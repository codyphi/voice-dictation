import Waveform from "./Waveform";

interface Language {
  code: string;
  label: string;
}

interface ControlBarProps {
  recording: boolean;
  connected: boolean;
  analyserData: Uint8Array | null;
  language: string;
  languages: Language[];
  commandMode: boolean;
  onLanguageChange: (lang: string) => void;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
}

export default function ControlBar({
  recording,
  connected,
  analyserData,
  language,
  languages,
  commandMode,
  onLanguageChange,
  onStart,
  onStop,
  onClear,
}: ControlBarProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-[#131320] border border-[#2a2a3e] px-5 py-3">
      {/* Record / Stop */}
      <button
        onClick={recording ? onStop : onStart}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          recording
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            : "bg-brand-600/20 text-brand-400 hover:bg-brand-600/30"
        }`}
      >
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            recording ? "bg-red-500 animate-pulse" : "bg-brand-500"
          }`}
        />
        {recording ? "Stop" : "Record"}
      </button>

      {/* Command mode indicator */}
      {commandMode && recording && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-xs font-medium text-amber-400">Command Mode</span>
        </div>
      )}

      {/* Language selector */}
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="rounded-lg bg-gray-800 border border-[#2a2a3e] px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-brand-600 transition-colors"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>

      {/* Waveform */}
      <Waveform data={analyserData} width={180} height={36} />

      {/* Status */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span
          className={`h-2 w-2 rounded-full ${
            connected ? "bg-emerald-500" : "bg-gray-600"
          }`}
        />
        {connected ? "Connected" : "Disconnected"}
      </div>

      <div className="flex-1" />

      {/* Clear */}
      <button
        onClick={onClear}
        className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
