// src/App.js
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import Dashboard from './Dashboard';
import ArcheryGame from './ArcheryGame'; // already created

function App() {
  return (
    <Router>
      <Routes>
        {/* The dashboard is your main/landing page */}
        <Route path="/" element={<Dashboard />} />

        {/* Archery game route */}
        <Route path="/archery" element={<ArcheryGame />} />
      </Routes>
    </Router>
  );
}

export default App;
