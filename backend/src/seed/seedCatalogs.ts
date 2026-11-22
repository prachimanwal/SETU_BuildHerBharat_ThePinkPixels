import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { Assessment } from '../models/Assessment';
import { LearningResource } from '../models/LearningResource';
import { GovernmentScheme } from '../models/GovernmentScheme';
import { User } from '../models/User';
import { Employer } from '../models/Employer';
import { ASSESSMENTS_CATALOG } from './data/assessmentsData';
import { LEARNING_CATALOG } from './data/learningData';
import { GOVERNMENT_SCHEMES_CATALOG } from './data/schemesData';

interface SeedStats {
  collection: string;
  inserted: number;
  updated: number;
  skipped: number;
  totalInDb: number;
}

const shouldUpdateExisting = process.argv.includes('--update');

async function seedCollection<T extends { slug: string; title: string }>(
  model: mongoose.Model<any>,
  collectionName: string,
  items: T[]
): Promise<SeedStats> {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    const existing = await model.findOne({
      $or: [{ slug: item.slug }, { title: item.title }]
    });

    if (!existing) {
      await model.create(item);
      inserted++;
    } else if (shouldUpdateExisting) {
      await model.updateOne({ _id: existing._id }, { $set: item });
      updated++;
    } else {
      // Backfill slug if missing on legacy record, otherwise skip
      if (!existing.slug && item.slug) {
        await model.updateOne({ _id: existing._id }, { $set: { slug: item.slug } });
        updated++;
      } else {
        skipped++;
      }
    }
  }

  const totalInDb = await model.countDocuments();
  return { collection: collectionName, inserted, updated, skipped, totalInDb };
}

export async function runSafeCatalogSeed(): Promise<void> {
  console.log('================================================================');
  console.log('SETU Safe, Non-Destructive Idempotent Database Catalog Seeder');
  console.log(`Mode: ${shouldUpdateExisting ? 'Insert missing + Update existing (--update)' : 'Insert missing only (skip existing)'}`);
  console.log('================================================================\n');

  await connectDB();

  // Validate active database connectivity via ping
  if (!mongoose.connection.db) {
    throw new Error('MongoDB connection is not initialized.');
  }
  await mongoose.connection.db.admin().ping();
  console.log(`[Verify] MongoDB ping succeeded on database: ${mongoose.connection.name}`);

  const usersBefore = await User.countDocuments();
  const employersBefore = await Employer.countDocuments();
  console.log(`[Guard] Existing protected counts BEFORE seed -> users: ${usersBefore}, employers: ${employersBefore}\n`);

  const stats: SeedStats[] = [];
  stats.push(await seedCollection(Assessment, 'assessments', ASSESSMENTS_CATALOG));
  stats.push(await seedCollection(LearningResource, 'learningresources', LEARNING_CATALOG));
  stats.push(await seedCollection(GovernmentScheme, 'governmentschemes', GOVERNMENT_SCHEMES_CATALOG));

  const usersAfter = await User.countDocuments();
  const employersAfter = await Employer.countDocuments();

  console.log('--- Seed Summary ---');
  for (const s of stats) {
    console.log(
      `  • ${s.collection.padEnd(20)} | inserted: ${String(s.inserted).padStart(3)} | updated: ${String(s.updated).padStart(3)} | skipped: ${String(s.skipped).padStart(3)} | total in DB: ${s.totalInDb}`
    );
  }
  console.log(`\n[Guard] Protected counts AFTER seed  -> users: ${usersAfter}, employers: ${employersAfter}`);
  if (usersBefore !== usersAfter || employersBefore !== employersAfter) {
    throw new Error('SAFETY CHECK FAILED: Protected user/employer counts changed unexpectedly!');
  }
  console.log('[Success] Catalog seeding completed safely without touching users or employers.');
}

if (require.main === module) {
  runSafeCatalogSeed()
    .then(async () => {
      await mongoose.connection.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('\n[Seed Error]', err?.message || err);
      try {
        await mongoose.connection.close();
      } catch {}
      process.exit(1);
    });
}
