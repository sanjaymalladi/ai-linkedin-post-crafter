

import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold, FinishReason } from "@google/genai";

// Ensure API_KEY is available from environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  // This error will be logged if API_KEY is not set during build/runtime.
  // The UI part can catch errors from service calls and display a specific message.
  console.error("API_KEY is not set in environment variables. Gemini API calls will fail if a key is not provided to GoogleGenAI constructor.");
}
// Initialize GoogleGenAI. If apiKey is undefined here, the library itself might throw an error or calls will fail.
// The problem statement says to assume process.env.API_KEY is available.
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


export const generateLinkedInPostText = async (userInput: string): Promise<string> => {
  if (!apiKey) throw new Error("Gemini API Key not configured. Please ensure the API_KEY environment variable is set.");

  const model = 'gemini-2.5-flash-preview-04-17';
  const currentDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const basePrompt = `You are an expert LinkedIn content creator specializing in AI and Generative AI news. 
Your posts are professional, engaging, insightful, and concise (around 100-200 words). 
Always include 2-4 relevant hashtags (e.g., #AI, #GenerativeAI, #TechNews, #Innovation, #FutureOfWork). 
Ensure the tone is suitable for LinkedIn.
Finally, always append the following to the very end of the post, after any other content and hashtags: #0to100xengineers #0to100xEngineer @100xengineers`;

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
        // Use FinishReason enum members for comparison
        if (candidate.finishReason && candidate.finishReason !== FinishReason.STOP && candidate.finishReason !== FinishReason.FINISH_REASON_UNSPECIFIED) {
          reason = `Model finished due to ${candidate.finishReason}.`;
          // Use FinishReason enum member for comparison
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
        // Re-throw the error if it's already specific (e.g., from the check above) or from the SDK
        throw error;
    }
    // Fallback for non-Error objects
    throw new Error("Failed to generate LinkedIn post due to an unexpected error in the AI service.");
  }
};

// Removed generatePostImage function entirely
