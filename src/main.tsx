import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { App } from './App'

// Apply dark theme immediately before render to prevent flash
document.documentElement.setAttribute('data-theme', 'dark')
document.documentElement.classList.add('dark')

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
