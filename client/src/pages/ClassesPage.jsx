import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as classApi from '../api/classApi';
import * as departmentApi from '../api/departmentApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const ClassesPage = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [form, setForm] = useState({
    className: '',
    departmentId: '',
    level: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDepartments();
    loadClasses();
  }, []);

  useEffect(() => {
    loadClasses();
  }, [selectedDepartment]);

  const loadDepartments = async () => {
    try {
      const data = await departmentApi.getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error('Failed to load departments');
    }
  };

  const loadClasses = async () => {
    setLoading(true);
    try {
      const params = selectedDepartment ? { departmentId: selectedDepartment } : {};
      const data = await classApi.getClasses(params);
      setClasses(data);
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const departmentOptions = departments.map((d) => ({
    value: d._id,
    label: d.name,
  }));

  const levelOptions = [
    { value: '4', label: 'Level 4' },
    { value: '5', label: 'Level 5' },
    { value: '6', label: 'Level 6' },
  ];

  const openCreate = () => {
    setEditing(null);
    setForm({ className: '', departmentId: '', level: '' });
    setShowModal(true);
  };

  const openEdit = (cls) => {
    setEditing(cls);
    setForm({
      className: cls.className,
      departmentId: cls.departmentId?._id || cls.departmentId || '',
      level: cls.level || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        className: form.className,
        departmentId: form.departmentId,
        level: form.level ? Number(form.level) : null,
      };

      if (editing) {
        await classApi.updateClass(editing._id, payload);
        toast.success('Class updated');
      } else {
        await classApi.createClass(payload);
        toast.success('Class created');
      }
      setShowModal(false);
      loadClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await classApi.deleteClass(deleteTarget._id);
      toast.success('Class deleted');
      setDeleteTarget(null);
      loadClasses();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const headers = ['Class Name', 'Department', 'Level', 'Students', 'Units', 'Status', 'Actions'];

  const renderRow = (cls) => (
    <tr key={cls._id}>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-medium text-gray-900">{cls.className}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="primary">
          {cls.departmentId?.name || '-'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
        {cls.level ? `Level ${cls.level}` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
        {cls.studentCount || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
        {cls.unitCount || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={cls.isActive ? 'success' : 'danger'}>
          {cls.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap space-x-2">
        <Button variant="primary" size="sm" onClick={() => navigate(`/classes/${cls._id}`)}>
          Open
        </Button>
        <Button variant="secondary" size="sm" onClick={() => openEdit(cls)}>
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(cls)}>
          Delete
        </Button>
      </td>
    </tr>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-1">Manage classes and their units</p>
        </div>
        <Button onClick={openCreate}>
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Class
        </Button>
      </div>

      <Card className="mb-6">
        <Select
          label="Filter by Department"
          placeholder="All Departments"
          options={departmentOptions}
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        />
      </Card>

      <Card>
        <Table
          headers={headers}
          data={classes}
          renderRow={renderRow}
          loading={loading}
          emptyMessage="No classes found"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Class' : 'Add Class'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Department"
            placeholder="Select department"
            options={departmentOptions}
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            required
          />
          <Input
            label="Class Name"
            placeholder="e.g., ICTL5 25M"
            value={form.className}
            onChange={(e) => setForm({ ...form, className: e.target.value })}
            required
          />
          <Select
            label="Level (optional)"
            placeholder="Select level"
            options={levelOptions}
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        message={`Delete "${deleteTarget?.className}" and all its scores?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default ClassesPage;