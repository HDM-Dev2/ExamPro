const Score = require('../models/Score');
const Course = require('../models/Course');

const getScoresByCourse = async (req, res) => {
  try {
    const scores = await Score.find({ 
      courseId: req.params.courseId, 
      adminId: req.userId 
    })
      .populate('studentId', 'fullName admissionNumber')
      .sort({ assessmentType: 1 });
    
    res.json(scores);
  } catch (error) {
    console.error('Get scores by course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getScoresByUnit = async (req, res) => {
  try {
    const scores = await Score.find({ 
      unitId: req.params.unitId, 
      adminId: req.userId 
    })
      .populate('studentId', 'fullName admissionNumber')
      .sort({ assessmentType: 1 });
    
    res.json(scores);
  } catch (error) {
    console.error('Get scores by unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getScoresByStudent = async (req, res) => {
  try {
    const scores = await Score.find({ 
      studentId: req.params.studentId, 
      adminId: req.userId 
    })
      .populate('courseId', 'courseCode courseName')
      .sort({ createdAt: -1 });
    
    res.json(scores);
  } catch (error) {
    console.error('Get scores by student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createScore = async (req, res) => {
  try {
    const { studentId, courseId, unitId, assessmentType, score } = req.body;
    
    const course = await Course.findOne({ 
      _id: courseId, 
      adminId: req.userId 
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const unit = course.units.id(unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    const maxScore = course.weights[assessmentType];
    if (score < 0 || score > maxScore) {
      return res.status(400).json({ message: `Score must be between 0 and ${maxScore}` });
    }
    
    let existingScore = await Score.findOne({ 
      studentId, 
      courseId, 
      unitId, 
      assessmentType, 
      adminId: req.userId 
    });
    
    if (existingScore) {
      existingScore.score = score;
      await existingScore.save();
      return res.json(existingScore);
    }
    
    const newScore = new Score({
      adminId: req.userId,
      studentId,
      courseId,
      unitId,
      assessmentType,
      score
    });
    
    await newScore.save();
    res.status(201).json(newScore);
  } catch (error) {
    console.error('Create score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateScore = async (req, res) => {
  try {
    const { score } = req.body;
    
    const existingScore = await Score.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!existingScore) {
      return res.status(404).json({ message: 'Score not found' });
    }
    
    const course = await Course.findById(existingScore.courseId);
    const maxScore = course.weights[existingScore.assessmentType];
    
    if (score < 0 || score > maxScore) {
      return res.status(400).json({ message: `Score must be between 0 and ${maxScore}` });
    }
    
    existingScore.score = score;
    await existingScore.save();
    
    res.json(existingScore);
  } catch (error) {
    console.error('Update score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteScore = async (req, res) => {
  try {
    const score = await Score.findOneAndDelete({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!score) {
      return res.status(404).json({ message: 'Score not found' });
    }
    
    res.json({ message: 'Score deleted successfully' });
  } catch (error) {
    console.error('Delete score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getScoresByCourse,
  getScoresByUnit,
  getScoresByStudent,
  createScore,
  updateScore,
  deleteScore
};