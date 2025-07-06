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

  let basePrompt = `You are an expert LinkedIn content creator specializing in viral and engaging content. Your posts follow proven viral LinkedIn strategies:

**VIRAL LINKEDIN POST GUIDELINES:**

1. **Compelling Hook**: Start with an intriguing, controversial, or thought-provoking statement that immediately grabs attention. Subtly hint at your expertise without being overtly promotional.

2. **Clear & Concise Formatting**:
   - Use short paragraphs (1-2 sentences max)
   - Employ bullet points or one-line paragraphs for easy reading
   - Use ample white space for mobile readability
   - Strategically place content to encourage "read more" clicks

3. **Valuable & Relevant Content**: 
   - Share actionable insights, lessons learned, or industry-relevant advice
   - Focus on trending topics that resonate with your target audience
   - Provide genuine value that people want to share

4. **Authentic Tone & Personal Branding**: 
   - Maintain a consistent, genuine voice that reflects professional identity
   - Be relatable while staying professional

5. **Positive & Resilient Framing**: 
   - Frame challenges or difficulties with a positive outlook
   - Highlight growth, gratitude, or resilience
   - Show learning and development mindset

6. **Engaging Call-to-Action**: 
   - End with thought-provoking questions that encourage comments
   - Prompt discussions and interactions to extend reach
   - Ask for experiences, opinions, or advice from your network

7. **Strategic Content Structure**:
   - Keep posts concise (100-200 words optimal)
   - Include 2-4 relevant hashtags strategically placed
   - Use data and trends to support your points
   - Leverage proven viral structures and adapt them to your voice

Focus on AI, Generative AI, and tech industry insights. Make the content shareable and discussion-worthy.
Always append the following to the very end: #0to100xengineers #0to100xEngineer @100xengineers`;

  if (personaInstruction) {
    basePrompt = `${personaInstruction}\n\n${basePrompt}`;
  }
  
  let contentPrompt: string;
  if (userInput.trim()) {
    contentPrompt = `${basePrompt}
    
Based on the following topic/content (extract key insights and create engaging content):
---
${userInput}
---

Create a viral LinkedIn post following the guidelines above. Start with a compelling hook and end with an engaging question to drive comments.`;
  } else {
    contentPrompt = `${basePrompt}
    
Create a viral LinkedIn post about a recent AI/Generative AI development or trend for today, ${currentDate}. Follow the viral guidelines above - start with a compelling hook and end with an engaging question.`;
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
              .map(r => r.category?.replace('HARM_CATEGORY_', '') || 'UNKNOWN')
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

export const suggestPostImprovements = async (currentPost: string, persona: string): Promise<string> => {
  if (!apiKey) throw new Error("Gemini API Key not configured. Please ensure the API_KEY environment variable is set.");

  const model = 'gemini-2.5-flash-preview-04-17';
  const personaInstruction = getPersonaInstruction(persona);

  let basePrompt = `You are an expert LinkedIn content strategist specializing in viral content optimization. Improve the given post using proven viral LinkedIn strategies:

**VIRAL OPTIMIZATION GUIDELINES:**

1. **Compelling Hook Enhancement**: 
   - Strengthen the opening with more intriguing/controversial statements
   - Add curiosity gaps that make people want to read more
   - Hint at valuable insights without giving everything away upfront

2. **Format Optimization**:
   - Break into shorter paragraphs (1-2 sentences max)
   - Add bullet points or numbered lists for better readability
   - Use white space strategically for mobile users
   - Create natural "read more" break points

3. **Value & Engagement Boost**:
   - Add actionable insights or specific examples
   - Include relevant data points or trends if applicable
   - Make content more shareable and discussion-worthy
   - Ensure genuine professional value

4. **Authentic Voice Strengthening**:
   - Enhance personal branding elements
   - Add authentic, relatable touches
   - Maintain professional credibility

5. **Positive Framing**:
   - Reframe any negative aspects with growth mindset
   - Highlight learning opportunities and resilience
   - Show gratitude and forward-thinking perspective

6. **CTA Optimization**:
   - End with compelling questions that drive comments
   - Encourage specific types of engagement (sharing experiences, opinions)
   - Create conversation starters that extend reach

7. **Strategic Structure**:
   - Optimize length (100-200 words ideal)
   - Improve hashtag placement and relevance (2-4 hashtags)
   - Enhance overall flow and readability

Always maintain the core message while maximizing viral potential.
Always append the following to the very end: #0to100xengineers #0to100xEngineer @100xengineers`;

  if (personaInstruction) {
    basePrompt = `${personaInstruction}\n\n${basePrompt}`;
  }

  const improvementPrompt = `${basePrompt}

Original LinkedIn Post:
---
${currentPost}
---

Optimize this post for maximum viral potential while maintaining its core message. Focus on improving the hook, formatting, and call-to-action:`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: improvementPrompt,
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
              .map(r => r.category?.replace('HARM_CATEGORY_', '') || 'UNKNOWN')
              .join(', ');
            if (harmfulCategories) {
              reason += ` Potentially harmful content detected in categories: ${harmfulCategories}.`;
            }
          }
        }
      }
      console.warn("Gemini API returned no usable text for post improvement.", { reason, response });
      throw new Error(`Failed to suggest post improvements: ${reason} Please try again later.`);
    }
  } catch (error) {
    console.error("Error suggesting post improvements:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
             throw new Error("Invalid API Key for post improvement. Please check your API key configuration.");
        }
        throw error;
    }
    throw new Error("Failed to suggest post improvements due to an unexpected error in the AI service.");
  }
};
