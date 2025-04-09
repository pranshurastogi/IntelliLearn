// src/sections/Contact/Contact.js
import React, { useState } from 'react';
import styles from './Contact.module.css';
import Button from '../../components/Button/Button';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false); // To show success message

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // **IMPORTANT:** Add actual form submission logic here
    // (e.g., using EmailJS, Formspree, or a backend API)
    console.log('Form Data Submitted:', formData);

    // Simulate submission success
    setIsSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form

    // Optional: Hide success message after a few seconds
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <section id="contact" className={styles.contactSection}> {/* Add ID */}
      <div className="container">
        <h2 className={styles.sectionTitle}>Get In Touch</h2>
        <p className={styles.sectionSubtitle}>
          Have questions or want to discuss partnership opportunities? Reach out to our team.
        </p>

        <div className={styles.contactFormWrapper}>
          {isSubmitted ? (
            <p className={styles.successMessage}>Thank you for your message! We'll be in touch soon.</p>
          ) : (
            <form onSubmit={handleSubmit} className={styles.contactForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6" // Adjust height
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <div className={styles.submitButtonWrapper}>
                 <Button type="submit" className={styles.submitButton}>Send Message</Button>
              </div>
            </form>
          )}
        </div>
         {/* Optional: Add direct contact info */}
         <div className={styles.directContact}>
             <p>Or email us directly at: <a href="mailto:contact@aria-ai.com">contact@aria-ai.com</a></p>
             {/* Add investor-specific email if needed */}
             {/* <p>For investor relations: <a href="mailto:investors@aria-ai.com">investors@aria-ai.com</a></p> */}
         </div>
      </div>
    </section>
  );
};

export default Contact;