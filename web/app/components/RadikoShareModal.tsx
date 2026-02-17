import { useState } from "react";
import { X, ClipboardPaste } from "lucide-react";
import { parseRadikoShareString, RadikoShareInfo } from "@/app/utils/radiko";

interface RadikoShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParse: (info: RadikoShareInfo) => void;
}

export function RadikoShareModal({ isOpen, onClose, onParse }: RadikoShareModalProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    setError(null);
    if (!text.trim()) {
      setError("テキストを入力してください");
      return;
    }

    const result = parseRadikoShareString(text);
    if (result) {
      onParse(result);
      onClose();
      setText(""); // Reset on success
    } else {
      setError("情報の解析に失敗しました。正しいRadikoのシェア用テキストか確認してください。");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5" />
            Radiko情報から入力
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Radikoのシェアボタンからコピーした番組情報とURLを貼り付けてください。
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-primary focus:ring focus:ring-primary/20 outline-none resize-none text-sm transition-all"
            placeholder="例: 佐久間宣行のオールナイトニッポン0(ZERO) | ニッポン放送 | 2026/02/11/水 27:00-28:30 https://radiko.jp/share/?sid=LFR&t=20260212030000"
          />

          {error && (
            <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleParse}
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
            >
              反映する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
