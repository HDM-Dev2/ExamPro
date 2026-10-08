const { parseCSV } = require('./csvParser');
const { parseXLSX } = require('./xlsxParser');

const parseFileBuffer = (buffer, mimetype, originalname) => {
  const name = (originalname || '').toLowerCase();

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseXLSX(buffer);
  }

  if (name.endsWith('.csv') || mimetype === 'text/csv') {
    const text = buffer.toString('utf-8');
    return parseCSV(text);
  }

  throw new Error('Unsupported file type. Use .csv or .xlsx');
};

const normalizeRows = (rows) => {
  return rows.map((row) => ({
    admissionNumber: (row.admission_number || row.admissionnumber || row.admission_no || '').trim(),
    fullName: (row.full_name || row.fullname || row.name || '').trim(),
    phone: (row.phone || row.phone_number || row.mobile || '').trim()
  }));
};

module.exports = {
  parseFileBuffer,
  normalizeRows
};