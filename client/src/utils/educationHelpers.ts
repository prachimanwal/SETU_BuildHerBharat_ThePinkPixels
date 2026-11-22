import { EducationEntry } from '../context/AuthContext';

export const getDefaultEducationStatus = (level: string): string => {
  if (level === 'Undergraduate student') return 'Pursuing';
  if (
    level === 'Class 10 completed' ||
    level === 'Class 12 completed' ||
    level === 'Graduate' ||
    level === 'Postgraduate' ||
    level === 'Doctorate'
  ) {
    return 'Completed';
  }
  return 'Completed';
};

export const isQualificationPursuing = (ed: EducationEntry): boolean => {
  const normalizedStatus = (ed.status || '').trim().toLowerCase();
  if (normalizedStatus === 'completed') return false;
  if (
    normalizedStatus.includes('pursuing') ||
    normalizedStatus.includes('studying') ||
    normalizedStatus.includes('final year') ||
    normalizedStatus.includes('awaiting')
  ) {
    return true;
  }
  // If status is unset, only Undergraduate student defaults to Pursuing
  return ed.level === 'Undergraduate student';
};

export const getDisplayEducationStatus = (ed: EducationEntry): string => {
  if (ed.status && ed.status.trim()) {
    // Ensure completed qualifications never accidentally show 'Pursuing'
    if (
      (ed.level === 'Class 10 completed' ||
        ed.level === 'Class 12 completed' ||
        ed.level === 'Graduate' ||
        ed.level === 'Postgraduate' ||
        ed.level === 'Doctorate') &&
      ed.status.trim().toLowerCase() === 'pursuing'
    ) {
      return 'Completed';
    }
    return ed.status.trim();
  }
  return getDefaultEducationStatus(ed.level);
};

export const formatAcademicScore = (ed: EducationEntry): string => {
  const pursuing = isQualificationPursuing(ed);
  const prefix = pursuing ? 'Current' : '';

  if (ed.scoreType === 'Percentage' && ed.percentage !== null && ed.percentage !== undefined) {
    return `${prefix ? `${prefix} ` : ''}Percentage: ${ed.percentage}%`;
  }
  if (ed.scoreType === 'CGPA' && ed.cgpa !== null && ed.cgpa !== undefined) {
    const scale = ed.cgpaScale || 10;
    return `${prefix ? `${prefix} ` : ''}CGPA: ${ed.cgpa}/${scale}`;
  }
  if (ed.scoreType === 'Grade' && ed.grade?.trim()) {
    return `${prefix ? `${prefix} ` : ''}Grade: ${ed.grade.trim()}${
      ed.gradingSystem?.trim() ? ` (${ed.gradingSystem.trim()})` : ''
    }`;
  }
  return '';
};

export const formatEducationTitle = (ed: EducationEntry): string => {
  if (ed.level === 'Class 12 completed') {
    const streamPart = ed.stream ? ` — ${ed.stream}` : '';
    const specPart = ed.specialization ? ` (${ed.specialization})` : '';
    return `Class 12${streamPart}${specPart}`;
  }
  if (ed.level === 'Class 10 completed') {
    return `Class 10${ed.board ? ` (${ed.board})` : ''}`;
  }
  if (ed.level === 'Below Class 10') {
    return ed.classCompleted ? `${ed.classCompleted}` : 'Below Class 10';
  }
  if (ed.degree) {
    return ed.specialization ? `${ed.degree} — ${ed.specialization}` : ed.degree;
  }
  return ed.level;
};

export const validateEducationEntry = (ed: EducationEntry): string | null => {
  if (!ed.level) return 'Please select a qualification level.';

  if (ed.scoreType === 'Percentage' && ed.percentage !== null && ed.percentage !== undefined) {
    if (Number.isNaN(Number(ed.percentage)) || Number(ed.percentage) < 0 || Number(ed.percentage) > 100) {
      return 'Percentage obtained must be between 0 and 100.';
    }
  }

  if (ed.scoreType === 'CGPA') {
    const scale = Number(ed.cgpaScale ?? 10);
    if (Number.isNaN(scale) || scale <= 0 || scale > 100) {
      return 'Please enter a valid maximum CGPA scale (e.g. 4, 5, or 10).';
    }
    if (ed.cgpa !== null && ed.cgpa !== undefined) {
      if (Number.isNaN(Number(ed.cgpa)) || Number(ed.cgpa) < 0 || Number(ed.cgpa) > scale) {
        return `CGPA obtained must be between 0 and ${scale}.`;
      }
    }
  }

  return null;
};
