import assert from 'node:assert/strict';
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_FALLBACK_MODEL,
  getActiveAIProvider,
  normalizeGeminiModelName,
  selectBestGeminiFlashModel,
  parseRetryAfterMs,
  generateCaneCompletion,
  resetGeminiRuntimeState
} from '../src/services/caneAI.service';

async function run() {
  console.log('=== SETU CANE Gemini Reliability & Fallback Verification ===\n');

  const origFetch = globalThis.fetch;
  const origKey = process.env.GEMINI_API_KEY;
  const origModel = process.env.GEMINI_MODEL;
  const origFallback = process.env.GEMINI_FALLBACK_MODEL;
  const origProvider = process.env.CANE_AI_PROVIDER;

  const origInfo = console.info;
  const origWarn = console.warn;
  const origError = console.error;
  const capturedLogs: string[] = [];

  const captureLog = (...args: any[]) => {
    capturedLogs.push(args.map(String).join(' '));
  };

  const DUMMY_SECRET_KEY = 'AIzaSy-TEST-SECRET-KEY-NEVER-LOG-9999';
  const SENSITIVE_USER_TOKEN = 'PRIVATE_USER_PHONE_9876543210';

  try {
    console.info = captureLog;
    console.warn = captureLog;
    console.error = captureLog;

    // ------------------------------------------------------------------
    // 1. Default primary & fallback models + env overrides + normalization
    // ------------------------------------------------------------------
    assert.equal(DEFAULT_GEMINI_MODEL, 'gemini-3.8-flash');
    assert.equal(DEFAULT_GEMINI_FALLBACK_MODEL, 'gemini-3.5-flash-lite');
    assert.equal(normalizeGeminiModelName('models/gemini-3.8-flash'), 'gemini-3.8-flash');
    assert.equal(
      normalizeGeminiModelName('  models/gemini-3.5-flash-lite  '),
      'gemini-3.5-flash-lite'
    );

    process.env.CANE_AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = DUMMY_SECRET_KEY;
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_FALLBACK_MODEL;
    resetGeminiRuntimeState();

    const defaultActive = getActiveAIProvider();
    assert.equal(defaultActive.provider, 'gemini');
    assert.equal(defaultActive.model, 'gemini-3.8-flash');
    assert.equal(defaultActive.fallbackModel, 'gemini-3.5-flash-lite');

    process.env.GEMINI_MODEL = 'models/gemini-3.8-flash';
    process.env.GEMINI_FALLBACK_MODEL = 'models/gemini-3.5-flash-lite';
    const overrideActive = getActiveAIProvider();
    assert.equal(overrideActive.model, 'gemini-3.8-flash');
    assert.equal(overrideActive.fallbackModel, 'gemini-3.5-flash-lite');

    assert.equal(parseRetryAfterMs('3'), 3000);
    assert.equal(parseRetryAfterMs('invalid'), null);
    origInfo(
      '  ✓ 1. Primary (GEMINI_MODEL) & fallback (GEMINI_FALLBACK_MODEL) config + Retry-After parsing verified'
    );

    // ------------------------------------------------------------------
    // 2. Simulated 503 on primary -> exponential backoff -> ListModels verify -> fallback succeeds
    //    AND verifies full context preservation + x-goog-api-key header (never in URL)
    // ------------------------------------------------------------------
    resetGeminiRuntimeState();
    capturedLogs.length = 0;

    const backoffDelays: number[] = [];
    const requestBodies: Array<{ url: string; headers: any; body?: any }> = [];

    globalThis.fetch = (async (url: any, init?: any) => {
      const urlStr = String(url);
      // Security assertion: API key must NEVER be in URL query string
      assert.ok(!urlStr.includes(DUMMY_SECRET_KEY), 'API key must never appear in request URL');
      const headers = (init?.headers || {}) as Record<string, string>;
      assert.equal(headers['x-goog-api-key'], DUMMY_SECRET_KEY, 'Must send x-goog-api-key header');

      requestBodies.push({
        url: urlStr,
        headers,
        body: init?.body ? JSON.parse(init.body) : undefined
      });

      if (urlStr.includes('/models/gemini-3.8-flash:generateContent')) {
        return new Response(
          JSON.stringify({
            error: {
              code: 503,
              status: 'UNAVAILABLE',
              message:
                'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.'
            }
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (urlStr.endsWith('/v1beta/models')) {
        return new Response(
          JSON.stringify({
            models: [
              {
                name: 'models/gemini-3.8-flash',
                supportedGenerationMethods: ['generateContent']
              },
              {
                name: 'models/gemini-3.5-flash-lite',
                supportedGenerationMethods: ['generateContent']
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (urlStr.includes('/models/gemini-3.5-flash-lite:generateContent')) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: 'Based on your B.Tech profile, Business Analyst and Product Operations are great non-coding paths!'
                    }
                  ]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response('Not found', { status: 404 });
    }) as any;

    const systemPromptWithProfile = `You are CANE.\nUSER PROFILE: Ananya, B.Tech ECE, Skills: Excel, SQL (${SENSITIVE_USER_TOKEN})`;
    const multiTurnHistory = [
      { role: 'user' as const, content: 'Hi CANE, I am in final year B.Tech.' },
      { role: 'assistant' as const, content: 'Welcome! What kind of roles interest you?' },
      {
        role: 'user' as const,
        content: 'I do not enjoy coding. What careers suit my profile?'
      }
    ];

    const fallbackSuccess = await generateCaneCompletion(systemPromptWithProfile, multiTurnHistory, {
      sleepFn: async (ms) => {
        backoffDelays.push(ms);
      },
      baseBackoffMs: 500
    });

    assert.equal(fallbackSuccess.configured, true);
    assert.equal(fallbackSuccess.provider, 'gemini');
    assert.equal(fallbackSuccess.model, 'gemini-3.5-flash-lite');
    assert.equal(fallbackSuccess.fallbackUsed, true);
    assert.equal(fallbackSuccess.error, undefined);
    assert.ok(fallbackSuccess.content.includes('Business Analyst'));

    // Verify exponential backoff: 500ms, then 1000ms (2 retries = 3 primary tries)
    assert.deepEqual(backoffDelays, [500, 1000]);

    // Verify exact context preservation between primary and fallback payloads
    const primaryReq = requestBodies.find((r) => r.url.includes('gemini-3.8-flash:generateContent'));
    const fallbackReq = requestBodies.find((r) =>
      r.url.includes('gemini-3.5-flash-lite:generateContent')
    );
    assert.ok(primaryReq && fallbackReq);
    assert.deepEqual(fallbackReq.body.systemInstruction, primaryReq.body.systemInstruction);
    assert.deepEqual(fallbackReq.body.contents, primaryReq.body.contents);

    // Verify logs record attempted models, status, fallbackSucceeded=true, and NO secrets/PII
    const logBlob = capturedLogs.join('\n');
    assert.ok(logBlob.includes('model="gemini-3.8-flash" status=503'));
    assert.ok(logBlob.includes('model="gemini-3.5-flash-lite" status=200 fallbackSucceeded=true'));
    assert.ok(!logBlob.includes(DUMMY_SECRET_KEY), 'Logs must never expose API key');
    assert.ok(!logBlob.includes(SENSITIVE_USER_TOKEN), 'Logs must never expose user profile data');
    origInfo(
      '  ✓ 2. Simulated 503 triggers exponential backoff (500ms, 1000ms) -> ListModels verification -> fallback preserves full context & logs safely'
    );

    // ------------------------------------------------------------------
    // 3. Fallback candidate (gemini-3.5-flash-lite) NOT accessible -> picks next verified Flash model
    // ------------------------------------------------------------------
    resetGeminiRuntimeState();
    globalThis.fetch = (async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/models/gemini-3.8-flash:generateContent')) {
        return new Response('{"error":{"code":503,"message":"Overloaded"}}', { status: 503 });
      }
      if (urlStr.endsWith('/v1beta/models')) {
        return new Response(
          JSON.stringify({
            models: [
              {
                name: 'models/gemini-3.8-flash',
                supportedGenerationMethods: ['generateContent']
              },
              {
                name: 'models/gemini-3.5-flash',
                supportedGenerationMethods: ['generateContent']
              }
            ]
          }),
          { status: 200 }
        );
      }
      if (urlStr.includes('/models/gemini-3.5-flash:generateContent')) {
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Verified alternate Flash model reply!' }] } }]
          }),
          { status: 200 }
        );
      }
      return new Response('Not found', { status: 404 });
    }) as any;

    const altFallback = await generateCaneCompletion(
      'You are CANE.',
      [{ role: 'user', content: 'Suggest government skill schemes.' }],
      { sleepFn: async () => {}, baseBackoffMs: 100 }
    );
    assert.equal(altFallback.model, 'gemini-3.5-flash');
    assert.equal(altFallback.fallbackUsed, true);
    assert.equal(altFallback.error, undefined);
    origInfo(
      '  ✓ 3. When gemini-3.5-flash-lite is not accessible for key, verified alternate Flash model is chosen via ListModels'
    );

    // ------------------------------------------------------------------
    // 4. Both primary AND fallback return 503 -> friendly unavailable message
    // ------------------------------------------------------------------
    resetGeminiRuntimeState();
    capturedLogs.length = 0;
    globalThis.fetch = (async (url: any) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/v1beta/models')) {
        return new Response(
          JSON.stringify({
            models: [
              { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
              {
                name: 'models/gemini-3.5-flash-lite',
                supportedGenerationMethods: ['generateContent']
              }
            ]
          }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          error: { code: 503, message: 'Raw internal Google stacktrace UNAVAILABLE' }
        }),
        { status: 503 }
      );
    }) as any;

    const allBusy = await generateCaneCompletion(
      'You are CANE.',
      [{ role: 'user', content: 'Review my resume.' }],
      { sleepFn: async () => {}, baseBackoffMs: 100 }
    );
    assert.equal(allBusy.statusCode, 503);
    assert.equal(allBusy.fallbackUsed, false);
    assert.ok(allBusy.error && allBusy.error.toLowerCase().includes('high demand'));
    assert.ok(!allBusy.error.includes('stacktrace'));
    assert.ok(capturedLogs.join('\n').includes('fallbackSucceeded=false'));
    origInfo('  ✓ 4. All models 503 returns friendly high-demand message without leaking raw errors');

    // ------------------------------------------------------------------
    // 5. Long Retry-After on 503 skips primary retries, sets cooldown, and switches to fallback
    // ------------------------------------------------------------------
    resetGeminiRuntimeState();
    const longRetryDelays: number[] = [];
    let primaryHits = 0;

    globalThis.fetch = (async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/models/gemini-3.8-flash:generateContent')) {
        primaryHits++;
        return new Response('{"error":{"code":503}}', {
          status: 503,
          headers: { 'Retry-After': '30' }
        });
      }
      if (urlStr.endsWith('/v1beta/models')) {
        return new Response(
          JSON.stringify({
            models: [
              { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
              {
                name: 'models/gemini-3.5-flash-lite',
                supportedGenerationMethods: ['generateContent']
              }
            ]
          }),
          { status: 200 }
        );
      }
      if (urlStr.includes('/models/gemini-3.5-flash-lite:generateContent')) {
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Immediate fallback during cooldown!' }] } }]
          }),
          { status: 200 }
        );
      }
      return new Response('Not found', { status: 404 });
    }) as any;

    const cooldownRes1 = await generateCaneCompletion(
      'You are CANE.',
      [{ role: 'user', content: 'Mock interview please.' }],
      { sleepFn: async (ms) => { longRetryDelays.push(ms); } }
    );
    assert.equal(primaryHits, 1, 'Should not retry primary inline when Retry-After > 5s');
    assert.equal(longRetryDelays.length, 0);
    assert.equal(cooldownRes1.model, 'gemini-3.5-flash-lite');
    assert.equal(cooldownRes1.fallbackUsed, true);

    // Subsequent call during cooldown skips hitting primary altogether
    const cooldownRes2 = await generateCaneCompletion(
      'You are CANE.',
      [{ role: 'user', content: 'Next question.' }],
      { sleepFn: async () => {} }
    );
    assert.equal(primaryHits, 1, 'Primary should stay skipped during active Retry-After cooldown');
    assert.equal(cooldownRes2.model, 'gemini-3.5-flash-lite');
    origInfo(
      '  ✓ 5. Long Retry-After on 503 respects cooldown and routes directly to verified fallback'
    );

    // ------------------------------------------------------------------
    // 6. 429 Exhausted Quota -> NEVER retries repeatedly, NEVER switches models
    // ------------------------------------------------------------------
    resetGeminiRuntimeState();
    let quotaHits = 0;
    globalThis.fetch = (async () => {
      quotaHits++;
      return new Response(
        JSON.stringify({
          error: {
            code: 429,
            status: 'RESOURCE_EXHAUSTED',
            message: 'You exceeded your current quota, please check your plan and billing details.'
          }
        }),
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }) as any;

    const quotaRes = await generateCaneCompletion(
      'You are CANE.',
      [{ role: 'user', content: 'Hello' }],
      { sleepFn: async () => {} }
    );
    assert.equal(quotaHits, 1, 'Must NEVER repeatedly retry exhausted quota');
    assert.equal(quotaRes.statusCode, 429);
    assert.equal(quotaRes.retryAfterSeconds, 60);
    assert.ok(quotaRes.error && !quotaRes.error.includes('RESOURCE_EXHAUSTED'));
    origInfo('  ✓ 6. 429 exhausted quota halts immediately (0 retries, no fallback loop)');

    // ------------------------------------------------------------------
    // 7. 429 transient RPM with short Retry-After -> respects Retry-After once & succeeds
    // ------------------------------------------------------------------
    resetGeminiRuntimeState();
    let rpmHits = 0;
    const rpmWaits: number[] = [];
    globalThis.fetch = (async () => {
      rpmHits++;
      if (rpmHits === 1) {
        return new Response('{"error":{"code":429,"message":"Too many requests"}}', {
          status: 429,
          headers: { 'Retry-After': '2' }
        });
      }
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Recovered after respecting Retry-After!' }] } }]
        }),
        { status: 200 }
      );
    }) as any;

    const rpmRes = await generateCaneCompletion(
      'You are CANE.',
      [{ role: 'user', content: 'Hi' }],
      { sleepFn: async (ms) => { rpmWaits.push(ms); } }
    );
    assert.equal(rpmHits, 2);
    assert.deepEqual(rpmWaits, [2000]);
    assert.equal(rpmRes.error, undefined);
    origInfo('  ✓ 7. 429 transient rate-limit respects short Retry-After header (2000ms) cleanly');

    // ------------------------------------------------------------------
    // 8. Invalid API Key (401/403) & Bad Request (400) -> NEVER retry, NEVER switch models
    // ------------------------------------------------------------------
    for (const badStatus of [401, 403, 400]) {
      resetGeminiRuntimeState();
      let calls = 0;
      globalThis.fetch = (async () => {
        calls++;
        return new Response(
          JSON.stringify({
            error: {
              code: badStatus,
              message: badStatus === 400 ? 'Invalid argument' : 'API key not valid'
            }
          }),
          { status: badStatus }
        );
      }) as any;

      const errRes = await generateCaneCompletion(
        'You are CANE.',
        [{ role: 'user', content: 'Help me' }],
        { sleepFn: async () => {} }
      );
      assert.equal(calls, 1, `HTTP ${badStatus} must NOT retry or call ListModels/fallback`);
      assert.equal(errRes.fallbackUsed, false);
      assert.ok(errRes.error && errRes.error.length > 0);
    }
    origInfo('  ✓ 8. Unrelated errors (401, 403, 400) never retry or switch models');

    // ------------------------------------------------------------------
    // 9. 404 model unavailable still auto-discovers verified model via ListModels
    // ------------------------------------------------------------------
    resetGeminiRuntimeState();
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';
    globalThis.fetch = (async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/models/gemini-2.5-flash:generateContent')) {
        return new Response('{"error":{"code":404,"message":"Not found"}}', { status: 404 });
      }
      if (urlStr.endsWith('/v1beta/models')) {
        return new Response(
          JSON.stringify({
            models: [
              { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
              {
                name: 'models/gemini-3.5-flash-lite',
                supportedGenerationMethods: ['generateContent']
              }
            ]
          }),
          { status: 200 }
        );
      }
      if (urlStr.includes('/models/gemini-3.5-flash-lite:generateContent')) {
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Recovered from 404 via verified fallback!' }] } }]
          }),
          { status: 200 }
        );
      }
      return new Response('Not found', { status: 404 });
    }) as any;

    const res404 = await generateCaneCompletion('You are CANE.', [{ role: 'user', content: 'Test' }]);
    assert.equal(res404.model, 'gemini-3.5-flash-lite');
    assert.equal(res404.fallbackUsed, true);
    assert.equal(res404.error, undefined);

    // Ranking sanity check
    assert.equal(
      selectBestGeminiFlashModel([
        { name: 'models/embedding-001', id: 'embedding-001', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-3.5-flash-lite', id: 'gemini-3.5-flash-lite', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-3.8-flash', id: 'gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }
      ]),
      'gemini-3.8-flash'
    );
    origInfo('  ✓ 9. HTTP 404 recovery & Flash model ranking remain intact');

    origInfo('\n✅ ALL 9 CANE GEMINI RELIABILITY & FALLBACK TESTS PASSED!');
  } finally {
    console.info = origInfo;
    console.warn = origWarn;
    console.error = origError;
    globalThis.fetch = origFetch;
    if (origKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = origKey;
    if (origModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = origModel;
    if (origFallback === undefined) delete process.env.GEMINI_FALLBACK_MODEL;
    else process.env.GEMINI_FALLBACK_MODEL = origFallback;
    if (origProvider === undefined) delete process.env.CANE_AI_PROVIDER;
    else process.env.CANE_AI_PROVIDER = origProvider;
    resetGeminiRuntimeState();
  }
}

run().catch((err) => {
  console.error('\n❌ CANE Gemini verification failed:', err);
  process.exit(1);
});
