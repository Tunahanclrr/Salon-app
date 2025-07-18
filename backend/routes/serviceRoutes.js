const express = require('express');
const router = express.Router();
const { createService, getServices, deleteService, editService } = require('../controllers/serviceControllers');

router.post('/', createService);
router.get('/', getServices);
router.delete('/:id', deleteService);
router.put('/:id', editService);

module.exports = router;