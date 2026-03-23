# Voice Dict — Privacy-First Voice Dictation

A local-first voice dictation product with smart formatting, voice commands,
and AI post-processing. All speech-to-text runs on-device via Whisper.

## Core Features

- **Real-time dictation** — Speak into your mic, see text appear live
- **Smart formatting** — Auto-punctuation, capitalization, number conversion
- **Voice commands** — "Delete that", "new paragraph", "undo", etc.
- **AI post-processing** — Summarize, rewrite, fix grammar, translate (via local Ollama)
- **Desktop app** — Tauri shell with global hotkey (Ctrl+Shift+D) and system tray

## Architecture

- **Backend**: Python + FastAPI + faster-whisper + Ollama
- **Frontend**: React + TypeScript + Tailwind CSS
- **Desktop**: Tauri v2 (Rust)
