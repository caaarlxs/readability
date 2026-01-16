from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import ExtractRequest, ExtractResponse
from extractor import extract_content
import os

app = FastAPI(title="RSVP Readability API")

# Allow environment-based CORS configuration
# In production, set ALLOWED_ORIGINS to your Vercel domain
# Example: ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-app.com
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/extract", response_model=ExtractResponse)
async def extract_url(req: ExtractRequest):
    return await extract_content(str(req.url))
