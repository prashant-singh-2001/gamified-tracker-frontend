import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { Providers } from '@/app/providers';
import { router } from '@/app/router';
import { bootSession } from '@/lib/auth/session';
import './styles/index.css';

// Restore the session from the stored refresh token before guarded routes decide anything;
// until it settles the auth store is "booting" and guards render a skeleton.
void bootSession();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
