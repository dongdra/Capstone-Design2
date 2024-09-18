const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const xml2js = require('xml2js');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');

// .env 파일 로드
dotenv.config();

const app = express();
app.use(express.json()); // POST 요청에서 JSON 데이터 처리

// Rate Limiting 설정
const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS) || 60) * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    handler: (req, res) => {
        const response = {
            StatusCode: 429,
            message: 'Too many requests, please try again later.',
            RequestTime: DateTime.now().toISO()
        };
        res.status(429).json(response); // HTTP 상태 코드 429와 함께 반환
    }
});
app.use(limiter);

// CORS 설정
const allowedOrigins = JSON.parse(process.env.ALLOWED_ORIGINS || '["*"]');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.some(o => origin.endsWith(o.slice(1)))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

// 요청 포맷 설정 (JSON/XML)
const getContentType = (req) => req.query.format === 'xml' ? 'application/xml' : 'application/json';

// 응답 형식 처리
const responseFormat = (data, contentType = 'application/json') => {
    if (contentType === 'application/xml') {
        const builder = new xml2js.Builder();
        return builder.buildObject({ response: data });
    }
    return JSON.stringify(data);
};

// 공통 라우트 처리 함수
const handleRequest = async (endpointPath, method, req) => {
    const modulePath = path.join(__dirname, 'routes', endpointPath, 'index.js');
    
    if (!fs.existsSync(modulePath)) {
        console.log('Module not found at:', modulePath); // 디버깅 로그
        return {
            StatusCode: 404,
            message: 'Endpoint not found',
            RequestTime: DateTime.now().toISO(),
            httpStatus: 404
        };
    }

    const module = require(modulePath);
    const responseFunction = module[`${method.toLowerCase()}_response`];
    
    if (!responseFunction) {
        console.log('Method not supported:', method); // 디버깅 로그
        return {
            StatusCode: 405,
            message: `Method ${method} not supported for this endpoint`,
            RequestTime: DateTime.now().toISO(),
            httpStatus: 405
        };
    }

    const data = method === 'GET' ? req.query : req.body;

    try {
        // 비동기 함수 호출 (await 사용)
        const response = await responseFunction(data) || {};

        // 기본값 처리 (StatusCode, message가 누락된 경우)
        return {
            StatusCode: response.StatusCode || 500,
            message: response.message || 'An unknown error occurred',
            RequestTime: DateTime.now().toISO(),
            httpStatus: response.StatusCode || 500
        };
    } catch (error) {
        console.error('Error in handleRequest:', error);
        return {
            StatusCode: 500,
            message: 'Internal server error',
            RequestTime: DateTime.now().toISO(),
            httpStatus: 500
        };
    }
};

// /ping 경로 처리
app.all('/ping', (req, res) => {
    const contentType = getContentType(req);
    const response = handleRequest('ping', req.method, req);
    res.status(response.httpStatus || 500).contentType(contentType).send(responseFormat(response, contentType));
});

// /user/signup 경로 처리
app.all('/user/signup', async (req, res) => {
    const contentType = getContentType(req);
    const response = await handleRequest('user/signup', req.method, req); // await 추가
    res.status(response.httpStatus || 500).contentType(contentType).send(responseFormat(response, contentType));
});

// 서버 시작
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
