const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const adminAuth = require('../middleware/adminAuth');

router.get('/', adminAuth, courseController.getCourses);
router.get('/:id', adminAuth, courseController.getCourseById);
router.post('/', adminAuth, courseController.createCourse);
router.put('/:id', adminAuth, courseController.updateCourse);
router.delete('/:id', adminAuth, courseController.deleteCourse);

module.exports = router;