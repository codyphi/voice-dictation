import re

_NUMBER_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12", "thirteen": "13",
    "fourteen": "14", "fifteen": "15", "sixteen": "16", "seventeen": "17",
    "eighteen": "18", "nineteen": "19", "twenty": "20", "thirty": "30",
    "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70",
    "eighty": "80", "ninety": "90", "hundred": "100", "thousand": "1000",
}

_ABBREVIATIONS = {
    "mister": "Mr.", "missus": "Mrs.", "miss": "Ms.", "doctor": "Dr.",
    "professor": "Prof.", "junior": "Jr.", "senior": "Sr.",
    "versus": "vs.", "approximately": "approx.", "et cetera": "etc.",
    "for example": "e.g.", "that is": "i.e.",
}

_SENTENCE_ENDERS = re.compile(r"[.!?]$")


def capitalize_first(text: str) -> str:
    if not text:
        return text
    return text[0].upper() + text[1:]


def format_numbers(text: str) -> str:
    words = text.split()
    result = []
    for word in words:
        lower = word.lower().strip(".,!?;:")
        if lower in _NUMBER_WORDS:
            punct = word[len(lower):]
            result.append(_NUMBER_WORDS[lower] + punct)
        else:
            result.append(word)
    return " ".join(result)


def expand_abbreviations(text: str) -> str:
    lower = text.lower()
    for phrase, abbrev in _ABBREVIATIONS.items():
        if phrase in lower:
            pattern = re.compile(re.escape(phrase), re.IGNORECASE)
            text = pattern.sub(abbrev, text)
    return text


def auto_punctuate(text: str) -> str:
    """Add a period at the end if no sentence-ending punctuation is present."""
    text = text.strip()
    if text and not _SENTENCE_ENDERS.search(text):
        text += "."
    return text


def format_text(text: str, is_start_of_sentence: bool = True) -> str:
    """Apply all formatting passes to a raw transcript segment."""
    text = text.strip()
    if not text:
        return text

    text = expand_abbreviations(text)
    text = format_numbers(text)
    text = auto_punctuate(text)

    if is_start_of_sentence:
        text = capitalize_first(text)

    return text
