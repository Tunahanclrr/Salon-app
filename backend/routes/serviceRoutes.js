const express = require('express');
const router = express.Router();
const { createService, getServices, deleteService, editService } = require('../controllers/serviceControllers');
const { authenticateToken, requirePermission } = require('../middleware/auth');

router.get('/', authenticateToken, getServices);
router.post('/', authenticateToken, requirePermission('canEditServices'), createService);
router.put('/:id', authenticateToken, requirePermission('canEditServices'), editService);
router.delete('/:id', authenticateToken, requirePermission('canEditServices'), deleteService);

module.exports = router;