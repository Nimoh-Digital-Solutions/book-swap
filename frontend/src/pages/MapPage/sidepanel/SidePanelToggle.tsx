import { useTranslation } from "react-i18next";

import { ChevronsLeft, ChevronsRight } from "lucide-react";

interface SidePanelToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Persistent vertical tab on the right edge of the panel that lets the
 * user collapse and re-expand the side panel. Stays visible when the
 * panel itself is closed so the user can always recover it.
 */
export function SidePanelToggle({ isOpen, onToggle }: SidePanelToggleProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute top-1/2 -translate-y-1/2 -right-0 translate-x-full flex items-center justify-center w-6 h-14 bg-[#0f1a14] border border-l-0 border-[#28382D]/50 rounded-r-lg text-[#8C9C92] hover:text-[#E4B643] transition-colors"
      aria-label={
        isOpen
          ? t("map.panel.collapse", "Collapse panel")
          : t("map.panel.expand", "Expand panel")
      }
    >
      {isOpen ? (
        <ChevronsLeft className="w-3.5 h-3.5" />
      ) : (
        <ChevronsRight className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
