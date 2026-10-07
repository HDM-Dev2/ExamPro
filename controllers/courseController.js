const Course = require('../models/Course');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Score = require('../models/Score');

const CRNM = 'CRNM';

const getCourses = async (req, res) => {
  try {
    const { classId } = req.query;
    
    let query = { adminId: req.userId, isActive: true };
    if (classId) query.classId = classId;
    
    const courses = await Course.find(query)
      .populate('classId', 'className')
      .sort({ courseName: 1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    }).populate('classId', 'className');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const students = await Student.find({ 
      classId: course.classId._id, 
      adminId: req.userId, 
      isActive: true 
    }).sort({ fullName: 1 });
    
    const scores = await Score.find({ 
      courseId: course._id, 
      adminId: req.userId 
    });
    
    res.json({
      ...course.toObject(),
      students,
      scores
    });
  } catch (error) {
    console.error('Get course by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { courseCode, courseName, classId, examType, weights } = req.body;
    
    const cls = await Class.findOne({ 
      _id: classId, 
      adminId: req.userId 
    });
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    const course = new Course({
      adminId: req.userId,
      courseCode,
      courseName,
      classId,
      examType: examType || 'assignment_cat_exam',
      weights: weights || { assignment: 10, cat: 20, exam: 70 },
      units: []
    });
    
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { courseCode, courseName, classId, examType, weights } = req.body;
    
    const course = await Course.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (courseCode !== undefined) course.courseCode = courseCode;
    if (courseName !== undefined) course.courseName = courseName;
    if (classId !== undefined) course.classId = classId;
    if (examType !== undefined) course.examType = examType;
    if (weights !== undefined) course.weights = weights;
    
    await course.save();
    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    course.isActive = false;
    await course.save();
    
    await Score.deleteMany({ 
      courseId: course._id, 
      adminId: req.userId 
    });
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addUnit = async (req, res) => {
  try {
    const { name, code } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Unit name is required' });
    }
    
    const course = await Course.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    course.units.push({
      name: name.trim(),
      code: code ? code.trim() : ''
    });
    
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Add unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUnit = async (req, res) => {
  try {
    const { name, code } = req.body;
    
    const course = await Course.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const unit = course.units.id(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    if (name && name.trim()) unit.name = name.trim();
    if (code !== undefined) unit.code = code ? code.trim() : '';
    
    await course.save();
    res.json(course);
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const unit = course.units.id(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    course.units.pull(req.params.unitId);
    await course.save();
    
    await Score.deleteMany({ 
      courseId: course._id, 
      unitId: req.params.unitId,
      adminId: req.userId 
    });
    
    res.json(course);
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addManualStudent = async (req, res) => {
  try {
    const { studentName, admissionNumber } = req.body;
    
    const course = await Course.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    course.manualStudents.push({ studentName, admissionNumber });
    await course.save();
    
    res.status(201).json(course);
  } catch (error) {
    console.error('Add manual student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteManualStudent = async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const studentIndex = parseInt(req.params.studentIndex);
    
    if (isNaN(studentIndex) || studentIndex < 0 || studentIndex >= course.manualStudents.length) {
      return res.status(400).json({ message: 'Invalid student index' });
    }
    
    course.manualStudents.splice(studentIndex, 1);
    await course.save();
    
    res.json(course);
  } catch (error) {
    console.error('Delete manual student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCourseScores = async (req, res) => {
  try {
    const scores = await Score.find({ 
      courseId: req.params.id, 
      adminId: req.userId 
    }).sort({ assessmentType: 1 });
    
    res.json(scores);
  } catch (error) {
    console.error('Get course scores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const saveBulkScores = async (req, res) => {
  try {
    const { unitId, assessmentType, scores } = req.body;
    
    if (!unitId) {
      return res.status(400).json({ message: 'Unit ID is required' });
    }
    
    if (!['assignment', 'cat', 'exam'].includes(assessmentType)) {
      return res.status(400).json({ message: 'Invalid assessment type' });
    }
    
    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ message: 'No scores provided' });
    }
    
    const course = await Course.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const unitExists = course.units.some(u => u._id.toString() === unitId.toString());
    if (!unitExists) {
      return res.status(404).json({ message: 'Unit not found in course' });
    }
    
    const maxScore = course.weights[assessmentType];
    
    const results = [];
    const errors = [];
    
    for (const scoreData of scores) {
      try {
        const { studentId, score } = scoreData;
        
        const numericScore = Number(score);
        
        if (isNaN(numericScore) || numericScore < 0) {
          errors.push({ studentId, message: 'Invalid score' });
          continue;
        }
        
        if (numericScore > maxScore) {
          errors.push({ studentId, message: `Score must not exceed ${maxScore}` });
          continue;
        }
        
        let existingScore = await Score.findOne({
          studentId,
          courseId: course._id,
          unitId,
          assessmentType,
          adminId: req.userId
        });
        
        if (existingScore) {
          existingScore.score = numericScore;
          await existingScore.save();
          results.push(existingScore);
        } else {
          const newScore = new Score({
            adminId: req.userId,
            studentId,
            courseId: course._id,
            unitId,
            assessmentType,
            score: numericScore
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

const getRequiredTypes = (examType) => {
  switch (examType) {
    case 'assignment_cat_exam':
      return ['assignment', 'cat', 'exam'];
    case 'cat_exam':
      return ['cat', 'exam'];
    case 'exam_only':
      return ['exam'];
    default:
      return ['assignment', 'cat', 'exam'];
  }
};

const calculateStudentResults = (course, studentScores) => {
  const requiredTypes = getRequiredTypes(course.examType);
  const unitResults = [];
  let hasCRNM = false;
  
  for (const unit of course.units) {
    const unitScores = studentScores.filter(
      s => s.unitId.toString() === unit._id.toString()
    );
    
    let unitTotal = 0;
    let unitHasMissing = false;
    
    for (const type of requiredTypes) {
      const score = unitScores.find(s => s.assessmentType === type);
      
      if (!score) {
        unitHasMissing = true;
        break;
      }
      
      unitTotal += score.score;
    }
    
    if (unitHasMissing) {
      unitResults.push({ unitId: unit._id, unitName: unit.name, total: CRNM });
      hasCRNM = true;
    } else {
      unitResults.push({ unitId: unit._id, unitName: unit.name, total: Math.round(unitTotal) });
    }
  }
  
  let courseFinal = CRNM;
  
  if (!hasCRNM && unitResults.length > 0) {
    const sum = unitResults.reduce((acc, u) => acc + u.total, 0);
    courseFinal = Math.round(sum / unitResults.length);
  }
  
  return { unitResults, courseFinal };
};

const getCourseSummary = async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    }).populate('classId', 'className');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const students = await Student.find({ 
      classId: course.classId._id, 
      adminId: req.userId, 
      isActive: true 
    }).sort({ fullName: 1 });
    
    const scores = await Score.find({ 
      courseId: course._id, 
      adminId: req.userId 
    });
    
    const studentSummaries = students.map((student) => {
      const studentScores = scores.filter(s => 
        s.studentId.toString() === student._id.toString()
      );
      
      const results = calculateStudentResults(course, studentScores);
      
      return {
        student,
        unitResults: results.unitResults,
        courseFinal: results.courseFinal
      };
    });
    
    res.json({ course, studentSummaries });
  } catch (error) {
    console.error('Get course summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addUnit,
  updateUnit,
  deleteUnit,
  addManualStudent,
  deleteManualStudent,
  getCourseScores,
  saveBulkScores,
  getCourseSummary
};