const express = require('express');
const router = express.Router();
const platformSettingsController = require('../controllers/platformSettingsController');
const adminAuth = require('../middleware/adminAuth');

router.get('/public', platformSettingsController.getPublicSettings);
router.get('/', adminAuth, platformSettingsController.getSettings);
router.put('/', adminAuth, platformSettingsController.updateSettings);

module.exports = router;