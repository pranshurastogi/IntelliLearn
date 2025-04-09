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
          <p>Pilot your spaceship, collect tokens, and unlock secrets of OCID Connect and Educhain!</p>
          <Link to="/code-quest" className="play-button">
            Play Game
          </Link>
        </div>

        {/* DAO Dungeon Escape Game Card */}
        <div className="game-card">
          <img
            src="/Images/dao_dungeon.png"
            alt="DAO Dungeon Escape"
            className="game-image"
          />
          <h2>DAO Dungeon Escape</h2>
          <p>
            Navigate the dungeon, collect all tokens to unlock the door, and escape using blockchain logic!
          </p>
          <Link to="/dao-dungeon" className="play-button">
            Play Game
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
