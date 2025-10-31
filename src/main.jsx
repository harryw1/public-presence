/**
 * main.jsx - Application entry point
 * 
 * This file is the first JavaScript file that runs when the app loads
 * It mounts the React application to the DOM
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

/**
 * Mount the React application
 * 
 * StrictMode is a development tool that:
 * - Warns about deprecated APIs
 * - Detects unexpected side effects
 * - Ensures components are resilient to future React features
 * 
 * It only runs in development mode and doesn't affect production
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

