# save_pdf_as_png.py
import sys
import os
from pdf2image import convert_from_path
from datetime import datetime
import cv2
import numpy as np

def convert_pdf_to_images(pdf_path, output_dir, user_name):
    try:
        # Convert PDF to images
        images = convert_from_path(pdf_path)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        # Create subfolder for WEBP images
        webp_dir = os.path.join(output_dir, "webp")
        if not os.path.exists(webp_dir):
            os.makedirs(webp_dir, exist_ok=True)

        # Current date for watermark
        current_date = datetime.now().strftime('%Y-%m-%d')

        # Save each page as PNG and WEBP with watermark
        for i, page in enumerate(images):
            png_path = os.path.join(output_dir, f"{i + 1}.png")
            webp_path = os.path.join(webp_dir, f"{i + 1}.webp")

            # Save the image in PNG format
            page.save(png_path, 'PNG')
            # Save the image in WEBP format
            page.save(webp_path, 'WEBP')

            # Apply watermark
            watermark_text = f"Uploaded by {user_name} on {current_date}"
            embed_watermark(png_path, png_path, watermark_text)
            embed_watermark(webp_path, webp_path, watermark_text)

        print("success")
    except Exception as e:
        print(f"error: {str(e)}")

def embed_watermark(input_image_path, output_image_path, watermark_text):
    # Load color image (BGR)
    img = cv2.imread(input_image_path)

    # Convert the image to YUV to insert watermark in the Y channel
    yuv_img = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
    y_channel = yuv_img[:, :, 0]

    # Convert the watermark text to binary bit sequence
    watermark_bits = np.unpackbits(np.frombuffer(watermark_text.encode('utf-8'), dtype=np.uint8))
    wm_size = y_channel.shape[0] // 8 * y_channel.shape[1] // 8
    watermark_bits = np.pad(watermark_bits, (0, wm_size - len(watermark_bits)), 'constant')

    # Randomly distribute watermark bits within the image blocks
    np.random.seed(42)  # Ensures repeatability
    indices = np.random.permutation(wm_size)

    # Insert the watermark into 8x8 blocks
    bit_index = 0
    for i in range(0, y_channel.shape[0], 8):
        for j in range(0, y_channel.shape[1], 8):
            if bit_index >= len(indices):
                break

            # Select current block
            block = y_channel[i:i+8, j:j+8]
            if block.size == 0:
                continue

            # Dynamically adjust embedding strength
            mean_intensity = block.mean()
            strength = 1 if mean_intensity < 128 else 0.5

            # Insert watermark bit at random location in the block
            idx = indices[bit_index]
            block_index = (idx // block.shape[1], idx % block.shape[1])
            block[block_index] = (block[block_index] & ~1) | int(watermark_bits[bit_index]) * strength
            y_channel[i:i+8, j:j+8] = block

            bit_index += 1

    # Update the Y channel in the original image
    yuv_img[:, :, 0] = y_channel

    # Convert YUV image back to BGR
    watermarked_img = cv2.cvtColor(yuv_img, cv2.COLOR_YUV2BGR)

    # Save the watermarked image
    cv2.imwrite(output_image_path, watermarked_img)

if __name__ == "__main__":
    # Get PDF path and output directory from command line arguments
    if len(sys.argv) != 4:
        print("error: Invalid arguments")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    user_name = sys.argv[3]

    convert_pdf_to_images(pdf_path, output_dir, user_name)
