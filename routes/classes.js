const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const adminAuth = require('../middleware/adminAuth');

router.get('/', adminAuth, classController.getClasses);
router.get('/:id', adminAuth, classController.getClassById);
router.post('/', adminAuth, classController.createClass);
router.put('/:id', adminAuth, classController.updateClass);
router.delete('/:id', adminAuth, classController.deleteClass);

router.post('/:id/units', adminAuth, classController.addUnit);
router.put('/:id/units/:unitId', adminAuth, classController.updateUnit);
router.delete('/:id/units/:unitId', adminAuth, classController.deleteUnit);

module.exports = router;