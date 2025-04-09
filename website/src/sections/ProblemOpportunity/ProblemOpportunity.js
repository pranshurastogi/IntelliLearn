// src/sections/ProblemOpportunity/ProblemOpportunity.js
import React from 'react';
import styles from './ProblemOpportunity.module.css';
import { FaRegSadTear, FaQuestionCircle, FaUnlink, FaLightbulb, FaBrain, FaCertificate } from 'react-icons/fa'; // Example icons

const ProblemOpportunity = () => {
  return (
    <section id="problem-opportunity" className={styles.problemOpportunitySection}> {/* Add ID */}
      <div className={`container ${styles.container}`}>
        <div className={styles.column}>
          <div className={styles.iconWrapper}><FaRegSadTear size={40} /></div>
          <h3>The Learning Engagement Gap</h3>
          <p>
            Traditional learning methods often fail to capture attention, leading to
            passive knowledge consumption and low retention rates.
          </p>
           <div className={styles.iconWrapper}><FaUnlink size={40} /></div>
           <h3>Disconnected Credentials</h3>
           <p>
             Verifying skills and learning achievements across different platforms
             remains a significant challenge in the digital age.
           </p>
        </div>
        <div className={`${styles.column} ${styles.solutionColumn}`}>
          <div className={styles.iconWrapper}><FaLightbulb size={40} color="var(--secondary-color)"/></div>
          <h3>The IntelliLearn Advantage</h3>
          <p>
            We bridge the gap by transforming education into an interactive and
            rewarding adventure, boosting engagement and knowledge retention.
          </p>
           <div className={styles.iconWrapper}><FaCertificate size={40} color="var(--secondary-color)" /></div>
           <h3>Verified Learning on EduChain</h3>
           <p>
             Leveraging blockchain, IntelliLearn provides secure, verifiable, and
             portable credentials for every learning milestone achieved.
           </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemOpportunity;