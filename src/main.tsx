import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'
import { PublicContractPage } from './components/PublicContractPage.tsx'

// A tab left open across a deploy keeps running the JS it already loaded --
// the service worker updating in the background doesn't touch it, only the
// *next* navigation does. For a time clock, that's not cosmetic staleness:
// it means punches silently keep going to whatever backend the old build
// talks to. So force it: poll for a new service worker periodically even
// without navigation, and reload immediately once one is found.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => registration.update(), 5 * 60 * 1000)
  },
})

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
