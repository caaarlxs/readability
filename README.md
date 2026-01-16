# RSVP Reader

A modern web application for speed reading articles using the RSVP (Rapid Serial Visual Presentation) technique. Paste any article URL and read it one word at a time with optimal recognition point highlighting.

## Features

- 🚀 **Universal URL extraction** - Works with most public articles and blog posts
- ⚡ **RSVP reading** - Read at speeds from 100 to 1000 WPM
- 🎯 **ORP highlighting** - Optimal Recognition Point for faster reading
- 📖 **Full text view** - See the entire article with paragraph formatting
- 🌙 **Dark mode** - Comfortable reading in any lighting
- 📱 **Responsive** - Works on desktop and mobile

## Tech Stack

### Frontend

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling

### Backend

- **FastAPI** - Python web framework
- **Playwright** - Headless browser for JavaScript-heavy sites
- **Readability** - Content extraction algorithm
- **BeautifulSoup4** - HTML parsing

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.10+
- pip

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/caaarlxs/readability.git
   cd readability
   ```

2. **Install frontend dependencies**

   ```bash
   cd apps/web
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../api
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   playwright install chromium
   ```

### Running the Application

1. **Start the backend** (from `apps/api`)

   ```bash
   source .venv/bin/activate
   uvicorn apps.api.main:app --reload --port 8000
   ```

2. **Start the frontend** (from `apps/web`)

   ```bash
   npm run dev
   ```

3. **Open your browser**
   ```
   http://localhost:3000
   ```

## Usage

1. Paste an article URL into the input field
2. Click "Start reading →"
3. Use the controls to:
   - ⏯️ Play/Pause
   - ⏪⏩ Skip 10 words backward/forward
   - 🎚️ Adjust reading speed (WPM)
   - 📄 Toggle full text view

## How It Works

### Content Extraction

The backend uses a two-phase extraction strategy:

1. **Fast Path**: Direct HTTP fetch + Readability algorithm
2. **Render Path**: Playwright headless browser for JavaScript-heavy sites (fallback)

This approach works with most public articles without site-specific rules.

### RSVP Reading

Words are displayed one at a time with the Optimal Recognition Point (ORP) highlighted in red. The ORP is calculated based on word length:

- 1-2 letters: position 1
- 3-5 letters: position 2
- 6-9 letters: position 3
- 10-13 letters: position 4
- 14+ letters: position 5

## Project Structure

```
readability/
├── apps/
│   ├── api/          # FastAPI backend
│   │   ├── main.py
│   │   ├── extractor.py
│   │   └── models.py
│   └── web/          # Next.js frontend
│       └── src/
│           ├── app/
│           └── components/
└── PROJECT.md        # Detailed architecture docs
```

## Limitations

- Only works with **public articles** (no paywalls or login-required content)
- May not extract content from heavily JavaScript-dependent sites
- Anti-bot protection may block some requests
- Video/image-only content cannot be extracted

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Author

Built by [caaarlxs](https://github.com/caaarlxs)

## Acknowledgments

- [Readability](https://github.com/mozilla/readability) - Content extraction algorithm
- [Playwright](https://playwright.dev/) - Browser automation
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
