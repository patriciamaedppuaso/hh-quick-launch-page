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

// The periodic check above only forces the *check* to happen promptly on an
// idle tab -- it still waits for that check to complete before reloading.
// These two close the remaining gap, reacting the instant something actually
// goes wrong instead of waiting on the timer:

// Vite renames every chunk by content hash on each build -- a tab that's
// already open can still try to lazily load one of its own old chunks (e.g.
// jsPDF for a timesheet export) after a deploy has deleted it. That fetch
// 404s and Vite fires this event instead of leaving a silent broken feature.
// Guarded by a timestamp, not a flat one-shot flag -- a tab can stay open
// across many separate deploys over days, and a flat "already reloaded once"
// flag would stop self-healing after the very first failure. The 30s window
// still stops a genuinely broken deploy from reload-looping.
window.addEventListener('vite:preloadError', () => {
  const key = 'reloaded-after-preload-error'
  const last = Number(sessionStorage.getItem(key) ?? 0)
  if (Date.now() - last < 30000) return
  sessionStorage.setItem(key, String(Date.now()))
  window.location.reload()
})

// The generated service worker (registerType: 'autoUpdate') calls
// skipWaiting()/clientsClaim() the moment a new deploy's SW finishes
// installing -- it takes control of this tab immediately, with no
// coordination with the page itself. The page's in-memory bundle still
// points at the OLD build's chunk filenames for any feature not yet used;
// reloading the instant control actually changes hands re-fetches the
// current index.html/chunks before a later lazy load can 404 against them.
if ('serviceWorker' in navigator) {
  let reloadedForNewSW = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadedForNewSW) return
    reloadedForNewSW = true
    window.location.reload()
  })
}

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
