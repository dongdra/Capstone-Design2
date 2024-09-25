# 회원가입
`/user/signup.php`는 회원가입을 위한 경로입니다.

## 요청
|HTTP|
|--|
| `GET` / `POST` http://{address}:{port}/user/signup.php |

### 요청 바디
|필드명|필수 여부|타입|설명|
|--|--|--|--|
| `username` | `Y` | `String` | `유저명, 닉네임` |
| `password` | `Y` | `String` | `비밀번호` |
| `email` | `Y` | `String` | `이메일 주소` |
| `name` | `Y` | `String` | `이름` |

* `POST`로만 요청을 보내야 합니다.

### 응답
#### 응답 바디
|필드 이름|데이터 타입|설명|
|--|--|--|
|`StatusCode`|`Int`|상태 코드|
|`message`|`String`|응답 메시지|

### 요청 예시
```url
http://{address}:{port}/user/signup.php
```

```json
{
    "username": "testusers",
    "password": "securepassword123",
    "email": "testusers@example.com",
    "name": "Test User"
}
```

### 응답 예시
```JSON
{
	"StatusCode": 200,
	"message": "Sign up successfully"
}
```

### 오류
#### 필수 입력값 누락
```JSON
{
	"StatusCode": 400,
	"message": "필수 입력값이 누락되었습니다."
}
```

#### 중복 아이디
```JSON
{
	"StatusCode": 409,
	"message": "이미 사용 중인 아이디입니다."
}
```

#### 중복 이메일
```JSON
{
	"StatusCode": 409,
	"message": "이미 사용 중인 이메일입니다."
}
```

#### 기타 오류
```JSON
{
	"StatusCode": 500,
	"message": "회원 등록 중 오류가 발생했습니다."
}
```