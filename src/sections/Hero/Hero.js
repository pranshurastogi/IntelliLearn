// src/sections/Hero/Hero.js
import React from 'react';
import Button from '../../components/Button/Button';
import styles from './Hero.module.css';
import { Link } from 'react-scroll'; // Import Link for smooth scrolling


const Hero = () => {
  return (
    <section id="hero" className={styles.heroSection}> {/* Add ID for scrolling */}
        {/* Optional: Add a subtle background pattern or animation div here */}
        <div className={styles.overlay}></div> {/* Overlay for contrast */}
      <div className={`container ${styles.heroContainer}`}>
        <h1 className={styles.headline}>
        IntelliLearn: Revolutionizing Education Through AI-Powered Gameplay.
        </h1>
        <p className={styles.subHeadline}>
          Engage, learn, and earn verifiable credentials. We turn knowledge
          acquisition into an immersive adventure on the EduChain.
        </p>
        <div className={styles.ctaButtons}>
           {/* Use Link for smooth scroll */}
           <Link
             to="how-it-works" // ID of the target section
             spy={true}
             smooth={true}
             offset={-70} // Adjust based on navbar height
             duration={500}
             className={`${styles.buttonLink} ${styles.primary}`} // Apply button styles via classes
           >
             Explore IntelliLearn
           </Link>
           <Link
             to="investors" // ID of the target section
             spy={true}
             smooth={true}
             offset={-70}
             duration={500}
             className={`${styles.buttonLink} ${styles.secondary}`} // Apply button styles via classes
           >
             Investor Info
           </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;