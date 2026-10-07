const Student = require('../models/Student');
const Class = require('../models/Class');
const Score = require('../models/Score');

const getStudents = async (req, res) => {
  try {
    const { classId, search } = req.query;
    
    let query = { adminId: req.userId, isActive: true };
    if (classId) query.classId = classId;
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const students = await Student.find(query)
      .populate('classId', 'className')
      .sort({ fullName: 1 });
    
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    }).populate('classId', 'className');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Get student by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudentsByClass = async (req, res) => {
  try {
    const students = await Student.find({ 
      classId: req.params.classId, 
      adminId: req.userId, 
      isActive: true 
    }).sort({ fullName: 1 });
    
    res.json(students);
  } catch (error) {
    console.error('Get students by class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createStudent = async (req, res) => {
  try {
    const { admissionNumber, fullName, classId, email, phone } = req.body;
    
    const cls = await Class.findOne({ 
      _id: classId, 
      adminId: req.userId 
    });
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    if (admissionNumber) {
      const existingStudent = await Student.findOne({ 
        admissionNumber, 
        adminId: req.userId 
      });
      if (existingStudent) {
        return res.status(400).json({ message: 'Admission number already exists' });
      }
    }
    
    const student = new Student({
      adminId: req.userId,
      admissionNumber,
      fullName,
      classId,
      email,
      phone
    });
    
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBulkStudents = async (req, res) => {
  try {
    const { students, classId } = req.body;
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'No students provided' });
    }
    
    const cls = await Class.findOne({ 
      _id: classId, 
      adminId: req.userId 
    });
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    const createdStudents = [];
    const errors = [];
    
    for (const studentData of students) {
      try {
        const { admissionNumber, fullName } = studentData;
        
        if (admissionNumber) {
          const existingStudent = await Student.findOne({ 
            admissionNumber, 
            adminId: req.userId 
          });
          if (existingStudent) {
            errors.push({ admissionNumber, message: 'Already exists' });
            continue;
          }
        }
        
        const student = new Student({
          adminId: req.userId,
          admissionNumber,
          fullName,
          classId
        });
        
        await student.save();
        createdStudents.push(student);
      } catch (error) {
        errors.push({ studentData, message: error.message });
      }
    }
    
    res.status(201).json({
      created: createdStudents,
      errors,
      totalCreated: createdStudents.length,
      totalErrors: errors.length
    });
  } catch (error) {
    console.error('Bulk create students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { admissionNumber, fullName, classId, email, phone } = req.body;
    
    const student = await Student.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (admissionNumber && admissionNumber !== student.admissionNumber) {
      const existingStudent = await Student.findOne({ 
        admissionNumber, 
        adminId: req.userId 
      });
      if (existingStudent) {
        return res.status(400).json({ message: 'Admission number already exists' });
      }
      student.admissionNumber = admissionNumber;
    }
    
    if (fullName !== undefined) student.fullName = fullName;
    if (classId !== undefined) student.classId = classId;
    if (email !== undefined) student.email = email;
    if (phone !== undefined) student.phone = phone;
    
    await student.save();
    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    student.isActive = false;
    await student.save();
    
    await Score.deleteMany({ 
      studentId: student._id, 
      adminId: req.userId 
    });
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  getStudentsByClass,
  createStudent,
  createBulkStudents,
  updateStudent,
  deleteStudent
};