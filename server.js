// app.js
const express = require('express');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define topic enum
const Topics = {
  BLOCKCHAIN_BASICS: 'blockchain basics'
};

// Validate if topic is in enum
const isValidTopic = (topic) => {
  return Object.values(Topics).includes(topic);
};

// Route to generate questions
app.get('/generate-question', async (req, res) => {
  console.log('generate questions');
  
  try {
    const { topic } = req.query;
    
    // Validate topic
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    if (!isValidTopic(topic)) {
      return res.status(400).json({ 
        error: 'Invalid topic', 
        validTopics: Object.values(Topics) 
      });
    }
    
    // Generate questions based on topic
    const questions = await generateQuestions(topic);
    
    return res.status(200).json(questions);
  } catch (error) {
    console.error('Error generating questions:', error);
    return res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// Function to generate questions using OpenAI
async function generateQuestions(topic) {
  const prompt = `
    Generate 5 multiple-choice questions about ${topic}.
    Each question should have:
    - A "question" field with the question text
    - An "options" array with 4 possible answers
    - A "Correct_option_index" field (0-3) indicating which option is correct
    - A "difficulty" field with values from 1-3
    - A "category" field (e.g., "Basics", "Theory", "Applications")
    - An "explanation" field explaining the correct answer
    - A "round" field numbered 1-5

    Format the response as a valid JSON array like this example:
    [
      {
        "question": "What typically happens if you lose access to your blockchain wallet?",
        "options": ["You can contact customer support to reset your wallet.", "You can retrieve your wallet using your email and password.", "You permanently lose access to your funds and cannot recover them.", "Your wallet will automatically reset after 30 days."],
        "Correct_option_index": 2,
        "difficulty": 1,
        "category": "Basics",
        "explanation": "Blockchain wallets are decentralized, meaning there's no central authority (like a bank or company) that can recover or reset your access. If you lose your private key or recovery phrase (also called a seed phrase), there's no way to access your wallet or the funds stored in it.",
        "round": 1
      }
    ]

    Ensure all questions are relevant to ${topic} and provide educational value. Make sure the JSON is valid.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "You are an expert educator creating quiz questions. Return only valid JSON arrays with no additional text or explanation."
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  // Parse and handle the response
  try {
    const content = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(content);
    return parsedResponse.hasOwnProperty('questions') ? parsedResponse.questions : parsedResponse;
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Failed to generate valid questions');
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;