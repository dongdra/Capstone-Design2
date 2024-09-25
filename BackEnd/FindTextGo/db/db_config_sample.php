<?php
// db_config.php
// 데이터베이스 연결 정보
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'username');
define('DB_PASSWORD', 'password');
define('DB_NAME', 'FindTextGo');

// MySQL 연결 함수
function getDbConnection()
{
	$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);
	// 연결 오류 시 예외 처리
	if ($conn->connect_error) {
		throw new Exception('Database connection failed: ' . $conn->connect_error);
	}
	return $conn;
}
?>