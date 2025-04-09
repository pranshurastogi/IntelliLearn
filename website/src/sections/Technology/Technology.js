// src/sections/Technology/Technology.js
import React from 'react';
import styles from './Technology.module.css';
import { FaReact, FaBrain } from 'react-icons/fa'; // React, AI
import { SiBlockchaindotcom } from "react-icons/si"; // Blockchain icon

const Technology = () => {
  return (
    <section id="technology" className={`${styles.technologySection} dark-section`}> {/* Add ID and dark class */}
      <div className="container">
        <h2 className={styles.sectionTitle}>Powered by Cutting-Edge Technology</h2>
        <p className={styles.sectionSubtitle}>
        IntelliLearn leverages a robust stack to deliver a seamless and intelligent learning experience.
        </p>
        <div className={styles.techGrid}>
          <div className={styles.techItem}>
            <FaBrain className={styles.techIcon} />
            <h3>Large Language Models (LLMs)</h3>
            <p>State-of-the-art AI for dynamic content generation and adaptive learning personalization.</p>
          </div>
          <div className={styles.techItem}>
             <SiBlockchaindotcom className={styles.techIcon} />
            <h3>EduChain Blockchain</h3>
            <p>Ensures secure, transparent, and verifiable credentialing of learner achievements.</p>
          </div>
          <div className={styles.techItem}>
            <FaReact className={styles.techIcon} />
            <h3>ReactJS Framework</h3>
            <p>Builds a modern, responsive, and interactive user interface for an engaging front-end experience.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Technology;