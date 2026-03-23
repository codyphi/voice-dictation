# Voice Dictation

Privacy-first voice dictation with local Whisper transcription, smart formatting, voice commands, and AI post-processing.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Rust** (for Tauri desktop build — optional for dev)
- **Ollama** (for AI features — `brew install ollama` then `ollama pull mistral`)

## Quick Start (Development)

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

The API server starts at `http://127.0.0.1:8000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/ws` and `/api` to the backend.

### 3. Desktop (Tauri)

Requires Rust. From the project root:

```bash
cd frontend
npm install
cd ../src-tauri
cargo tauri dev
```

## Project Structure

```
voice-dict/
├── backend/          Python FastAPI server
│   ├── main.py          WebSocket + REST endpoints
│   ├── transcriber.py   faster-whisper integration
│   ├── commands.py      Voice command parser
│   ├── formatter.py     Smart text formatting
│   ├── ai_processor.py  Ollama AI post-processing
│   └── config.py        App configuration
├── frontend/         React + TypeScript + Tailwind
│   └── src/
│       ├── App.tsx
│       ├── components/  UI components
│       ├── hooks/       Audio & WebSocket hooks
│       └── utils/       Audio conversion utilities
└── src-tauri/        Tauri desktop shell (Rust)
    └── src/main.rs      Global hotkey, tray, backend lifecycle
```

## Voice Commands

| Say this                   | Action                |
| -------------------------- | --------------------- |
| "delete that"              | Delete last word      |
| "delete last sentence"     | Delete last sentence  |
| "new line" / "new paragraph" | Insert break       |
| "undo" / "undo that"      | Undo last action      |
| "stop dictation"           | Pause recording       |
| "select all"               | Select all text       |
| "bold that" / "italicize that" | Format text      |

## AI Actions

Select text in the editor, then click an AI action:

- **Summarize** — Condense selected text
- **Rewrite** — Improve clarity and flow
- **Fix Grammar** — Correct errors
- **Translate** — Translate to another language
- **Expand** — Elaborate on notes
