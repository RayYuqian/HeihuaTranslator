import { HUMAN_TO_HEIHUA_PROMPT, HEIHUA_TO_HUMAN_PROMPT } from './prompts';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'deepseek/deepseek-chat';

export async function translateText(text: string, toHeihua: boolean, apiKey: string): Promise<string> {
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
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      throw new Error(errorData.error?.message || `请求失败 (状态码: ${response.status})`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '未返回有效结果';
  } catch (error: any) {
    console.error('Translation error:', error);
    throw new Error(error.message || '网络请求异常，请检查网络连接或 API Key 设置。');
  }
}
