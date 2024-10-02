<?php
// 에러 보고 수준 설정
// error_reporting(E_ALL);
// ini_set('display_errors', value: true); // 실제 운영환경에서는 0으로 설정하여 에러를 표시하지 않음

require_once '../db/db_config.php';
require_once './vendor/autoload.php'; // PDF 라이브러리 로드

// JSON 요청 본문 파싱
$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

// JSON 응답을 반환하는 함수
function sendJsonResponse($statusCode, $message)
{
	header('Content-Type: application/json');
	http_response_code($statusCode);
	echo json_encode(['StatusCode' => $statusCode, 'message' => $message]);
	exit;
}

// OS에 따라 Python 명령어를 결정하는 함수
function getPythonCommand()
{
	return strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? 'python' : 'python3';
}

// 이미지 변환 함수
function processImages($pdfPath, $outputDir, $pageCount, $userName)
{
	$pythonCommand = getPythonCommand();
	$scriptPath = __DIR__ . '/save_pdf_as_png.py'; // Python 스크립트 경로

	// Python 스크립트를 실행하고 출력 결과를 확인
	$command = escapeshellcmd("$pythonCommand $scriptPath " . escapeshellarg($pdfPath) . " " . escapeshellarg($outputDir) . " " . escapeshellarg($userName));
	$output = [];
	exec($command, $output, $returnVar);

	// 디버깅: 명령어와 결과 출력
	error_log("Command: $command");
	error_log("Output: " . implode("\n", $output));
	error_log("Return var: $returnVar");

	if ($returnVar !== 0 || empty($output) || strpos($output[0], 'success') === false) {
		return false;
	}

	// 변환된 이미지 수가 페이지 수와 일치하는지 확인
	$processedCount = count(glob("$outputDir/*.png"));

	// 페이지 수와 이미지 수가 일치하지 않으면 모든 이미지를 삭제
	if ($processedCount !== $pageCount) {
		array_map('unlink', glob("$outputDir/*.png"));
		return false; // 변환이 실패로 처리됨
	}

	return $processedCount;
}

// PDF 페이지 수 추출
function getPDFPageCount($filePath)
{
	try {
		$parser = new \Smalot\PdfParser\Parser();
		$pdf = $parser->parseFile($filePath);
		$details = $pdf->getDetails();

		return isset($details['Pages']) ? (int) $details['Pages'] : 0;
	} catch (\Exception $e) {
		return 0;
	}
}

// 파일명 안전하게 처리
function sanitizeFileName($fileName)
{
	$fileName = basename($fileName);
	$fileName = preg_replace('/[^\p{L}\p{N}\s\_\-\.]/u', '_', $fileName);
	return htmlspecialchars($fileName, ENT_QUOTES, 'UTF-8');
}

// PDF 유효성 확인
function isValidPDF($filePath)
{
	$file = fopen($filePath, 'rb');
	$header = fread($file, 4);
	fclose($file);

	if ($header !== '%PDF') {
		return false;
	}

	return true;
}

// base64 데이터에서 확장자 추출
function getExtensionFromBase64($base64Data)
{
	// 접두사가 있는 경우
	if (preg_match('/^data:application\/pdf;base64,/', $base64Data)) {
		return 'pdf';
	}

	// 접두사가 없는 경우, base64 디코딩 후 파일 시그니처 확인
	$decodedData = base64_decode(preg_replace('/^data:application\/pdf;base64,/', '', $base64Data));
	if (substr($decodedData, 0, 4) === '%PDF') {
		return 'pdf';
	}

	return null;
}

// base64로 파일 저장 처리
function saveBase64File($base64Data, $filename)
{
	// 접두사 제거 (있는 경우)
	$base64Data = preg_replace('/^data:application\/pdf;base64,/', '', $base64Data);

	$decodedData = base64_decode($base64Data);
	if ($decodedData === false) {
		return false;
	}

	$filepath = tempnam(sys_get_temp_dir(), 'pdf_');
	if (file_put_contents($filepath, $decodedData) === false) {
		return false;
	}

	return $filepath;
}

// 회원 인증 함수
function authenticateUser($conn, $identifier, $password)
{
	$sql = "SELECT user_id, username, password FROM members WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1";
	$stmt = $conn->prepare($sql);
	if (!$stmt) {
		throw new Exception('Failed to prepare statement: ' . $conn->error);
	}

	$stmt->bind_param("ss", $identifier, $identifier);
	$stmt->execute();
	$result = $stmt->get_result();

	if ($result->num_rows === 0) {
		sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
	}

	$user = $result->fetch_assoc();
	if (!password_verify($password, $user['password'])) {
		sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
	}

	return $user;
}

// PDF 파일 저장 처리
function savePDFFile($conn, $user, $filepath, $filename)
{
	$fileHash = hash_file('sha256', $filepath);
	$pageCount = getPDFPageCount($filepath);
	$userId = $user['user_id'];

	// 파일 중복 체크
	$fileExistsQuery = "SELECT file_id FROM file_info WHERE file_hash = ?";
	$fileExistsStmt = $conn->prepare($fileExistsQuery);
	$fileExistsStmt->bind_param("s", $fileHash);
	$fileExistsStmt->execute();
	$fileExistsResult = $fileExistsStmt->get_result();

	if ($fileExistsResult->num_rows > 0) {
		sendJsonResponse(409, '이미 업로드한 파일입니다.');
	}

	$insertFileQuery = "INSERT INTO file_info (file_hash, file_extension, file_size, pdf_page_count, image_processed_count) VALUES (?, 'pdf', ?, ?, 0)";
	$insertFileStmt = $conn->prepare($insertFileQuery);
	$fileSize = filesize($filepath);
	$insertFileStmt->bind_param("sii", $fileHash, $fileSize, $pageCount);
	$insertFileStmt->execute();
	$fileId = $insertFileStmt->insert_id;

	$sanitizedFileName = sanitizeFileName($filename);
	$insertUploadQuery = "INSERT INTO file_uploads (file_id, user_id, file_name) VALUES (?, ?, ?)";
	$insertUploadStmt = $conn->prepare($insertUploadQuery);
	$insertUploadStmt->bind_param("iis", $fileId, $userId, $sanitizedFileName);
	$insertUploadStmt->execute();

	$documentsDir = '../documents/' . $fileId;
	if (!is_dir($documentsDir)) {
		mkdir($documentsDir, 0777, true);
	}

	$filePath = $documentsDir . '/' . $fileId . '.pdf';
	if (!rename($filepath, $filePath)) {
		sendJsonResponse(500, '파일 저장 중 오류가 발생했습니다.');
	}

	// 이미지 변환 실행 및 변환된 이미지 수 확인
	$processedCount = processImages($filePath, $documentsDir, $pageCount, $user['username']);

	if ($processedCount === false) {
		sendJsonResponse(500, '이미지 변환 처리 중 오류가 발생했습니다.');
	}

	// 이미지 수가 정상적으로 변환된 경우 DB 업데이트
	$updateFileQuery = "UPDATE file_info SET image_processed_count = ? WHERE file_id = ?";
	$updateFileStmt = $conn->prepare($updateFileQuery);
	$updateFileStmt->bind_param("ii", $processedCount, $fileId);
	$updateFileStmt->execute();
	$updateFileStmt->close();

	sendJsonResponse(200, '파일이 성공적으로 업로드되었습니다.');
}

// main logic
try {
	$identifier = trim($data['identifier'] ?? '');
	$password = trim($data['password'] ?? '');
	$base64File = $data['file_base64'] ?? '';
	$filename = sanitizeFileName($data['filename'] ?? 'noname.pdf');

	if (!$identifier || !$password || !$base64File) {
		sendJsonResponse(400, '아이디/이메일, 비밀번호 및 파일을 모두 입력해야 합니다.');
	}

	// 확장자 추출 및 파일명 처리
	$fileExtension = getExtensionFromBase64($base64File);
	if ($fileExtension !== 'pdf') {
		sendJsonResponse(400, '올바르지 않은 파일 형식입니다. PDF 파일만 허용됩니다.');
	}

	if (pathinfo($filename, PATHINFO_EXTENSION) !== 'pdf') {
		$filename = pathinfo($filename, PATHINFO_FILENAME) . '.pdf';
	}

	// base64 파일 저장 처리
	$filePath = saveBase64File($base64File, $filename);
	if ($filePath === false || !isValidPDF($filePath)) {
		sendJsonResponse(400, '올바르지 않은 PDF 파일입니다. 파일을 저장하거나 검증하는 데 실패했습니다.');
	}

	// DB 연결 및 사용자 인증
	$conn = getDbConnection();
	$user = authenticateUser($conn, $identifier, $password);

	// PDF 파일 처리 및 저장
	savePDFFile($conn, $user, $filePath, $filename);

} catch (Exception $e) {
	// sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
	sendJsonResponse(500, '오류가 발생했습니다');
}
?>
