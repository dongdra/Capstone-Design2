# 로그인
`/user/login.php`는 회원가입을 위한 경로입니다.

## 요청
|HTTP|
|--|
| `GET` / `POST` http://{address}:{port}/user/login.php |

### 요청 바디
|필드명|필수 여부|타입|설명|
|--|--|--|--|
| `identifier` | `Y` | `String` | `유저명 또는 이메일 주소` |
| `password` | `Y` | `String` | `비밀번호` |

* `identifier`에는 유저명 또는 이메일 주소를 입력해야 합니다.
* `POST`로만 요청을 보내야 합니다.

### 응답
#### 응답 바디
|필드 이름|데이터 타입|설명|
|--|--|--|
|`StatusCode`|`Int`|상태 코드|
|`message`|`String`|응답 메시지|

### 요청 예시
```url
http://{address}:{port}/user/login.php
```

```json
{
    "identifier": "testuser",
    "password": "securepassword123"
}
```

### 응답 예시
```JSON
{
	"StatusCode": 200,
	"message": "Login successful"
}
```

### 오류
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
