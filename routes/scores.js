const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const adminAuth = require('../middleware/adminAuth');
const ownerOnly = require('../middleware/ownerOnly');

router.get('/class/:classId', adminAuth, scoreController.getScoresByClass);
router.get('/unit/:unitId', adminAuth, scoreController.getScoresByUnit);
router.get('/student/:studentId', adminAuth, scoreController.getScoresByStudent);
router.post('/bulk', adminAuth, scoreController.saveBulkScores);
router.post('/unlock', adminAuth, ownerOnly, scoreController.unlockScores);
router.put('/:id', adminAuth, scoreController.updateScore);
router.delete('/:id', adminAuth, scoreController.deleteScore);

module.exports = router;