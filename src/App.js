// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // Import HelmetProvider
import UrlForm from './components/UrlForm';
import Redirector from './components/Redirector';
import './App.css';

function App() {
  return (
    <HelmetProvider> {/* Bungkus aplikasi dengan HelmetProvider */}
      <Router>
        <div className="App">
          <header className="App-header">
            <h1>URL Shortener</h1>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<UrlForm />} />
              <Route path="/short/:shortCode" element={<Redirector />} />
            </Routes>
          </main>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
