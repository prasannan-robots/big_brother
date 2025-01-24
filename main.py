from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import openai
import os
import uvicorn
from dotenv import load_dotenv
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://nninmhcncmmlplpnfklkdeohhmfggcpd"],  # Replace with your Chrome extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = os.getenv("OPENAI_API_KEY")

class ImageRequest(BaseModel):
    image_base64: str
class Output(BaseModel):
    scam: bool


@app.post("/classify-image")
async def classify_image(request: ImageRequest):
    prompt = "Classify whether the post is scam or not.Consider only financial scams."
    response = openai.beta.chat.completions.parse(
    model="gpt-4o-mini",
    response_format=Output,
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {"url": request.image_base64},
                },
            ],
        }
    ],)
    return response.choices[0].message.parsed.scam
   


@app.post("/test")
async def classify_image(request: ImageRequest):
 
    return True
   

# if __name__ == "__main__":
   
#     uvicorn.run(app, host="0.0.0.0", port=8000)