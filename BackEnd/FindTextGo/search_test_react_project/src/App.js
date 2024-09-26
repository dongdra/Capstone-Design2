// OCRDisplay.js
import React, { useState } from 'react';
import { Card, Spin, Alert, Form, Input, Button, List } from 'antd';
import axios from 'axios';
import './OCRDisplay.css'; // For custom styles

const OCRDisplay = () => {
  const [ocrResults, setOcrResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSearch = async (values) => {
    setLoading(true);
    setError(null);
    setOcrResults([]);

    try {
      const response = await axios.post('http://localhost/search.php', {
        identifier: values.identifier,
        password: values.password,
        search_term: values.search_term,
      });

      if (response.data.StatusCode === 200) {
        const data = response.data.data;
        if (data.length > 0) {
          // Group data by file_id and page_number to handle multiple pages
          const groupedData = data.reduce((acc, item) => {
            const key = `${item.file_id}_${item.page_number}`;
            if (!acc[key]) acc[key] = { file_id: item.file_id, page_number: item.page_number, items: [] };
            acc[key].items.push(item);
            return acc;
          }, {});
          setOcrResults(Object.values(groupedData));
        } else {
          setError('No OCR results found for the search term.');
        }
      } else {
        setError(response.data.message || 'Failed to fetch OCR data');
      }
    } catch (err) {
      setError('Error fetching OCR data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="ocr-display-card">
      <Form layout="inline" onFinish={handleSearch}>
        <Form.Item
          name="identifier"
          rules={[{ required: true, message: 'Please input your ID or email!' }]}
        >
          <Input placeholder="ID or Email" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>
        <Form.Item
          name="search_term"
          rules={[{ required: true, message: 'Please input a search term!' }]}
        >
          <Input placeholder="Search Term" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Search
          </Button>
        </Form.Item>
      </Form>

      {loading ? (
        <Spin tip="Loading..."></Spin>
      ) : error ? (
        <Alert message="Error" description={error} type="error" showIcon />
      ) : (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={ocrResults}
          renderItem={(result) => (
            <List.Item>
              <OCRResultDisplay result={result} />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

// Component to display individual OCR result
const OCRResultDisplay = ({ result }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  // Update the image dimensions on load for accurate bounding box scaling
  const handleImageLoad = (e) => {
    setImageLoaded(true);
    setImageWidth(e.target.naturalWidth);
    setImageHeight(e.target.naturalHeight);
  };

  return (
    <div className="ocr-container">
      <img
        src={`http://localhost/documents/${result.file_id}/${result.page_number}.png`}
        alt={`OCR Result - File ${result.file_id} Page ${result.page_number}`}
        className="ocr-image"
        onLoad={handleImageLoad}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      {imageLoaded &&
        result.items.map((item) => (
          <div
            key={item.ocr_id}
            className="ocr-bounding-box"
            style={{
              left: `${(item.coord_x / imageWidth) * 100}%`,
              top: `${(item.coord_y / imageHeight) * 100}%`,
              width: `${(item.coord_width / imageWidth) * 100}%`,
              height: `${(item.coord_height / imageHeight) * 100}%`,
            }}
          >
            <span className="ocr-text">{item.extracted_text}</span>
          </div>
        ))}
    </div>
  );
};

export default OCRDisplay;
