import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import config
from transcriber import transcribe_audio, get_model
from commands import parse, parse_fuzzy
from formatter import format_text
from ai_processor import process as ai_process, SUPPORTED_ACTIONS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Pre-loading Whisper model…")
    await asyncio.to_thread(get_model)
    logger.info("Backend ready.")
    yield

app = FastAPI(title="Voice Dictation API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

is_start_of_sentence = True


@app.websocket("/ws/dictate")
async def dictate(ws: WebSocket):
    await ws.accept()
    logger.info("WebSocket client connected.")
    is_start_of_sentence = True
    session_language: str = config.whisper.language
    command_mode = False

    try:
        while True:
            raw = await ws.receive()

            if "text" in raw:
                import json
                try:
                    msg = json.loads(raw["text"])
                    if msg.get("type") == "set_language":
                        session_language = msg.get("language", "en")
                        logger.info("Session language set to: %s", session_language)
                        await ws.send_json({"type": "language_set", "language": session_language})
                        continue
                    if msg.get("type") == "set_command_mode":
                        command_mode = msg.get("active", False)
                        logger.info("Command mode: %s", command_mode)
                        continue
                except (json.JSONDecodeError, TypeError):
                    continue

            audio_bytes = raw.get("bytes")
            if not audio_bytes:
                continue

            segments = await asyncio.to_thread(transcribe_audio, audio_bytes, session_language)

            for seg in segments:
                logger.info("Segment [cmd=%s]: '%s'", command_mode, seg["text"])
                if command_mode:
                    result = parse_fuzzy(seg["text"])
                    if result.is_command:
                        await ws.send_json({
                            "type": "command",
                            "command": result.command,
                        })
                        is_start_of_sentence = True
                    else:
                        logger.info("Command mode: no match for '%s'", seg["text"])
                else:
                    formatted = format_text(
                        seg["text"],
                        is_start_of_sentence=is_start_of_sentence,
                    )
                    await ws.send_json({
                        "type": "transcript",
                        "text": formatted,
                        "start": seg["start"],
                        "end": seg["end"],
                        "language": seg.get("language"),
                    })
                    is_start_of_sentence = formatted.endswith((".", "!", "?"))

    except (WebSocketDisconnect, RuntimeError):
        logger.info("WebSocket client disconnected.")


class AIRequest(BaseModel):
    action: str
    text: str
    target_language: str = "Spanish"


class AIResponse(BaseModel):
    result: str


@app.post("/api/ai", response_model=AIResponse)
async def ai_endpoint(req: AIRequest):
    result = await ai_process(req.action, req.text, req.target_language)
    return AIResponse(result=result)


@app.get("/api/ai/actions")
async def ai_actions():
    return {"actions": SUPPORTED_ACTIONS}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=config.host,
        port=config.port,
        reload=True,
    )
