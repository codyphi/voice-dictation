import { useRef, useCallback, useState } from "react";
import { float32To16kPCM } from "../utils/audio";

const BUFFER_SIZE = 4096;
const SEND_INTERVAL_MS = 3000;

export interface AudioChunk {
  buffer: ArrayBuffer;
  commandMode: boolean;
}

interface UseAudioStreamOptions {
  onChunk: (chunk: AudioChunk) => void;
}

export function useAudioStream({ onChunk }: UseAudioStreamOptions) {
  const [recording, setRecording] = useState(false);
  const [analyserData, setAnalyserData] = useState<Uint8Array | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const accumulatorRef = useRef<Int16Array[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const commandModeRef = useRef(false);

  const flush = useCallback(() => {
    const chunks = accumulatorRef.current;
    if (chunks.length === 0) return;

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Int16Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    accumulatorRef.current = [];
    onChunk({ buffer: merged.buffer, commandMode: commandModeRef.current });
  }, [onChunk]);

  const setCommandMode = useCallback(
    (active: boolean) => {
      if (commandModeRef.current === active) return;

      // Flush whatever was accumulated under the *previous* mode
      flush();

      commandModeRef.current = active;

      if (active) {
        // Entering command mode: stop the periodic timer.
        // Audio accumulates until Ctrl is released.
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // Leaving command mode: flush the command audio, restart dictation timer.
        flush();
        timerRef.current = setInterval(flush, SEND_INTERVAL_MS);
      }
    },
    [flush],
  );

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, sampleRate: 16000 },
    });
    const ctx = new AudioContext({
      sampleRate: stream.getAudioTracks()[0].getSettings().sampleRate ?? 44100,
    });
    const source = ctx.createMediaStreamSource(stream);

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    accumulatorRef.current = [];
    commandModeRef.current = false;

    const processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);
    processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0);
      const pcm = float32To16kPCM(float32, ctx.sampleRate);
      accumulatorRef.current.push(new Int16Array(pcm));
    };
    source.connect(processor);
    processor.connect(ctx.destination);

    timerRef.current = setInterval(flush, SEND_INTERVAL_MS);

    ctxRef.current = ctx;
    streamRef.current = stream;
    processorRef.current = processor;
    setRecording(true);

    const poll = () => {
      if (!analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteTimeDomainData(data);
      setAnalyserData(data);
      animFrameRef.current = requestAnimationFrame(poll);
    };
    poll();
  }, [onChunk, flush]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    flush();
    cancelAnimationFrame(animFrameRef.current);
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    processorRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
    analyserRef.current = null;
    accumulatorRef.current = [];
    commandModeRef.current = false;
    setRecording(false);
    setAnalyserData(null);
  }, [flush]);

  return { recording, start, stop, analyserData, setCommandMode };
}
