import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

declare global {
  interface Window {
    deferredPrompt: any;
  }
}

window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

function Router() {
  const path = window.location.pathname;
  if (path === '/privacy' || path === '/privacy-policy') {
    return <PrivacyPolicy />;
  }
  if (path === '/terms' || path === '/terms-of-service') {
    return <TermsOfService />;
  }
  
  const clientId = (import.meta as any).env.VITE_GOOGLE_OAUTH_CLIENT_ID || (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || 'missing_client_id';
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
);
