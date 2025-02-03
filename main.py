from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
import sqlite3
from datetime import datetime

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://nninmhcncmmlplpnfklkdeohhmfggcpd"],  # Replace with your Chrome extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


conn = sqlite3.connect('background.db')
cursor = conn.cursor()
cursor.execute('''CREATE TABLE IF NOT EXISTS scamdata
             (date text, image text, target text)''')

cursor = conn.cursor()

openai.api_key = os.getenv("OPENAI_API_KEY")

class ImageRequest(BaseModel):
    image_base64: str
class Output(BaseModel):
    scam: bool
    target: str


@app.post("/classify-image")
async def classify_image(request: ImageRequest):
    prompt = "Classify whether the post is scam or not. Consider only financial scams and the target group of the scam."
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
        ],
    )
    print(response.choices[0].message.parsed.scam)
    if response.choices[0].message.parsed.scam:
        cursor.execute(
            "INSERT INTO scamdata VALUES (?, ?, ?)",
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), request.image_base64, response.choices[0].message.parsed.target)
        )
        conn.commit()

    return response.choices[0].message.parsed.scam

@app.on_event("shutdown")
def shutdown_event():
    conn.close()
 


@app.post("/test")
async def classify_image(request: ImageRequest):
    cursor.execute(
            "INSERT INTO scamdata VALUES (?, ?, ?)",
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), request.image_base64, 'test')
        )
    conn.commit()
    return True
   

# if __name__ == "__main__":
   
#     uvicorn.run(app, host="0.0.0.0", port=8000)