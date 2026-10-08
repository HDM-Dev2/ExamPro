import { useState, useEffect } from 'react';
import * as studentApi from '../api/studentApi';
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
import ExportMenu from '../components/students/ExportMenu';
import ImportModal from '../components/students/ImportModal';
import toast from 'react-hot-toast';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({
    departmentId: '',
    classId: '',
    search: '',
  });
  const [form, setForm] = useState({
    admissionNumber: '',
    fullName: '',
    classId: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadClasses();
  }, [filters.departmentId]);

  useEffect(() => {
    loadStudents();
  }, [filters.departmentId, filters.classId, filters.search]);

  const loadDepartments = async () => {
    try {
      const data = await departmentApi.getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error('Failed to load departments');
    }
  };

  const loadClasses = async () => {
    try {
      const params = filters.departmentId ? { departmentId: filters.departmentId } : {};
      const data = await classApi.getClasses(params);
      setClasses(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.classId) params.classId = filters.classId;
      if (filters.search) params.search = filters.search;

      const data = await studentApi.getStudents(params);
      setStudents(data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const departmentOptions = departments.map((d) => ({
    value: d._id,
    label: `${d.name}`,
  }));

  const classOptions = classes.map((c) => ({
    value: c._id,
    label: c.className,
  }));

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditing(student);
      setForm({
        admissionNumber: student.admissionNumber || '',
        fullName: student.fullName,
        classId: student.classId?._id || student.classId || '',
        phone: student.phone || '',
      });
    } else {
      setEditing(null);
      setForm({
        admissionNumber: '',
        fullName: '',
        classId: filters.classId || '',
        phone: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        await studentApi.updateStudent(editing._id, form);
        toast.success('Student updated');
      } else {
        await studentApi.createStudent(form);
        toast.success('Student created');
      }
      setShowModal(false);
      loadStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await studentApi.deleteStudent(deleteTarget._id);
      toast.success('Student deleted');
      setDeleteTarget(null);
      loadStudents();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleExport = async (format) => {
    try {
      const params = { format };
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.classId) params.classId = filters.classId;
      if (filters.search) params.search = filters.search;

      await studentApi.exportStudents(params);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleClearFilters = () => {
    setFilters({ departmentId: '', classId: '', search: '' });
  };

  const headers = ['No.', 'Admission No', 'Full Name', 'Class', 'Department', 'Phone', 'Status', 'Actions'];

  const renderRow = (student, index) => (
    <tr key={student._id}>
      <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-sm">{index + 1}</td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
        {student.admissionNumber || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="font-medium text-gray-900">{student.fullName}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Badge variant="primary">{student.classId?.className || '-'}</Badge>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">
        {student.classId?.departmentId?.name || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
        {student.phone || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Badge variant={student.isActive ? 'success' : 'danger'}>
          {student.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 whitespace-nowrap space-x-2">
        <Button variant="secondary" size="sm" onClick={() => handleOpenModal(student)}>
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(student)}>
          Delete
        </Button>
      </td>
    </tr>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage students across departments</p>
        </div>
        <div className="flex space-x-3">
          <ExportMenu onExport={handleExport} disabled={students.length === 0} />
          <Button variant="secondary" onClick={() => setShowImportModal(true)}>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Student
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Department"
            placeholder="All Departments"
            options={departmentOptions}
            value={filters.departmentId}
            onChange={(e) =>
              setFilters({ ...filters, departmentId: e.target.value, classId: '' })
            }
          />
          <Select
            label="Class"
            placeholder="All Classes"
            options={classOptions}
            value={filters.classId}
            onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
          />
          <Input
            label="Search"
            placeholder="Name or admission no..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={handleClearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          headers={headers}
          data={students}
          renderRow={renderRow}
          loading={loading}
          emptyMessage="No students found"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Student' : 'Add Student'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Admission Number"
            value={form.admissionNumber}
            onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
          />
          <Input
            label="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
          <Select
            label="Class"
            placeholder="Select class"
            options={classOptions}
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
            required
          />
          <Input
            label="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
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

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        classes={classes}
        onImported={loadStudents}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Delete "${deleteTarget?.fullName}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default StudentsPage;

