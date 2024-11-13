
# PDF 파일 삭제
/search/delete.php는 파일 삭제를 할 수 있는 API 입니다.

## 요청
|HTTP|
|--|
| `POST` http://{address}:{port}/search/delete.php |

#### 요청 바디

| 필드명        | 필수 여부 | 타입    | 설명                           |
|---------------|-----------|---------|--------------------------------|
| `identifier`  | `Y`       | `String`| 사용자 아이디 또는 이메일        |
| `password`    | `Y`       | `String`| 사용자 비밀번호                 |
| `upload_id`     | `Y`       | `Integer`| 업로드 고유번호                 |

#### 응답

#### 응답바디
|필드 이름|데이터 타입|설명|
|--|--|--|
|`StatusCode`|`Int`|상태 코드|
|`message`|`String`|응답 메시지|

#### 요청 예시
```url
http://{address}:{port}/search/delete.php
```
```json
{
    "identifier": "user@example.com",
    "password": "yourpassword"
    "upload_id": 1
}
```

##### 응답예시
```JSON
{
  "StatusCode": 200,
 "message": "파일이 성공적으로 삭제되었습니다."
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
