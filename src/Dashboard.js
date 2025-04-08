import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-brand">IntelliLearn</div>
        <div className="navbar-links">
          <Link to="/">Home</Link>
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

        {/* Web3 Miner Challenge Game Card */}
        <div className="game-card">
          <img
            src="/Images/miner.png"
            alt="Web3 Miner Challenge"
            className="game-image"
          />
          <h2>Web3 Miner Challenge</h2>
          <p>Collect coins and learn fun facts about blockchain, Web3, and Educhain!</p>
          <Link to="/block-miner" className="play-button">
            Play Game
          </Link>
        </div>

        {/* OpenCampus Code Quest Game Card */}
        <div className="game-card">
          <img
            src="/Images/codequest.png"
            alt="OpenCampus Code Quest"
            className="game-image"
          />
          <h2>OpenCampus Code Quest</h2>
          <p>
            Pilot your spaceship, collect tokens, and unlock secrets of OCID Connect and Educhain!
          </p>
          <Link to="/code-quest" className="play-button">
            Play Game
          </Link>
        </div>

        {/* Additional placeholder card for future games */}
        <div className="game-card">
          <img
            src="https://via.placeholder.com/400x200.png?text=Game+4"
            alt="Game 4"
            className="game-image"
          />
          <h2>Placeholder Game 4</h2>
          <p>More blockchain adventures coming soon.</p>
          <button className="play-button" disabled>
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
