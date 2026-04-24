import { type ReactElement, useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon: ReactElement;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#28382D]/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-[#1A251D]/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#8C9C92]">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#5A6A60]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#5A6A60]" />
        )}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
