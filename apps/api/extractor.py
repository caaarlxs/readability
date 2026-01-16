import httpx
from readability import Document
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
import asyncio

from models import ExtractResponse


# Configuration (could be moved to env vars)
MIN_TEXT_LENGTH = 500
TIMEOUT_FAST = 10.0
TIMEOUT_RENDER = 30.0


async def fetch_fast(url: str) -> str:
    async with httpx.AsyncClient(follow_redirects=True, timeout=TIMEOUT_FAST) as client:
        # Mocking a common user agent is often helpful
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        return resp.text


async def fetch_render(url: str) -> str:
    async with async_playwright() as p:
        # Launch with arguments to reduce bot detection
        browser = await p.chromium.launch(
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-setuid-sandbox"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720},
            device_scale_factor=2,
        )
        page = await context.new_page()

        # Add stealth scripts to hide webdriver property
        await page.add_init_script(
            """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """
        )

        try:
            await page.goto(url, timeout=TIMEOUT_RENDER * 1000, wait_until="domcontentloaded")

            # Specific handling for X.com / Twitter
            if "x.com" in url or "twitter.com" in url:
                print("Waiting for tweet text...")
                try:
                    # Wait for the tweet text to explicitly appear
                    await page.wait_for_selector('[data-testid="tweetText"]', timeout=8000)
                except Exception:
                    print("Timeout waiting for tweetText")

            # General wait for dynamic content
            await page.wait_for_timeout(2000)

            content = await page.content()
            return content
        finally:
            await browser.close()


def parse_html(html: str, url: str) -> dict:
    doc = Document(html)
    title = doc.title()
    summary_html = doc.summary()

    # Convert summary HTML to plain text
    soup = BeautifulSoup(summary_html, "lxml")
    text = soup.get_text(separator="\n\n", strip=True)

    return {"title": title, "text": text, "html": summary_html}


async def extract_content(url: str):

    try:
        # 1. Try Fast Path
        try:
            html = await fetch_fast(url)
            data = parse_html(html, url)

            # Check if sufficient
            if len(data.get("text", "")) >= MIN_TEXT_LENGTH:
                return ExtractResponse(
                    url=url, title=data["title"], text=data["text"], length=len(data["text"]), method="fast"
                )
        except Exception as e:
            print(f"Fast path failed: {e}")
            # If fast path fails (e.g. 403, or parsing error), fall through to render
            pass

        # 2. Try Render Path (Fallback)
        print("Falling back to render path...")
        html = await fetch_render(url)
        data = parse_html(html, url)

        return ExtractResponse(
            url=url, title=data["title"], text=data["text"], length=len(data["text"]), method="render"
        )

    except Exception as e:
        return ExtractResponse(url=url, error=str(e), method="failed")


if __name__ == "__main__":
    # Helper for running directly: python apps/api/extractor.py "https://..."
    import sys

    # Default URL to test if none provided
    test_url = sys.argv[1] if len(sys.argv) > 1 else "https://en.wikipedia.org/wiki/Batman_Returns"

    async def main():
        print(f"Extracting from: {test_url}")
        result = await extract_content(test_url)
        print("--- Result ---")
        print(result)

    asyncio.run(main())
