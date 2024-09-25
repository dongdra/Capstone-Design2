<?php
// 에러 보고 수준 설정
// error_reporting(E_ALL);
// ini_set('display_errors', 0); // 실제 운영환경에서는 0으로 설정하여 에러를 표시하지 않음

// 데이터베이스 설정 파일 포함
require_once 'db_config.php';

// JSON 응답을 반환하는 함수
function sendJsonResponse($statusCode, $message)
{
	header('Content-Type: application/json');
	echo json_encode(['StatusCode' => $statusCode, 'message' => $message]);
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
	$userName = trim($data['username'] ?? '');
	$password = trim($data['password'] ?? '');
	$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
	$name = trim($data['name'] ?? '');

	// 필수 입력값 확인
	if (!$userName || !$password || !$email || !$name) {
		sendJsonResponse(400, '필수 입력값이 누락되었습니다.');
	}

	// 데이터베이스 연결
	$conn = getDbConnection();

	// 아이디 중복 검사
	$checkUsernameStmt = $conn->prepare("SELECT user_id FROM members WHERE username = ?");
	$checkUsernameStmt->bind_param("s", $userName);
	$checkUsernameStmt->execute();
	$checkUsernameStmt->store_result();

	if ($checkUsernameStmt->num_rows > 0) {
		sendJsonResponse(409, '이미 사용 중인 아이디입니다.');
	}
	$checkUsernameStmt->close();

	// 이메일 중복 검사
	$checkEmailStmt = $conn->prepare("SELECT user_id FROM members WHERE email = ?");
	$checkEmailStmt->bind_param("s", $email);
	$checkEmailStmt->execute();
	$checkEmailStmt->store_result();

	if ($checkEmailStmt->num_rows > 0) {
		sendJsonResponse(409, '이미 사용 중인 이메일입니다.');
	}
	$checkEmailStmt->close();

	// 비밀번호 해시 처리
	$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

	// SQL 쿼리 작성 및 실행 (Prepared statement 사용)
	$sql = "INSERT INTO members (username, password, email, name, join_date, is_active)
            VALUES (?, ?, ?, ?, NOW(), 1)";
	$stmt = $conn->prepare($sql);

	// 쿼리 실행
	if (!$stmt) {
		throw new Exception('Failed to prepare statement: ' . $conn->error);
	}

	$stmt->bind_param("ssss", $userName, $hashedPassword, $email, $name);

	// 쿼리 실행 및 결과 확인
	if ($stmt->execute()) {
		sendJsonResponse(200, 'Sign up successfully');
	} else {
		sendJsonResponse(500, '회원 등록 중 오류가 발생했습니다.');
	}

	// statement와 연결 종료
	$stmt->close();
	$conn->close();

} catch (Exception $e) {
	// 예외 발생 시 에러 메시지 출력
	sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
}
?>