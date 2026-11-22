import { ENV } from '../config/env';

export interface ChatTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ModelAttemptRecord {
  model: string;
  status: number;
  role: 'primary' | 'fallback';
}

export interface CaneCompletionResult {
  configured: boolean;
  provider: 'gemini' | 'openai' | 'none';
  model: string;
  content: string;
  error?: string;
  statusCode?: number;
  retryAfterSeconds?: number;
  fallbackUsed?: boolean;
  attemptedModels?: ModelAttemptRecord[];
}

export interface GeminiModelInfo {
  name: string;
  id: string;
  displayName?: string;
  supportedGenerationMethods: string[];
}

export interface CaneCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  /** Optional delay override (useful for deterministic unit tests) */
  sleepFn?: (ms: number) => Promise<void>;
  /** Base exponential backoff delay in ms (default: 500ms) */
  baseBackoffMs?: number;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

const MODEL_LIST_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const PRIMARY_503_MAX_RETRIES = 2; // Initial try + 2 exponential backoff retries
const PRIMARY_5XX_MAX_RETRIES = 1; // Initial try + 1 retry for 500/502/504
const FALLBACK_503_MAX_RETRIES = 1; // Initial try + 1 retry on fallback model
const MAX_INLINE_WAIT_MS = 5000; // Never stall a user HTTP request longer than 5s inline
const MAX_COOLDOWN_MS = 60_000; // Cap temporary primary 503 cooldown to 60s

// In-memory runtime state (never persisted; never logs keys)
let cachedVerifiedGeminiModel: string | null = null;
let cachedModelList: {
  keyLength: number;
  keyTailTag: string;
  fetchedAt: number;
  models: GeminiModelInfo[];
} | null = null;
const modelCooldownUntil = new Map<string, number>();

export function normalizeGeminiModelName(rawModel: string): string {
  return String(rawModel || '')
    .trim()
    .replace(/^models\//i, '');
}

export function resetGeminiRuntimeState(): void {
  cachedVerifiedGeminiModel = null;
  cachedModelList = null;
  modelCooldownUntil.clear();
}

export function resetCachedGeminiModel(): void {
  resetGeminiRuntimeState();
}

function getApiKeyCacheFingerprint(apiKey: string): { keyLength: number; keyTailTag: string } {
  // Lightweight in-memory change detector only (never logged or returned)
  let hash = 0;
  for (let i = 0; i < apiKey.length; i++) {
    hash = (hash * 31 + apiKey.charCodeAt(i)) | 0;
  }
  return { keyLength: apiKey.length, keyTailTag: String(hash) };
}

export function getConfiguredGeminiModel(): string {
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

export function getConfiguredGeminiFallbackModel(): string {
  const fromEnv = process.env.GEMINI_FALLBACK_MODEL || ENV.GEMINI_FALLBACK_MODEL || '';
  if (fromEnv.trim()) {
    return normalizeGeminiModelName(fromEnv);
  }
  return DEFAULT_GEMINI_FALLBACK_MODEL;
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
  fallbackModel?: string;
  configured: boolean;
} {
  const pref = (process.env.CANE_AI_PROVIDER || ENV.CANE_AI_PROVIDER || 'auto').toLowerCase();
  const hasGemini = Boolean(getGeminiApiKey());
  const hasOpenAI = Boolean(getOpenAiApiKey());

  if (pref === 'gemini' && hasGemini) {
    return {
      provider: 'gemini',
      model: getConfiguredGeminiModel(),
      fallbackModel: getConfiguredGeminiFallbackModel(),
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
      fallbackModel: getConfiguredGeminiFallbackModel(),
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
 * Parses HTTP Retry-After header (delta-seconds or HTTP-date) into milliseconds.
 */
export function parseRetryAfterMs(headerValue: string | null | undefined): number | null {
  if (!headerValue) return null;
  const trimmed = headerValue.trim();
  if (!trimmed) return null;

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds * 1000) : null;
  }

  const parsedDateMs = Date.parse(trimmed);
  if (!Number.isNaN(parsedDateMs)) {
    const delta = parsedDateMs - Date.now();
    return delta > 0 ? delta : null;
  }

  return null;
}

export function isQuotaExhaustedError(rawError: string): boolean {
  return /exceeded your current quota|quota exceeded|daily limit|perday|per_day|billing|limit:\s*0|plan and billing/i.test(
    rawError
  );
}

export function isInvalidApiKeyError(status: number, rawError: string): boolean {
  if (status === 401 || status === 403) return true;
  return /api key not valid|api_key_invalid|invalid api key|permission_denied|unauthenticated/i.test(
    rawError
  );
}

function classifyGeminiError(status: number, rawError: string): string {
  if (isInvalidApiKeyError(status, rawError)) return 'auth_error';
  if (status === 400) return 'invalid_request';
  if (status === 404) return 'model_not_found';
  if (status === 429) return isQuotaExhaustedError(rawError) ? 'quota_exhausted' : 'rate_limited';
  if (status === 503) return 'high_demand';
  if (status >= 500) return 'upstream_server_error';
  if (status === 0) return 'network_error';
  return 'upstream_error';
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAccessibleGeminiModels(apiKey: string): Promise<{
  models: GeminiModelInfo[];
  status: number;
  authFailed: boolean;
}> {
  if (!apiKey) return { models: [], status: 0, authFailed: false };

  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey
      }
    });

    if (!res.ok) {
      const authFailed = res.status === 401 || res.status === 403;
      console.error(`[CANE AI] Gemini ListModels returned status=${res.status}`);
      return { models: [], status: res.status, authFailed };
    }

    const data: any = await res.json();
    const rawModels: any[] = Array.isArray(data?.models) ? data.models : [];

    const models = rawModels
      .map((m) => ({
        name: String(m?.name || ''),
        id: normalizeGeminiModelName(m?.name || ''),
        displayName: m?.displayName ? String(m.displayName) : undefined,
        supportedGenerationMethods: Array.isArray(m?.supportedGenerationMethods)
          ? m.supportedGenerationMethods.map(String)
          : []
      }))
      .filter((m) => m.id && m.supportedGenerationMethods.includes('generateContent'));

    return { models, status: res.status, authFailed: false };
  } catch {
    console.error('[CANE AI] Gemini ListModels request failed due to network error.');
    return { models: [], status: 0, authFailed: false };
  }
}

/**
 * Queries Google's official Gemini ListModels API to discover models
 * accessible to the configured API key that support `generateContent`.
 */
export async function listAccessibleGeminiModels(
  apiKey = getGeminiApiKey()
): Promise<GeminiModelInfo[]> {
  const result = await fetchAccessibleGeminiModels(apiKey);
  return result.models;
}

async function getAccessibleGeminiModelsCached(apiKey: string): Promise<{
  models: GeminiModelInfo[];
  authFailed: boolean;
  status: number;
}> {
  const fp = getApiKeyCacheFingerprint(apiKey);
  const now = Date.now();

  if (
    cachedModelList &&
    cachedModelList.keyLength === fp.keyLength &&
    cachedModelList.keyTailTag === fp.keyTailTag &&
    now - cachedModelList.fetchedAt < MODEL_LIST_CACHE_TTL_MS
  ) {
    return { models: cachedModelList.models, authFailed: false, status: 200 };
  }

  const fetched = await fetchAccessibleGeminiModels(apiKey);
  if (!fetched.authFailed && fetched.models.length > 0) {
    cachedModelList = {
      keyLength: fp.keyLength,
      keyTailTag: fp.keyTailTag,
      fetchedAt: now,
      models: fetched.models
    };
  }
  return fetched;
}

/**
 * Picks the best available Gemini Flash model from an official ListModels response.
 * Prioritizes configured fallback / newest stable Gemini Flash models while excluding failed models.
 */
export function selectBestGeminiFlashModel(
  models: GeminiModelInfo[],
  excludeModelIds?: string | string[]
): string | null {
  const excludedSet = new Set(
    (Array.isArray(excludeModelIds) ? excludeModelIds : excludeModelIds ? [excludeModelIds] : [])
      .map((id) => normalizeGeminiModelName(id).toLowerCase())
      .filter(Boolean)
  );

  const candidates = models.filter((m) => !excludedSet.has(m.id.toLowerCase()));
  if (candidates.length === 0) return null;

  const preferredOrder = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.0-flash',
    'gemini-flash-latest'
  ];

  for (const preferred of preferredOrder) {
    const exact = candidates.find((m) => m.id.toLowerCase() === preferred);
    if (exact) return exact.id;
  }

  // Fallback: newest stable Gemini Flash model (excluding image/tts/audio/embedding/live)
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

/**
 * Verifies the configured fallback candidate (default: `gemini-3.5-flash-lite`)
 * against the official ListModels API for the configured API key.
 * If the preferred fallback candidate is not accessible, selects the best
 * accessible alternative Flash model (excluding the already-failed primary model).
 */
export async function resolveVerifiedFallbackModel(
  apiKey: string,
  excludeModels: string[]
): Promise<{ model: string | null; authFailed: boolean }> {
  const excludedSet = new Set(
    excludeModels.map((m) => normalizeGeminiModelName(m).toLowerCase()).filter(Boolean)
  );
  const candidate = getConfiguredGeminiFallbackModel();

  console.info(
    `[CANE AI] Verifying fallback candidate="${candidate}" via Gemini ListModels...`
  );

  const { models, authFailed } = await getAccessibleGeminiModelsCached(apiKey);
  if (authFailed) {
    return { model: null, authFailed: true };
  }

  // 1. Check if configured fallback candidate (e.g. gemini-3.5-flash-lite) is accessible and distinct from failed primary
  if (candidate && !excludedSet.has(candidate.toLowerCase())) {
    const exactMatch = models.find((m) => m.id.toLowerCase() === candidate.toLowerCase());
    if (exactMatch) {
      console.info(
        `[CANE AI] Verified fallback model="${exactMatch.id}" is accessible for this API key.`
      );
      return { model: exactMatch.id, authFailed: false };
    }
    console.warn(
      `[CANE AI] Fallback candidate="${candidate}" is not accessible for this API key. Selecting best verified alternative Flash model...`
    );
  }

  // 2. Otherwise pick the best verified Flash model accessible to this API key
  const bestAlternative = selectBestGeminiFlashModel(models, excludeModels);
  if (bestAlternative) {
    console.info(
      `[CANE AI] Selected verified alternative fallback model="${bestAlternative}" from ListModels.`
    );
  }
  return { model: bestAlternative, authFailed: false };
}

function mapProviderErrorToUserMessage(
  status: number,
  provider: 'gemini' | 'openai',
  options: { allModelsBusy?: boolean; retryAfterMs?: number | null; quotaExhausted?: boolean } = {}
): string {
  if (options.allModelsBusy) {
    return 'CANE’s AI models are temporarily experiencing high demand. Your message has been saved—please try again in a moment.';
  }
  if (status === 401 || status === 403) {
    return 'CANE could not authenticate with the AI service right now. Please ask the administrator to verify the backend API key.';
  }
  if (status === 400) {
    return 'CANE could not process that request format. Please try rephrasing your question slightly.';
  }
  if (status === 404) {
    return 'CANE’s configured AI model is currently unavailable for this API key. Please try again in a moment or verify GEMINI_MODEL on the server.';
  }
  if (status === 429) {
    if (options.quotaExhausted) {
      return 'CANE has temporarily reached its AI usage limit. Please try again in a little while.';
    }
    if (options.retryAfterMs && options.retryAfterMs > 0) {
      const waitSec = Math.max(1, Math.ceil(options.retryAfterMs / 1000));
      return `CANE is handling many requests right now. Please wait about ${waitSec} seconds and try again.`;
    }
    return 'CANE is receiving too many requests right now. Please wait a few seconds and try your message again.';
  }
  if (status === 503) {
    return 'CANE’s AI models are temporarily experiencing high demand. Please try sending your message again in a moment.';
  }
  if (status >= 500) {
    return 'CANE’s AI service is temporarily busy. Please try sending your message again in a moment.';
  }
  return provider === 'gemini'
    ? 'CANE could not complete your request right now. Please try again shortly.'
    : 'CANE encountered a temporary issue reaching the AI service. Please try again shortly.';
}

interface RawGeminiCallResult {
  ok: boolean;
  status: number;
  text: string;
  rawError: string;
  retryAfterMs: number | null;
}

async function callGeminiGenerateContent(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  trimmedMessages: ChatTurn[],
  temperature: number,
  maxTokens: number
): Promise<RawGeminiCallResult> {
  const cleanModel = normalizeGeminiModelName(modelId);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    cleanModel
  )}:generateContent`;

  const contents = trimmedMessages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
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

    const retryAfterMs = parseRetryAfterMs(res.headers?.get?.('retry-after'));

    if (!res.ok) {
      const rawError = await res.text().catch(() => '');
      return { ok: false, status: res.status, text: '', rawError, retryAfterMs };
    }

    const data: any = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text || '')
        .join('')
        .trim() || '';

    return { ok: true, status: res.status, text, rawError: '', retryAfterMs: null };
  } catch {
    return {
      ok: false,
      status: 0,
      text: '',
      rawError: 'network_error',
      retryAfterMs: null
    };
  }
}

/**
 * Calls the configured external LLM provider (Gemini primary, with OpenAI-compatible fallback option).
 *
 * Gemini reliability features:
 * - Reads primary model from GEMINI_MODEL (default: gemini-3.8-flash)
 * - Retries temporary 503 high-demand errors with exponential backoff (respecting Retry-After)
 * - Automatically verifies GEMINI_FALLBACK_MODEL (default: gemini-3.5-flash-lite) via ListModels
 *   before switching, preserving full conversation history, user profile context, and question
 * - Respects 429 rate limits & Retry-After without repeatedly retrying exhausted quotas
 * - Never switches models for unrelated errors (401/403 invalid API key, 400 invalid request)
 * - Keeps API keys strictly on the backend (x-goog-api-key header; never logged or exposed)
 */
export async function generateCaneCompletion(
  systemPrompt: string,
  messages: ChatTurn[],
  options: CaneCompletionOptions = {}
): Promise<CaneCompletionResult> {
  const active = getActiveAIProvider();
  if (!active.configured) {
    return {
      configured: false,
      provider: 'none',
      model: '',
      content: '',
      statusCode: 503,
      error:
        'CANE is not connected to an AI provider yet. Ask your administrator to configure GEMINI_API_KEY (and optional GEMINI_MODEL) on the backend server.'
    };
  }

  // Trim conversation history to last 12 turns to control token cost and latency
  const trimmedMessages = messages.slice(-12);
  const temperature = options.temperature ?? 0.6;
  const maxTokens = options.maxTokens ?? 1100;
  const sleep = options.sleepFn || defaultSleep;
  const baseBackoffMs = options.baseBackoffMs ?? 500;
  const useJitter = !options.sleepFn;

  try {
    if (active.provider === 'gemini') {
      const apiKey = getGeminiApiKey();
      const primaryModel = active.model;
      const attemptedModels: ModelAttemptRecord[] = [];

      let triggerFallbackReason: '503' | '5xx' | '404' | 'cooldown' | null = null;
      let lastPrimaryStatus = 0;

      // Check if primary model is currently in a temporary Retry-After cooldown window
      const primaryCooldownUntil = modelCooldownUntil.get(primaryModel.toLowerCase()) || 0;
      if (primaryCooldownUntil > Date.now()) {
        const remainingSec = Math.ceil((primaryCooldownUntil - Date.now()) / 1000);
        console.info(
          `[CANE AI] Primary model="${primaryModel}" in Retry-After cooldown (${remainingSec}s remaining); switching directly to verified fallback.`
        );
        triggerFallbackReason = 'cooldown';
        lastPrimaryStatus = 503;
      } else {
        // Attempt primary Gemini model with controlled exponential backoff on temporary 503/5xx
        let rateLimitRetriedOnce = false;

        for (let attemptIdx = 0; attemptIdx <= PRIMARY_503_MAX_RETRIES; attemptIdx++) {
          const attempt = await callGeminiGenerateContent(
            apiKey,
            primaryModel,
            systemPrompt,
            trimmedMessages,
            temperature,
            maxTokens
          );
          lastPrimaryStatus = attempt.status;
          attemptedModels.push({ model: primaryModel, status: attempt.status, role: 'primary' });

          console.info(
            `[CANE AI] Attempt primary model="${primaryModel}" status=${attempt.status} (try ${
              attemptIdx + 1
            }/${PRIMARY_503_MAX_RETRIES + 1})`
          );

          if (attempt.ok) {
            modelCooldownUntil.delete(primaryModel.toLowerCase());
            if (!attempt.text) {
              return {
                configured: true,
                provider: 'gemini',
                model: primaryModel,
                content: '',
                statusCode: 502,
                fallbackUsed: false,
                attemptedModels,
                error:
                  'CANE could not generate an answer for that phrasing. Try rephrasing your career question slightly.'
              };
            }
            return {
              configured: true,
              provider: 'gemini',
              model: primaryModel,
              content: attempt.text,
              fallbackUsed: false,
              attemptedModels
            };
          }

          const errorClass = classifyGeminiError(attempt.status, attempt.rawError);

          // 1. Auth / Invalid API key / Bad Request -> NEVER retry, NEVER switch models
          if (errorClass === 'auth_error' || errorClass === 'invalid_request') {
            console.error(
              `[CANE AI] Primary model="${primaryModel}" failed (${errorClass}, status=${attempt.status}) — non-retryable error, skipping fallback.`
            );
            return {
              configured: true,
              provider: 'gemini',
              model: primaryModel,
              content: '',
              statusCode: attempt.status === 400 ? 400 : 502,
              fallbackUsed: false,
              attemptedModels,
              error: mapProviderErrorToUserMessage(attempt.status, 'gemini')
            };
          }

          // 2. Rate limit / Quota exhausted (429) -> Respect Retry-After; NEVER repeatedly retry exhausted quotas
          if (attempt.status === 429) {
            const quotaExhausted = isQuotaExhaustedError(attempt.rawError);
            const retryAfterSeconds = attempt.retryAfterMs
              ? Math.max(1, Math.ceil(attempt.retryAfterMs / 1000))
              : undefined;

            if (quotaExhausted) {
              console.warn(
                `[CANE AI] Primary model="${primaryModel}" failed (quota_exhausted, status=429) — not retrying exhausted quota.`
              );
              return {
                configured: true,
                provider: 'gemini',
                model: primaryModel,
                content: '',
                statusCode: 429,
                retryAfterSeconds,
                fallbackUsed: false,
                attemptedModels,
                error: mapProviderErrorToUserMessage(429, 'gemini', {
                  quotaExhausted: true,
                  retryAfterMs: attempt.retryAfterMs
                })
              };
            }

            // Allow at most 1 respectful wait ONLY if Retry-After is explicitly present and short (<= 5s)
            if (
              !rateLimitRetriedOnce &&
              attempt.retryAfterMs &&
              attempt.retryAfterMs > 0 &&
              attempt.retryAfterMs <= MAX_INLINE_WAIT_MS
            ) {
              rateLimitRetriedOnce = true;
              console.warn(
                `[CANE AI] Primary model="${primaryModel}" rate-limited (status=429). Respecting Retry-After=${attempt.retryAfterMs}ms for 1 retry.`
              );
              await sleep(attempt.retryAfterMs);
              continue;
            }

            console.warn(
              `[CANE AI] Primary model="${primaryModel}" rate-limited (status=429${
                retryAfterSeconds ? `, retryAfter=${retryAfterSeconds}s` : ''
              }) — halting retries to respect API limits.`
            );
            return {
              configured: true,
              provider: 'gemini',
              model: primaryModel,
              content: '',
              statusCode: 429,
              retryAfterSeconds,
              fallbackUsed: false,
              attemptedModels,
              error: mapProviderErrorToUserMessage(429, 'gemini', {
                retryAfterMs: attempt.retryAfterMs
              })
            };
          }

          // 3. Model unavailable (404) -> switch directly to verified fallback/accessible Flash model
          if (attempt.status === 404) {
            console.warn(
              `[CANE AI] Primary model="${primaryModel}" returned status=404. Resolving verified fallback model...`
            );
            triggerFallbackReason = '404';
            break;
          }

          // 4. Temporary high demand (503) or transient upstream failure (500/502/504/network)
          const isTemporary503 = attempt.status === 503;
          const isTransient5xx =
            attempt.status === 500 ||
            attempt.status === 502 ||
            attempt.status === 504 ||
            attempt.status === 0;

          if (isTemporary503 || isTransient5xx) {
            // If server tells us to wait longer than inline threshold, respect Retry-After via cooldown & switch immediately
            if (attempt.retryAfterMs && attempt.retryAfterMs > MAX_INLINE_WAIT_MS) {
              const cooldownMs = Math.min(attempt.retryAfterMs, MAX_COOLDOWN_MS);
              modelCooldownUntil.set(primaryModel.toLowerCase(), Date.now() + cooldownMs);
              console.warn(
                `[CANE AI] Primary model="${primaryModel}" returned status=${attempt.status} with Retry-After=${Math.ceil(
                  attempt.retryAfterMs / 1000
                )}s. Setting ${Math.ceil(cooldownMs / 1000)}s cooldown and switching to fallback.`
              );
              triggerFallbackReason = isTemporary503 ? '503' : '5xx';
              break;
            }

            const maxRetriesForStatus = isTemporary503
              ? PRIMARY_503_MAX_RETRIES
              : PRIMARY_5XX_MAX_RETRIES;

            if (attemptIdx < maxRetriesForStatus) {
              const expDelay = baseBackoffMs * Math.pow(2, attemptIdx);
              const jitter = useJitter ? Math.floor(Math.random() * Math.max(50, expDelay * 0.15)) : 0;
              const waitMs = Math.min(
                MAX_INLINE_WAIT_MS,
                Math.max(expDelay + jitter, attempt.retryAfterMs || 0)
              );
              console.warn(
                `[CANE AI] Primary model="${primaryModel}" temporarily unavailable (${errorClass}, status=${attempt.status}). Backing off ${waitMs}ms before retry ${
                  attemptIdx + 2
                }/${maxRetriesForStatus + 1}...`
              );
              await sleep(waitMs);
              continue;
            }

            console.warn(
              `[CANE AI] Primary model="${primaryModel}" still unavailable after retries (status=${attempt.status}). Switching to verified fallback model...`
            );
            triggerFallbackReason = isTemporary503 ? '503' : '5xx';
            break;
          }

          // 5. Any other unexpected 4xx -> do not switch models blindly
          console.error(
            `[CANE AI] Primary model="${primaryModel}" failed (${errorClass}, status=${attempt.status}) — fallback not applicable.`
          );
          return {
            configured: true,
            provider: 'gemini',
            model: primaryModel,
            content: '',
            statusCode: 502,
            fallbackUsed: false,
            attemptedModels,
            error: mapProviderErrorToUserMessage(attempt.status, 'gemini')
          };
        }
      }

      // === VERIFIED FALLBACK MODEL EXECUTION ===
      if (triggerFallbackReason) {
        const verifiedFallback = await resolveVerifiedFallbackModel(apiKey, [primaryModel]);

        if (verifiedFallback.authFailed) {
          console.error(
            '[CANE AI] Fallback verification failed with auth error (401/403). Skipping fallback.'
          );
          return {
            configured: true,
            provider: 'gemini',
            model: primaryModel,
            content: '',
            statusCode: 502,
            fallbackUsed: false,
            attemptedModels,
            error: mapProviderErrorToUserMessage(401, 'gemini')
          };
        }

        const fallbackModel = verifiedFallback.model;
        if (!fallbackModel) {
          console.error(
            `[CANE AI] No verified fallback Gemini model available (primary="${primaryModel}" status=${lastPrimaryStatus}). fallbackSucceeded=false`
          );
          return {
            configured: true,
            provider: 'gemini',
            model: primaryModel,
            content: '',
            statusCode: triggerFallbackReason === '404' ? 502 : 503,
            fallbackUsed: false,
            attemptedModels,
            error:
              triggerFallbackReason === '404'
                ? mapProviderErrorToUserMessage(404, 'gemini')
                : mapProviderErrorToUserMessage(503, 'gemini', { allModelsBusy: true })
          };
        }

        // Only cache as default replacement when primary permanently returned 404 (not for temporary 503 spikes)
        if (triggerFallbackReason === '404') {
          cachedVerifiedGeminiModel = fallbackModel;
        }

        let lastFallbackAttempt: RawGeminiCallResult | null = null;

        for (let fbIdx = 0; fbIdx <= FALLBACK_503_MAX_RETRIES; fbIdx++) {
          const fbAttempt = await callGeminiGenerateContent(
            apiKey,
            fallbackModel,
            systemPrompt,
            trimmedMessages,
            temperature,
            maxTokens
          );
          lastFallbackAttempt = fbAttempt;
          attemptedModels.push({
            model: fallbackModel,
            status: fbAttempt.status,
            role: 'fallback'
          });

          if (fbAttempt.ok) {
            console.info(
              `[CANE AI] Fallback attempt model="${fallbackModel}" status=${fbAttempt.status} fallbackSucceeded=true (primary="${primaryModel}" status=${lastPrimaryStatus})`
            );
            if (!fbAttempt.text) {
              return {
                configured: true,
                provider: 'gemini',
                model: fallbackModel,
                content: '',
                statusCode: 502,
                fallbackUsed: true,
                attemptedModels,
                error:
                  'CANE could not generate an answer for that phrasing. Try rephrasing your career question slightly.'
              };
            }
            return {
              configured: true,
              provider: 'gemini',
              model: fallbackModel,
              content: fbAttempt.text,
              fallbackUsed: true,
              attemptedModels
            };
          }

          const fbErrorClass = classifyGeminiError(fbAttempt.status, fbAttempt.rawError);

          // Respect auth / bad request / 429 quota limits on fallback without retrying
          if (
            fbErrorClass === 'auth_error' ||
            fbErrorClass === 'invalid_request' ||
            fbAttempt.status === 429
          ) {
            console.error(
              `[CANE AI] Fallback attempt model="${fallbackModel}" status=${fbAttempt.status} (${fbErrorClass}) fallbackSucceeded=false (primary="${primaryModel}" status=${lastPrimaryStatus})`
            );
            const quotaExhausted = fbAttempt.status === 429 && isQuotaExhaustedError(fbAttempt.rawError);
            const retryAfterSeconds = fbAttempt.retryAfterMs
              ? Math.max(1, Math.ceil(fbAttempt.retryAfterMs / 1000))
              : undefined;
            return {
              configured: true,
              provider: 'gemini',
              model: fallbackModel,
              content: '',
              statusCode: fbAttempt.status === 429 ? 429 : fbAttempt.status === 400 ? 400 : 502,
              retryAfterSeconds,
              fallbackUsed: false,
              attemptedModels,
              error: mapProviderErrorToUserMessage(fbAttempt.status, 'gemini', {
                quotaExhausted,
                retryAfterMs: fbAttempt.retryAfterMs
              })
            };
          }

          // Retry fallback once if it also hits a transient 503 with manageable Retry-After
          if (
            fbAttempt.status === 503 &&
            fbIdx < FALLBACK_503_MAX_RETRIES &&
            (!fbAttempt.retryAfterMs || fbAttempt.retryAfterMs <= MAX_INLINE_WAIT_MS)
          ) {
            const waitMs = Math.min(
              MAX_INLINE_WAIT_MS,
              Math.max(baseBackoffMs, fbAttempt.retryAfterMs || 0)
            );
            console.warn(
              `[CANE AI] Fallback model="${fallbackModel}" temporarily unavailable (status=503). Backing off ${waitMs}ms before retry...`
            );
            await sleep(waitMs);
            continue;
          }

          break;
        }

        const finalStatus = lastFallbackAttempt?.status ?? 503;
        console.error(
          `[CANE AI] Fallback attempt model="${fallbackModel}" status=${finalStatus} fallbackSucceeded=false (primary="${primaryModel}" status=${lastPrimaryStatus}; all configured Gemini models unavailable)`
        );

        const allModelsBusy =
          triggerFallbackReason !== '404' &&
          (finalStatus === 503 || finalStatus >= 500 || finalStatus === 0);

        return {
          configured: true,
          provider: 'gemini',
          model: fallbackModel,
          content: '',
          statusCode: allModelsBusy ? 503 : 502,
          fallbackUsed: false,
          attemptedModels,
          error: mapProviderErrorToUserMessage(finalStatus, 'gemini', { allModelsBusy })
        };
      }
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
      const retryAfterMs = parseRetryAfterMs(res.headers?.get?.('retry-after'));
      console.error(
        `[CANE AI] OpenAI-compatible request failed (model="${active.model}", status=${res.status})`
      );
      return {
        configured: true,
        provider: 'openai',
        model: active.model,
        content: '',
        statusCode: res.status === 429 ? 429 : res.status === 503 ? 503 : 502,
        retryAfterSeconds: retryAfterMs ? Math.max(1, Math.ceil(retryAfterMs / 1000)) : undefined,
        error: mapProviderErrorToUserMessage(res.status, 'openai', { retryAfterMs })
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
            statusCode: 502,
            error:
              'CANE could not generate a reply for that question. Please try rephrasing slightly.'
          })
    };
  } catch {
    console.error(`[CANE AI] Unexpected runtime/network error (provider=${active.provider}).`);
    return {
      configured: true,
      provider: active.provider,
      model: active.model,
      content: '',
      statusCode: 503,
      error: 'CANE is having trouble connecting right now. Please try again in a few seconds.'
    };
  }
}
