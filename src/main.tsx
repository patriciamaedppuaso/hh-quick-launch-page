import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'
import { PublicContractPage } from './components/PublicContractPage.tsx'

// A shared contract link (/contract/:token) must work for a signed-out
// visitor, so it's routed here -- before the normal app (and its Supabase
// auth bootstrap) ever renders -- rather than inside App.tsx's authenticated
// shell.
const contractMatch = window.location.pathname.match(/^\/contract\/([^/]+)\/?$/);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      {contractMatch ? <PublicContractPage token={decodeURIComponent(contractMatch[1])} /> : <App />}
    </ToastProvider>
  </StrictMode>,
)
