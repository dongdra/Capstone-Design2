# PDF 파일 업로드
/upload/upload.php는 파일업로드을 위한 경로입니다.

## 요청
|HTTP|
|--|
| `POST` http://{address}:{port}/upload/upload.php |

#### 요청 바디

| 필드명        | 필수 여부 | 타입    | 설명                           |
|---------------|-----------|---------|--------------------------------|
| `identifier`  | `Y`       | `String`| 사용자 아이디 또는 이메일      |
| `password`    | `Y`       | `String`| 사용자 비밀번호                |
| `file_base64` | `Y`       | `String`| Base64로 인코딩된 PDF 파일     |
| `filename`    | `N`       | `String`| 파일 이름 (기본값: `noname.pdf`) |

#### 응답

#### 응답바디
|필드 이름|데이터 타입|설명|
|--|--|--|
|`StatusCode`|`Int`|상태 코드|
|`message`|`String`|응답 메시지|

#### 요청 예시
```url
http://{address}:{port}/user/login.php
```
```json
{
    "identifier": "user@example.com",
    "password": "yourpassword",
    "file_base64": "data:application/pdf;base64,...",
    "filename": "example.pdf"
}
```
#### 응답예시
```JSON
{
   "StatusCode": 200,
   "message": "Upload successful"
}
```

#### 오류
#### 아이디(이메일) 또는 비밀번호 미입력
```JSON
{
   "StatusCode": 400,
   "message": "아이디/이메일과 비밀번호를 모두 입력해야 합니다."
}
```

#### 사용자 존재 안함 / 아이디(이메일) 및 비밀번호 불일치
```JSON
{
   "StatusCode": 401,
   "message": "아이디/이메일 또는 비밀번호가 잘못되었습니다."
}
```
