const Course = require('../models/Course');
const Department = require('../models/Department');
const Class = require('../models/Class');

const getCourses = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { departmentId } = req.query;

    const query = { adminId: tenantId, isActive: true };
    if (departmentId) query.departmentId = departmentId;

    const courses = await Course.find(query)
      .populate('departmentId', 'name')
      .sort({ name: 1 });

    const coursesWithCount = await Promise.all(
      courses.map(async (course) => {
        const classCount = await Class.countDocuments({
          courseId: course._id,
          adminId: tenantId,
          isActive: true
        });
        return { ...course.toObject(), classCount };
      })
    );

    res.json(coursesWithCount);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const course = await Course.findOne({
      _id: req.params.id,
      adminId: tenantId
    }).populate('departmentId', 'name');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const classes = await Class.find({
      courseId: course._id,
      adminId: tenantId,
      isActive: true
    }).sort({ className: 1 });

    res.json({ ...course.toObject(), classes });
  } catch (error) {
    console.error('Get course by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, code, departmentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    if (!departmentId) {
      return res.status(400).json({ message: 'Department is required' });
    }

    const department = await Department.findOne({
      _id: departmentId,
      adminId: tenantId
    });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const existing = await Course.findOne({
      name: name.trim(),
      departmentId,
      adminId: tenantId
    });
    if (existing) {
      return res.status(400).json({ message: 'Course name already exists in this department' });
    }

    const course = new Course({
      adminId: tenantId,
      departmentId,
      name: name.trim(),
      code: code ? code.trim() : ''
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
    const tenantId = req.tenantId;
    const { name, code, departmentId } = req.body;

    const course = await Course.findOne({
      _id: req.params.id,
      adminId: tenantId
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (name && name.trim() !== course.name) {
      const existing = await Course.findOne({
        name: name.trim(),
        departmentId: course.departmentId,
        adminId: tenantId,
        _id: { $ne: course._id }
      });
      if (existing) {
        return res.status(400).json({ message: 'Course name already exists in this department' });
      }
      course.name = name.trim();
    }

    if (code !== undefined) course.code = code ? code.trim() : '';
    if (departmentId && departmentId !== course.departmentId.toString()) {
      const department = await Department.findOne({
        _id: departmentId,
        adminId: tenantId
      });
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
      course.departmentId = departmentId;
    }

    await course.save();
    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const course = await Course.findOne({
      _id: req.params.id,
      adminId: tenantId
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const classCount = await Class.countDocuments({
      courseId: course._id,
      adminId: tenantId,
      isActive: true
    });

    if (classCount > 0) {
      return res.status(400).json({
        message: `Cannot delete course — ${classCount} class(es) still linked`
      });
    }

    course.isActive = false;
    await course.save();

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};