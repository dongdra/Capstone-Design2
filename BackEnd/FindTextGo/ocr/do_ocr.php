<?php
// OCR 처리 및 데이터 저장 함수

require_once '../db/db_config.php';

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

function processOCR($conn)
{
    // OCR 처리가 필요한 파일을 가져옴
    $query = "SELECT file_id, pdf_page_count FROM file_info WHERE ocr_processed_count = 0 LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendJsonResponse(404, 'OCR 처리가 필요한 파일이 없습니다.');
    }

    $file = $result->fetch_assoc();
    $fileId = $file['file_id'];
    $pageCount = $file['pdf_page_count'];

    $fileDir = "../documents/$fileId";
    
    // 페이지 별 PNG 파일에 OCR 처리
    for ($page = 1; $page <= $pageCount; $page++) {
        $imagePath = "$fileDir/$page.png";

        if (!file_exists($imagePath)) {
            continue; // 이미지가 없으면 다음으로 넘어감
        }

        // OCR 결과를 받기 위해 Python 스크립트 호출
        $ocrResult = runOCR($imagePath);

        if ($ocrResult === false) {
            sendJsonResponse(500, 'OCR 처리 중 오류가 발생했습니다.');
        }

        // OCR 결과 데이터베이스에 저장
        saveOCRData($conn, $fileId, $page, $ocrResult);
    }

    // 모든 OCR 처리가 완료된 경우 파일 정보 업데이트
    $updateQuery = "UPDATE file_info SET ocr_processed_count = ? WHERE file_id = ?";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bind_param("ii", $pageCount, $fileId);
    $updateStmt->execute();
    $updateStmt->close();

    sendJsonResponse(200, 'OCR 처리가 완료되었습니다.');
}

// Python OCR 스크립트를 실행하여 텍스트를 추출하는 함수
function runOCR($imagePath)
{
    // URL of the Flask API
    $apiUrl = 'http://localhost:5000/ocr';

    // Set up the request data
    $postData = json_encode(['image_path' => $imagePath]);

    // Initialize cURL session
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($postData)
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);

    // Execute cURL request
    $response = curl_exec($ch);

    if ($response === false) {
        sendJsonResponse(500, 'Failed to connect to OCR API: ' . curl_error($ch));
    }

    curl_close($ch);

    // Decode the response
    $responseData = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendJsonResponse(500, 'JSON parsing error: ' . json_last_error_msg());
    }

    // Check if the OCR processing was successful
    if ($responseData['StatusCode'] !== 200) {
        sendJsonResponse($responseData['StatusCode'], $responseData['message']);
    }

    return $responseData['data'];
}

// OCR 결과를 데이터베이스에 저장하는 함수
function saveOCRData($conn, $fileId, $pageNumber, $ocrResult)
{
    $insertQuery = "INSERT INTO ocr_data (file_id, page_number, extracted_text, coord_x, coord_y, coord_width, coord_height) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($insertQuery);

    if (!$stmt) {
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }

    foreach ($ocrResult as $data) {
        $extractedText = $data['text'];
        $coordX = $data['x'];
        $coordY = $data['y'];
        $coordWidth = $data['width'];
        $coordHeight = $data['height'];

        $stmt->bind_param("iisiiii", $fileId, $pageNumber, $extractedText, $coordX, $coordY, $coordWidth, $coordHeight);
        $stmt->execute();
    }

    $stmt->close();
}

// 메인 실행 부분 (OCR 처리 시작)
try {
    $conn = getDbConnection();
    processOCR($conn);

} catch (Exception $e) {
    sendJsonResponse(500, '오류가 발생했습니다: ' . $e->getMessage());
}
?>