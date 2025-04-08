import React from 'react';
import { useOCAuth } from '@opencampus/ocid-connect-js';
import LoginButton from './LoginButton';
import './Home.css';

const Home = () => {
  const { authState, ocAuth } = useOCAuth();

  // 1) Guard: wait until authState is defined
  if (!authState) {
    return <div className="status-message">Initializing...</div>;
  }

  // 2) Show loading if in progress
  if (authState.isLoading) {
    return <div className="status-message">Loading...</div>;
  }

  // 3) Show error if any
  if (authState.error) {
    return (
      <div className="status-message error">
        <h2>Error:</h2>
        <p>{authState.error.message}</p>
      </div>
    );
  }

  // 4) Render the main UI
  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">IntelliLearn</div>
        <div className="navbar-links">
          <a href="#about-educhain">About</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1>Welcome to IntelliLearn</h1>
          <p>
            Experience the power of <strong>Educhain</strong> and{' '}
            <strong>OpenCampus</strong> to learn about blockchain
            through interactive games and real-world applications.
          </p>

          {authState.isAuthenticated ? (
            <div className="user-info">
              <h2>You are logged in!</h2>
              <p>Below is your OCID authentication data:</p>
              <pre>{JSON.stringify(ocAuth.getAuthState(), null, 2)}</pre>
            </div>
          ) : (
            <div>
              <p>Click below to start your OCID Login process.</p>
              <LoginButton />
            </div>
          )}
        </div>
      </header>

      {/* Info/Explanation Section */}
      <section id="about-educhain" className="info-section">
        <h2>Why IntelliLearn?</h2>
        <p>
          IntelliLearn is a platform that leverages the power of <strong>Educhain</strong> 
          and <strong>OpenCampus</strong> to deliver engaging learning experiences. 
          Dive into blockchain fundamentals, explore real-world 
          use cases, and discover how decentralized technology is changing the world—all 
          while playing fun, interactive games!
        </p>
      </section>
    </div>
  );
};

export default Home;
