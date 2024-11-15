import sys
import google.generativeai as genai
import json

# Configure the Google Gemini API
genai.configure(api_key="AIzaSyAH3nXug262foRug7tPKQHePBXuImgOulM")  # Replace with your actual API key

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
chat_session = model.start_chat(history=[])

# Get input arguments
story_prompt = sys.argv[1]

# Generate the animal story
story_request = f"""

Imagine you are my Indian  grandma and a great story teller and you are narrating a story about {story_prompt}. 
Please narrate the story in an engaging manner through an through an imaginative storytelling.
Focus on narratives that are beneficial for a child’s development—both intellectually and ethically—while avoiding themes that might be inappropriate or unhelpful for their growth.
make sure each story has a great moral.
The stories should emphasize popular, unique, and fresh concepts that resonate with children in today’s world with olden golden values so that children are subtly educated in values such as kindness, empathy, perseverance, and honesty.

Use simple language that is easy for them to understand. 
Avoid using any non-ASCII characters in your response. 
Do not include any unnecessary quotation marks, hashtags, or highlighted headings. 
Keep the information concise and avoid extra details or introductory phrases.
Avoid this character in the response "�".


"""
story_response = chat_session.send_message(story_request)
generated_story = story_response.text

# Output the generated story
print(generated_story)
