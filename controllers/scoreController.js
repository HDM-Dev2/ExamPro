const Score = require('../models/Score');
const Class = require('../models/Class');

const getScoresByClass = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const scores = await Score.find({
      classId: req.params.classId,
      adminId: tenantId
    }).sort({ unitId: 1, formativeNumber: 1 });

    res.json(scores);
  } catch (error) {
    console.error('Get scores by class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getScoresByUnit = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const scores = await Score.find({
      unitId: req.params.unitId,
      adminId: tenantId
    }).sort({ formativeNumber: 1 });

    res.json(scores);
  } catch (error) {
    console.error('Get scores by unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getScoresByStudent = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const scores = await Score.find({
      studentId: req.params.studentId,
      adminId: tenantId
    })
      .populate('classId', 'className')
      .sort({ createdAt: -1 });

    res.json(scores);
  } catch (error) {
    console.error('Get scores by student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const saveBulkScores = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId, unitId, scores } = req.body;

    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }

    if (!unitId) {
      return res.status(400).json({ message: 'Unit ID is required' });
    }

    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ message: 'No scores provided' });
    }

    const cls = await Class.findOne({
      _id: classId,
      adminId: tenantId
    });

    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const unitExists = cls.units.some((u) => u._id.toString() === unitId.toString());
    if (!unitExists) {
      return res.status(404).json({ message: 'Unit not found in class' });
    }

    const results = [];
    const errors = [];

    for (const scoreData of scores) {
      try {
        const { studentId, formativeNumber, score } = scoreData;

        const num = Number(score);

        if (isNaN(num) || num < 0 || num > 100) {
          errors.push({ studentId, formativeNumber, message: 'Score must be between 0 and 100' });
          continue;
        }

        if (![1, 2, 3, 4].includes(formativeNumber)) {
          errors.push({ studentId, message: 'Invalid formative number' });
          continue;
        }

        let existingScore = await Score.findOne({
          studentId,
          classId,
          unitId,
          formativeNumber,
          adminId: tenantId
        });

        if (existingScore) {
          if (existingScore.locked) {
            errors.push({
              studentId,
              formativeNumber,
              message: 'Score is locked and cannot be edited'
            });
            continue;
          }
          existingScore.score = num;
          await existingScore.save();
          results.push(existingScore);
        } else {
          const newScore = new Score({
            adminId: tenantId,
            studentId,
            classId,
            unitId,
            formativeNumber,
            score: num,
            locked: true,
            lockedAt: new Date(),
            lockedBy: req.userId
          });
          await newScore.save();
          results.push(newScore);
        }
      } catch (error) {
        errors.push({ scoreData, message: error.message });
      }
    }

    res.status(201).json({
      saved: results,
      errors,
      totalSaved: results.length,
      totalErrors: errors.length
    });
  } catch (error) {
    console.error('Save bulk scores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const unlockScores = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    if (!req.isOwner) {
      return res.status(403).json({ message: 'Only the account owner can unlock scores' });
    }

    const { classId, unitId } = req.body;

    if (!classId || !unitId) {
      return res.status(400).json({ message: 'Class ID and Unit ID are required' });
    }

    const result = await Score.updateMany(
      {
        classId,
        unitId,
        adminId: tenantId,
        locked: true
      },
      {
        $set: {
          locked: false,
          lockedAt: null,
          lockedBy: null
        }
      }
    );

    res.json({
      message: 'Scores unlocked',
      unlocked: result.modifiedCount
    });
  } catch (error) {
    console.error('Unlock scores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateScore = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { score } = req.body;

    const existing = await Score.findOne({
      _id: req.params.id,
      adminId: tenantId
    });

    if (!existing) {
      return res.status(404).json({ message: 'Score not found' });
    }

    if (existing.locked && !req.isOwner) {
      return res.status(403).json({ message: 'Score is locked' });
    }

    const num = Number(score);
    if (isNaN(num) || num < 0 || num > 100) {
      return res.status(400).json({ message: 'Score must be between 0 and 100' });
    }

    existing.score = num;
    await existing.save();

    res.json(existing);
  } catch (error) {
    console.error('Update score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteScore = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const score = await Score.findOne({
      _id: req.params.id,
      adminId: tenantId
    });

    if (!score) {
      return res.status(404).json({ message: 'Score not found' });
    }

    if (score.locked && !req.isOwner) {
      return res.status(403).json({ message: 'Score is locked' });
    }

    await score.deleteOne();

    res.json({ message: 'Score deleted successfully' });
  } catch (error) {
    console.error('Delete score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getScoresByClass,
  getScoresByUnit,
  getScoresByStudent,
  saveBulkScores,
  unlockScores,
  updateScore,
  deleteScore
};