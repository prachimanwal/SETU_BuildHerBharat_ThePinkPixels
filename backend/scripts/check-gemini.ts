import '../src/config/env';
import {
  getActiveAIProvider,
  listAccessibleGeminiModels,
  selectBestGeminiFlashModel,
  generateCaneCompletion
} from '../src/services/caneAI.service';

async function main() {
  console.log('=== SETU CANE Gemini API Diagnostic & Live Verification ===\n');

  const active = getActiveAIProvider();
  console.log(`Configured provider       : ${active.provider}`);
  console.log(`Configured primary model  : ${active.model || '(none)'}`);
  console.log(`Configured fallback model : ${active.fallbackModel || '(none)'}`);

  if (!process.env.GEMINI_API_KEY?.trim()) {
    console.error(
      '\nGEMINI_API_KEY is not set in this environment. Set GEMINI_API_KEY (and optional GEMINI_MODEL / GEMINI_FALLBACK_MODEL) before running this live check.'
    );
    process.exit(1);
  }

  console.log('\n1. Querying official Gemini ListModels API for accessible models...');
  const models = await listAccessibleGeminiModels();
  const flashModels = models.filter((m) => /flash/i.test(m.id));
  console.log(
    `   Found ${models.length} generateContent-capable models (${flashModels.length} Flash variants):`
  );
  flashModels.slice(0, 15).forEach((m) => console.log(`   • ${m.id}`));

  const primaryAccessible = models.some(
    (m) => m.id.toLowerCase() === active.model.toLowerCase()
  );
  const fallbackAccessible = active.fallbackModel
    ? models.some((m) => m.id.toLowerCase() === active.fallbackModel!.toLowerCase())
    : false;

  console.log(
    `\n   Primary model (${active.model}) accessible  : ${primaryAccessible ? 'YES' : 'NO'}`
  );
  console.log(
    `   Fallback model (${active.fallbackModel || 'n/a'}) accessible : ${
      fallbackAccessible ? 'YES' : 'NO'
    }`
  );

  const recommended = selectBestGeminiFlashModel(models);
  console.log(`   Recommended accessible Flash model : ${recommended || '(none detected)'}`);

  console.log('\n2. Sending real test prompt to CANE...');
  const reply = await generateCaneCompletion(
    'You are CANE, SETU AI Career Companion. Reply in 1 friendly sentence.',
    [{ role: 'user', content: 'Hi CANE! Give me one quick tip for preparing for my first interview.' }],
    { maxTokens: 120 }
  );

  if (reply.error || !reply.content) {
    console.error('\n❌ Live Gemini test failed:', reply.error);
    process.exit(1);
  }

  console.log(
    `\n✅ Live CANE Gemini response succeeded (model: ${reply.model}, fallbackUsed: ${Boolean(
      reply.fallbackUsed
    )}):`
  );
  console.log(`   "${reply.content}"\n`);
}

main().catch((err) => {
  console.error('❌ Diagnostic script failed:', err?.message || err);
  process.exit(1);
});
