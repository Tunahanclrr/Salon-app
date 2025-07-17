const express = require('express');
const router = express.Router();
const { createService, getServices, deleteService } = require('../controllers/serviceControllers');

router.post('/', createService);
router.get('/', getServices);
router.delete('/:id', deleteService);

module.exports = router;