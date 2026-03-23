import { useState, useCallback, useRef, useEffect } from "react";
import ControlBar from "./components/ControlBar";
import Editor from "./components/Editor";
import CommandPalette from "./components/CommandPalette";
import AIToolbar from "./components/AIToolbar";
import Settings from "./components/Settings";
import { useWebSocket, type WSMessage } from "./hooks/useWebSocket";
import { useAudioStream, type AudioChunk } from "./hooks/useAudioStream";

interface CommandEvent {
  command: string;
  timestamp: number;
}

const WS_URL = `ws://${window.location.hostname}:${window.location.port}/ws/dictate`;

const LANGUAGES = [
  { code: "auto", label: "Auto-detect" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ko", label: "Korean" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "ru", label: "Russian" },
];

export default function App() {
  const [text, setText] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [commandEvents, setCommandEvents] = useState<CommandEvent[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([""]);
  const [language, setLanguage] = useState("en");
  const [commandMode, setCommandMode] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const ws = useWebSocket(WS_URL);

  const handleChunk = useCallback(
    (chunk: AudioChunk) => {
      if (chunk.commandMode) {
        ws.sendJson({ type: "set_command_mode", active: true });
      } else {
        ws.sendJson({ type: "set_command_mode", active: false });
      }
      ws.send(chunk.buffer);
    },
    [ws],
  );

  const audio = useAudioStream({ onChunk: handleChunk });

  const handleStartRef = useRef<() => void>(() => {});
  const handleStopRef = useRef<() => void>(() => {});
  const recordingRef = useRef(audio.recording);
  recordingRef.current = audio.recording;

  const shiftHeldRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftHeldRef.current = true;

      // Ctrl+Shift+R or Cmd+Shift+R = toggle recording (takes priority)
      if (e.key === "r" && e.shiftKey && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (recordingRef.current) {
          handleStopRef.current();
        } else {
          handleStartRef.current();
        }
        return;
      }

      // Ctrl/Cmd held alone (no Shift) = command mode
      if ((e.key === "Control" || e.key === "Meta") && !e.repeat && !shiftHeldRef.current && recordingRef.current) {
        setCommandMode(true);
        audio.setCommandMode(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftHeldRef.current = false;

      if (e.key === "Control" || e.key === "Meta") {
        setCommandMode(false);
        audio.setCommandMode(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [audio]);

  const executeCommand = useCallback(
    (command: string) => {
      setCommandEvents((prev) => [
        ...prev,
        { command, timestamp: Date.now() },
      ]);

      setText((prev) => {
        let next = prev;
        switch (command) {
          case "delete_last": {
            const trimmed = prev.trimEnd();
            const lastSpace = trimmed.lastIndexOf(" ");
            next = lastSpace >= 0 ? trimmed.slice(0, lastSpace + 1) : "";
            break;
          }
          case "delete_last_sentence": {
            const trimmed = prev.trimEnd();
            const lastPeriod = Math.max(
              trimmed.lastIndexOf(". "),
              trimmed.lastIndexOf("! "),
              trimmed.lastIndexOf("? "),
            );
            next = lastPeriod >= 0 ? trimmed.slice(0, lastPeriod + 2) : "";
            break;
          }
          case "new_line":
            next = prev + "\n";
            break;
          case "new_paragraph":
            next = prev + "\n\n";
            break;
          case "undo":
            if (history.length > 1) {
              const prevHistory = history.slice(0, -1);
              setHistory(prevHistory);
              return prevHistory[prevHistory.length - 1];
            }
            break;
          case "stop":
            handleStopRef.current();
            break;
          case "start":
            handleStartRef.current();
            break;
          case "select_all":
            editorRef.current?.select();
            return prev;
          default:
            break;
        }
        return next;
      });
    },
    [audio, history],
  );

  useEffect(() => {
    const unsub = ws.onMessage((msg: WSMessage) => {
      if (msg.type === "transcript") {
        setText((prev) => {
          const next = prev + (prev && !prev.endsWith("\n") ? " " : "") + msg.text;
          setHistory((h) => [...h.slice(-50), next]);
          return next;
        });
      } else if (msg.type === "command") {
        executeCommand(msg.command);
      }
    });
    return unsub;
  }, [ws, executeCommand]);

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setLanguage(lang);
      ws.sendJson({ type: "set_language", language: lang });
    },
    [ws],
  );

  const handleStart = useCallback(() => {
    ws.connect();
    setTimeout(() => {
      ws.sendJson({ type: "set_language", language });
      audio.start();
    }, 300);
  }, [ws, audio, language]);

  const handleStop = useCallback(() => {
    audio.stop();
    ws.disconnect();
  }, [ws, audio]);

  handleStartRef.current = handleStart;
  handleStopRef.current = handleStop;

  const handleClear = useCallback(() => {
    setText("");
    setHistory([""]);
    setCommandEvents([]);
  }, []);

  const handleAIResult = useCallback((result: string) => {
    setText((prev) => prev + "\n\n--- AI Result ---\n" + result);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#2a2a3e] px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20">
            <span className="text-brand-400 text-sm font-bold">V</span>
          </div>
          <h1 className="text-base font-semibold text-gray-200">Voice Dict</h1>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          Settings
        </button>
      </header>

      {/* Main content */}
      <main className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left: Editor */}
        <div className="flex flex-1 flex-col gap-4">
          <ControlBar
            recording={audio.recording}
            connected={ws.connected}
            analyserData={audio.analyserData}
            language={language}
            languages={LANGUAGES}
            commandMode={commandMode}
            onLanguageChange={handleLanguageChange}
            onStart={handleStart}
            onStop={handleStop}
            onClear={handleClear}
          />
          <Editor
            ref={editorRef}
            text={text}
            onChange={setText}
            selectedText={selectedText}
            onSelect={setSelectedText}
          />
        </div>

        {/* Right sidebar */}
        <aside className="flex w-72 flex-col gap-4 overflow-y-auto">
          <AIToolbar selectedText={selectedText} fullText={text} onResult={handleAIResult} />
          <CommandPalette events={commandEvents} />
        </aside>
      </main>

      {/* Settings modal */}
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
