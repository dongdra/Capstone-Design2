<?php
// 에러 보고 수준 설정
// error_reporting(E_ALL);
// ini_set('display_errors', value: true); // 실제 운영환경에서는 0으로 설정하여 에러를 표시하지 않음

require_once '../db/db_config.php';
require_once './vendor/autoload.php'; // PDF 라이브러리 로드

// 지원되는 파일 형식
$supportedExtensions = [
    'pdf' => 'pdf',
    'doc' => 'libreoffice',
    'docx' => 'libreoffice',
    'ppt' => 'libreoffice',
    'pptx' => 'libreoffice',
    'xls' => 'libreoffice',
    'xlsx' => 'libreoffice',
    'odt' => 'libreoffice',
    'odp' => 'libreoffice',
    'epub' => 'libreoffice',
    'md' => 'pandoc',
    'txt' => 'pandoc'
];

// LibreOffice로 파일 변환 함수
function convertWithLibreOffice($inputFile, $outputDir)
{
    try {
        $command = escapeshellcmd("libreoffice --headless --convert-to pdf --outdir " . escapeshellarg($outputDir) . " " . escapeshellarg($inputFile));
        exec($command, $output, $returnVar);
        if ($returnVar !== 0) {
            throw new Exception('LibreOffice 변환 실패');
        }
        return true;
    } catch (Exception $e) {
        error_log($e->getMessage());
        return false;
    }
}

// Pandoc으로 파일 변환 함수
function convertWithPandoc($inputFile, $outputFile)
{
    try {
        $command = escapeshellcmd("pandoc " . escapeshellarg($inputFile) . " -o " . escapeshellarg($outputFile));
        exec($command, $output, $returnVar);
        if ($returnVar !== 0) {
            throw new Exception('Pandoc 변환 실패');
        }
        return true;
    } catch (Exception $e) {
        error_log($e->getMessage());
        return false;
    }
}

// OS에 따라 Python 명령어를 결정하는 함수
function getPythonCommand()
{
    return strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? 'python' : 'python3';
}

// PDF를 PNG 이미지로 변환하는 함수
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

// 파일 처리 함수
function handleFileUpload($fileData, $fileExtension, $outputDir)
{
    global $supportedExtensions;

    try {
        // 지원되지 않는 파일 확장자 체크
        if (!isset($supportedExtensions[$fileExtension])) {
            throw new Exception('지원하지 않는 파일 형식입니다.');
        }

        // 변환 방식 선택
        $conversionMethod = $supportedExtensions[$fileExtension];
        $tempFilePath = saveBase64File($fileData, 'temp_file.' . $fileExtension);

        if (!$tempFilePath) {
            throw new Exception('파일 저장 실패');
        }

        if ($conversionMethod === 'libreoffice') {
            if (!convertWithLibreOffice($tempFilePath, $outputDir)) {
                throw new Exception('LibreOffice 변환 실패');
            }
            return $outputDir . '/temp_file.pdf';
        } elseif ($conversionMethod === 'pandoc') {
            $outputPdfPath = $outputDir . '/temp_file.pdf';
            if (!convertWithPandoc($tempFilePath, $outputPdfPath)) {
                throw new Exception('Pandoc 변환 실패');
            }
            return $outputPdfPath;
        } elseif ($fileExtension === 'pdf') {
            return $tempFilePath;
        }

        return false;
    } catch (Exception $e) {
        error_log($e->getMessage());
        sendJsonResponse(400, $e->getMessage());
    }
}

// PDF 파일을 처리하고 DB에 저장하는 함수
function savePDFFile($conn, $user, $filepath, $filename, $fileExtension)
{
    try {
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
            throw new Exception('이미 업로드한 파일입니다.');
        }

        // 파일 정보 저장
        $insertFileQuery = "INSERT INTO file_info (file_hash, file_extension, file_size, pdf_page_count, image_processed_count) VALUES (?, ?, ?, ?, 0)";
        $insertFileStmt = $conn->prepare($insertFileQuery);
        $fileSize = filesize($filepath);
        $insertFileStmt->bind_param("ssii", $fileHash, $fileExtension, $fileSize, $pageCount);
        $insertFileStmt->execute();

        $fileId = $insertFileStmt->insert_id;

        $sanitizedFileName = sanitizeFileName($filename);
        $insertUploadQuery = "INSERT INTO file_uploads (file_id, user_id, file_name) VALUES (?, ?, ?)";
        $insertUploadStmt = $conn->prepare($insertUploadQuery);
        $insertUploadStmt->bind_param("iis", $fileId, $userId, $sanitizedFileName);
        $insertUploadStmt->execute();

        // 파일 저장 경로 설정
        $documentsDir = '../documents/' . $fileId;
        if (!is_dir($documentsDir)) {
            mkdir($documentsDir, 0777, true);
        }

        // 파일 이동
        $filePath = $documentsDir . '/' . $fileId . '.pdf';
        if (!rename($filepath, $filePath)) {
            throw new Exception('파일 저장 중 오류가 발생했습니다.');
        }

        // 이미지 변환 실행 및 변환된 이미지 수 확인
        $processedCount = processImages($filePath, $documentsDir, $pageCount, $user['username']);

        if ($processedCount === false) {
            throw new Exception('이미지 변환 처리 중 오류가 발생했습니다.');
        }

        // 이미지 수가 정상적으로 변환된 경우 DB 업데이트
        $updateFileQuery = "UPDATE file_info SET image_processed_count = ? WHERE file_id = ?";
        $updateFileStmt = $conn->prepare($updateFileQuery);
        $updateFileStmt->bind_param("ii", $processedCount, $fileId);
        $updateFileStmt->execute();
        $updateFileStmt->close();

        sendJsonResponse(200, '파일이 성공적으로 업로드되었습니다.');
    } catch (Exception $e) {
        error_log($e->getMessage());
        sendJsonResponse(500, $e->getMessage());
    }
}

// 파일 저장 함수 (base64에서 파일로 저장)
function saveBase64File($base64Data, $filename)
{
    try {
        $base64Data = preg_replace('/^data:application\/pdf;base64,/', '', $base64Data);
        $decodedData = base64_decode($base64Data);
        if ($decodedData === false) {
            throw new Exception('파일 디코딩 실패');
        }

        $filepath = tempnam(sys_get_temp_dir(), 'temp_');
        if (file_put_contents($filepath, $decodedData) === false) {
            throw new Exception('파일 저장 실패');
        }

        return $filepath;
    } catch (Exception $e) {
        error_log($e->getMessage());
        return false;
    }
}

// main logic
try {
    // 필수 값 검증
    $identifier = trim($data['identifier'] ?? '');
    $password = trim($data['password'] ?? '');
    $base64File = $data['file_base64'] ?? '';
    $filename = sanitizeFileName($data['filename'] ?? 'noname');

    if (!$identifier || !$password || !$base64File) {
        throw new Exception('아이디/이메일, 비밀번호 및 파일을 모두 입력해야 합니다.');
    }

    // 파일 확장자 추출
    $fileExtension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

    // 파일 처리 (PDF로 변환)
    $outputDir = sys_get_temp_dir(); // 임시 디렉토리
    $filePath = handleFileUpload($base64File, $fileExtension, $outputDir);

    if (!$filePath || !isValidPDF($filePath)) {
        throw new Exception('파일을 저장하거나 변환하는 데 실패했습니다.');
    }

    // DB 연결 및 사용자 인증
    $conn = getDbConnection();
    $user = authenticateUser($conn, $identifier, $password);

    // 파일 저장 (DB에 정보 기록)
    savePDFFile($conn, $user, $filePath, $filename, $fileExtension);

} catch (Exception $e) {
    error_log($e->getMessage());
    sendJsonResponse(500, $e->getMessage());
}
