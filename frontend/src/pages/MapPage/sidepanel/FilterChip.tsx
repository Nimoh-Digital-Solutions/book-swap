import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#28382D] text-white text-[10px] px-2 py-0.5 rounded-full">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-[#E4B643] transition-colors"
        aria-label={`Remove ${label}`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}
