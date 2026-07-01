import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AdminApp } from './admin/AdminApp.tsx';
import { QueueDisplay } from './components/QueueDisplay.tsx';
import { WalkInPage } from './pages/WalkInPage.tsx';
import './index.css';

const path = window.location.pathname;

function Root() {
  if (path.startsWith('/admin')) return <AdminApp />;
  if (path.startsWith('/queue-display')) return <QueueDisplay />;
  if (path.startsWith('/walk-in')) return <WalkInPage />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
