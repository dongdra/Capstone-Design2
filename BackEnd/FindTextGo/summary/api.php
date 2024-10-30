<?php
// 에러 보고 수준 설정
// error_reporting(E_ALL);
// ini_set('display_errors', 0); // 실제 운영환경에서는 0으로 설정하여 에러를 표시하지 않음

// 데이터베이스 설정 파일 포함
require_once '../db/db_config.php';

// JSON 응답을 반환하는 함수
function sendJsonResponse($statusCode, $message, $data = null)
{
    header('Content-Type: application/json');
    $response = ['StatusCode' => $statusCode, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}

// POST 요청 확인
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, 'POST 요청만 허용됩니다.');
}

try {
    // php://input을 사용하여 JSON 데이터를 받아옵니다.
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    // 입력값 확인 및 변수 설정
    $identifier = trim($data['identifier'] ?? ''); // 아이디 또는 이메일
    $password = trim($data['password'] ?? '');
    $file_id = intval($data['file_id'] ?? 0);

    // 필수 입력값 확인
    if (!$identifier || !$password || !$file_id) {
        sendJsonResponse(400, '아이디/이메일, 비밀번호, 파일 ID를 모두 입력해야 합니다.');
    }

    // 데이터베이스 연결
    $conn = getDbConnection();

    // SQL 쿼리 작성 - 아이디 또는 이메일로 사용자 검색
    $sql = "SELECT user_id, username, password, email, is_active FROM members 
            WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }

    // 쿼리에 바인딩
    $stmt->bind_param("ss", $identifier, $identifier);
    $stmt->execute();
    $result = $stmt->get_result();

    // 사용자 존재 여부 확인
    if ($result->num_rows === 0) {
        sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
    }

    // 사용자 정보 가져오기
    $user = $result->fetch_assoc();

    // 비밀번호 확인
    if (!password_verify($password, $user['password'])) {
        sendJsonResponse(401, '아이디/이메일 또는 비밀번호가 잘못되었습니다.');
    }

    // 파일 소유 확인
    $sql = "SELECT upload_id FROM file_uploads WHERE file_id = ? AND user_id = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $file_id, $user['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendJsonResponse(403, '해당 파일에 접근 권한이 없습니다.');
    }

    // 파일 경로 설정
    $file_path = "../documents/$file_id/$file_id.pdf";

    // 파일이 존재하는지 확인
    if (!file_exists($file_path)) {
        sendJsonResponse(404, '파일을 찾을 수 없습니다.');
    }

    // Python 실행 명령어 OS에 따라 설정
    $pythonCommand = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') ? 'python' : 'python3';
    $command = escapeshellcmd("$pythonCommand summarize.py --pdf " . escapeshellarg($file_path));
    $output = shell_exec($command);

    // 결과를 JSON으로 파싱
    $summary_data = json_decode($output, true);

    if (!$summary_data || !isset($summary_data['summary'])) {
        sendJsonResponse(500, '요약 생성 중 오류가 발생했습니다.', $output);
    }

    // 성공적인 응답일 경우 summary만 data에 담기
    sendJsonResponse(200, '파일 처리 및 요약 성공', $summary_data);

} catch (Exception $e) {
    // 예외 발생 시 에러 메시지 출력
    sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
}
?>
