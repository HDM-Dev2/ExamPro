import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import * as courseApi from '../api/courseApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import AddUnitModal from '../components/course/AddUnitModal';
import RecordScoreModal from '../components/course/RecordScoreModal';
import { CRNM, calculateStudentResults, getGradeFromSettings, getGradeColorFromSettings, getRequiredTypes } from '../utils/calculations';
import { formatExamType } from '../utils/constants';
import toast from 'react-hot-toast';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { fetchCourseById, currentCourse, loading } = useData();
  const { settings } = useSettings();
  const [scores, setScores] = useState([]);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAddManualStudent, setShowAddManualStudent] = useState(false);
  const [editUnitTarget, setEditUnitTarget] = useState(null);
  const [deleteUnitTarget, setDeleteUnitTarget] = useState(null);
  const [deleteManualStudentTarget, setDeleteManualStudentTarget] = useState(null);
  const [recordModal, setRecordModal] = useState({ unit: null, type: null });
  const [manualStudentForm, setManualStudentForm] = useState({
    studentName: '',
    admissionNumber: '',
  });
  const [editUnitForm, setEditUnitForm] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      await fetchCourseById(courseId);
      const scoreData = await courseApi.getCourseScores(courseId);
      setScores(scoreData);
    } catch (error) {
      toast.error('Failed to load course data');
      navigate('/courses');
    }
  };

  const handleAddUnit = async (unitData) => {
    try {
      await courseApi.addUnit(courseId, unitData);
      toast.success('Unit added');
      await loadCourseData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add unit');
      throw error;
    }
  };

  const handleEditUnit = async (e) => {
    e.preventDefault();
    try {
      await courseApi.updateUnit(courseId, editUnitTarget._id, editUnitForm);
      toast.success('Unit updated');
      setEditUnitTarget(null);
      await loadCourseData();
    } catch (error) {
      toast.error('Failed to update unit');
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnitTarget) return;
    try {
      await courseApi.deleteUnit(courseId, deleteUnitTarget._id);
      toast.success('Unit deleted');
      setDeleteUnitTarget(null);
      await loadCourseData();
    } catch (error) {
      toast.error('Failed to delete unit');
    }
  };

  const handleSaveScores = async (payload) => {
    try {
      const result = await courseApi.saveBulkScores(courseId, {
        unitId: recordModal.unit._id,
        assessmentType: recordModal.type,
        scores: payload,
      });
      toast.success(`${result.totalSaved} scores saved`);
      if (result.totalErrors > 0) {
        toast.error(`${result.totalErrors} scores failed`);
      }
      setRecordModal({ unit: null, type: null });
      await loadCourseData();
      return result;
    } catch (error) {
      toast.error('Failed to save scores');
      throw error;
    }
  };

  const handleAddManualStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await courseApi.addManualStudent(courseId, manualStudentForm);
      toast.success('Manual student added');
      setShowAddManualStudent(false);
      setManualStudentForm({ studentName: '', admissionNumber: '' });
      await loadCourseData();
    } catch (error) {
      toast.error('Failed to add manual student');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteManualStudent = async () => {
    if (deleteManualStudentTarget === null) return;
    try {
      await courseApi.deleteManualStudent(courseId, deleteManualStudentTarget);
      toast.success('Manual student removed');
      setDeleteManualStudentTarget(null);
      await loadCourseData();
    } catch (error) {
      toast.error('Failed to delete manual student');
    }
  };

  if (loading && !currentCourse) {
    return <Spinner size="lg" className="py-20" />;
  }

  if (!currentCourse) return null;

  const units = currentCourse.units || [];
  const students = currentCourse.students || [];
  const requiredTypes = getRequiredTypes(currentCourse.examType);

  const getMaxForType = (type) => currentCourse.weights[type] || 0;

  const showAssignment = requiredTypes.includes('assignment');
  const showCat = requiredTypes.includes('cat');
  const showExam = requiredTypes.includes('exam');

  // Status calculation for each unit
  const getUnitStatus = (unit) => {
    if (students.length === 0) {
      return { status: 'empty', label: 'No Students', color: 'gray' };
    }

    const totalNeeded = students.length * requiredTypes.length;
    let recorded = 0;

    students.forEach((student) => {
      requiredTypes.forEach((type) => {
        const found = scores.find(
          (s) =>
            (s.studentId?._id || s.studentId)?.toString() === student._id.toString() &&
            (s.unitId?._id || s.unitId)?.toString() === unit._id.toString() &&
            s.assessmentType === type
        );
        if (found) recorded++;
      });
    });

    if (recorded === 0) {
      return { status: 'none', label: 'Not Recorded', color: 'gray', recorded, total: totalNeeded };
    }

    if (recorded === totalNeeded) {
      return { status: 'full', label: 'Fully Recorded', color: 'green', recorded, total: totalNeeded };
    }

    return { status: 'partial', label: 'Partial', color: 'yellow', recorded, total: totalNeeded };
  };

  const getStatusBadgeVariant = (color) => {
    switch (color) {
      case 'green': return 'success';
      case 'yellow': return 'warning';
      case 'gray': return 'default';
      default: return 'default';
    }
  };

  const studentSummaries = students.map((student) => {
    const studentScores = scores.filter(
      (s) => (s.studentId?._id || s.studentId)?.toString() === student._id.toString()
    );
    
    const results = calculateStudentResults(currentCourse, studentScores);
    
    return {
      student,
      unitResults: results.unitResults,
      courseFinal: results.courseFinal,
    };
  });

  const numericFinals = studentSummaries.filter(s => s.courseFinal !== CRNM).map(s => s.courseFinal);
  const crnmCount = studentSummaries.filter(s => s.courseFinal === CRNM).length;
  
  const classAverage = numericFinals.length > 0
    ? Math.round(numericFinals.reduce((a, b) => a + b, 0) / numericFinals.length)
    : 0;
  
  const passRate = numericFinals.length > 0
    ? Math.round((numericFinals.filter((s) => s >= (settings?.passMark || 40)).length / numericFinals.length) * 100)
    : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/courses')}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Courses
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{currentCourse.courseName}</h1>
          <p className="text-gray-600 mt-1">{currentCourse.courseCode}</p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="primary">{formatExamType(currentCourse.examType)}</Badge>
            <Badge variant="info">{units.length} Units</Badge>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => setShowAddManualStudent(true)}>
            Add Manual Student
          </Button>
          <Button onClick={() => setShowAddUnit(true)}>
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Unit
          </Button>
        </div>
      </div>

      {units.length === 0 && (
        <div className="mb-6">
          <Alert
            type="info"
            title="No units yet"
            message="Add units first before recording scores."
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <p className="text-sm text-gray-500">Class Average</p>
          <p className="text-2xl font-bold text-gray-900">{classAverage}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Pass Rate</p>
          <p className="text-2xl font-bold text-gray-900">{passRate}%</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Units</p>
          <p className="text-2xl font-bold text-gray-900">{units.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">CRNM</p>
          <p className="text-2xl font-bold text-red-600">{crnmCount}</p>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Units & Score Entry</h3>
        </div>

        {units.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No units added yet</p>
        ) : (
          <div className="space-y-4">
            {units.map((unit) => {
              const unitStatus = getUnitStatus(unit);

              return (
                <div
                  key={unit._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-gray-900">{unit.name}</p>
                        <Badge variant={getStatusBadgeVariant(unitStatus.color)}>
                          {unitStatus.label}
                        </Badge>
                        {unitStatus.status === 'partial' && (
                          <span className="text-xs text-gray-500">
                            {unitStatus.recorded}/{unitStatus.total}
                          </span>
                        )}
                      </div>
                      {unit.code && <p className="text-xs text-gray-500 mt-1">{unit.code}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditUnitTarget(unit);
                          setEditUnitForm({ name: unit.name, code: unit.code || '' });
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteUnitTarget(unit)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {showAssignment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRecordModal({ unit, type: 'assignment' })}
                      >
                        Record Assignment (Max {getMaxForType('assignment')})
                      </Button>
                    )}
                    {showCat && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRecordModal({ unit, type: 'cat' })}
                      >
                        Record CAT (Max {getMaxForType('cat')})
                      </Button>
                    )}
                    {showExam && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRecordModal({ unit, type: 'exam' })}
                      >
                        Record Exam (Max {getMaxForType('exam')})
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Final Results</h3>
        </div>

        {students.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No students in this class</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student
                  </th>
                  {units.map((unit) => (
                    <th
                      key={unit._id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {unit.name}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Final
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentSummaries.map((summary) => {
                  const grade = summary.courseFinal === CRNM 
                    ? CRNM 
                    : getGradeFromSettings(summary.courseFinal, settings);
                  const gradeColor = getGradeColorFromSettings(grade, settings);

                  return (
                    <tr key={summary.student._id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-gray-900">{summary.student.fullName}</p>
                        <p className="text-xs text-gray-500">{summary.student.admissionNumber || ''}</p>
                      </td>
                      {units.map((unit) => {
                        const unitResult = summary.unitResults.find(
                          (u) => u.unitId?.toString() === unit._id.toString()
                        );
                        const total = unitResult?.total;
                        const isCRNM = total === CRNM;
                        return (
                          <td key={unit._id} className="px-4 py-3 whitespace-nowrap">
                            {isCRNM ? (
                              <span className="text-red-600 font-semibold text-xs">CRNM</span>
                            ) : (
                              <span className="text-gray-900">{total ?? '-'}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {summary.courseFinal === CRNM ? (
                          <span className="text-red-600 font-semibold text-xs">CRNM</span>
                        ) : (
                          <span className="font-bold text-gray-900">{summary.courseFinal}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-bold ${gradeColor}`}>{grade}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {currentCourse.manualStudents?.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Manual Students</h4>
            <div className="space-y-2">
              {currentCourse.manualStudents.map((ms, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">{ms.studentName}</p>
                    <p className="text-xs text-gray-500">{ms.admissionNumber || ''}</p>
                  </div>
                  <button
                    onClick={() => setDeleteManualStudentTarget(idx)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <AddUnitModal
        isOpen={showAddUnit}
        onClose={() => setShowAddUnit(false)}
        onSubmit={handleAddUnit}
        existingUnits={units}
      />

      {recordModal.unit && recordModal.type && (
        <RecordScoreModal
          isOpen={!!recordModal.unit}
          onClose={() => setRecordModal({ unit: null, type: null })}
          onSubmit={handleSaveScores}
          unit={recordModal.unit}
          assessmentType={recordModal.type}
          maxScore={getMaxForType(recordModal.type)}
          students={students}
          existingScores={scores}
        />
      )}

      <Modal
        isOpen={!!editUnitTarget}
        onClose={() => setEditUnitTarget(null)}
        title="Edit Unit"
      >
        <form onSubmit={handleEditUnit} className="space-y-4">
          <Input
            label="Unit Name"
            value={editUnitForm.name}
            onChange={(e) => setEditUnitForm({ ...editUnitForm, name: e.target.value })}
            required
          />
          <Input
            label="Unit Code"
            value={editUnitForm.code}
            onChange={(e) => setEditUnitForm({ ...editUnitForm, code: e.target.value })}
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setEditUnitTarget(null)}>
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showAddManualStudent}
        onClose={() => setShowAddManualStudent(false)}
        title="Add Manual Student"
      >
        <form onSubmit={handleAddManualStudent} className="space-y-4">
          <Input
            label="Student Name"
            value={manualStudentForm.studentName}
            onChange={(e) => setManualStudentForm({ ...manualStudentForm, studentName: e.target.value })}
            required
          />
          <Input
            label="Admission Number"
            value={manualStudentForm.admissionNumber}
            onChange={(e) => setManualStudentForm({ ...manualStudentForm, admissionNumber: e.target.value })}
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowAddManualStudent(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Add
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteUnitTarget}
        onClose={() => setDeleteUnitTarget(null)}
        onConfirm={handleDeleteUnit}
        title="Delete Unit"
        message={`Delete "${deleteUnitTarget?.name}" and all its scores?`}
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={deleteManualStudentTarget !== null}
        onClose={() => setDeleteManualStudentTarget(null)}
        onConfirm={handleDeleteManualStudent}
        title="Delete Manual Student"
        message="Remove this manual student?"
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};

export default CourseDetailPage;