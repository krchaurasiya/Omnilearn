import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DifficultyLevel, LessonContent, Roadmap } from "../types";

// Helper to get client with current key
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select an API key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateLessonPlan = async (
  concept: string,
  level: DifficultyLevel
): Promise<LessonContent> => {
  const ai = getClient();

  const prompt = `Create a highly comprehensive, academic, and deep educational lesson about "${concept}" specifically tailored for a ${level} level audience.
  
  The explanation must be rigorous, detailed, and exhaustive, covering the "why" and "how" in depth, not just the surface level.

  CRITICAL REQUIREMENT FOR MATH RENDER (JSON FORMAT):
  - You are outputting a JSON object.
  - ALL LaTeX backslashes MUST be escaped in the JSON string to be valid.
  - CORRECT: "x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}" (This parses to x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a})
  - INCORRECT: "x = \\frac..." (This parses to a control character or invalid escape)
  - INCORRECT: "x = \frac..." (Invalid JSON)
  - USE DOUBLE BACKSLASHES for all LaTeX commands: \\\\theta, \\\\in, \\\\mathbb{R}, \\\\sum, \\\\int, etc.
  
  Structure & Format:
  - Inline math: $E = mc^2$
  - Block math: $$ ... $$
  - Use Markdown headers (#, ##, ###) to structure the content logically.
  - Use bolding (**) for emphasis.
  
  Include:
  1. A Title.
  2. A 2-sentence Summary.
  3. A Detailed Explanation: This should be extensive. Derive formulas where applicable.
  4. A relatable Analogy.
  5. 5-7 Key Takeaway points.
  6. A comprehensive Quiz with a MINIMUM of 30 questions. The questions should be exhaustive and cover every minute detail, definition, formula, and logical step mentioned in the explanation to ensure total mastery.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          detailedExplanation: { type: Type.STRING },
          analogy: { type: Type.STRING },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctAnswerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ["question", "options", "correctAnswerIndex", "explanation"],
            },
          },
        },
        required: ["title", "summary", "detailedExplanation", "analogy", "keyPoints", "quiz"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate lesson content");
  }

  const data = JSON.parse(response.text);
  
  // Add metadata for history
  return {
    ...data,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  } as LessonContent;
};

export const generateRoadmap = async (concept: string): Promise<Roadmap> => {
  const ai = getClient();
  
  const prompt = `Create a detailed learning roadmap for mastering "${concept}". 
  Break it down into logical, sequential steps starting from the basics and moving to advanced topics.
  
  For each step, provide:
  - A title
  - A brief description
  - Estimated time to master
  - A list of sub-topics/concepts to learn in that step.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING },
          description: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stepNumber: { type: Type.INTEGER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedTime: { type: Type.STRING },
                topics: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["stepNumber", "title", "description", "estimatedTime", "topics"]
            }
          }
        },
        required: ["concept", "description", "steps"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate roadmap");
  }

  return JSON.parse(response.text) as Roadmap;
}

export const textToSpeech = async (text: string): Promise<AudioBuffer> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    // Helper functions for manual PCM decoding (required for Gemini Native Audio)
    const decodeBase64 = (base64: string) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    const decodeAudioData = (data: Uint8Array, ctx: AudioContext) => {
        const sampleRate = 24000; // Gemini Native Audio standard
        const numChannels = 1;
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                // Convert Int16 PCM to Float32
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    };

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const bytes = decodeBase64(base64Audio);
    return decodeAudioData(bytes, audioContext);
};

export const getTutorResponse = async (
  lesson: LessonContent,
  history: { role: string; parts: { text: string }[] }[],
  message: string
): Promise<string> => {
  const ai = getClient();
  
  // Initialize chat with system context about the lesson
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [
      {
        role: "user",
        parts: [{ text: `SYSTEM CONTEXT: The student is studying a lesson titled "${lesson.title}".
        
        LESSON CONTENT:
        ${lesson.detailedExplanation.substring(0, 20000)}
        
        INSTRUCTIONS:
        You are an expert AI Tutor.
        - Answer the student's questions based on the lesson content.
        - If asked to "simplify", provide an ELI5 (Explain Like I'm 5) explanation or a simple analogy.
        - If asked to "solve math", use rigorous step-by-step math with LaTeX.
        - ALWAYS use LaTeX for math expressions: $E=mc^2$ (inline) or $$...$$ (block).
        - Be encouraging, concise, and helpful.
        ` }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am ready to help the student master this concept." }],
      },
      ...history
    ],
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};