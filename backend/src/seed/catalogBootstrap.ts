import { Assessment } from '../models/Assessment';
import { LearningResource } from '../models/LearningResource';
import { GovernmentScheme } from '../models/GovernmentScheme';
import { ASSESSMENTS_CATALOG } from './data/assessmentsData';
import { LEARNING_CATALOG } from './data/learningData';
import { GOVERNMENT_SCHEMES_CATALOG } from './data/schemesData';

let bootstrapped = false;

/**
 * Safe, non-destructive, idempotent catalog bootstrapper.
 * Populates missing verified Assessments, Learning Resources, and Government Schemes
 * on startup without deleting or modifying any User, Opportunity, Application,
 * Portfolio, AssessmentResult, or LearningProgress records.
 */
export async function ensurePlatformCatalogs(): Promise<void> {
  if (bootstrapped) return;

  try {
    // 1. Upsert Assessments by slug
    if (ASSESSMENTS_CATALOG.length > 0) {
      await Assessment.bulkWrite(
        ASSESSMENTS_CATALOG.map((item) => ({
          updateOne: {
            filter: { $or: [{ slug: item.slug }, { title: item.title }] },
            update: { $set: item },
            upsert: true
          }
        })),
        { ordered: false }
      );
    }

    // 2. Upsert Learning Resources by slug
    if (LEARNING_CATALOG.length > 0) {
      await LearningResource.bulkWrite(
        LEARNING_CATALOG.map((item) => ({
          updateOne: {
            filter: { $or: [{ slug: item.slug }, { title: item.title }] },
            update: { $set: item },
            upsert: true
          }
        })),
        { ordered: false }
      );
    }

    // 3. Upsert Verified Government Schemes by slug
    if (GOVERNMENT_SCHEMES_CATALOG.length > 0) {
      await GovernmentScheme.bulkWrite(
        GOVERNMENT_SCHEMES_CATALOG.map((item) => ({
          updateOne: {
            filter: { $or: [{ slug: item.slug }, { title: item.title }] },
            update: { $set: item },
            upsert: true
          }
        })),
        { ordered: false }
      );
    }

    bootstrapped = true;
    console.log(
      `[Catalog] Verified catalogs ready: ${ASSESSMENTS_CATALOG.length} assessments, ${LEARNING_CATALOG.length} learning resources, ${GOVERNMENT_SCHEMES_CATALOG.length} government schemes`
    );
  } catch (error: any) {
    console.error(
      `[Catalog] Non-fatal catalog sync warning: ${error?.message || 'unknown error'}`
    );
  }
}
