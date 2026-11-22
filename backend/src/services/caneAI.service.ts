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

export interface GeminiModelInfo {
  name: string;
  id: string;
  displayName?: string;
  supportedGenerationMethods: string[];
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

// In-memory cache of a live-verified fallback Gemini model if the default/configured model returns 404
let cachedVerifiedGeminiModel: string | null = null;

export function normalizeGeminiModelName(rawModel: string): string {
  return String(rawModel || '')
    .trim()
    .replace(/^models\//i, '');
}

export function resetCachedGeminiModel(): void {
  cachedVerifiedGeminiModel = null;
}

function getConfiguredGeminiModel(): string {
  const fromEnv =
    process.env.GEMINI_MODEL ||
    ENV.GEMINI_MODEL ||
    process.env.CANE_AI_MODEL ||
    ENV.CANE_AI_MODEL ||
    '';
  if (fromEnv.trim()) {
    return normalizeGeminiModelName(fromEnv);
  }
  if (cachedVerifiedGeminiModel) {
    return cachedVerifiedGeminiModel;
  }
  return DEFAULT_GEMINI_MODEL;
}

function getGeminiApiKey(): string {
  return (process.env.GEMINI_API_KEY || ENV.GEMINI_API_KEY || '').trim();
}

function getOpenAiApiKey(): string {
  return (process.env.OPENAI_API_KEY || ENV.OPENAI_API_KEY || '').trim();
}

export function getActiveAIProvider(): {
  provider: 'gemini' | 'openai' | 'none';
  model: string;
  configured: boolean;
} {
  const pref = (process.env.CANE_AI_PROVIDER || ENV.CANE_AI_PROVIDER || 'auto').toLowerCase();
  const hasGemini = Boolean(getGeminiApiKey());
  const hasOpenAI = Boolean(getOpenAiApiKey());

  if (pref === 'gemini' && hasGemini) {
    return {
      provider: 'gemini',
      model: getConfiguredGeminiModel(),
      configured: true
    };
  }
  if (pref === 'openai' && hasOpenAI) {
    return {
      provider: 'openai',
      model: process.env.CANE_AI_MODEL || ENV.CANE_AI_MODEL || DEFAULT_OPENAI_MODEL,
      configured: true
    };
  }
  if (hasGemini) {
    return {
      provider: 'gemini',
      model: getConfiguredGeminiModel(),
      configured: true
    };
  }
  if (hasOpenAI) {
    return {
      provider: 'openai',
      model: process.env.CANE_AI_MODEL || ENV.CANE_AI_MODEL || DEFAULT_OPENAI_MODEL,
      configured: true
    };
  }
  return { provider: 'none', model: '', configured: false };
}

/**
 * Queries Google's official Gemini ListModels API to discover models
 * accessible to the configured API key that support `generateContent`.
 */
export async function listAccessibleGeminiModels(apiKey = getGeminiApiKey()): Promise<GeminiModelInfo[]> {
  if (!apiKey) return [];

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
    apiKey
  )}`;

  const res = await fetch(endpoint, { method: 'GET' });
  if (!res.ok) {
    console.error(`[CANE AI] Gemini ListModels returned HTTP ${res.status}`);
    return [];
  }

  const data: any = await res.json();
  const rawModels: any[] = Array.isArray(data?.models) ? data.models : [];

  return rawModels
    .map((m) => ({
      name: String(m?.name || ''),
      id: normalizeGeminiModelName(m?.name || ''),
      displayName: m?.displayName ? String(m.displayName) : undefined,
      supportedGenerationMethods: Array.isArray(m?.supportedGenerationMethods)
        ? m.supportedGenerationMethods.map(String)
        : []
    }))
    .filter((m) => m.id && m.supportedGenerationMethods.includes('generateContent'));
}

/**
 * Picks the best available Gemini Flash model from an official ListModels response.
 * Prioritizes `gemini-3.8-flash` and newest stable Gemini Flash models.
 */
export function selectBestGeminiFlashModel(
  models: GeminiModelInfo[],
  excludeModelId?: string
): string | null {
  const excluded = excludeModelId ? normalizeGeminiModelName(excludeModelId).toLowerCase() : '';
  const candidates = models.filter((m) => m.id.toLowerCase() !== excluded);
  if (candidates.length === 0) return null;

  const preferredOrder = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.0-flash',
    'gemini-flash-latest'
  ];

  for (const preferred of preferredOrder) {
    const exact = candidates.find((m) => m.id.toLowerCase() === preferred);
    if (exact) return exact.id;
  }

  // Fallback: newest stable Gemini Flash model (excluding preview/exp/tts/image/thinking-only where possible)
  const flashCandidates = candidates.filter(
    (m) =>
      /^gemini-/i.test(m.id) &&
      /flash/i.test(m.id) &&
      !/image|tts|audio|embedding|vision-only|live/i.test(m.id)
  );

  if (flashCandidates.length > 0) {
    flashCandidates.sort((a, b) => {
      const aExp = /exp|preview/i.test(a.id) ? 1 : 0;
      const bExp = /exp|preview/i.test(b.id) ? 1 : 0;
      if (aExp !== bExp) return aExp - bExp;
      return b.id.localeCompare(a.id, undefined, { numeric: true });
    });
    return flashCandidates[0].id;
  }

  // Last resort: any generateContent-capable gemini text model
  const anyGemini = candidates.find(
    (m) => /^gemini-/i.test(m.id) && !/embedding|imagen|veo|aqa/i.test(m.id)
  );
  return anyGemini ? anyGemini.id : null;
}

function mapProviderErrorToUserMessage(status: number, provider: 'gemini' | 'openai'): string {
  if (status === 401 || status === 403) {
    return 'CANE could not authenticate with the AI service right now. Please ask the administrator to verify the backend API key.';
  }
  if (status === 404) {
    return 'CANE’s configured AI model is currently unavailable for this API key. Please try again in a moment or verify GEMINI_MODEL on the server.';
  }
  if (status === 429) {
    return 'CANE is receiving too many requests right now. Please wait a few seconds and try your message again.';
  }
  if (status >= 500) {
    return 'CANE’s AI service is temporarily busy. Please try sending your message again in a moment.';
  }
  return provider === 'gemini'
    ? 'CANE could not complete your request right now. Please try again shortly.'
    : 'CANE encountered a temporary issue reaching the AI service. Please try again shortly.';
}

async function callGeminiGenerateContent(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  trimmedMessages: ChatTurn[],
  temperature: number,
  maxTokens: number
): Promise<{ ok: boolean; status: number; text: string; rawError: string }> {
  const cleanModel = normalizeGeminiModelName(modelId);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    cleanModel
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

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
    const rawError = await res.text().catch(() => '');
    return { ok: false, status: res.status, text: '', rawError };
  }

  const data: any = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text || '')
      .join('')
      .trim() || '';

  return { ok: true, status: res.status, text, rawError: '' };
}

/**
 * Calls the configured external LLM provider (Gemini or OpenAI-compatible API).
 * Strictly keeps API keys on the backend, auto-discovers a supported Gemini Flash
 * model via ListModels if the configured model returns 404, and returns user-friendly
 * error messages without leaking raw provider payloads.
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
        'CANE is not connected to an AI provider yet. Ask your administrator to configure GEMINI_API_KEY (and optional GEMINI_MODEL) on the backend server.'
    };
  }

  // Trim conversation history to last 12 turns to control token cost and latency
  const trimmedMessages = messages.slice(-12);
  const temperature = options.temperature ?? 0.6;
  const maxTokens = options.maxTokens ?? 1100;

  try {
    if (active.provider === 'gemini') {
      const apiKey = getGeminiApiKey();
      let modelToUse = active.model;

      let attempt = await callGeminiGenerateContent(
        apiKey,
        modelToUse,
        systemPrompt,
        trimmedMessages,
        temperature,
        maxTokens
      );

      // If Gemini reports 404 (model unavailable for this key), query official ListModels & retry once with a verified Flash model
      if (!attempt.ok && attempt.status === 404) {
        console.warn(
          `[CANE AI] Gemini model "${modelToUse}" returned 404. Querying ListModels for a supported Flash model...`
        );
        const accessibleModels = await listAccessibleGeminiModels(apiKey);
        const fallbackModel = selectBestGeminiFlashModel(accessibleModels, modelToUse);

        if (fallbackModel) {
          console.info(
            `[CANE AI] Switching CANE Gemini model from "${modelToUse}" to verified model "${fallbackModel}".`
          );
          cachedVerifiedGeminiModel = fallbackModel;
          modelToUse = fallbackModel;
          attempt = await callGeminiGenerateContent(
            apiKey,
            modelToUse,
            systemPrompt,
            trimmedMessages,
            temperature,
            maxTokens
          );
        }
      }

      if (!attempt.ok) {
        console.error(
          `[CANE AI] Gemini request failed (model=${modelToUse}, status=${attempt.status}): ${attempt.rawError.slice(
            0,
            280
          )}`
        );
        return {
          configured: true,
          provider: 'gemini',
          model: modelToUse,
          content: '',
          error: mapProviderErrorToUserMessage(attempt.status, 'gemini')
        };
      }

      if (!attempt.text) {
        return {
          configured: true,
          provider: 'gemini',
          model: modelToUse,
          content: '',
          error:
            'CANE could not generate an answer for that phrasing. Try rephrasing your career question slightly.'
        };
      }

      return {
        configured: true,
        provider: 'gemini',
        model: modelToUse,
        content: attempt.text
      };
    }

    // OpenAI / OpenAI-compatible provider
    const endpoint = `${ENV.OPENAI_BASE_URL}/chat/completions`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getOpenAiApiKey()}`
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
      console.error(
        `[CANE AI] OpenAI-compatible request failed (model=${active.model}, status=${res.status}): ${errText.slice(
          0,
          280
        )}`
      );
      return {
        configured: true,
        provider: 'openai',
        model: active.model,
        content: '',
        error: mapProviderErrorToUserMessage(res.status, 'openai')
      };
    }

    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || '';

    return {
      configured: true,
      provider: 'openai',
      model: active.model,
      content: text,
      ...(text
        ? {}
        : {
            error:
              'CANE could not generate a reply for that question. Please try rephrasing slightly.'
          })
    };
  } catch (err: any) {
    console.error(`[CANE AI] Network/runtime error (${active.provider}):`, err?.message || err);
    return {
      configured: true,
      provider: active.provider,
      model: active.model,
      content: '',
      error: 'CANE is having trouble connecting right now. Please try again in a few seconds.'
    };
  }
}
