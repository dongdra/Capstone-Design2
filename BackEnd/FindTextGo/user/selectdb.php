<?php
// 에러 보고 수준 설정
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

require_once '../db/db_config.php';

// JSON 응답을 반환하는 함수
function sendJsonResponse($statusCode, $data)
{
	header('Content-Type: application/json');
	http_response_code($statusCode);
	echo json_encode($data);
	exit;
}

// 사용자 인증 함수
function authenticateUser($conn, $identifier, $password)
{
	// identifier는 유저네임 또는 이메일로 가정
	$sql = "SELECT user_id, username FROM users WHERE (email = ? OR username = ?) AND password = ?";
	$stmt = $conn->prepare($sql);
	if (!$stmt) {
		throw new Exception('Failed to prepare statement: ' . $conn->error);
	}
	$stmt->bind_param("sss", $identifier, $identifier, $password);
	$stmt->execute();
	$result = $stmt->get_result();

	if ($result->num_rows === 0) {
		throw new Exception('아이디/이메일 또는 비밀번호가 잘못되었습니다.');
	}

	$user = $result->fetch_assoc();
	$stmt->close();

	return $user; // user_id와 username 반환
}

// 파일 목록을 가져오는 함수 (특정 사용자만 조회)
function getFileList($conn, $userId)
{
	$sql = "SELECT f.file_id, f.file_hash, f.file_extension, f.file_size, f.pdf_page_count, f.image_processed_count, u.file_name, u.user_id 
			FROM file_info f
			JOIN file_uploads u ON f.file_id = u.file_id
			WHERE u.user_id = ?"; // 특정 사용자의 파일만 조회

	$stmt = $conn->prepare($sql);
	if (!$stmt) {
		throw new Exception('Failed to prepare statement: ' . $conn->error);
	}
	$stmt->bind_param("i", $userId); // user_id 바인딩
	$stmt->execute();
	$result = $stmt->get_result();

	$fileList = [];
	while ($row = $result->fetch_assoc()) {
		$fileList[] = $row;
	}

	$stmt->close();
	return $fileList;
}

// main logic
try {
	// DB 연결
	$conn = getDbConnection();

	// POST 요청 데이터 가져오기
	$input = json_decode(file_get_contents("php://input"), true);
	$identifier = $input['identifier'] ?? null;
	$password = $input['password'] ?? null;

	// 아이디와 비밀번호 확인
	if (!$identifier || !$password) {
		sendJsonResponse(400, [
			"StatusCode" => 400,
			"message" => "아이디/이메일과 비밀번호를 모두 입력해야 합니다."
		]);
	}

	// 사용자 인증 및 user_id와 username 가져오기
	$user = authenticateUser($conn, $identifier, $password);
	$userId = $user['user_id'];
	$username = $user['username'];

	// 해당 사용자의 파일 목록 조회
	$fileList = getFileList($conn, $userId);

	// 조회된 파일 목록과 유저네임을 JSON으로 응답
	sendJsonResponse(200, [
		"StatusCode" => 200,
		"username" => $username,  // 유저네임 추가
		"files" => $fileList
	]);

} catch (Exception $e) {
	sendJsonResponse(500, [
		"StatusCode" => 500,
		"message" => '오류가 발생했습니다: ' . $e->getMessage()
	]);
}

?>
