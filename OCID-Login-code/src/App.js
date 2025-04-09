import React from 'react';
import { OCConnect } from '@opencampus/ocid-connect-js';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';
import RedirectPage from './RedirectPage';
import ErrorBoundary from './ErrorBoundary';

const opts = {
  clientId: '<Does_Not_Matter_For_Sandbox_mode>',
  redirectUri: 'https://intelli-learn-delta.vercel.app/',
  referralCode: 'PARTNER6'
};

function App() {
  return (
    <div id="app-root">
      <OCConnect opts={opts} sandboxMode={true}>
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/redirect" element={<RedirectPage />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </OCConnect>
    </div>
  );
}

export default App;
