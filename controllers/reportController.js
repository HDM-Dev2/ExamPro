const Course = require('../models/Course');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Score = require('../models/Score');

const CRNM = 'CRNM';

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

const buildStudentCourseReport = (course, studentScores) => {
  const requiredTypes = getRequiredTypes(course.examType);
  const unitResults = [];
  let hasCRNM = false;

  for (const unit of course.units) {
    const unitScores = studentScores.filter((s) => s.unitId.toString() === unit._id.toString());

    let unitTotal = 0;
    let unitHasMissing = false;

    for (const type of requiredTypes) {
      const score = unitScores.find((s) => s.assessmentType === type);

      if (!score) {
        unitHasMissing = true;
        break;
      }

      unitTotal += score.score;
    }

    if (unitHasMissing) {
      unitResults.push({
        unitId: unit._id,
        unitName: unit.name,
        unitCode: unit.code || '',
        total: CRNM
      });
      hasCRNM = true;
    } else {
      unitResults.push({
        unitId: unit._id,
        unitName: unit.name,
        unitCode: unit.code || '',
        total: Math.round(unitTotal)
      });
    }
  }

  let courseFinal = CRNM;

  if (!hasCRNM && unitResults.length > 0) {
    const sum = unitResults.reduce((acc, u) => acc + u.total, 0);
    courseFinal = Math.round(sum / unitResults.length);
  }

  return {
    course,
    unitResults,
    finalScore: courseFinal
  };
};

const getClassReport = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId } = req.params;

    const cls = await Class.findOne({ _id: classId, adminId: tenantId });
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const students = await Student.find({
      classId,
      adminId: tenantId,
      isActive: true
    }).sort({ fullName: 1 });

    const courses = await Course.find({
      classId,
      adminId: tenantId,
      isActive: true
    });

    const report = [];

    for (const student of students) {
      const studentReport = {
        student,
        courses: []
      };

      for (const course of courses) {
        const scores = await Score.find({
          studentId: student._id,
          courseId: course._id,
          adminId: tenantId
        });

        const result = buildStudentCourseReport(course, scores);
        studentReport.courses.push(result);
      }

      report.push(studentReport);
    }

    res.json({ class: cls, report });
  } catch (error) {
    console.error('Get class report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudentReport = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { studentId } = req.params;

    const student = await Student.findOne({ _id: studentId, adminId: tenantId }).populate(
      'classId',
      'className'
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const courses = await Course.find({
      classId: student.classId._id,
      adminId: tenantId,
      isActive: true
    });

    const courseReports = [];

    for (const course of courses) {
      const scores = await Score.find({
        studentId: student._id,
        courseId: course._id,
        adminId: tenantId
      });

      const result = buildStudentCourseReport(course, scores);
      courseReports.push(result);
    }

    res.json({ student, courseReports });
  } catch (error) {
    console.error('Get student report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCourseReport = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { courseId } = req.params;

    const course = await Course.findOne({ _id: courseId, adminId: tenantId }).populate(
      'classId',
      'className'
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const students = await Student.find({
      classId: course.classId._id,
      adminId: tenantId,
      isActive: true
    }).sort({ fullName: 1 });

    const scores = await Score.find({ courseId: course._id, adminId: tenantId });

    const studentSummaries = students.map((student) => {
      const studentScores = scores.filter(
        (s) => s.studentId.toString() === student._id.toString()
      );

      const result = buildStudentCourseReport(course, studentScores);

      return {
        student,
        unitResults: result.unitResults,
        finalScore: result.finalScore
      };
    });

    const numericFinals = studentSummaries
      .filter((s) => s.finalScore !== CRNM)
      .map((s) => s.finalScore);

    const summary = {
      totalStudents: students.length,
      totalCRNM: studentSummaries.filter((s) => s.finalScore === CRNM).length,
      classAverage:
        numericFinals.length > 0
          ? Math.round(numericFinals.reduce((a, b) => a + b, 0) / numericFinals.length)
          : 0,
      passRate:
        numericFinals.length > 0
          ? Math.round((numericFinals.filter((s) => s >= 40).length / numericFinals.length) * 100)
          : 0,
      highestScore: numericFinals.length > 0 ? Math.max(...numericFinals) : 0,
      lowestScore: numericFinals.length > 0 ? Math.min(...numericFinals) : 0
    };

    res.json({ course, summary, studentSummaries });
  } catch (error) {
    console.error('Get course report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getClassReport,
  getStudentReport,
  getCourseReport
};