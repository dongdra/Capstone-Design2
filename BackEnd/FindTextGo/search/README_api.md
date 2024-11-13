# PDF 파일 업로드
/search/api.php는 파일 목록 검색, 문서 내용 검색할 수 있는 API 입니다.

## 요청
|HTTP|
|--|
| `POST` http://{address}:{port}/search/api.php |

#### 요청 바디

| 필드명        | 필수 여부 | 타입    | 설명                           |
|---------------|-----------|---------|--------------------------------|
| `identifier`  | `Y`       | `String`| 사용자 아이디 또는 이메일      |
| `password`    | `Y`       | `String`| 사용자 비밀번호                |
| `search_term` | `N`       | `String`| 검색 조건     |

* search_term에서 사용 가능한 검색 조건은 다음과 같습니다.
    - `upload:20240101` → 해당 날짜에 올린 파일 검색
    - `upload:20240101-20240901` → 해당 날짜 범위 검색
    - `filetype:pdf` → pdf 파일만
    - `filetype:pdf,hwp` → pdf, hwp 파일
    - `pages:300` → 페이지 수 300페이지
    - `pages:>15` → 15 페이지 초과
    - `pages:<=15` → 15 페이지 이하
    - `size:500KB` → 500KB(단위 없으면 바이트로 간주)
    - `size:<5MB` → 5MB 미만
    - `filename:'파일명'` → '파일명'이라는 파일 이름 찾기(확장자 무시)
    - `text:'ocr 텍스트'` → OCR 처리된 텍스트 검색(해당 문서의 페이지 정보만 반환)

#### 응답

#### 응답바디
|필드 이름|데이터 타입|설명|
|--|--|--|
|`StatusCode`|`Int`|상태 코드|
|`message`|`String`|응답 메시지|
|`data`|`Array`|문서 정보가 담긴 배열|

#### 요청 예시
##### 해당 유저 소유의 문서 정보 출력
```url
http://{address}:{port}/search/api.php
```
```json
{
    "identifier": "user@example.com",
    "password": "yourpassword"
}
```

##### 응답예시
```JSON
{
  "StatusCode": 200,
  "message": "검색 성공",
  "data": [
    {
      "file_name": "1. 2023학년도 1학기 STEP 교과목 운영계획서 1부.pdf",
      "file_extension": "pdf",
      "pdf_page_count": 2,
      "file_size": 57878,
      "upload_date": "2024-10-02 15:06:35",
      "first_page_image": "UklGRvC..."
    }
}
```

##### 해당 유저 소유의 문서 내에서 검색
```url
http://{address}:{port}/search/api.php
```
```json
{
    "identifier": "user@example.com",
    "password": "yourpassword",
    "search_term": "upload:20241002"
}
```

##### 응답예시
```JSON
{
  "StatusCode": 200,
  "message": "검색 성공",
  "data": [
    {
      "file_name": "1. 2023학년도 1학기 STEP 교과목 운영계획서 1부.pdf",
      "file_extension": "pdf",
      "pdf_page_count": 2,
      "file_size": 57878,
      "upload_date": "2024-10-02 15:06:35",
      "first_page_image": "UklGRvC..."
    }
}
```

#### 오류
##### 아이디(이메일) 또는 비밀번호 미입력
```JSON
{
   "StatusCode": 400,
   "message": "아이디/이메일과 비밀번호를 모두 입력해야 합니다."
}
```

##### 사용자 존재 안함 / 아이디(이메일) 및 비밀번호 불일치
```JSON
{
   "StatusCode": 401,
   "message": "아이디/이메일 또는 비밀번호가 잘못되었습니다."
}
```

##### 검색 결과 없음
```JSON
{
   "StatusCode": 404,
   "message": "검색 결과가 없습니다."
}
```
