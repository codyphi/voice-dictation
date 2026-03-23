from dataclasses import dataclass, field


@dataclass
class WhisperConfig:
    model_size: str = "small" # tiny, base, small, medium, large-v3
    language: str = "en"
    device: str = "auto"
    compute_type: str = "int8"
    beam_size: int = 5
    vad_filter: bool = True
    vad_parameters: dict = field(default_factory=lambda: {
        "threshold": 0.5,
        "min_speech_duration_ms": 250,
        "min_silence_duration_ms": 500,
    })


@dataclass
class AudioConfig:
    sample_rate: int = 16000
    channels: int = 1
    chunk_duration_ms: int = 1000


@dataclass
class OllamaConfig:
    model: str = "mistral"
    base_url: str = "http://localhost:11434"
    timeout: float = 120.0


@dataclass
class AppConfig:
    whisper: WhisperConfig = field(default_factory=WhisperConfig)
    audio: AudioConfig = field(default_factory=AudioConfig)
    ollama: OllamaConfig = field(default_factory=OllamaConfig)
    host: str = "127.0.0.1"
    port: int = 9000


config = AppConfig()
