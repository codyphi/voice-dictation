import logging
import httpx
from config import config

logger = logging.getLogger(__name__)

_SYSTEM_PROMPTS: dict[str, str] = {
    "summarize": (
        "You are a concise summarizer. Summarize the following text in 1-3 sentences. "
        "Preserve the key points and meaning. Return ONLY the summary, no preamble."
    ),
    "rewrite": (
        "Rewrite the following text to improve clarity, grammar, and flow while "
        "preserving the original meaning and tone. Return ONLY the rewritten text."
    ),
    "fix_grammar": (
        "Fix any grammar, spelling, and punctuation errors in the following text. "
        "Preserve the author's voice and meaning. Return ONLY the corrected text."
    ),
    "translate": (
        "Translate the following text into {target_language}. "
        "Return ONLY the translation, no preamble."
    ),
    "expand": (
        "Expand on the following text. Add detail, examples, and elaboration "
        "while preserving the original meaning. Return ONLY the expanded text."
    ),
}

SUPPORTED_ACTIONS = list(_SYSTEM_PROMPTS.keys())


async def process(action: str, text: str, target_language: str = "Spanish") -> str:
    """Run an AI post-processing action on the given text via Ollama HTTP API."""
    if action not in _SYSTEM_PROMPTS:
        raise ValueError(f"Unknown action '{action}'. Supported: {SUPPORTED_ACTIONS}")

    system = _SYSTEM_PROMPTS[action]
    if "{target_language}" in system:
        system = system.format(target_language=target_language)

    url = f"{config.ollama.base_url}/api/chat"
    payload = {
        "model": config.ollama.model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": text},
        ],
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=config.ollama.timeout) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"].strip()
    except Exception:
        logger.exception("Ollama request failed for action '%s'", action)
        raise
