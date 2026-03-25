import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import type { LucideIcon } from 'lucide-react';

interface EmptyPlaceholderAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description?: string | undefined;
  action?: EmptyPlaceholderAction | undefined;
}

/**
 * App-specific empty-state block for list/grid views, matching the dark-green
 * design system. Use this instead of the tast-ui EmptyState when you need the
 * icon-circle + gold CTA button styling.
 */
export function EmptyPlaceholder({ icon: Icon, title, description, action }: EmptyPlaceholderProps): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div
        className="w-20 h-20 rounded-full bg-[#1A251D] border border-[#28382D] flex items-center justify-center mb-6"
        aria-hidden="true"
      >
        <Icon className="w-9 h-9 text-[#28382D]" />
      </div>

      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>

      {description && (
        <p className="text-[#8C9C92] text-sm max-w-sm mx-auto mb-6 leading-relaxed">{description}</p>
      )}

      {action &&
        (action.href ? (
          <Link
            to={action.href}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] font-bold text-sm rounded-full transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#E4B643] text-[#E4B643] font-bold text-sm rounded-full hover:bg-[#E4B643]/10 transition-colors"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
