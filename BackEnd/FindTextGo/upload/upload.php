<?php
// 에러 보고 수준 설정
// error_reporting(E_ALL);
// ini_set('display_errors', value: true); // 실제 운영환경에서는 0으로 설정하여 에러를 표시하지 않음

// 데이터베이스 설정 파일 포함
require_once '../db/db_config.php';
require_once './vendor/autoload.php'; // PDF 라이브러리 로드 ( pdfparser 사용. 설치: composer require Smalot/PdfParser )

// JSON 응답을 반환하는 함수
function sendJsonResponse($statusCode, $message)
{
    header('Content-Type: application/json');
    echo json_encode(['StatusCode' => $statusCode, 'message' => $message]);
    exit;
}

// OS에 따라 Python 명령어를 결정하는 함수
function getPythonCommand()
{
    // 윈도우 시스템에서는 python, 리눅스/맥에서는 python3 사용
    return strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? 'python' : 'python3';
}

// PDF 페이지 수를 추출하는 함수
function getPDFPageCount($filePath)
{
    try {
        $parser = new \Smalot\PdfParser\Parser();
        $pdf = $parser->parseFile($filePath);
        $details = $pdf->getDetails();

        return isset($details['Pages']) ? (int)$details['Pages'] : 0;
    } catch (\Exception $e) {
        return 0; // 페이지 수를 가져올 수 없는 경우 0 반환
    }
}

// 파일명을 안전하게 처리하는 함수 (보안 강화, 원본 파일명 유지)
function sanitizeFileName($fileName)
{
    $fileName = basename($fileName);
    $fileName = preg_replace('/[^\p{L}\p{N}\s\_\-\.]/u', '_', $fileName); 
    $fileName = trim($fileName);
    return htmlspecialchars($fileName, ENT_QUOTES, 'UTF-8');
}

// PDF 파일의 유효성을 확인하는 함수 (깨진 파일, 비밀번호 설정 여부 등)
function isValidPDF($filePath)
{
    $file = fopen($filePath, 'rb');
    $header = fread($file, 4);
    fclose($file);

    if ($header !== '%PDF') {
        return false;
    }

    try {
        $parser = new \Smalot\PdfParser\Parser();
        $pdf = $parser->parseFile($filePath);

        if ($pdf->getDetails()) {
            return true;
        }
    } catch (\Exception $e) {
        return false;
    }

    return false;
}

// 회원 인증
function authenticateUser($conn, $identifier, $password)
{
    $sql = "SELECT user_id, username, password FROM members 
            WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1";
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

    $stmt->close();

    return $user;
}

// PDF 파일 저장 처리 함수
function savePDFFile($conn, $user, $file, $fileHash, $fileExtension)
{
    $pageCount = getPDFPageCount($file['tmp_name']);
    $userId = $user['user_id'];

    // 파일 중복 체크
    $fileExistsQuery = "SELECT file_id FROM file_info WHERE file_hash = ?";
    $fileExistsStmt = $conn->prepare($fileExistsQuery);
    $fileExistsStmt->bind_param("s", $fileHash);
    $fileExistsStmt->execute();
    $fileExistsResult = $fileExistsStmt->get_result();

    if ($fileExistsResult->num_rows > 0) {
        $fileInfo = $fileExistsResult->fetch_assoc();
        $fileId = $fileInfo['file_id'];

        // 파일 업로드 기록 체크
        $userFileQuery = "SELECT upload_id FROM file_uploads WHERE file_id = ? AND user_id = ?";
        $userFileStmt = $conn->prepare($userFileQuery);
        $userFileStmt->bind_param("ii", $fileId, $userId);
        $userFileStmt->execute();
        $userFileResult = $userFileStmt->get_result();

        if ($userFileResult->num_rows > 0) {
            sendJsonResponse(409, '이미 업로드한 파일입니다.');
        }
        $userFileStmt->close();
    } else {
        // 새로운 파일 등록
        $insertFileQuery = "INSERT INTO file_info (file_hash, file_extension, file_size, pdf_page_count, image_processed_count) VALUES (?, ?, ?, ?, 0)";
        $insertFileStmt = $conn->prepare($insertFileQuery);
        $fileSize = filesize($file['tmp_name']);
        $insertFileStmt->bind_param("ssii", $fileHash, $fileExtension, $fileSize, $pageCount);
        $insertFileStmt->execute();
        $fileId = $insertFileStmt->insert_id;
        $insertFileStmt->close();
    }

    $sanitizedFileName = sanitizeFileName($file['name']);
    $insertUploadQuery = "INSERT INTO file_uploads (file_id, user_id, file_name) VALUES (?, ?, ?)";
    $insertUploadStmt = $conn->prepare($insertUploadQuery);
    $insertUploadStmt->bind_param("iis", $fileId, $userId, $sanitizedFileName);
    $insertUploadStmt->execute();
    $insertUploadStmt->close();

    $documentsDir = '../documents';
    if (!is_dir($documentsDir)) {
        mkdir($documentsDir, 0777, true);
    }

    $fileDir = $documentsDir . '/' . $fileId;
    if (!is_dir($fileDir)) {
        mkdir($fileDir, 0777, true);
    }

    $filePath = $fileDir . '/' . $fileId . '.pdf';

    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        sendJsonResponse(500, '파일 저장 중 오류가 발생했습니다.');
    }

    // 이미지 변환 실행 및 변환된 이미지 수 확인
    $processedCount = processImages($filePath, $fileDir, $pageCount, $user['username']);

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

// 이미지 변환 함수
function processImages($pdfPath, $outputDir, $pageCount, $userName)
{
    $pythonCommand = getPythonCommand();
    $scriptPath = __DIR__ . '/save_pdf_as_png.py'; // Python 스크립트 경로

    // Python 스크립트를 실행하고 출력 결과를 확인
    $command = escapeshellcmd("$pythonCommand $scriptPath " . escapeshellarg($pdfPath) . " " . escapeshellarg($outputDir) . " " . escapeshellarg($userName));
    $output = [];
    exec($command, $output, $returnVar);

    // Python 스크립트의 출력 확인
    if ($returnVar !== 0 || empty($output) || $output[0] !== 'success') {
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

try {
    $identifier = trim($_POST['identifier'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!$identifier || !$password) {
        sendJsonResponse(400, '아이디/이메일과 비밀번호를 모두 입력해야 합니다.');
    }

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        sendJsonResponse(400, '파일 업로드에 실패했습니다.');
    }

    $file = $_FILES['file'];
    $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $allowedExtensions = ['pdf'];

    if (!in_array(strtolower($fileExtension), $allowedExtensions)) {
        sendJsonResponse(400, '지원하지 않는 파일 형식입니다. PDF 파일만 업로드 가능합니다.');
    }

    if (!isValidPDF($file['tmp_name'])) {
        sendJsonResponse(400, '올바르지 않은 PDF 파일입니다.');
    }

    $conn = getDbConnection();
    $user = authenticateUser($conn, $identifier, $password);
    $fileHash = hash_file('sha256', $file['tmp_name']);

    savePDFFile($conn, $user, $file, $fileHash, $fileExtension);

    sendJsonResponse(200, '파일이 성공적으로 업로드되었습니다.');

} catch (Exception $e) {
    sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
}
?>
