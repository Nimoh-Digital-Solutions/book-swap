import type { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';

import { Footer, Header } from '@components';
import { useRouteAnnouncer } from '@hooks';

const AppLayout = (): ReactElement => {
  useRouteAnnouncer();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#152018] text-[#8C9C92] font-sans selection:bg-[#E4B643] selection:text-[#152018]">
      {/* Skip navigation — satisfies WCAG 2.1 SC 2.4.1 (Bypass Blocks, Level A) */}
      <a
        href="#main-content"
        className="absolute -top-full left-0 z-[9999] px-4 py-2 bg-surface text-on-surface font-semibold no-underline border-2 border-primary rounded-b-sm focus:top-0 transition-[top] duration-100"
      >
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;
