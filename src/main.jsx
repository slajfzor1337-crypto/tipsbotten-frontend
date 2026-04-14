import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import App2 from './App2.jsx'

// Change to App2 to use the new newspaper layout
// Change to App to use the original layout
const LAYOUT = "App2";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {LAYOUT === "App2" ? <App2 /> : <App />}
  </React.StrictMode>,
)
