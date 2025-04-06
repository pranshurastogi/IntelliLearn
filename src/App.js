// src/App.js
import React from 'react';
import './App.css'; // Minimal global styles

// Import Components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

// Import Sections
import Hero from './sections/Hero/Hero';
import ProblemOpportunity from './sections/ProblemOpportunity/ProblemOpportunity';
import HowItWorks from './sections/HowItWorks/HowItWorks';
import Features from './sections/Features/Features';
import Technology from './sections/Technology/Technology';
import VisionFutureScope from './sections/VisionFutureScope/VisionFutureScope';
import Investor from './sections/Investor/Investor';
import Contact from './sections/Contact/Contact';

function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        {/* Sections are rendered in order */}
        <Hero />
        <ProblemOpportunity />
        <HowItWorks />
        <Features />
        <Technology />
        <VisionFutureScope />
        <Investor />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;