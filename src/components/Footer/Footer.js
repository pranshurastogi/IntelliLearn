// src/components/Footer/Footer.js
import React from 'react';
import styles from './Footer.module.css';
// Import social icons if you have them
// import { FaLinkedin, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerContainer}`}>
        <div className={styles.footerContent}>
          <span className={styles.logo}>IntelliLearn</span>
          <p className={styles.copyright}>
            © {currentYear} IntelliLearn. All Rights Reserved.
          </p>
          {/* <div className={styles.socialIcons}>
            <a href="#" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
            <a href="#" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
          </div> */}
          <div className={styles.footerLinks}>
            {/* Add actual links later */}
            <a href="#">Privacy Policy</a>
            <span>|</span>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;