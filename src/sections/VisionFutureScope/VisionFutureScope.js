// src/sections/VisionFutureScope/VisionFutureScope.js
import React from 'react';
import styles from './VisionFutureScope.module.css';
// Import FaCoins
import { FaGamepad, FaUserGraduate, FaUsers, FaCube, FaPaintBrush, FaLink, FaCoins } from 'react-icons/fa';

const VisionFutureScope = () => {
  return (
    <section id="vision" className={styles.visionSection}> {/* Add ID */}
      <div className="container">
        <h2 className={styles.sectionTitle}>Shaping the Future of Learning</h2>
        <p className={styles.visionStatement}>
          Our vision is to become the go-to AI-driven gamified learning layer for Web3 education, where learning feels like play and knowledge becomes a verifiable adventure.
        </p>

        <div className={styles.visionGrid}>

          {/* Card 1: More Game Types */}
          <div className={styles.visionCard}>
             <div className={styles.iconWrapper}>
                <FaGamepad className={styles.icon} />
            </div>
            <div className={styles.textContent}>
              <h4>More Game Types</h4>
              <p>Expand beyond archery to include strategy, puzzles, RPGs, and more, catering to diverse subjects and learning styles.</p>
            </div>
          </div>

          {/* Card 2: Deeper Personalization */}
          <div className={styles.visionCard}>
             <div className={styles.iconWrapper}>
                <FaUserGraduate className={styles.icon} />
            </div>
            <div className={styles.textContent}>
                <h4>Deeper Personalization</h4>
                <p>Enhanced AI for personalized learning paths, skill mapping, and predictive learning recommendations.</p>
            </div>
          </div>

          {/* Card 3: Protocol Partnerships */}
          <div className={styles.visionCard}>
             <div className={styles.iconWrapper}>
                <FaLink className={styles.icon} />
            </div>
            <div className={styles.textContent}>
                <h4>Protocol Partnerships</h4>
                <p>Collaborate with educational DAOs and platforms for verified certifications and official learning credits.</p>
            </div>
          </div>

          {/* Card 4: Community & Multiplayer */}
          <div className={styles.visionCard}>
             <div className={styles.iconWrapper}>
                <FaUsers className={styles.icon} />
            </div>
            <div className={styles.textContent}>
                <h4>Community & Multiplayer</h4>
                <p>Introduce competitive and cooperative modes, tournaments, and collaborative knowledge-building features.</p>
            </div>
          </div>

           {/* Card 5: NFT-Based Customization */}
          <div className={styles.visionCard}>
             <div className={styles.iconWrapper}>
                <FaPaintBrush className={styles.icon} />
            </div>
            <div className={styles.textContent}>
                <h4>NFT-Based Customization</h4>
                <p>Implement NFT avatars, skill-based gear, and collectible items to boost engagement and reward learners.</p>
            </div>
          </div>

           {/* Card 6: Tokenomics Integration - NEW */}
           <div className={styles.visionCard}>
             <div className={styles.iconWrapper}>
                <FaCoins className={styles.icon} /> {/* Use FaCoins icon */}
            </div>
            <div className={styles.textContent}>
                <h4>Tokenomics Integration</h4> {/* Title for the new card */}
                <p>Develop and integrate a token economy to reward user participation, incentivize learning achievements, and potentially enable governance.</p> {/* Description */}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default VisionFutureScope;