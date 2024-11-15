import sys
import google.generativeai as genai
import json

# Configure the Google Gemini API
genai.configure(api_key="AIzaSyAH3nXug262foRug7tPKQHePBXuImgOulM")  # Use your actual API key

generation_config = {
    "temperature": 1.0, 
    "top_p": 1.0,
    "top_k": 0,
    "max_output_tokens": 10000,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
)

# Get input arguments
fact_prompt = sys.argv[1]

# Start chat session for generating the fact
chat_session = model.start_chat(history=[])

# Generate the fact
fact_request = f"""

Imagine you are a knowledgeable person sharing a fun fact about {fact_prompt} with a 5 to 10-year-old Indian student. 
Use simple language that is easy for them to understand. 
Avoid using any non-ASCII characters in your response. 
Do not include any unnecessary quotation marks, hashtags, or highlighted headings. 
Keep the information concise and avoid extra details or introductory phrases. Format the response like the below format:
"Did you know that the Great Barrier Reef is the largest living structure on Earth? It is made up of millions of tiny creatures called coral."
Avoid this character in the response "�".

"""
fact_response = chat_session.send_message(fact_request)
generated_fact = fact_response.text

# Output the generated fact
print(generated_fact)
