import { Router } from 'express';
import { analyzeDocument, upload } from '../controllers/document.controller';
import { exportTasksToExcel } from '../controllers/export.controller';

const router = Router();

// Upload and analyze document
router.post('/analyze', upload.single('document'), analyzeDocument);

// Export tasks to Excel
router.post('/export', exportTasksToExcel);

export const documentRoutes = router; 