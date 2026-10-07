import { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { formatDate } from '../utils/formatters';
import { CRNM, getGradeFromSettings, getGradeColorFromSettings, getGradeRemark } from '../utils/calculations';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const { classes, courses, fetchClasses, fetchCourses, fetchClassReport, fetchCourseReport, fetchStudentReport, reports, loading } = useData();
  const { settings } = useSettings();
  const [reportType, setReportType] = useState('class');
  const [selectedItem, setSelectedItem] = useState('');
  const [generated, setGenerated] = useState(false);
  const [selectedStudentReport, setSelectedStudentReport] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const reportContentRef = useRef(null);
  const studentReportRef = useRef(null);

  useEffect(() => {
    fetchClasses();
    fetchCourses();
  }, []);

  const classOptions = classes.map((cls) => ({
    value: cls._id,
    label: cls.className,
  }));

  const courseOptions = courses.map((course) => ({
    value: course._id,
    label: `${course.courseName} (${course.courseCode})`,
  }));

  const handleGenerate = async () => {
    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }

    try {
      if (reportType === 'class') {
        await fetchClassReport(selectedItem);
      } else {
        await fetchCourseReport(selectedItem);
      }
      setGenerated(true);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const handlePrintIndividual = async (studentId) => {
    try {
      const report = await fetchStudentReport(studentId);
      setSelectedStudentReport(report);
      setShowStudentModal(true);
    } catch (error) {
      toast.error('Failed to load student report');
    }
  };

  const handlePrintReport = () => {
    const content = reportContentRef.current?.innerHTML;
    if (!content) {
      toast.error('Nothing to print');
      return;
    }
    printHTML(content, 'Report');
  };

  const handlePrintStudentReport = () => {
    const content = studentReportRef.current?.innerHTML;
    if (!content) {
      toast.error('Nothing to print');
      return;
    }
    printHTML(content, `Student Report`);
  };

  const printHTML = (content, title) => {
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups.');
      return;
    }
    
    const schoolName = settings?.schoolName || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${schoolName}</title>
          <script src="https://cdn.tailwindcss.com"><\/script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 30px; background: white; color: black; }
            .report-header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px double #333; }
            .report-header .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .report-header .school-motto { font-size: 14px; font-style: italic; }
            .report-header .school-address { font-size: 12px; color: #555; line-height: 1.5; }
            .report-title { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 15px 0; text-decoration: underline; }
            .report-meta { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px; flex-wrap: wrap; gap: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #333; padding: 8px 10px; text-align: left; font-size: 13px; }
            th { background-color: #f3f4f6; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            .text-green-600 { color: #16a34a !important; }
            .text-blue-600 { color: #2563eb !important; }
            .text-yellow-600 { color: #ca8a04 !important; }
            .text-orange-600 { color: #ea580c !important; }
            .text-red-600 { color: #dc2626 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .text-gray-900 { color: #111827 !important; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-white { background-color: #ffffff; }
            .text-center { text-align: center; }
            .text-2xl { font-size: 24px; }
            .text-lg { font-size: 18px; }
            .text-sm { font-size: 13px; }
            .text-xs { font-size: 11px; }
            .grid { display: grid; }
            .grid-cols-3 { grid-template-columns: 1fr 1fr 1fr; }
            .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
            .gap-4 { gap: 16px; }
            .whitespace-nowrap { white-space: nowrap; }
            .rounded-lg { border-radius: 8px; }
            .p-4 { padding: 16px; }
            .px-4 { padding-left: 16px; padding-right: 16px; }
            .py-3 { padding-top: 12px; padding-bottom: 12px; }
            .uppercase { text-transform: uppercase; }
            .mb-6 { margin-bottom: 24px; }
            .border-t { border-top: 1px solid #ddd; }
            .pt-4 { padding-top: 16px; }
            .report-footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #ddd; padding-top: 16px; }
            @media print { body { padding: 15px; } .print-hidden, button { display: none !important; } }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 1000);
            };
          <\/script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const getGrade = (score) => {
    if (score === CRNM) return CRNM;
    return getGradeFromSettings(score, settings);
  };

  const getGradeColor = (grade) => getGradeColorFromSettings(grade, settings);

  const renderLetterhead = () => {
    const addressParts = [];
    if (settings?.address) addressParts.push(settings.address);
    if (settings?.city) addressParts.push(settings.city);
    if (settings?.state) addressParts.push(settings.state);
    if (settings?.postalCode) addressParts.push(settings.postalCode);
    if (settings?.country) addressParts.push(settings.country);
    
    const fullAddress = addressParts.join(', ');
    const contactParts = [];
    if (settings?.phone) contactParts.push(`Tel: ${settings.phone}`);
    if (settings?.email) contactParts.push(`Email: ${settings.email}`);
    if (settings?.website) contactParts.push(settings.website);
    const fullContact = contactParts.join(' | ');
    
    return (
      <div className="report-header">
        {settings?.logo && (
          <img src={settings.logo} alt="Logo" style={{ height: '60px', margin: '0 auto 10px', display: 'block' }} />
        )}
        <div className="school-name">{settings?.schoolName || ''}</div>
        {settings?.motto && <div className="school-motto">"{settings.motto}"</div>}
        {fullAddress && <div className="school-address">{fullAddress}</div>}
        {fullContact && <div className="school-address">{fullContact}</div>}
      </div>
    );
  };

  const renderReportFooter = () => (
    <div className="report-footer">
      {settings?.reportFooter || `© ${new Date().getFullYear()} ${settings?.schoolName || ''}`}
    </div>
  );

  const renderScoreCell = (value) => {
    if (value === CRNM) {
      return <span className="text-red-600 font-semibold text-xs">CRNM</span>;
    }
    return <span>{value ?? '-'}</span>;
  };

  const renderClassReport = () => {
    if (!reports?.report) return null;

    const allCourses = reports.report[0]?.courses?.map(c => c.course) || [];

    return (
      <div>
        {renderLetterhead()}
        
        <div className="report-title">Class Performance Report</div>
        
        <div className="report-meta">
          <span><strong>Class:</strong> {reports.class?.className || 'N/A'}</span>
          <span><strong>Academic Year:</strong> {settings?.academicYear || 'N/A'}</span>
          <span><strong>Term:</strong> {settings?.term || 'N/A'}</span>
          <span><strong>Date:</strong> {formatDate(new Date())}</span>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Student Name</th>
                <th>Admission No.</th>
                {allCourses.map((course, index) => (
                  <th key={index}>{course.courseCode}</th>
                ))}
                <th>Average</th>
                <th>Grade</th>
                <th className="print-hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.report.map((studentReport, index) => {
                const numericScores = studentReport.courses
                  .map(c => c.finalScore)
                  .filter(s => s !== CRNM);
                
                const hasCRNM = studentReport.courses.some(c => c.finalScore === CRNM);
                
                const average = !hasCRNM && numericScores.length > 0
                  ? Math.round(numericScores.reduce((a, b) => a + b, 0) / numericScores.length)
                  : CRNM;
                
                const grade = getGrade(average);

                return (
                  <tr key={studentReport.student._id}>
                    <td>{index + 1}</td>
                    <td className="font-medium">{studentReport.student.fullName}</td>
                    <td className="text-gray-500">{studentReport.student.admissionNumber || '-'}</td>
                    {studentReport.courses.map((courseReport, i) => (
                      <td key={i}>{renderScoreCell(courseReport.finalScore)}</td>
                    ))}
                    <td className="font-semibold">{renderScoreCell(average)}</td>
                    <td className={`font-semibold ${getGradeColor(grade)}`}>{grade}</td>
                    <td className="print-hidden">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handlePrintIndividual(studentReport.student._id)}
                      >
                        Print
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {renderReportFooter()}
      </div>
    );
  };

  const renderCourseReport = () => {
    if (!reports?.studentSummaries) return null;

    const course = reports.course;
    const units = course?.units || [];

    return (
      <div>
        {renderLetterhead()}
        
        <div className="report-title">Course Performance Report</div>
        
        <div className="report-meta">
          <span><strong>Course:</strong> {course?.courseName || 'N/A'}</span>
          <span><strong>Code:</strong> {course?.courseCode || 'N/A'}</span>
          <span><strong>Class:</strong> {course?.classId?.className || 'N/A'}</span>
          <span><strong>Date:</strong> {formatDate(new Date())}</span>
        </div>

        {reports.summary && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Total Students</p>
              <p className="text-xl font-bold">{reports.summary.totalStudents}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Class Average</p>
              <p className="text-xl font-bold">{reports.summary.classAverage}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Pass Rate</p>
              <p className="text-xl font-bold">{reports.summary.passRate}%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-xs text-gray-500 uppercase">CRNM</p>
              <p className="text-xl font-bold text-red-600">{reports.summary.totalCRNM}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Student Name</th>
                <th>Admission No.</th>
                {units.map((unit) => (
                  <th key={unit._id}>{unit.name}</th>
                ))}
                <th>Final</th>
                <th>Grade</th>
                <th className="print-hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.studentSummaries.map((summary, index) => {
                const grade = getGrade(summary.finalScore);
                
                return (
                  <tr key={summary.student._id}>
                    <td>{index + 1}</td>
                    <td className="font-medium">{summary.student.fullName}</td>
                    <td className="text-gray-500">{summary.student.admissionNumber || '-'}</td>
                    {units.map((unit) => {
                      const unitResult = summary.unitResults?.find(
                        (u) => u.unitId?.toString() === unit._id.toString()
                      );
                      const total = unitResult?.total;
                      return (
                        <td key={unit._id}>{renderScoreCell(total)}</td>
                      );
                    })}
                    <td className="font-semibold">{renderScoreCell(summary.finalScore)}</td>
                    <td className={`font-semibold ${getGradeColor(grade)}`}>{grade}</td>
                    <td className="print-hidden">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handlePrintIndividual(summary.student._id)}
                      >
                        Print
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {renderReportFooter()}
      </div>
    );
  };

  const renderStudentModalContent = () => {
    if (!selectedStudentReport) return null;

    const { student, courseReports } = selectedStudentReport;

    return (
      <>
        <div ref={studentReportRef}>
          <div className="text-center mb-6 pb-4 border-b-2 border-gray-300">
            {settings?.logo && (
              <img src={settings.logo} alt="Logo" className="h-16 w-16 mx-auto rounded-lg object-cover mb-2" />
            )}
            <h2 className="text-2xl font-bold uppercase tracking-wide">{settings?.schoolName || ''}</h2>
            {settings?.motto && <p className="text-gray-600 italic">"{settings.motto}"</p>}
          </div>

          <div className="text-center mb-4">
            <h3 className="text-lg font-bold uppercase underline">Student Performance Report</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase">Student Name</p>
              <p className="font-semibold">{student.fullName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Admission Number</p>
              <p className="font-semibold">{student.admissionNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Class</p>
              <p className="font-semibold">{student.classId?.className || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Academic Year</p>
              <p className="font-semibold">{settings?.academicYear || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Term</p>
              <p className="font-semibold">{settings?.term || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Date</p>
              <p className="font-semibold">{formatDate(new Date())}</p>
            </div>
          </div>

          {courseReports.map((courseReport, cIndex) => {
            const grade = getGrade(courseReport.finalScore);
            const remark = getGradeRemark(courseReport.finalScore, settings);
            const units = courseReport.course?.units || [];

            return (
              <div key={cIndex} className="mb-6">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-300">
                  <h4 className="font-bold text-gray-900">
                    {courseReport.course.courseName}
                    <span className="text-xs text-gray-500 ml-2">({courseReport.course.courseCode})</span>
                  </h4>
                  <div className="flex items-center space-x-2">
                    {courseReport.finalScore === CRNM ? (
                      <span className="text-red-600 font-bold text-xs">CRNM</span>
                    ) : (
                      <>
                        <span className="font-semibold">{courseReport.finalScore}</span>
                        <span className={`font-bold ${getGradeColor(grade)}`}>{grade}</span>
                      </>
                    )}
                  </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {units.map((unit) => {
                      const unitResult = courseReport.unitResults?.find(
                        (u) => u.unitId?.toString() === unit._id.toString()
                      );
                      const total = unitResult?.total;

                      return (
                        <tr key={unit._id}>
                          <td className="px-3 py-2 text-sm font-medium">{unit.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{unit.code || '-'}</td>
                          <td className="px-3 py-2 text-sm">
                            {total === CRNM ? (
                              <span className="text-red-600 font-semibold text-xs">CRNM</span>
                            ) : (
                              <span className="font-semibold">{total ?? '-'}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {remark && (
                  <p className="text-xs text-gray-500 mt-1">Remark: {remark}</p>
                )}
              </div>
            );
          })}

          {renderReportFooter()}
        </div>

        <div className="flex justify-end space-x-3 mt-6 print-hidden">
          <Button variant="secondary" onClick={() => setShowStudentModal(false)}>
            Close
          </Button>
          <Button onClick={handlePrintStudentReport}>
            Print Report
          </Button>
        </div>
      </>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and view reports</p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Report Type"
            options={[
              { value: 'class', label: 'Class Report' },
              { value: 'course', label: 'Course Report' },
            ]}
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              setSelectedItem('');
              setGenerated(false);
            }}
          />
          <Select
            label={reportType === 'class' ? 'Select Class' : 'Select Course'}
            placeholder={`Select ${reportType}`}
            options={reportType === 'class' ? classOptions : courseOptions}
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          />
          <div className="flex items-end">
            <Button onClick={handleGenerate} className="w-full">
              Generate Report
            </Button>
          </div>
        </div>
      </Card>

      {loading && <Spinner size="lg" className="py-12" />}

      {generated && !loading && (
        <Card>
          <div className="flex justify-between items-center mb-4 print-hidden">
            <h2 className="text-lg font-semibold text-gray-900">Report Results</h2>
            <Button variant="secondary" size="sm" onClick={handlePrintReport}>
              Print Report
            </Button>
          </div>
          <div ref={reportContentRef}>
            {reportType === 'class' ? renderClassReport() : renderCourseReport()}
          </div>
        </Card>
      )}

      <Modal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        title={selectedStudentReport ? `Student Report - ${selectedStudentReport.student.fullName}` : 'Student Report'}
        size="lg"
      >
        {renderStudentModalContent()}
      </Modal>
    </div>
  );
};

export default ReportsPage;