import base64
import json
import os
import requests
import sys
from typing import Optional

class MermaidConverter:
    def __init__(self, output_dir: str = "output"):
        self.output_dir = output_dir
        self.mermaid_api_url = "https://mermaid.ink/img/"
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f" Created output directory: {output_dir}")
    
    def encode_mermaid(self, mermaid_code: str) -> str:
        """Encodes the Mermaid code for API use."""
        json_obj = {"code": mermaid_code, "mermaid": {"theme": "default"}}
        json_str = json.dumps(json_obj)
        encoded = base64.urlsafe_b64encode(json_str.encode('utf-8')).decode('utf-8')
        print(" Successfully encoded Mermaid diagram")
        return encoded
    
    def get_mermaid_image(self, encoded_data: str) -> Optional[bytes]:
        """Fetches the image generated from the Mermaid API."""
        try:
            url = f"{self.mermaid_api_url}{encoded_data}"
            print(" Sending request to Mermaid API...")
            
            response = requests.get(url)
            response.raise_for_status()
            
            print(" Successfully received image from API")
            return response.content
        except requests.exceptions.RequestException as e:
            print(f" Error fetching image from Mermaid API: {str(e)}")
            return None
    
    def save_image(self, image_data: bytes, output_filename: str) -> bool:
        """Saves the generated image to a file."""
        try:
            output_path = os.path.join(self.output_dir, output_filename)
            with open(output_path, 'wb') as file:
                file.write(image_data)
            print(f" Successfully saved image to: {output_path}")
            return True
        except Exception as e:
            print(f" Error saving image: {str(e)}")
            return False
    
    def convert(self, mermaid_code: str, output_filename: str) -> bool:
        """Main method to convert Mermaid code to an image."""
        print("\nMermaid Diagram Converter")
        print("=" * 50)
        print(f"Output file: {output_filename}")
        print("=" * 50 + "\n")
        
        try:
            # Encode Mermaid code
            encoded_data = self.encode_mermaid(mermaid_code)
            
            # Get image from Mermaid API
            image_data = self.get_mermaid_image(encoded_data)
            
            if image_data:
                # Save image
                if self.save_image(image_data, output_filename):
                    print("\n Conversion completed successfully!")
                    return True
            
            print("\n Conversion failed!")
            return False
        except Exception as e:
            print(f"\n Error during conversion: {str(e)}")
            return False

def read_mermaid_code(file_path: str) -> str:
    """Reads the Mermaid code from a specified file."""
    try:
        with open(file_path, 'r') as file:
            return file.read()
    except Exception as e:
        print(f" Error reading Mermaid code from file: {str(e)}")
        return ""

if __name__ == "__main__":
    print("output_filename")
    # Read Mermaid code file path and output filename from command-line arguments
    mermaid_code_file = sys.argv[1]  # Path to Mermaid code file
    output_filename = sys.argv[2]    # Output image filename
    
    # Read Mermaid code from file
    mermaid_code = read_mermaid_code(mermaid_code_file)
    
    if mermaid_code:
        converter = MermaidConverter()
        converter.convert(mermaid_code, output_filename)
        print(output_filename)
    else:
        print(" Mermaid code file is empty or couldn't be read.")
