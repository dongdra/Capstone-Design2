// GET 요청 핸들러
exports.get_response = (params) => {
    console.log('Received GET request with params:', params);
    return {
            StatusCode: 200,
            message: 'Success to GET request!',
    };
};

// POST 요청 핸들러
exports.post_response = (data) => {
    console.log('Received POST request with data:', data);
    return {
            StatusCode: 200,
            message: 'Success to POST request!',
    };
};
