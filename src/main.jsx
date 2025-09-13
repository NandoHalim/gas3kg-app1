import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ToastProvider } from './context/ToastContext.jsx'
import { NetworkProvider } from './context/NetworkContext.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <NetworkProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </NetworkProvider>
    </ToastProvider>
  </React.StrictMode>
)
