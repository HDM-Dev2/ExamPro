import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import toast from 'react-hot-toast';

const GRADING_SYSTEMS = [
  { value: 'af', label: 'A-F Grading' },
  { value: 'cbc', label: 'CBC Based' },
  { value: 'custom', label: 'Custom' },
];

const SettingsPage = () => {
  const { isOwner } = useAuth();
  const {
    settings,
    loading,
    fetchSettings,
    saveSettings,
    saveGradingSystem,
    addNewGrade,
    removeGrade,
    saveLogo,
  } = useSettings();

  const [schoolForm, setSchoolForm] = useState({
    schoolName: '',
    schoolCode: '',
    motto: '',
    academicYear: '',
    term: '',
  });

  const [contactForm, setContactForm] = useState({
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
  });

  const [reportForm, setReportForm] = useState({
    reportFooter: '',
    passMark: 40,
  });

  const [gradingSystem, setGradingSystem] = useState('af');
  const [grades, setGrades] = useState([]);
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [deleteGradeTarget, setDeleteGradeTarget] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    name: '',
    minScore: 0,
    maxScore: 100,
    remark: '',
  });
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const fileInputRef = useRef();

  const readOnly = !isOwner;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      populateForms(data);
    } catch (error) {
      console.error('Failed to load settings');
    }
  };

  const populateForms = (data) => {
    if (!data) return;

    setSchoolForm({
      schoolName: data.schoolName || '',
      schoolCode: data.schoolCode || '',
      motto: data.motto || '',
      academicYear: data.academicYear || '',
      term: data.term || '',
    });

    setContactForm({
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      postalCode: data.postalCode || '',
      country: data.country || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
    });

    setReportForm({
      reportFooter: data.reportFooter || '',
      passMark: data.passMark || 40,
    });

    setGradingSystem(data.gradingSystem || 'af');
    setGrades(data.grades || []);
    setLogoPreview(data.logo || '');
  };

  const handleSaveSchool = async () => {
    setSaving(true);
    try {
      await saveSettings(schoolForm);
    } catch (error) {
      console.error('Failed to save school info');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      await saveSettings(contactForm);
    } catch (error) {
      console.error('Failed to save contact info');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      await saveSettings(reportForm);
    } catch (error) {
      console.error('Failed to save report settings');
    } finally {
      setSaving(false);
    }
  };

  const handleGradingSystemChange = async (system) => {
    if (readOnly) return;
    setGradingSystem(system);
    setSaving(true);
    try {
      const data = await saveGradingSystem({
        gradingSystem: system,
        passMark: reportForm.passMark,
      });
      setGrades(data.grades || []);
    } catch (error) {
      console.error('Failed to update grading system');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await addNewGrade(gradeForm);
      setGrades(data.grades || []);
      setShowAddGrade(false);
      setGradeForm({ name: '', minScore: 0, maxScore: 100, remark: '' });
    } catch (error) {
      console.error('Failed to add grade');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGrade = async () => {
    if (!deleteGradeTarget) return;
    setSaving(true);
    try {
      const data = await removeGrade(deleteGradeTarget._id);
      setGrades(data.grades || []);
      setDeleteGradeTarget(null);
    } catch (error) {
      console.error('Failed to delete grade');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setLogoPreview(base64);
      setSaving(true);
      try {
        await saveLogo(base64);
      } catch (error) {
        console.error('Failed to upload logo');
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading && !settings) {
    return <Spinner size="lg" className="py-20" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          {readOnly ? 'View school information' : 'Manage your school information'}
        </p>
      </div>

      {readOnly && (
        <div className="mb-6">
          <Alert
            type="info"
            message="You can view settings but only the super-admin can make changes."
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="School Information" subtitle="Basic school details">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              </div>
              {!readOnly && (
                <div>
                  <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Upload Logo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, or SVG</p>
                </div>
              )}
            </div>

            <Input
              label="School Name"
              placeholder="Enter school name"
              value={schoolForm.schoolName}
              onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
              disabled={readOnly}
            />
            <Input
              label="School Code"
              placeholder="Enter school code"
              value={schoolForm.schoolCode}
              onChange={(e) => setSchoolForm({ ...schoolForm, schoolCode: e.target.value })}
              disabled={readOnly}
            />
            <Input
              label="Motto"
              placeholder="Enter school motto"
              value={schoolForm.motto}
              onChange={(e) => setSchoolForm({ ...schoolForm, motto: e.target.value })}
              disabled={readOnly}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Academic Year"
                placeholder="2026"
                value={schoolForm.academicYear}
                onChange={(e) => setSchoolForm({ ...schoolForm, academicYear: e.target.value })}
                disabled={readOnly}
              />
              <Input
                label="Term"
                placeholder="Term 1"
                value={schoolForm.term}
                onChange={(e) => setSchoolForm({ ...schoolForm, term: e.target.value })}
                disabled={readOnly}
              />
            </div>
            {!readOnly && (
              <Button onClick={handleSaveSchool} isLoading={saving}>
                Save School Info
              </Button>
            )}
          </div>
        </Card>

        <Card title="Contact Details" subtitle="School contact information">
          <div className="space-y-4">
            <Input
              label="Address"
              placeholder="Enter address"
              value={contactForm.address}
              onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
              disabled={readOnly}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                placeholder="Enter city"
                value={contactForm.city}
                onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                disabled={readOnly}
              />
              <Input
                label="State/Region"
                placeholder="Enter state"
                value={contactForm.state}
                onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Postal Code"
                placeholder="Enter postal code"
                value={contactForm.postalCode}
                onChange={(e) => setContactForm({ ...contactForm, postalCode: e.target.value })}
                disabled={readOnly}
              />
              <Input
                label="Country"
                placeholder="Enter country"
                value={contactForm.country}
                onChange={(e) => setContactForm({ ...contactForm, country: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                placeholder="Enter phone"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                disabled={readOnly}
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <Input
              label="Website"
              placeholder="Enter website"
              value={contactForm.website}
              onChange={(e) => setContactForm({ ...contactForm, website: e.target.value })}
              disabled={readOnly}
            />
            {!readOnly && (
              <Button onClick={handleSaveContact} isLoading={saving}>
                Save Contact Info
              </Button>
            )}
          </div>
        </Card>

        <Card title="Grading System" subtitle="Configure how grades are calculated">
          <div className="space-y-4">
            <Select
              label="Grading System"
              options={GRADING_SYSTEMS}
              value={gradingSystem}
              onChange={(e) => handleGradingSystemChange(e.target.value)}
              disabled={readOnly}
            />

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Grade
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Min
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Max
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Remark
                    </th>
                    {!readOnly && gradingSystem === 'custom' && <th className="px-3 py-2"></th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.map((grade) => (
                    <tr key={grade._id}>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                        {grade.name}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">{grade.minScore}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{grade.maxScore}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{grade.remark}</td>
                      {!readOnly && gradingSystem === 'custom' && (
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setDeleteGradeTarget(grade)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!readOnly && gradingSystem === 'custom' && (
              <Button variant="secondary" onClick={() => setShowAddGrade(true)}>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Grade
              </Button>
            )}
          </div>
        </Card>

        <Card title="Report Settings" subtitle="Configure report output">
          <div className="space-y-4">
            <Input
              label="Pass Mark"
              type="number"
              min="0"
              max="100"
              value={reportForm.passMark}
              onChange={(e) =>
                setReportForm({ ...reportForm, passMark: Number(e.target.value) })
              }
              disabled={readOnly}
            />
            <Input
              label="Report Footer Text"
              placeholder="© 2026 My School"
              value={reportForm.reportFooter}
              onChange={(e) =>
                setReportForm({ ...reportForm, reportFooter: e.target.value })
              }
              disabled={readOnly}
            />
            {!readOnly && (
              <Button onClick={handleSaveReport} isLoading={saving}>
                Save Report Settings
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showAddGrade}
        onClose={() => setShowAddGrade(false)}
        title="Add Custom Grade"
      >
        <form onSubmit={handleAddGrade} className="space-y-4">
          <Input
            label="Grade Name"
            placeholder="e.g., Distinction"
            value={gradeForm.name}
            onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Score"
              type="number"
              min="0"
              max="100"
              value={gradeForm.minScore}
              onChange={(e) =>
                setGradeForm({ ...gradeForm, minScore: Number(e.target.value) })
              }
              required
            />
            <Input
              label="Max Score"
              type="number"
              min="0"
              max="100"
              value={gradeForm.maxScore}
              onChange={(e) =>
                setGradeForm({ ...gradeForm, maxScore: Number(e.target.value) })
              }
              required
            />
          </div>
          <Input
            label="Remark (optional)"
            placeholder="e.g., Outstanding"
            value={gradeForm.remark}
            onChange={(e) => setGradeForm({ ...gradeForm, remark: e.target.value })}
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowAddGrade(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Add
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteGradeTarget}
        onClose={() => setDeleteGradeTarget(null)}
        onConfirm={handleDeleteGrade}
        title="Delete Grade"
        message={`Are you sure you want to delete "${deleteGradeTarget?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default SettingsPage;