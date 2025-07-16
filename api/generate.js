// /api/generate.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Экспортируем функцию, которую Vercel будет запускать
export default async function handler(request, response) {
  // Принимаем запросы только методом POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // Получаем API-ключ из секретных переменных окружения Vercel
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return response.status(500).json({ error: 'API key is not configured' });
  }

  // Получаем промпт из тела запроса, который прислал наш Python-бот
  const { prompt } = request.body;
  if (!prompt) {
    return response.status(400).json({ error: 'Prompt is missing from request body' });
  }

  try {
    // Инициализируем клиент Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Отправляем промпт в Gemini
    const result = await model.generateContent(prompt);
    const geminiResponse = await result.response;
    
    // Отправляем ответ от Gemini обратно нашему Python-боту
    response.status(200).json({ text: geminiResponse.text() });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    response.status(500).json({ error: 'Failed to get response from Gemini API' });
  }
}