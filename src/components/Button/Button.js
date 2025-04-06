// src/components/Button/Button.js
import React from 'react';
import styles from './Button.module.css';

const Button = ({ children, onClick, type = 'primary', className = '', href, target, rel }) => {
  const buttonClass = `${styles.button} ${styles[type]} ${className}`;

  if (href) {
    return (
      <a href={href} className={buttonClass} target={target} rel={rel}>
        {children}
      </a>
    );
  }

  return (
    <button className={buttonClass} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;