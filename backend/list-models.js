require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
  
  try {
    // Try to get models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_KEY}`);
    const data = await response.json();
    
    console.log("Available models:");
    if (data.models) {
      data.models.forEach(m => {
        if (m.supportedGenerationMethods?.includes('generateContent')) {
          console.log(`  ✓ ${m.name} - ${m.displayName}`);
        }
      });
    } else {
      console.log("Response:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

listModels();
