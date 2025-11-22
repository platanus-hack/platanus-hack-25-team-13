"use client";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  loading: boolean;
}

export default function ChatInput({ input, onInputChange, onSend, loading }: ChatInputProps) {
  return (
    <div className="border-t-[0.5px] border-[#1098f7] p-4 bg-white">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Escribe tu pregunta al paciente..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#1098f7] focus:ring-1 focus:ring-[#1098f7]"
          disabled={loading}
        />
        <button
          onClick={onSend}
          disabled={loading || !input.trim()}
          className="bg-[#1098f7] text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0d7fd6] transition-colors font-medium"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

