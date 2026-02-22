import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Разрешаем CORS для всех источников (включая Telegram WebView)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Обработка preflight запроса
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Только POST запросы
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ OpenAI API key not found in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured' }),
      };
    }

    // Парсим тело запроса
    const requestBody = JSON.parse(event.body || '{}');
    const { text, lang, model = 'tts-1', voice = 'nova' } = requestBody;

    if (!text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text parameter is required' }),
      };
    }

    console.log('📡 [Proxy] Forwarding request to OpenAI TTS API:', {
      textLength: text.length,
      lang,
      model,
      voice,
    });

    // Делаем запрос к OpenAI API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        language: lang === 'de' ? 'de' : lang === 'ru' ? 'ru' : undefined,
        speed: 1.0, // Скорость речи (0.25-4.0)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Proxy] OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      
      return {
        statusCode: response.status,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: `OpenAI API error: ${response.status} ${response.statusText}`,
          details: errorText,
        }),
      };
    }

    // Получаем аудио как blob
    const audioBlob = await response.blob();
    const audioBuffer = await audioBlob.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    console.log('✅ [Proxy] Audio received from OpenAI:', {
      size: `${(audioBlob.size / 1024).toFixed(2)} KB`,
      type: audioBlob.type,
    });

    // Возвращаем аудио как base64
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: audioBase64,
        contentType: audioBlob.type,
        size: audioBlob.size,
      }),
    };
  } catch (error: any) {
    console.error('❌ [Proxy] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
