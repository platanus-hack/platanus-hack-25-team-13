"use client";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend?: () => void;
  loading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ input, onInputChange, onSend, loading, disabled = false }: ChatInputProps) {
  return (
    <div className="p-4 bg-white">
      <div className="flex gap-2 max-w-3xl mx-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend && !disabled && onSend()}
          placeholder="Habla con el paciente..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-[#1098f7] focus:ring-1 focus:ring-[#1098f7] placeholder:text-gray-400"
          disabled={loading || disabled}
        />
        <button
          onClick={onSend}
          disabled={loading || !input.trim() || disabled || !onSend}
          className="bg-[#1098f7] text-white px-6 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0d7fd6] transition-colors font-medium flex-shrink-0 cursor-pointer"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

