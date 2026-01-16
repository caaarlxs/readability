from pydantic import BaseModel, HttpUrl
from typing import Optional, Any


class ExtractRequest(BaseModel):
    url: HttpUrl


class ExtractResponse(BaseModel):
    url: str
    title: Optional[str] = None
    text: Optional[str] = None
    byline: Optional[str] = None
    site_name: Optional[str] = None
    length: int = 0
    excerpt: Optional[str] = None
    method: str = "fast"  # 'fast' or 'render'
    error: Optional[str] = None
