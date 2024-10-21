# PDF 요약
/summary/api.php는 파일 요약을 위한 경로입니다.

## 의존성 프로그램
본 기능을 정상 사용하기 위해서는 다음 프로그램들이 필요합니다.
* composer require vlucas/phpdotenv

## 요청
|HTTP|
|--|
| `POST` http://{address}:{port}/summary/api.php |

#### 요청 바디

| 필드명        | 필수 여부 | 타입    | 설명                             |
|---------------|-----------|---------|--------------------------------|
| `identifier`  | `Y`       | `String`| 사용자 아이디 또는 이메일        |
| `password`    | `Y`       | `String`| 사용자 비밀번호                 |
| `file_id`     | `Y`       | `Int`   | 사용자가 소유한 문서의 고유번호  |

#### 응답

#### 응답바디
|필드 이름|데이터 타입|설명|
|--|--|--|
|`StatusCode`|`Int`|상태 코드|
|`message`|`String`|응답 메시지|
|`data`|`Object`|요약 결과가 담긴 Object|
|`summary`|`String`|PDF 요약 결과(마크다운 문법으로 담겨 있음)|

#### 요청 예시
```url
http://{address}:{port}/summary/api.php
```
```json
{
    "identifier": "user@example.com",
    "password": "yourpassword",
    "file_id": 10
}
```
#### 응답예시
```JSON
{
	"StatusCode": 200,
	"message": "파일 처리 및 요약 성공",
	"data": {
		"summary": "재난긴급지원금 관련 부채증명서 발급 안내입니다. 공사 홈페이지에서 인터넷뱅킹, 모기지론, 공인인증서 로그인, 증명서 발급 메뉴 순으로 진행하여 부채증명서를 발급받을 수 있습니다. 재난으로 인한 재산 피해 증빙 서류입니다. 관련 서류는 시청이나 시민센터에서 작성해야 합니다."
	}
}
```

#### 오류
##### 아이디(이메일) 또는 비밀번호 미입력, 사용자 존재 안함 / 아이디(이메일) 및 비밀번호 불일치
```JSON
{
	"StatusCode": 400,
	"message": "아이디\/이메일, 비밀번호, 파일 ID를 모두 입력해야 합니다."
}
```

##### 권한 없는 파일 아이디 입력
```JSON
{
	"StatusCode": 403,
	"message": "해당 파일에 접근 권한이 없습니다."
}
```
