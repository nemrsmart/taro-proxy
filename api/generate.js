// /api/generate.js - v1.3 (финальная версия с safetySettings и новым вызовом API)
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error("[BRIDGE ERROR] GEMINI_API_KEY is not configured.");
    return response.status(500).json({ error: 'API key not configured' });
  }

  const { prompt } = request.body;
  if (!prompt) {
    console.error("[BRIDGE ERROR] Prompt is missing.");
    return response.status(400).json({ error: 'Prompt is missing' });
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    // --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: ОТКЛЮЧАЕМ ФИЛЬТРЫ БЕЗОПАСНОСТИ ---
    // Это позволит нам обрабатывать такие карты, как "Смерть" и "Дьявол" без блокировки.
    const safetySettings = [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];

    // --- ИСПОЛЬЗУЕМ ВЫЗОВ API В ТОЧНОСТИ КАК В ДОКУМЕНТАЦИИ ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", safetySettings });
    
    console.log("[BRIDGE INFO] Calling Gemini API with new method...");
    
    // Передаем промпт как 'contents'
    const result = await model.generateContent(prompt);
    const geminiResponse = await result.response;
    const responseText = geminiResponse.text();
    
    console.log("[BRIDGE INFO] Gemini API raw response text:", responseText);

    if (!responseText) {
      console.warn("[BRIDGE WARNING] Gemini returned an empty text. Check candidates log.");
      console.log("[BRIDGE INFO] Gemini API candidates:", JSON.stringify(geminiResponse.candidates, null, 2));
    }

    response.status(200).json({ text: responseText });

  } catch (error) {
    console.error('[BRIDGE CRITICAL] Error calling Gemini API:', error.message);
    response.status(500).json({ error: 'Failed to get response from Gemini API' });
  }
}
