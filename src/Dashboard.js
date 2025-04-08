// src/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // We'll create this stylesheet next

function Dashboard() {
  return (
    <div className="dashboard">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-brand">IntelliLearn</div>
        <div className="navbar-links">
          {/* Add more links as needed */}
          <Link to="/">Home</Link>
          {/* <Link to="/about">About</Link> */}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <h1>Welcome to IntelliLearn</h1>
        <p>
          Learn about blockchain and Educhain by playing multiple fun games!
        </p>
      </header>

      {/* Cards Section */}
      <div className="cards-container">
        {/* Blockchain Basics (Archery) Game Card */}
        <div className="game-card">
          {/* Replace the img src with a relevant image or illustration */}
          <img
            src="/Images/stickman.png"
            alt="Blockchain Basics Stickman"
            className="game-image"
          />
          <h2>Blockchain Basics Stickman</h2>
          <p>Master the fundamentals of blockchain in this interactive archery challenge!</p>
          <Link to="/archery" className="play-button">
            Play Game
          </Link>
        </div>

        {/* Example placeholder cards for future games */}
        <div className="game-card">
          <img
            src="https://via.placeholder.com/400x200.png?text=Game+2"
            alt="Game 2"
            className="game-image"
          />
          <h2>Another Fun Game</h2>
          <p>Coming soon! Learn more about crypto concepts here.</p>
          <button className="play-button" disabled>
            Coming Soon
          </button>
        </div>

        <div className="game-card">
          <img
            src="https://via.placeholder.com/400x200.png?text=Game+3"
            alt="Game 3"
            className="game-image"
          />
          <h2>Placeholder Game 3</h2>
          <p>Stay tuned for more blockchain adventures.</p>
          <button className="play-button" disabled>
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
