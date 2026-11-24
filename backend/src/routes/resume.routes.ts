import { Router, Request, Response, NextFunction } from 'express';
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
  getUploadedResumeStatus,
  confirmUploadedResumeData,
  downloadUploadedResume,
  toggleUploadedResumeSharing,
  deleteUploadedResume,
  improveProjectDescription,
  improveResumeWithCane
} from '../controllers/resume.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { sendError } from '../utils/response';

const ALLOWED_RESUME_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Some browsers/OS combinations report generic octet-stream for .docx; extension + magic bytes are strictly checked
  'application/octet-stream'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    const lower = (file.originalname || '').toLowerCase();
    const validExt = lower.endsWith('.pdf') || lower.endsWith('.docx');
    const validMime = ALLOWED_RESUME_MIMES.has(file.mimetype);

    if (validExt && validMime) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  }
});

/**
 * Wraps Multer upload middleware so size limits, invalid types, and multipart
 * errors always produce clean structured JSON responses (never raw stack traces).
 */
const handleResumeUploadMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const contentType = (req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('multipart/form-data')) {
    sendError(
      res,
      'Invalid upload request format. Please upload your PDF or DOCX file using multipart/form-data.',
      400
    );
    return;
  }

  upload.single('file')(req, res, (err: any) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        sendError(res, 'Resume file exceeds the 5 MB maximum size limit.', 400);
        return;
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        sendError(res, 'Unexpected file field. Please upload a single PDF or DOCX resume.', 400);
        return;
      }
      sendError(res, 'Could not process the uploaded file. Please try again.', 400);
      return;
    }

    if (err?.message === 'INVALID_FILE_TYPE') {
      sendError(res, 'Only PDF and DOCX resume files are supported.', 400);
      return;
    }

    sendError(res, 'Failed to read the uploaded file. Please try again with a valid PDF or DOCX.', 400);
  });
};

const router = Router();

router.use(authenticate);

router.get('/', getResumes);
router.get('/prefill', getResumePrefill);
router.post('/', createResume);
router.post('/improve-project', requireRole('seeker'), improveProjectDescription);
router.post('/improve-resume', requireRole('seeker'), improveResumeWithCane);

// Uploaded PDF/DOCX management (private MongoDB Atlas storage — never relies on ephemeral disk)
router.post('/upload', handleResumeUploadMiddleware, uploadAndParseResume);
router.get('/upload/:id/status', getUploadedResumeStatus);
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
