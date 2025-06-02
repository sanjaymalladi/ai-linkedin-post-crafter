
import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold, FinishReason } from "@google/genai";

// Ensure API_KEY is available from environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is not set in environment variables. Gemini API calls will fail if a key is not provided to GoogleGenAI constructor.");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const getPersonaInstruction = (persona: string): string => {
  switch (persona) {
    case "ethan-hunt":
      return "Adopt the persona of Ethan Hunt. Write with a direct, mission-focused, and intense tone. Convey a sense of urgency and high stakes. Use concise and impactful language.";
    case "iron-man":
      return "Adopt the persona of Iron Man (Tony Stark). Write with a witty, confident, and slightly arrogant tone. Be tech-focused, innovative, and visionary. Incorporate clever remarks and a sense of showmanship.";
    case "mike-ross":
      return "Adopt the persona of Mike Ross. Write with an intelligent, empathetic, and detail-oriented style. Be insightful, explain concepts clearly, and show genuine enthusiasm and a strong moral compass.";
    case "harvey-specter":
      return "Adopt the persona of Harvey Specter. Write with a confident, assertive, and results-driven tone. Be sharp, direct, and commanding. Focus on winning, success, and strategic insights. Use powerful language.";
    case "neutral":
    default:
      return ""; // No specific persona instruction for neutral
  }
};

export const generateLinkedInPostText = async (userInput: string, persona: string): Promise<string> => {
  if (!apiKey) throw new Error("Gemini API Key not configured. Please ensure the API_KEY environment variable is set.");

  const model = 'gemini-2.5-flash-preview-04-17';
  const currentDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const personaInstruction = getPersonaInstruction(persona);

  let basePrompt = `You are an expert LinkedIn content creator specializing in AI and Generative AI news. 
Your posts are professional, engaging, insightful, and concise (around 100-200 words). 
Always include 2-4 relevant hashtags (e.g., #AI, #GenerativeAI, #TechNews, #Innovation, #FutureOfWork). 
Ensure the tone is suitable for LinkedIn.
Finally, always append the following to the very end of the post, after any other content and hashtags: #0to100xengineers #0to100xEngineer @100xengineers`;

  if (personaInstruction) {
    basePrompt = `${personaInstruction}\n\n${basePrompt}`;
  }
  
  let contentPrompt: string;
  if (userInput.trim()) {
    contentPrompt = `${basePrompt}
    
Based on the following notes/links (summarize key takeaways if links are provided):
---
${userInput}
---
Craft a LinkedIn post.`;
  } else {
    contentPrompt = `${basePrompt}
    
Craft a LinkedIn post about a recent development, interesting aspect, or a general insightful take on Generative AI or AI news relevant for today, ${currentDate}.`;
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contentPrompt,
      config: {
        temperature: 0.7,
        topK: 32,
        topP: 0.9,
        safetySettings,
      }
    });
    
    const textOutput = response.text;

    if (typeof textOutput === 'string' && textOutput.trim() !== '') {
      return textOutput;
    } else {
      let reason = "The AI model did not provide any text content.";
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.finishReason && candidate.finishReason !== FinishReason.STOP && candidate.finishReason !== FinishReason.FINISH_REASON_UNSPECIFIED) {
          reason = `Model finished due to ${candidate.finishReason}.`;
          if (candidate.finishReason === FinishReason.SAFETY && candidate.safetyRatings && candidate.safetyRatings.length > 0) {
            const harmfulCategories = candidate.safetyRatings
              .filter(r => r.probability !== "NEGLIGIBLE" && r.probability !== "LOW")
              .map(r => r.category.replace('HARM_CATEGORY_', ''))
              .join(', ');
            if (harmfulCategories) {
              reason += ` Potentially harmful content detected in categories: ${harmfulCategories}.`;
            }
          }
        }
      }
      console.warn("Gemini API returned no usable text for post generation.", { reason, response });
      throw new Error(`Failed to generate LinkedIn post: ${reason} Please try rephrasing your input or try again later.`);
    }
  } catch (error) {
    console.error("Error generating LinkedIn post text:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
             throw new Error("Invalid API Key for text generation. Please check your API key configuration.");
        }
        throw error;
    }
    throw new Error("Failed to generate LinkedIn post due to an unexpected error in the AI service.");
  }
};
