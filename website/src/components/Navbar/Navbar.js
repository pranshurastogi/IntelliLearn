// src/components/Navbar/Navbar.js
import React, { useState, useEffect } from 'react';
import styles from './Navbar.module.css';
import { Link } from 'react-scroll'; // Import Link for smooth scrolling

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50); // Add background after scrolling 50px
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Smooth scroll parameters
  const scrollProps = {
    spy: true,
    smooth: true,
    offset: -70, // Adjust based on navbar height
    duration: 500,
    onClick: closeMobileMenu // Close mobile menu on link click
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.navbarContainer}`}>
        <a href="/" className={styles.logo}>
          IntelliLearn
        </a>

        <div className={`${styles.navLinks} ${isMobileMenuOpen ? styles.active : ''}`}>
          <Link to="features" {...scrollProps}>Features</Link>
          <Link to="how-it-works" {...scrollProps}>How It Works</Link>
          <Link to="technology" {...scrollProps}>Technology</Link>
          <Link to="vision" {...scrollProps}>Vision</Link>
          <Link to="investors" {...scrollProps}>Investors</Link>
          <Link to="contact" {...scrollProps}>Contact</Link>
        </div>

        <a
          href="https://intelli-learn-c8ln.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openAppButton}
        >
          Play Game
        </a>

        <div className={styles.mobileMenuIcon} onClick={toggleMobileMenu}>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
