const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const adminAuth = require('../middleware/adminAuth');

router.get('/course/:courseId', adminAuth, scoreController.getScoresByCourse);
router.get('/unit/:unitId', adminAuth, scoreController.getScoresByUnit);
router.get('/student/:studentId', adminAuth, scoreController.getScoresByStudent);
router.post('/', adminAuth, scoreController.createScore);
router.put('/:id', adminAuth, scoreController.updateScore);
router.delete('/:id', adminAuth, scoreController.deleteScore);

module.exports = router;