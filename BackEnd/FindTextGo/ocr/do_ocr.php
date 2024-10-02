<?php
// 에러 보고 수준 설정
// error_reporting(E_ALL);
// ini_set('display_errors', value: true); // 실제 운영환경에서는 0으로 설정하여 에러를 표시하지 않음

require_once '../db/db_config.php';
require_once './vendor/autoload.php'; // PDF 라이브러리 로드

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
    return strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? 'python' : 'python3';
}

// PDF 페이지 수 추출
function getPDFPageCount($filePath)
{
    try {
        $parser = new \Smalot\PdfParser\Parser();
        $pdf = $parser->parseFile($filePath);
        $details = $pdf->getDetails();

        return isset($details['Pages']) ? (int)$details['Pages'] : 0;
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

// base64 데이터에서 확장자 추출
function getExtensionFromBase64($base64Data)
{
    preg_match('/^data:application\/pdf;base64,/', $base64Data, $matches);
    if ($matches) {
        return 'pdf';
    }
    return null;
}

// base64로 파일 저장 처리
function saveBase64File($base64Data, $filename)
{
    $data = explode(',', $base64Data);
    if (count($data) !== 2) {
        return false;
    }
    
    $decodedData = base64_decode($data[1]);
    if ($decodedData === false) {
        return false;
    }
    
    $filepath = tempnam(sys_get_temp_dir(), 'pdf_');
    file_put_contents($filepath, $decodedData);
    
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

// main logic
try {
    // JSON 데이터를 읽어 처리
    $requestData = json_decode(file_get_contents('php://input'), true);

    $identifier = trim($requestData['identifier'] ?? '');
    $password = trim($requestData['password'] ?? '');
    $base64File = $requestData['file_base64'] ?? '';
    $filename = sanitizeFileName($requestData['filename'] ?? 'noname.pdf');

    if (!$identifier || !$password || !$base64File) {
        sendJsonResponse(400, '아이디/이메일, 비밀번호 및 파일을 모두 입력해야 합니다.');
    }

    // 확장자 추출 및 파일명 처리
    $fileExtension = getExtensionFromBase64($base64File);
    if ($fileExtension !== 'pdf') {
        sendJsonResponse(400, '올바르지 않은 파일 형식입니다.');
    }

    if (pathinfo($filename, PATHINFO_EXTENSION) !== 'pdf') {
        $filename = pathinfo($filename, PATHINFO_FILENAME) . '.pdf';
    }

    // base64 파일 저장 처리
    $filePath = saveBase64File($base64File, $filename);
    if ($filePath === false || !isValidPDF($filePath)) {
        sendJsonResponse(400, '올바르지 않은 PDF 파일입니다.');
    }

    // DB 연결 및 사용자 인증
    $conn = getDbConnection();
    $user = authenticateUser($conn, $identifier, $password);

    // 이후 PDF 저장 및 이미지 처리 로직 실행

} catch (Exception $e) {
    sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
}
?>
