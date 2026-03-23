import re
from dataclasses import dataclass
from difflib import SequenceMatcher

COMMAND_MAP: dict[str, str] = {
    "delete that": "delete_last",
    "delete last sentence": "delete_last_sentence",
    "new line": "new_line",
    "new paragraph": "new_paragraph",
    "undo": "undo",
    "undo that": "undo",
    "stop dictation": "stop",
    "stop recording": "stop",
    "start recording": "start",
    "select all": "select_all",
    "select last paragraph": "select_last_paragraph",
    "bold that": "bold",
    "italicize that": "italic",
}

_sorted_phrases = sorted(COMMAND_MAP.keys(), key=len, reverse=True)

_patterns = [
    (re.compile(r"\b" + re.escape(phrase) + r"\b", re.IGNORECASE), cmd)
    for phrase, cmd in sorted(COMMAND_MAP.items(), key=lambda x: len(x[0]), reverse=True)
]

FUZZY_THRESHOLD = 0.6


@dataclass
class ParseResult:
    is_command: bool
    command: str | None = None
    text: str | None = None


def parse(raw_text: str) -> ParseResult:
    """Check if raw transcript text contains a voice command using exact regex matching.

    Used during normal dictation mode.
    """
    stripped = raw_text.strip()
    if not stripped:
        return ParseResult(is_command=False, text=raw_text)

    for pattern, cmd in _patterns:
        if pattern.search(stripped):
            remaining = pattern.sub("", stripped).strip(" .,!?")
            if remaining:
                return ParseResult(is_command=True, command=cmd, text=remaining)
            return ParseResult(is_command=True, command=cmd)

    return ParseResult(is_command=False, text=raw_text)


def parse_fuzzy(raw_text: str) -> ParseResult:
    """Match transcript text against commands using fuzzy similarity.

    Used in command mode (Ctrl held) where we know the user intends a command.
    Tolerates Whisper's transcription quirks like extra punctuation, slight
    misspellings, or added filler words.
    """
    stripped = raw_text.strip()
    if not stripped:
        return ParseResult(is_command=False, text=raw_text)

    normalized = re.sub(r"[.,!?;:\"']+", "", stripped).strip().lower()
    if not normalized:
        return ParseResult(is_command=False, text=raw_text)

    # Exact match first (fast path)
    if normalized in COMMAND_MAP:
        return ParseResult(is_command=True, command=COMMAND_MAP[normalized])

    # Fuzzy match: find the best-matching command phrase
    best_score = 0.0
    best_cmd = None

    for phrase, cmd in COMMAND_MAP.items():
        score = SequenceMatcher(None, normalized, phrase).ratio()
        if score > best_score:
            best_score = score
            best_cmd = cmd

        # Also check if the command phrase is contained within a longer transcript
        if phrase in normalized:
            return ParseResult(is_command=True, command=cmd)

    if best_score >= FUZZY_THRESHOLD and best_cmd:
        return ParseResult(is_command=True, command=best_cmd)

    return ParseResult(is_command=False, text=raw_text)
