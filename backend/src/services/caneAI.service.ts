import { ENV } from '../config/env';

export interface ChatTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CaneCompletionResult {
  configured: boolean;
  provider: 'gemini' | 'openai' | 'none';
  model: string;
  content: string;
  error?: string;
}

export function getActiveAIProvider(): {
  provider: 'gemini' | 'openai' | 'none';
  model: string;
  configured: boolean;
} {
  const pref = ENV.CANE_AI_PROVIDER;
  const hasGemini = Boolean(ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim());
  const hasOpenAI = Boolean(ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.trim());

  if (pref === 'gemini' && hasGemini) {
    return {
      provider: 'gemini',
      model: ENV.CANE_AI_MODEL || 'gemini-2.5-flash',
      configured: true
    };
  }
  if (pref === 'openai' && hasOpenAI) {
    return {
      provider: 'openai',
      model: ENV.CANE_AI_MODEL || 'gpt-4o-mini',
      configured: true
    };
  }
  if (hasGemini) {
    return {
      provider: 'gemini',
      model: ENV.CANE_AI_MODEL || 'gemini-2.5-flash',
      configured: true
    };
  }
  if (hasOpenAI) {
    return {
      provider: 'openai',
      model: ENV.CANE_AI_MODEL || 'gpt-4o-mini',
      configured: true
    };
  }
  return { provider: 'none', model: '', configured: false };
}

/**
 * Calls the configured external LLM provider (Gemini or OpenAI-compatible API).
 * Strictly keeps API keys on the backend and trims context to manage cost & latency.
 */
export async function generateCaneCompletion(
  systemPrompt: string,
  messages: ChatTurn[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<CaneCompletionResult> {
  const active = getActiveAIProvider();
  if (!active.configured) {
    return {
      configured: false,
      provider: 'none',
      model: '',
      content: '',
      error:
        'CANE live AI provider is not configured on this server yet. Set GEMINI_API_KEY or OPENAI_API_KEY in backend environment variables (Render Dashboard → Environment).'
    };
  }

  // Trim conversation history to last 12 turns to control token cost and latency
  const trimmedMessages = messages.slice(-12);
  const temperature = options.temperature ?? 0.6;
  const maxTokens = options.maxTokens ?? 1100;

  try {
    if (active.provider === 'gemini') {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        active.model
      )}:generateContent?key=${encodeURIComponent(ENV.GEMINI_API_KEY)}`;

      const contents = trimmedMessages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return {
          configured: true,
          provider: 'gemini',
          model: active.model,
          content: '',
          error: `Gemini API request failed (${res.status}): ${errText.slice(0, 180)}`
        };
      }

      const data: any = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p?.text || '')
          .join('')
          .trim() || '';

      if (!text) {
        return {
          configured: true,
          provider: 'gemini',
          model: active.model,
          content: '',
          error: 'Gemini returned an empty response.'
        };
      }

      return {
        configured: true,
        provider: 'gemini',
        model: active.model,
        content: text
      };
    }

    // OpenAI / OpenAI-compatible provider
    const endpoint = `${ENV.OPENAI_BASE_URL}/chat/completions`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ENV.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: active.model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          ...trimmedMessages.map((m) => ({
            role: m.role === 'system' ? 'user' : m.role,
            content: m.content
          }))
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        configured: true,
        provider: 'openai',
        model: active.model,
        content: '',
        error: `AI provider request failed (${res.status}): ${errText.slice(0, 180)}`
      };
    }

    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || '';

    return {
      configured: true,
      provider: 'openai',
      model: active.model,
      content: text,
      ...(text ? {} : { error: 'AI provider returned an empty response.' })
    };
  } catch (err: any) {
    return {
      configured: true,
      provider: active.provider,
      model: active.model,
      content: '',
      error: err?.message || 'Unable to reach AI provider right now.'
    };
  }
}
