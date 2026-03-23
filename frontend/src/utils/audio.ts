const TARGET_SAMPLE_RATE = 16000;

/**
 * Downsample a Float32Array from the source sample rate to 16 kHz,
 * then encode as 16-bit PCM (little-endian) suitable for Whisper.
 */
export function float32To16kPCM(
  float32: Float32Array,
  sourceSampleRate: number,
): ArrayBuffer {
  const ratio = sourceSampleRate / TARGET_SAMPLE_RATE;
  const newLength = Math.round(float32.length / ratio);
  const result = new Int16Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = Math.round(i * ratio);
    const sample = Math.max(-1, Math.min(1, float32[srcIndex]));
    result[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return result.buffer;
}
