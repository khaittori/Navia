// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UrlForm from './components/UrlForm';
import Redirector from './components/Redirector';
import './App.css'; // Pastikan ada file App.css

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>URL Shortener</h1>
        </header>
        <main>
          <Routes>
            {/* Halaman utama dengan form */}
            <Route path="/" element={<UrlForm />} />
            {/* Halaman untuk redirect */}
            <Route path="/short/:shortCode" element={<Redirector />} />
            {/* Anda bisa menambahkan halaman lain di sini */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
