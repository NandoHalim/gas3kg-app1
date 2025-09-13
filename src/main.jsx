import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ToastProvider } from './context/ToastContext.jsx'
import { NetworkProvider } from './context/NetworkContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <NetworkProvider>
        <App />
      </NetworkProvider>
    </ToastProvider>
  </React.StrictMode>
)
