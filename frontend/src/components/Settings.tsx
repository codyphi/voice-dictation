interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function Settings({ open, onClose }: SettingsProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#131320] border border-[#2a2a3e] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <SettingRow label="Whisper Model">
            <select className="settings-select">
              <option>tiny</option>
              <option>base</option>
              <option>small</option>
              <option>medium</option>
              <option>large-v3</option>
            </select>
          </SettingRow>

          <SettingRow label="Language">
            <select className="settings-select">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
          </SettingRow>

          <SettingRow label="Ollama Model">
            <select className="settings-select">
              <option>mistral</option>
              <option>phi3</option>
              <option>llama3</option>
              <option>gemma2</option>
            </select>
          </SettingRow>

          <SettingRow label="Voice Commands">
            <span className="text-xs text-gray-500">Enabled</span>
          </SettingRow>
        </div>

        <p className="mt-6 text-xs text-gray-600">
          Settings are saved locally. Changes take effect on next recording session.
        </p>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      {children}
    </div>
  );
}
