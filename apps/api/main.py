from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import ExtractRequest, ExtractResponse
from .extractor import extract_content

app = FastAPI(title="RSVP Readability API")

origins = [
    "http://localhost:3000",
]

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
