import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'   // 👈 change
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>   {/* 👈 change */}
    <App />
  </HashRouter>
)
