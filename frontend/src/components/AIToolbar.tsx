import { useState } from "react";

interface AIToolbarProps {
  selectedText: string;
  fullText: string;
  onResult: (result: string) => void;
}

const AI_ACTIONS = [
  { id: "summarize", label: "Summarize", icon: "📝" },
  { id: "rewrite", label: "Rewrite", icon: "✏️" },
  { id: "fix_grammar", label: "Fix Grammar", icon: "🔤" },
  { id: "translate", label: "Translate", icon: "🌐" },
  { id: "expand", label: "Expand", icon: "📖" },
];

export default function AIToolbar({ selectedText, fullText, onResult }: AIToolbarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState("Spanish");
  const [lastResult, setLastResult] = useState<string | null>(null);

  const inputText = selectedText.trim() || fullText.trim();

  const run = async (action: string) => {
    if (!inputText) return;
    setLoading(action);
    setLastResult(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: inputText,
          target_language: targetLang,
        }),
      });
      const data = await res.json();
      setLastResult(data.result);
      onResult(data.result);
    } catch {
      setLastResult("Error: could not reach AI backend. Is Ollama running?");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-xl bg-[#131320] border border-[#2a2a3e] p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        AI Tools
      </h3>

      <p className="text-xs text-gray-600 mb-3">
        {!inputText
          ? "Record some text first, then use AI tools."
          : selectedText.trim()
            ? `Using selected text (${selectedText.trim().split(/\s+/).length} words)`
            : `Using full transcript (${fullText.trim().split(/\s+/).length} words)`}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {AI_ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => run(a.id)}
            disabled={!inputText || loading !== null}
            className="flex items-center gap-1.5 rounded-lg border border-[#2a2a3e] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-brand-600/10 hover:text-brand-400 hover:border-brand-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{a.icon}</span>
            {loading === a.id ? "Working…" : a.label}
          </button>
        ))}
      </div>

      {/* Translation language */}
      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-gray-500">Translate to:</label>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="rounded bg-gray-800 border border-[#2a2a3e] px-2 py-1 text-xs text-gray-300 focus:outline-none"
        >
          {["Spanish", "French", "German", "Japanese", "Chinese", "Korean", "Portuguese", "Italian"].map(
            (lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ),
          )}
        </select>
      </div>

      {lastResult && (
        <div className="rounded-lg bg-gray-800/50 border border-[#2a2a3e] p-3">
          <p className="text-xs text-gray-500 mb-1 font-medium">Result</p>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {lastResult}
          </p>
        </div>
      )}
    </div>
  );
}
