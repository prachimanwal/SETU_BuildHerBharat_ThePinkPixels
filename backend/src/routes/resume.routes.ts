import { Router } from 'express';
import multer from 'multer';
import {
  getResumes,
  getResumePrefill,
  createResume,
  updateResume,
  deleteResume,
  downloadResumePdf,
  downloadResumeDocx,
  uploadAndParseResume,
  confirmUploadedResumeData,
  downloadUploadedResume,
  toggleUploadedResumeSharing,
  deleteUploadedResume,
  improveProjectDescription,
  improveResumeWithCane
} from '../controllers/resume.controller';
import { authenticate } from '../middleware/auth.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});

const router = Router();

router.use(authenticate);

router.get('/', getResumes);
router.get('/prefill', getResumePrefill);
router.post('/', createResume);
router.post('/improve-project', improveProjectDescription);
router.post('/improve-resume', improveResumeWithCane);

// Uploaded PDF/DOCX management
router.post('/upload', upload.single('file'), uploadAndParseResume);
router.post('/upload/:id/confirm', confirmUploadedResumeData);
router.get('/upload/:id/download', downloadUploadedResume);
router.patch('/upload/:id/sharing', toggleUploadedResumeSharing);
router.delete('/upload/:id', deleteUploadedResume);

// Structured Resume CRUD & Export
router.get('/:id/download/pdf', downloadResumePdf);
router.get('/:id/download/docx', downloadResumeDocx);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);

export default router;
