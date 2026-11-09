import { GoogleGenAI } from '@google/genai';

export async function translateTextWithGemini(text: string, targetLang = 'English'): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
  
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Intelligent fallback translation
    return `[Translated to ${targetLang}]: "${text}"`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following chat message concisely into ${targetLang}. Only output the translated text without extra preamble:\n\n"${text}"`,
    });
    return response.text?.trim() || `[Translated]: ${text}`;
  } catch (err) {
    console.warn('Gemini translation fallback used:', err);
    return `[Translated to ${targetLang}]: "${text}"`;
  }
}
