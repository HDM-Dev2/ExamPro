const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const platformSettingsRoutes = require('./platformSettings');
const settingsRoutes = require('./settings');
const classRoutes = require('./classes');
const studentRoutes = require('./students');
const courseRoutes = require('./courses');
const scoreRoutes = require('./scores');
const reportRoutes = require('./reports');

router.use('/auth', authRoutes);
router.use('/platform-settings', platformSettingsRoutes);
router.use('/settings', settingsRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/courses', courseRoutes);
router.use('/scores', scoreRoutes);
router.use('/reports', reportRoutes);

module.exports = router;