interface CommandEvent {
  command: string;
  timestamp: number;
}

interface CommandPaletteProps {
  events: CommandEvent[];
}

const COMMAND_LABELS: Record<string, string> = {
  delete_last: "Delete Last",
  delete_last_sentence: "Delete Last Sentence",
  new_line: "New Line",
  new_paragraph: "New Paragraph",
  undo: "Undo",
  stop: "Stop Recording",
  start: "Start Recording",
  select_all: "Select All",
  select_last_paragraph: "Select Last Paragraph",
  bold: "Bold",
  italic: "Italic",
};

export default function CommandPalette({ events }: CommandPaletteProps) {
  return (
    <div className="rounded-xl bg-[#131320] border border-[#2a2a3e] p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Voice Commands
      </h3>
      {events.length === 0 ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
            <p className="text-xs text-amber-400 font-medium mb-1">
              Hold Ctrl and speak a command
            </p>
            <p className="text-xs text-gray-500">
              Release Ctrl to return to dictation
            </p>
          </div>
          <div className="flex flex-col gap-1 text-xs text-gray-600">
            <span>"new line" / "new paragraph"</span>
            <span>"delete that"</span>
            <span>"undo"</span>
            <span>"start recording" / "stop recording"</span>
          </div>
          <div className="rounded-lg bg-gray-800/50 px-3 py-2 mt-1">
            <p className="text-xs text-gray-500">
              <span className="text-gray-400 font-medium">Ctrl+Shift+R</span> to toggle recording
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
          {events
            .slice(-8)
            .reverse()
            .map((ev, i) => (
              <div
                key={`${ev.timestamp}-${i}`}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${
                  i === 0
                    ? "bg-brand-600/10 text-brand-400"
                    : "text-gray-500"
                }`}
              >
                <span className="font-mono">⌘</span>
                <span>{COMMAND_LABELS[ev.command] ?? ev.command}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
