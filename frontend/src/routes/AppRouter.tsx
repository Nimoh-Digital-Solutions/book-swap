import type { ReactElement } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { routes } from './config';

// router is an internal implementation detail — not exported.
// Import AppRouter (default export) rather than the router instance directly.
const router = createBrowserRouter(routes);

const AppRouter = (): ReactElement => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
