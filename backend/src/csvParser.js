import { parse } from 'csv-parse/sync';

const COLUMN_MAPPINGS = {
  fullName: ['full_name', 'name', 'full name', 'student name', 'candidate name'],
  email: ['email', 'email_id', 'email id', 'mail', 'mail id', 'student email'],
  position: ['position', 'role', 'designation', 'post'],
  department: ['department', 'dept', 'team', 'team_name', 'department_name'],
  appointmentId: ['appointment_id', 'appointment id', 'appt id', 'id', 'record id'],
  appointmentDate: ['appointment_date', 'appointment date', 'date', 'issue date', 'issue_date'],
  joiningDate: ['joining_date', 'joining date', 'join date'],
  duration: ['duration', 'tenure'],
  status: ['status', 'state'],
  phone: ['phone', 'mobile', 'contact', 'phone_number'],
  college: ['college', 'institution', 'university'],
  registrationNumber: ['registration_number', 'registration number', 'reg no', 'reg_number'],
  documentFilename: ['document_filename', 'document filename', 'filename', 'file']
};

export function autoMapHeaders(rawHeaders) {
  const mapping = {};
  const normalizedRaw = rawHeaders.map(h => ({
    original: h,
    clean: strClean(h)
  }));

  for (const [targetKey, synonyms] of Object.entries(COLUMN_MAPPINGS)) {
    for (const syn of synonyms) {
      const synClean = strClean(syn);
      const match = normalizedRaw.find(item => item.clean === synClean || item.clean.includes(synClean));
      if (match) {
        mapping[targetKey] = match.original;
        break;
      }
    }
  }

  return mapping;
}

export function parseAndValidateCSV(fileBuffer) {
  const content = fileBuffer.toString('utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  if (!records.length) {
    throw new Error('CSV file is empty or missing data rows.');
  }

  const rawHeaders = Object.keys(records[0]);
  const detectedMapping = autoMapHeaders(rawHeaders);

  const parsedRows = [];
  let validCount = 0;
  let attentionCount = 0;
  let invalidCount = 0;

  records.forEach((row, index) => {
    const rowNum = index + 2;
    const getValue = (key) => {
      const colName = detectedMapping[key];
      return colName && row[colName] !== undefined ? String(row[colName]).trim() : '';
    };

    const fullName = getValue('fullName');
    const email = getValue('email').toLowerCase();
    const position = getValue('position');
    const department = getValue('department') || 'Technical';
    const apptId = getValue('appointmentId') || `SOL-2026-${String(rowNum).padStart(3, '0')}`;
    const date = getValue('appointmentDate') || '20/08/2026';
    const joiningDate = getValue('joiningDate');
    const duration = getValue('duration');
    const status = getValue('status') || 'Verified';
    const phone = getValue('phone');
    const college = getValue('college');
    const regNo = getValue('registrationNumber');
    const docFilename = getValue('documentFilename');

    const issues = [];

    if (!fullName) issues.push('Missing Full Name');
    if (!email) issues.push('Missing Email Address');
    else if (!isValidEmail(email)) issues.push('Invalid Email Format');

    let rowStatus = 'VALID';
    if (issues.length > 0) {
      if (!fullName || !email) {
        rowStatus = 'INVALID';
        invalidCount++;
      } else {
        rowStatus = 'ATTENTION';
        attentionCount++;
      }
    } else {
      validCount++;
    }

    parsedRows.push({
      rowNum,
      appointmentId: apptId,
      fullName,
      email,
      position: position || 'Core Member',
      department,
      team: department,
      appointmentDate: date,
      joiningDate,
      duration,
      status,
      phone,
      college,
      registrationNumber: regNo,
      documentFilename: docFilename,
      statusCategory: rowStatus,
      issues
    });
  });

  return {
    rawHeaders,
    detectedMapping,
    summary: {
      total: records.length,
      valid: validCount,
      attention: attentionCount,
      invalid: invalidCount
    },
    rows: parsedRows
  };
}

function strClean(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
