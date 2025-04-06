// src/sections/Investor/Investor.js
import React from 'react';
import styles from './Investor.module.css';
import Button from '../../components/Button/Button';
import { Link } from 'react-scroll'; // For scrolling to contact

const Investor = () => {
  // Placeholder link for the deck - replace with actual link or logic
  const investorDeckLink = "/path/to/your/investor-deck.pdf"; // Or handle via state/props

  return (
    <section id="investors" className={`${styles.investorSection} dark-section`}> {/* Add ID and dark class */}
      <div className="container">
        <h2 className={styles.sectionTitle}>Invest in the Future of Education</h2>
        <p className={styles.sectionText}>
        IntelliLearn represents a unique opportunity at the intersection of AI, Blockchain,
          and the rapidly growing EdTech market. We are seeking strategic partners
          to accelerate our development, expand our game library, and scale our user base.
        </p>
        <div className={styles.ctaButtons}>
          <Button
              type="primary"
              href={investorDeckLink} // Link to the deck
              target="_blank" // Open in new tab
              rel="noopener noreferrer" // Security measure
          >
            Request Investor Deck
          </Button>
          {/* Use react-scroll Link to go to Contact section */}
           <Link
             to="contact"
             spy={true}
             smooth={true}
             offset={-70}
             duration={500}
             className={`${styles.buttonLink} ${styles.secondary}`} // Apply button styles via classes
           >
             Contact Investor Relations
           </Link>
        </div>
      </div>
    </section>
  );
};

export default Investor;