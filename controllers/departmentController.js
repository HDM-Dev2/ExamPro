const Department = require('../models/Department');

const getDepartments = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const departments = await Department.find({
      adminId: tenantId,
      isActive: true
    }).sort({ name: 1 });

    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const department = await Department.findOne({
      _id: req.params.id,
      adminId: tenantId
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(department);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const existing = await Department.findOne({
      adminId: tenantId,
      name: name.trim()
    });

    if (existing) {
      return res.status(400).json({ message: 'Department name already exists' });
    }

    const department = new Department({
      adminId: tenantId,
      name: name.trim()
    });

    await department.save();
    res.status(201).json(department);
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name } = req.body;

    const department = await Department.findOne({
      _id: req.params.id,
      adminId: tenantId
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (name && name.trim() !== department.name) {
      const existing = await Department.findOne({
        adminId: tenantId,
        name: name.trim(),
        _id: { $ne: department._id }
      });
      if (existing) {
        return res.status(400).json({ message: 'Department name already exists' });
      }
      department.name = name.trim();
    }

    await department.save();
    res.json(department);
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const department = await Department.findOne({
      _id: req.params.id,
      adminId: tenantId
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    department.isActive = false;
    await department.save();

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};