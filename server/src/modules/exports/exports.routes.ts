import { Router } from 'express';
import { ExportsController } from './exports.controller';
import { optionalAuthenticate } from '../../middleware/auth';

const router = Router();

// Download Tally-compatible CSV of approved orders
router.get('/tally.csv', optionalAuthenticate, ExportsController.downloadTallyCsv);

// Export batches history
router.get('/history', optionalAuthenticate, ExportsController.getExportHistory);

export default router;
