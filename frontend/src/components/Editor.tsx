import { forwardRef } from "react";

interface EditorProps {
  text: string;
  onChange: (text: string) => void;
  selectedText: string;
  onSelect: (selected: string) => void;
}

const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(
  ({ text, onChange, onSelect }, ref) => {
    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;
      const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd);
      onSelect(selected);
    };

    return (
      <div className="flex-1 rounded-xl bg-[#131320] border border-[#2a2a3e] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#2a2a3e] px-4 py-2">
          <div className="h-3 w-3 rounded-full bg-red-500/60" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
          <div className="h-3 w-3 rounded-full bg-green-500/60" />
          <span className="ml-2 text-xs text-gray-500 font-medium">
            Transcript
          </span>
          <span className="ml-auto text-xs text-gray-600">
            {text.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelect}
          spellCheck={false}
          placeholder="Start recording to see your transcript here…"
          className="h-full w-full resize-none bg-transparent p-5 text-base leading-relaxed text-gray-200 placeholder:text-gray-600 focus:outline-none"
          style={{ minHeight: "300px" }}
        />
      </div>
    );
  },
);

Editor.displayName = "Editor";
export default Editor;
