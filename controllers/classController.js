const Class = require('../models/Class');
const Student = require('../models/Student');
const Score = require('../models/Score');
const Department = require('../models/Department');

const getClasses = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { departmentId } = req.query;

    const query = { adminId: tenantId, isActive: true };

    if (req.departments && req.departments.length > 0) {
      query.departmentId = { $in: req.departments };
    } else if (departmentId) {
      query.departmentId = departmentId;
    }

    const classes = await Class.find(query)
      .populate('departmentId', 'name')
      .sort({ className: 1 });

    const classesWithCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({
          classId: cls._id,
          adminId: tenantId,
          isActive: true,
        });
        return {
          ...cls.toObject(),
          studentCount,
          unitCount: cls.units.length,
        };
      })
    );

    res.json(classesWithCount);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getClassById = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const cls = await Class.findOne({
      _id: req.params.id,
      adminId: tenantId,
    }).populate('departmentId', 'name');

    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (
      req.departments &&
      req.departments.length > 0 &&
      !req.departments.includes(cls.departmentId._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied to this department' });
    }

    const students = await Student.find({
      classId: cls._id,
      adminId: tenantId,
      isActive: true,
    }).sort({ fullName: 1 });

    res.json({ ...cls.toObject(), students });
  } catch (error) {
    console.error('Get class by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createClass = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { className, departmentId, level, description, academicYear } = req.body;

    if (!className || !className.trim()) {
      return res.status(400).json({ message: 'Class name is required' });
    }

    if (!departmentId) {
      return res.status(400).json({ message: 'Department is required' });
    }

    if (
      req.departments &&
      req.departments.length > 0 &&
      !req.departments.includes(departmentId.toString())
    ) {
      return res
        .status(403)
        .json({ message: 'You can only create classes in your departments' });
    }

    const department = await Department.findOne({
      _id: departmentId,
      adminId: tenantId,
    });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const existing = await Class.findOne({
      className: className.trim(),
      adminId: tenantId,
    });
    if (existing) {
      return res.status(400).json({ message: 'Class already exists' });
    }

    const cls = new Class({
      adminId: tenantId,
      className: className.trim(),
      departmentId,
      level: level || null,
      description: description || '',
      academicYear: academicYear || undefined,
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
    const tenantId = req.tenantId;
    const { className, departmentId, level, description, academicYear } = req.body;

    const cls = await Class.findOne({
      _id: req.params.id,
      adminId: tenantId,
    });

    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (
      req.departments &&
      req.departments.length > 0 &&
      !req.departments.includes(cls.departmentId.toString())
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (className && className.trim() !== cls.className) {
      const existing = await Class.findOne({
        className: className.trim(),
        adminId: tenantId,
        _id: { $ne: cls._id },
      });
      if (existing) {
        return res.status(400).json({ message: 'Class name already exists' });
      }
      cls.className = className.trim();
    }

    if (departmentId) {
      if (
        req.departments &&
        req.departments.length > 0 &&
        !req.departments.includes(departmentId.toString())
      ) {
        return res
          .status(403)
          .json({ message: 'Cannot move class to a different department' });
      }

      const department = await Department.findOne({
        _id: departmentId,
        adminId: tenantId,
      });
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
      cls.departmentId = departmentId;
    }

    if (level !== undefined) cls.level = level;
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
    const tenantId = req.tenantId;
    const cls = await Class.findOne({
      _id: req.params.id,
      adminId: tenantId,
    });

    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (
      req.departments &&
      req.departments.length > 0 &&
      !req.departments.includes(cls.departmentId.toString())
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    cls.isActive = false;
    await cls.save();

    await Score.deleteMany({ classId: cls._id, adminId: tenantId });

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addUnit = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, code, formativeCount } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Unit name is required' });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Unit code is required' });
    }

    const cls = await Class.findOne({
      _id: req.params.id,
      adminId: tenantId,
    });

    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (
      req.departments &&
      req.departments.length > 0 &&
      !req.departments.includes(cls.departmentId.toString())
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const existing = cls.units.find(
      (u) => u.code.toLowerCase() === code.trim().toLowerCase()
    );
    if (existing) {
      return res
        .status(400)
        .json({ message: 'Unit code already exists in this class' });
    }

    cls.units.push({
      name: name.trim(),
      code: code.trim(),
      formativeCount: formativeCount === 4 ? 4 : 3,
    });

    await cls.save();
    res.status(201).json(cls);
  } catch (error) {
    console.error('Add unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUnit = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, code, formativeCount } = req.body;

    const cls = await Class.findOne({
      _id: req.params.id,
      adminId: tenantId,
    });

    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (
      req.departments &&
      req.departments.length > 0 &&
      !req.departments.includes(cls.departmentId.toString())
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const unit = cls.units.id(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    if (code && code.trim().toLowerCase() !== unit.code.toLowerCase()) {
      const existing = cls.units.find(
        (u) =>
          u._id.toString() !== req.params.unitId &&
          u.code.toLowerCase() === code.trim().toLowerCase()
      );
      if (existing) {
        return res
          .status(400)
          .json({ message: 'Unit code already exists in this class' });
      }
      unit.code = code.trim();
    }

    if (name && name.trim()) unit.name = name.trim();
    if (formativeCount !== undefined) {
      unit.formativeCount = formativeCount === 4 ? 4 : 3;
    }

    await cls.save();
    res.json(cls);
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const cls = await Class.findOne({
      _id: req.params.id,
      adminId: tenantId,
    });

    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (
      req.departments &&
      req.departments.length > 0 &&
      !req.departments.includes(cls.departmentId.toString())
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const unit = cls.units.id(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    cls.units.pull(req.params.unitId);
    await cls.save();

    await Score.deleteMany({
      classId: cls._id,
      unitId: req.params.unitId,
      adminId: tenantId,
    });

    res.json(cls);
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  addUnit,
  updateUnit,
  deleteUnit,
};