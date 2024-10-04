<?php
// 에러 보고 수준 설정
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

require_once '../db/db_config.php';

// JSON 응답을 반환하는 함수
function sendJsonResponse($statusCode, $message)
{
	header('Content-Type: application/json');
	http_response_code($statusCode);
	echo json_encode($message);
	exit;
}

// 파일 목록을 가져오는 함수
function getFileList($conn)
{
	$sql = "SELECT f.file_id, f.file_hash, f.file_extension, f.file_size, f.pdf_page_count, f.image_processed_count, u.file_name, u.user_id 
			FROM file_info f
			JOIN file_uploads u ON f.file_id = u.file_id";

	$stmt = $conn->prepare($sql);
	if (!$stmt) {
		throw new Exception('Failed to prepare statement: ' . $conn->error);
	}
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

	// 파일 목록 조회
	$fileList = getFileList($conn);

	// 조회된 파일 목록을 JSON으로 응답
	sendJsonResponse(200, $fileList);

} catch (Exception $e) {
	sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
}

?>
