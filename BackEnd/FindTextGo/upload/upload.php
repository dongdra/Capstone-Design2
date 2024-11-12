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

// JSON 응답을 반환하는 함수 정의
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

function authenticateUser($conn, $identifier, $password)
{
    try {
        // identifier가 username 또는 email일 수 있으므로 둘 다 조회
        $query = "SELECT user_id, username, password, is_active FROM members WHERE (username = ? OR email = ?) AND is_active = 1";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ss", $identifier, $identifier);
        $stmt->execute();
        $result = $stmt->get_result();

        // 사용자가 존재하지 않으면 예외 처리
        if ($result->num_rows === 0) {
            throw new Exception('사용자를 찾을 수 없거나 비활성화된 계정입니다.');
        }

        // 사용자 정보 가져오기
        $user = $result->fetch_assoc();

        // 비밀번호 확인 (DB에 저장된 해시된 비밀번호와 비교)
        if (!password_verify($password, $user['password'])) {
            throw new Exception('비밀번호가 일치하지 않습니다.');
        }

        // 인증 성공, 사용자 정보 반환
        return $user;

    } catch (Exception $e) {
        error_log($e->getMessage());
        sendJsonResponse(401, '인증 실패: ' . $e->getMessage());
    }
}

// 파일 이름을 안전하게 만드는 함수
function sanitizeFileName($filename)
{
    // 파일 이름에서 위험한 문자를 제거 (허용하지 않는 문자: 공백, 특수 문자 등)
    // \p{L}은 모든 유니코드 문자의 알파벳(한글 포함)을 의미
    // \p{N}은 숫자, _.-은 특수 문자
    $filename = preg_replace('/[^\p{L}\p{N}_\.\-]/u', '_', $filename);
    
    // 너무 긴 파일 이름을 방지하기 위해 길이 제한 (255자 이하)
    return mb_substr($filename, 0, 255);
}

// LibreOffice로 파일 변환 함수
function convertWithLibreOffice($inputFile, $outputDir)
{
    try {
        // -env 옵션 구문 수정
        $command = escapeshellcmd("libreoffice --headless --convert-to pdf --outdir " . escapeshellarg($outputDir) . " -env:UserInstallation=file:///tmp/LibreOfficeProfile " . escapeshellarg($inputFile));
        exec($command, $output, $returnVar);

        // 디버깅용 로그: 명령어와 출력값, 반환 코드 기록
        error_log("LibreOffice Command: $command");
        error_log("LibreOffice Output: " . implode("\n", $output));
        error_log("LibreOffice Return Var: $returnVar");

        // 명령어 실행 후 에러 발생 시
        if ($returnVar !== 0) {
            // 변환 실패 시 오류 메시지와 출력값, 반환 코드를 함께 던짐
            throw new Exception('LibreOffice 변환 실패: ' . implode("\n", $output));
        }

        // 변환된 PDF 파일 경로 계산 (원본 파일명에서 확장자 제거 후 .pdf 추가)
        $outputFileName = pathinfo($inputFile, PATHINFO_FILENAME) . '.pdf';
        $outputFilePath = $outputDir . DIRECTORY_SEPARATOR . $outputFileName;

        // 변환된 파일이 존재하는지 확인
        if (!file_exists($outputFilePath)) {
            throw new Exception('LibreOffice 변환 후 파일을 찾을 수 없습니다.');
        }

        return $outputFilePath;  // 변환된 파일 경로 반환
    } catch (Exception $e) {
        // 오류 발생 시 출력값과 반환 코드도 JSON 응답에 포함
        sendJsonResponse(400, 'LibreOffice 변환 실패', [
            'output' => $output,
            'return_var' => $e->getCode(),
            'error' => $e->getMessage()
        ]);
    }
}

// Pandoc 변환 함수는 그대로 두되, 디버깅 메시지를 추가
function convertWithPandoc($inputFile, $outputFile)
{
    try {
        $command = escapeshellcmd("pandoc " . escapeshellarg($inputFile) . " -o " . escapeshellarg($outputFile));
        exec($command, $output, $returnVar);
        
        // 디버깅용 로그: 명령어와 출력값, 반환 코드 기록
        error_log("Pandoc Command: $command");
        error_log("Pandoc Output: " . implode("\n", $output));
        error_log("Pandoc Return Var: $returnVar");

        // 명령어 실행 후 에러 발생 시
        if ($returnVar !== 0) {
            throw new Exception('Pandoc 변환 실패', $returnVar);
        }
        return true;
    } catch (Exception $e) {
        sendJsonResponse(400, 'Pandoc 변환 실패', [
            'output' => $output,
            'return_var' => $e->getCode()
        ]);
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
    if (!file_exists($filePath)) {
        throw new Exception("파일이 존재하지 않습니다: $filePath");
    }

    $file = fopen($filePath, 'rb');
    if (!$file) {
        throw new Exception("파일을 열 수 없습니다: $filePath");
    }

    $header = fread($file, 4);
    fclose($file);

    if ($header !== '%PDF') {
        return false;
    }

    return true;
}

// 파일 저장 함수에서 디렉터리 경로 처리 강화
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
            // 이미 존재하는 경우 기존 file_id 사용
            $existingFile = $fileExistsResult->fetch_assoc();
            $fileId = $existingFile['file_id'];
        } else {
            // 새로운 파일 저장
            $insertFileQuery = "INSERT INTO file_info (file_hash, file_extension, file_size, pdf_page_count, image_processed_count) VALUES (?, ?, ?, ?, 0)";
            $insertFileStmt = $conn->prepare($insertFileQuery);
            $fileSize = filesize($filepath);
            $insertFileStmt->bind_param("ssii", $fileHash, $fileExtension, $fileSize, $pageCount);
            $insertFileStmt->execute();
            $fileId = $insertFileStmt->insert_id;
        }

        // 업로드 기록 추가
        $sanitizedFileName = sanitizeFileName($filename);
        $insertUploadQuery = "INSERT INTO file_uploads (file_id, user_id, file_name) VALUES (?, ?, ?)";
        $insertUploadStmt = $conn->prepare($insertUploadQuery);
        $insertUploadStmt->bind_param("iis", $fileId, $userId, $sanitizedFileName);
        $insertUploadStmt->execute();

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

        $filepath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $filename; // 임시 디렉토리에 저장
        if (file_put_contents($filepath, $decodedData) === false) {
            throw new Exception("파일 저장 실패: $filepath");
        }

        return $filepath;
    } catch (Exception $e) {
        error_log($e->getMessage());
        return false;
    }
}

// main logic

// JSON 요청 본문을 받아서 배열로 변환
$data = json_decode(file_get_contents('php://input'), true);

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
