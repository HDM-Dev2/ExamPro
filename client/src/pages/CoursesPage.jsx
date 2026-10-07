import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import * as courseApi from '../api/courseApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AddUnitModal from '../components/course/AddUnitModal';
import { EXAM_TYPES, DEFAULT_WEIGHTS } from '../utils/constants';
import { formatExamType } from '../utils/formatters';
import toast from 'react-hot-toast';

const CoursesPage = () => {
  const { courses, classes, fetchCourses, fetchClasses, loading } = useData();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [newCourse, setNewCourse] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    classId: '',
    examType: 'assignment_cat_exam',
    weights: { assignment: 10, cat: 20, exam: 70 },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchClasses();
  }, []);

  const classOptions = classes.map((cls) => ({
    value: cls._id,
    label: cls.className,
  }));

  const filteredCourses = courses.filter((course) => {
    return course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           course.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        courseCode: course.courseCode,
        courseName: course.courseName,
        classId: course.classId?._id || course.classId || '',
        examType: course.examType,
        weights: course.weights,
      });
    } else {
      setEditingCourse(null);
      setFormData({
        courseCode: '',
        courseName: '',
        classId: '',
        examType: 'assignment_cat_exam',
        weights: { assignment: 10, cat: 20, exam: 70 },
      });
    }
    setShowModal(true);
  };

  const handleExamTypeChange = (examType) => {
    setFormData({
      ...formData,
      examType,
      weights: DEFAULT_WEIGHTS[examType],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCourse) {
        await courseApi.updateCourse(editingCourse._id, formData);
        toast.success('Course updated successfully');
        setShowModal(false);
        fetchCourses();
      } else {
        const created = await courseApi.createCourse(formData);
        toast.success('Course created. Now add units.');
        setShowModal(false);
        setNewCourse(created);
        setShowAddUnit(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUnit = async (unitData) => {
    if (!newCourse) return;
    try {
      await courseApi.addUnit(newCourse._id, unitData);
      toast.success('Unit added');
      const updated = await courseApi.getCourseById(newCourse._id);
      setNewCourse(updated);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add unit');
      throw error;
    }
  };

  const handleFinishUnits = () => {
    setShowAddUnit(false);
    setNewCourse(null);
    fetchCourses();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await courseApi.deleteCourse(deleteTarget._id);
      toast.success('Course deleted successfully');
      setDeleteTarget(null);
      fetchCourses();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const headers = ['Course Code', 'Course Name', 'Class', 'Exam Type', 'Units', 'Status', 'Actions'];

  const renderRow = (course) => {
    const unitsCount = course.units?.length || 0;

    return (
      <tr key={course._id}>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="font-medium text-gray-900">{course.courseCode}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
          {course.courseName}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Badge variant="info">{course.classId?.className || 'No Class'}</Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Badge variant="primary">{formatExamType(course.examType)}</Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
          {unitsCount}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Badge variant={course.isActive ? 'success' : 'danger'}>
            {course.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap space-x-2">
          <Button variant="primary" size="sm" onClick={() => navigate(`/courses/${course._id}`)}>
            Open
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleOpenModal(course)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(course)}>
            Delete
          </Button>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">Manage your courses</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Course
        </Button>
      </div>

      <Card className="mb-6">
        <Input
          placeholder="Search by course name or code"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      <Card>
        <Table
          headers={headers}
          data={filteredCourses}
          renderRow={renderRow}
          loading={loading}
          emptyMessage="No courses found"
        />
      </Card>

      {/* Course Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCourse ? 'Edit Course' : 'Add Course'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Course Code"
              placeholder="Enter course code"
              value={formData.courseCode}
              onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
              required
            />
            <Input
              label="Course Name"
              placeholder="Enter course name"
              value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
              required
            />
          </div>
          <Select
            label="Class"
            placeholder="Select class"
            options={classOptions}
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            required
          />
          <Select
            label="Exam Type"
            placeholder="Select exam type"
            options={EXAM_TYPES}
            value={formData.examType}
            onChange={(e) => handleExamTypeChange(e.target.value)}
            required
          />
          
          {formData.examType !== 'exam_only' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.examType === 'assignment_cat_exam' && (
                <Input
                  label="Assignment Weight (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.weights.assignment}
                  onChange={(e) => setFormData({
                    ...formData,
                    weights: { ...formData.weights, assignment: Number(e.target.value) }
                  })}
                />
              )}
              {formData.examType !== 'exam_only' && (
                <Input
                  label="CAT Weight (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.weights.cat}
                  onChange={(e) => setFormData({
                    ...formData,
                    weights: { ...formData.weights, cat: Number(e.target.value) }
                  })}
                />
              )}
              <Input
                label="Exam Weight (%)"
                type="number"
                min="0"
                max="100"
                value={formData.weights.exam}
                onChange={(e) => setFormData({
                  ...formData,
                  weights: { ...formData.weights, exam: Number(e.target.value) }
                })}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingCourse ? 'Update' : 'Create & Add Units'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Units Modal (after course creation) */}
      {newCourse && (
        <AddUnitModal
          isOpen={showAddUnit}
          onClose={handleFinishUnits}
          onSubmit={handleAddUnit}
          existingUnits={newCourse.units || []}
        />
      )}

      {newCourse && showAddUnit && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button variant="success" onClick={handleFinishUnits}>
            Done Adding Units
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.courseName}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default CoursesPage;