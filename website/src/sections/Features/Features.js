// src/sections/Features/Features.js
import React from 'react';
import styles from './Features.module.css';
import { FaBrain, FaGamepad, FaShieldAlt, FaNetworkWired } from 'react-icons/fa'; // Example icons

const Features = () => {
  return (
    <section id="features" className={styles.featuresSection}> {/* Add ID */}
      <div className="container">
        <h2 className={styles.sectionTitle}>Key Features of IntelliLearn</h2>
        <div className={styles.featuresGrid}>
          {/* Feature Card 1 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <FaBrain className={styles.featureIcon} />
            </div>
            <h3>AI Personalization</h3>
            <p>
              Leverages Large Language Models (LLMs) to create adaptive learning
              paths, ensuring optimal challenge and knowledge absorption for every user.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className={styles.featureCard}>
             <div className={styles.featureIconWrapper}>
               <FaGamepad className={styles.featureIcon} />
            </div>
            <h3>Engaging Gamification</h3>
            <p>
              Transforms learning into fun, interactive experiences. Our pilot
              archery game is just the beginning of a diverse game library.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <FaShieldAlt className={styles.featureIcon} />
            </div>
            <h3>Blockchain Credentials</h3>
            <p>
              Built on EduChain for secure, transparent, and immutable recording
              of achievements, providing users with portable and verifiable credentials.
            </p>
          </div>

          {/* Feature Card 4 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
               <FaNetworkWired className={styles.featureIcon} />
            </div>
            <h3>Scalable Platform</h3>
            <p>
              Designed with future growth in mind, allowing for easy integration
              of new game types, subjects, and educational partnerships.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;