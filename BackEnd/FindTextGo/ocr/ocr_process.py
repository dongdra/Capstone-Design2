from flask import Flask, request, jsonify
import easyocr

app = Flask(__name__)

# Initialize easyocr Reader (supports Korean and English)
reader = easyocr.Reader(['ko', 'en'])

# Endpoint for OCR processing
@app.route('/ocr', methods=['POST'])
def perform_ocr():
    if 'image_path' not in request.json:
        return jsonify({'StatusCode': 400, 'message': 'Image path is required'}), 400
    
    image_path = request.json['image_path']
    
    try:
        # Perform OCR
        results = reader.readtext(image_path, detail=1)

        ocr_data = []
        for result in results:
            coordinates = result[0]
            x_min = min(coordinates[0][0], coordinates[3][0])
            y_min = min(coordinates[0][1], coordinates[1][1])
            x_max = max(coordinates[1][0], coordinates[2][0])
            y_max = max(coordinates[2][1], coordinates[3][1])
            width = x_max - x_min
            height = y_max - y_min
            text = result[1]

            ocr_data.append({
                'text': text,
                'x': int(x_min),
                'y': int(y_min),
                'width': int(width),
                'height': int(height)
            })

        return jsonify({'StatusCode': 200, 'data': ocr_data}), 200

    except Exception as e:
        return jsonify({'StatusCode': 500, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
