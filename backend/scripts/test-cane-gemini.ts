import assert from 'node:assert/strict';
import {
  DEFAULT_GEMINI_MODEL,
  getActiveAIProvider,
  normalizeGeminiModelName,
  selectBestGeminiFlashModel,
  generateCaneCompletion,
  resetCachedGeminiModel
} from '../src/services/caneAI.service';

async function run() {
  console.log('=== SETU CANE Gemini Integration Verification ===\n');

  const origFetch = globalThis.fetch;
  const origKey = process.env.GEMINI_API_KEY;
  const origModel = process.env.GEMINI_MODEL;

  try {
    // 1. Default model updated away from deprecated gemini-2.5-flash
    assert.equal(DEFAULT_GEMINI_MODEL, 'gemini-3.8-flash');
    assert.equal(normalizeGeminiModelName('models/gemini-3.8-flash'), 'gemini-3.8-flash');
    assert.equal(normalizeGeminiModelName('  gemini-3.8-flash  '), 'gemini-3.8-flash');

    process.env.GEMINI_API_KEY = 'test-dummy-key-never-logged';
    delete process.env.GEMINI_MODEL;
    resetCachedGeminiModel();
    assert.equal(getActiveAIProvider().model, 'gemini-3.8-flash');

    // 2. GEMINI_MODEL env var controls the selected model
    process.env.GEMINI_MODEL = 'models/gemini-3.5-flash-lite';
    assert.equal(getActiveAIProvider().model, 'gemini-3.5-flash-lite');
    console.log('  ✓ 1. Default model is gemini-3.8-flash and GEMINI_MODEL env override works cleanly');

    // 3. 404 automatic ListModels discovery & retry with verified Flash model
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';
    resetCachedGeminiModel();

    const calledUrls: string[] = [];
    globalThis.fetch = (async (url: any) => {
      const urlStr = String(url);
      calledUrls.push(urlStr);

      if (urlStr.includes('/models/gemini-2.5-flash:generateContent')) {
        return new Response(
          JSON.stringify({
            error: {
              code: 404,
              message: 'models/gemini-2.5-flash is unavailable to new users.'
            }
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (urlStr.includes('/v1beta/models?key=')) {
        return new Response(
          JSON.stringify({
            models: [
              {
                name: 'models/gemini-2.5-flash',
                supportedGenerationMethods: ['generateContent']
              },
              {
                name: 'models/gemini-3.8-flash',
                supportedGenerationMethods: ['generateContent']
              },
              {
                name: 'models/text-embedding-004',
                supportedGenerationMethods: ['embedContent']
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (urlStr.includes('/models/gemini-3.8-flash:generateContent')) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: 'Start by tailoring your SETU resume to the role and practicing two STAR stories!'
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

    const retryResult = await generateCaneCompletion('You are CANE.', [
      { role: 'user', content: 'How should I prepare for interviews?' }
    ]);

    assert.equal(retryResult.configured, true);
    assert.equal(retryResult.provider, 'gemini');
    assert.equal(retryResult.model, 'gemini-3.8-flash');
    assert.equal(retryResult.error, undefined);
    assert.ok(retryResult.content.includes('STAR stories'));
    assert.equal(calledUrls.length, 3, 'Should try initial -> ListModels -> retry verified model');
    console.log('  ✓ 2. HTTP 404 triggers official ListModels verification & retries with gemini-3.8-flash');

    // 4. User-friendly error translation (no raw API JSON leaked)
    globalThis.fetch = (async () =>
      new Response('{"error":{"code":429,"message":"RESOURCE_EXHAUSTED raw internal trace"}}', {
        status: 429
      })) as any;

    const rateErr = await generateCaneCompletion('You are CANE.', [
      { role: 'user', content: 'Hello CANE' }
    ]);
    assert.ok(rateErr.error && !rateErr.error.includes('RESOURCE_EXHAUSTED'));
    assert.ok(rateErr.error.toLowerCase().includes('too many requests'));

    // 5. Model selector skips non-generateContent / embedding models
    const best = selectBestGeminiFlashModel([
      { name: 'models/embedding-001', id: 'embedding-001', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.5-flash-lite', id: 'gemini-3.5-flash-lite', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.8-flash', id: 'gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }
    ]);
    assert.equal(best, 'gemini-3.8-flash');
    console.log('  ✓ 3. User-friendly error messages & safe Flash model ranking verified');

    console.log('\n✅ ALL CANE GEMINI INTEGRATION TESTS PASSED!');
  } finally {
    globalThis.fetch = origFetch;
    if (origKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = origKey;
    if (origModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = origModel;
    resetCachedGeminiModel();
  }
}

run().catch((err) => {
  console.error('\n❌ CANE Gemini test failed:', err);
  process.exit(1);
});
