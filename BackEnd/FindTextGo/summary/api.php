<?php
// Composer의 autoload 파일을 불러옵니다.
// 설치 방법: composer require vlucas/phpdotenv
require __DIR__ . '/vendor/autoload.php';

// Dotenv 클래스를 불러옵니다.
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// .env 파일에서 API_KEY 값을 가져옵니다.
$api_key = getenv('API_KEY');

// 모델 설정
$gemini_model = "gemini-1.5-flash-8b";

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

    // 파일 업로드를 위한 API 호출
    $num_bytes = filesize($file_path);
    $ch = curl_init();

    // 업로드 요청
    curl_setopt($ch, CURLOPT_URL, "https://generativelanguage.googleapis.com/upload/v1beta/files?key=$api_key");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);  // 헤더 정보를 받도록 설정
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'X-Goog-Upload-Protocol: resumable',
        'X-Goog-Upload-Command: start',
        'X-Goog-Upload-Header-Content-Length: ' . $num_bytes,
        'X-Goog-Upload-Header-Content-Type: application/pdf',
        'Content-Type: application/json'
    ));
    curl_setopt($ch, CURLOPT_POST, true);

    // file_id를 문자열로 변환하여 display_name에 전달
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['file' => ['display_name' => (string) $file_id]]));

    // 응답 받기
    $response_headers = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // HTTP 응답 코드 확인
    if ($http_code !== 200) {
        sendJsonResponse(500, "파일 업로드 요청 실패 (HTTP 코드: $http_code)", $response_headers);
    }

    // 업로드 URL 파싱
    preg_match('/x-goog-upload-url: (.*)/i', $response_headers, $matches);
    if (empty($matches[1])) {
        sendJsonResponse(500, '파일 업로드 URL을 가져오지 못했습니다.', $response_headers);  // 디버깅을 위해 응답 헤더 추가
    }

    $upload_url = trim($matches[1]);

    // 실제 파일 업로드
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $upload_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Length: ' . $num_bytes,
        'X-Goog-Upload-Offset: 0',
        'X-Goog-Upload-Command: upload, finalize'
    ));
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents($file_path));
    $upload_response = curl_exec($ch);
    curl_close($ch);

    // 파일 업로드가 성공했는지 확인
    $file_info = json_decode($upload_response, true);
    if (!isset($file_info['file']['uri'])) {
        sendJsonResponse(500, '파일 업로드 중 오류가 발생했습니다.', $upload_response);
    }

    $file_uri = $file_info['file']['uri'];

    // Gemini API에 파일 요청 보내기
    $ch = curl_init();
    $data = array(
        'contents' => array(
            array(
                'role' => 'user',
                'parts' => array(
                    array(
                        'fileData' => array(
                            'fileUri' => $file_uri,
                            'mimeType' => 'application/pdf'
                        )
                    )
                )
            ),
            array(
                'role' => 'user',
                'parts' => array(
                    array(
                        'text' => 'INSERT_INPUT_HERE'
                    )
                )
            )
        ),
        'systemInstruction' => array(
            'role' => 'user',
            'parts' => array(
                array(
                    'text' => 'You are the world\'s best summarizer. Summarize the following PDF file in JSON format with the "summary" key. The summary should be in Korean and should be concise. Avoid mentioning the summarization method or style.'
                )
            )
        ),
        'generationConfig' => array(
            'temperature' => 0.5,
            'topK' => 40,
            'topP' => 0.9,
            'maxOutputTokens' => 8192,
            'responseMimeType' => 'application/json',
            'responseSchema' => array(
                'type' => 'object',
                'properties' => array(
                    'summary' => array(
                        'type' => 'string'
                    )
                )
            )
        )
    );

    // JSON으로 변환
    $json_data = json_encode($data);

    // cURL 옵션 설정
    curl_setopt($ch, CURLOPT_URL, "https://generativelanguage.googleapis.com/v1beta/models/$gemini_model:generateContent?key=" . $api_key);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json'
    ));
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);

    // cURL 실행 및 응답 저장
    $response = curl_exec($ch);

    // cURL 종료
    curl_close($ch);

    // 응답 JSON 파싱
    $response_data = json_decode($response, true);

    if (!$response_data) {
        sendJsonResponse(500, 'Gemini API로부터 응답을 받을 수 없습니다.');
    }

    // summary 키만 추출
    $summary = $response_data['candidates'][0]['content']['parts'][0]['text'];
    $summary_data = json_decode($summary, true);

    // 성공적인 응답일 경우 summary만 data에 담기
    sendJsonResponse(200, '파일 처리 및 요약 성공', $summary_data);

} catch (Exception $e) {
    // 예외 발생 시 에러 메시지 출력
    sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
}
?>
