import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY || ''; // In a real app, ensure this is set safely
  // Note: For this demo environment, we assume the environment injects it. 
  // If undefined, the SDK handles the error.
  return new GoogleGenAI({ apiKey });
};

export const generateFinancialInsight = async (dataContext: string): Promise<string> => {
  try {
    const ai = getClient();
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      As an expert financial advisor for a SME (Small/Medium Enterprise), analyze the following financial summary data:
      ${dataContext}
      
      Provide a concise, professional standard operating procedure (SOP) recommendation or financial insight in Arabic.
      Focus on cash flow optimization, cost reduction, or revenue growth.
      Keep it under 100 words.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "لم يتم إنشاء أي رؤية. حاول مرة أخرى.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "عذراً، خدمة المساعد الذكي غير متاحة حالياً. يرجى التحقق من اتصالك.";
  }
};