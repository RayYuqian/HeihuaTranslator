import { HUMAN_TO_HEIHUA_PROMPT, HEIHUA_TO_HUMAN_PROMPT } from './prompts';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'deepseek/deepseek-chat';

export interface TranslationResult {
  translation: string;
  explanations?: {
    word: string;
    meaning: string;
    origin?: string;
  }[];
}

export async function translateText(text: string, toHeihua: boolean, apiKey: string): Promise<TranslationResult> {
  if (!apiKey) {
    throw new Error('未配置 API Key，请检查 .env 文件。');
  }

  if (!text.trim()) {
    throw new Error('请输入需要翻译的内容。');
  }

  const systemPrompt = toHeihua ? HUMAN_TO_HEIHUA_PROMPT : HEIHUA_TO_HUMAN_PROMPT;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.href, // Recommended for OpenRouter
        'X-Title': 'Heihua Translator', // Recommended for OpenRouter
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      throw new Error(errorData.error?.message || `请求失败 (状态码: ${response.status})`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '{}';
    
    // Some models still wrap JSON in markdown block even when told not to. Remove them.
    content = content.replace(/^```(json)?/, '').replace(/```$/, '').trim();

    try {
      const parsed = JSON.parse(content);
      return parsed as TranslationResult;
    } catch (e) {
      console.error('Failed to parse JSON out of content:', content);
      throw new Error('模型返回的格式无法解析，请重试一遍。');
    }
  } catch (error: any) {
    console.error('Translation error:', error);
    throw new Error(error.message || '网络请求异常，请检查网络连接或 API Key 设置。');
  }
}
