# save_pdf_as_png.py
import sys
import os
from pdf2image import convert_from_path
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

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

            # Apply watermark using Pillow
            watermark_text = f"Uploaded by {user_name} on {current_date}"
            add_watermark(png_path, watermark_text)
            add_watermark(webp_path, watermark_text)

        print("success")
    except Exception as e:
        print(f"error: {str(e)}")

def add_watermark(image_path, watermark_text):
    # Open an image file
    with Image.open(image_path) as img:
        # Make the image editable
        drawing = ImageDraw.Draw(img)

        # Define the font (you might need to provide the path to a .ttf file)
        try:
            font = ImageFont.truetype("arial.ttf", 36)  # You can adjust the font size
        except IOError:
            font = ImageFont.load_default()

        # Position for the watermark
        text_position = (img.width - 300, img.height - 50)  # Adjust the position as needed

        # Add watermark text to the image
        drawing.text(text_position, watermark_text, fill=(255, 255, 255), font=font)

        # Save the watermarked image back to the file
        img.save(image_path)

if __name__ == "__main__":
    # Get PDF path and output directory from command line arguments
    if len(sys.argv) != 4:
        print("error: Invalid arguments")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    user_name = sys.argv[3]

    convert_pdf_to_images(pdf_path, output_dir, user_name)
