const Class = require('../models/Class');
const Student = require('../models/Student');

const getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ 
      adminId: req.userId, 
      isActive: true 
    }).sort({ className: 1 });
    
    const classesWithCount = await Promise.all(classes.map(async (cls) => {
      const studentCount = await Student.countDocuments({ 
        classId: cls._id, 
        adminId: req.userId, 
        isActive: true 
      });
      return { ...cls.toObject(), studentCount };
    }));
    
    res.json(classesWithCount);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getClassById = async (req, res) => {
  try {
    const cls = await Class.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    const students = await Student.find({ 
      classId: cls._id, 
      adminId: req.userId, 
      isActive: true 
    });
    
    res.json({ ...cls.toObject(), students });
  } catch (error) {
    console.error('Get class by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createClass = async (req, res) => {
  try {
    const { className, description, academicYear } = req.body;
    
    const existingClass = await Class.findOne({ 
      className, 
      adminId: req.userId 
    });
    if (existingClass) {
      return res.status(400).json({ message: 'Class already exists' });
    }
    
    const cls = new Class({
      adminId: req.userId,
      className,
      description,
      academicYear
    });
    
    await cls.save();
    res.status(201).json(cls);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateClass = async (req, res) => {
  try {
    const { className, description, academicYear } = req.body;
    
    const cls = await Class.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    if (className && className !== cls.className) {
      const existingClass = await Class.findOne({ 
        className, 
        adminId: req.userId 
      });
      if (existingClass) {
        return res.status(400).json({ message: 'Class name already exists' });
      }
      cls.className = className;
    }
    
    if (description !== undefined) cls.description = description;
    if (academicYear !== undefined) cls.academicYear = academicYear;
    
    await cls.save();
    res.json(cls);
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteClass = async (req, res) => {
  try {
    const cls = await Class.findOne({ 
      _id: req.params.id, 
      adminId: req.userId 
    });
    
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    cls.isActive = false;
    await cls.save();
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};