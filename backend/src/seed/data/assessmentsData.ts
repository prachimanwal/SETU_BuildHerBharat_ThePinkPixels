import { TECHNICAL_ASSESSMENTS, SeedAssessment } from './assessmentsTechnical';
import { NON_TECHNICAL_ASSESSMENTS } from './assessmentsNonTechnical';

export type { SeedAssessment };

export const ASSESSMENTS_CATALOG: SeedAssessment[] = [
  ...TECHNICAL_ASSESSMENTS,
  ...NON_TECHNICAL_ASSESSMENTS
];
