import io
import logging
import numpy as np
from faster_whisper import WhisperModel
from config import config

logger = logging.getLogger(__name__)

_model: WhisperModel | None = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        logger.info(
            "Loading Whisper model '%s' (device=%s, compute=%s)…",
            config.whisper.model_size,
            config.whisper.device,
            config.whisper.compute_type,
        )
        _model = WhisperModel(
            config.whisper.model_size,
            device=config.whisper.device,
            compute_type=config.whisper.compute_type,
        )
        logger.info("Whisper model loaded.")
    return _model


def transcribe_audio(audio_bytes: bytes, language: str | None = None) -> list[dict]:
    """Transcribe raw 16-bit PCM audio (16 kHz, mono) and return segments.

    If language is None or "auto", Whisper will auto-detect the language.
    """
    pcm = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0

    if pcm.size == 0:
        return []

    lang = language if language and language != "auto" else None

    model = get_model()
    segments, info = model.transcribe(
        pcm,
        language=lang,
        beam_size=config.whisper.beam_size,
        vad_filter=config.whisper.vad_filter,
        vad_parameters=config.whisper.vad_parameters,
    )

    detected = info.language if lang is None else lang

    results = []
    for seg in segments:
        results.append({
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
            "language": detected,
        })
    return results
