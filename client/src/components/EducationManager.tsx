import React, { useState } from 'react';
import { Plus, Edit3, Trash2, AlertCircle, GraduationCap } from 'lucide-react';
import { EducationEntry } from '../context/AuthContext';
import { EDUCATION_LEVELS } from '../constants/profileOptions';
import {
  getDefaultEducationStatus,
  getDisplayEducationStatus,
  isQualificationPursuing,
  formatAcademicScore,
  formatEducationTitle,
  validateEducationEntry
} from '../utils/educationHelpers';

interface EducationManagerProps {
  educationList: EducationEntry[];
  onChange: (next: EducationEntry[]) => void;
  compactLevelSelector?: boolean;
}

const STREAM_OPTIONS = ['Science', 'Commerce', 'Arts', 'Vocational', 'Other'];

const createEmptyDraft = (level = 'Undergraduate student'): EducationEntry => ({
  level,
  degree: '',
  specialization: '',
  institution: '',
  schoolName: '',
  board: '',
  duration: '',
  currentYear: '',
  currentSemester: '',
  currentYearOrSemester: '',
  expectedGraduationYear: '',
  graduationYear: '',
  classCompleted: level === 'Class 10 completed' ? 'Class 10' : level === 'Class 12 completed' ? 'Class 12' : '',
  stream: '',
  status: getDefaultEducationStatus(level),
  scoreType: level === 'Undergraduate student' ? 'CGPA' : 'Percentage',
  percentage: null,
  cgpa: null,
  cgpaScale: 10,
  grade: '',
  gradingSystem: ''
});

export const EducationManager: React.FC<EducationManagerProps> = ({
  educationList,
  onChange,
  compactLevelSelector = false
}) => {
  const [draft, setDraft] = useState<EducationEntry>(createEmptyDraft());
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [scaleChoice, setScaleChoice] = useState<'4' | '5' | '10' | 'custom'>('10');
  const [validationError, setValidationError] = useState('');

  const handleLevelChange = (newLevel: string) => {
    setValidationError('');
    setScaleChoice('10');
    setDraft(createEmptyDraft(newLevel));
  };

  const handleSaveEntry = () => {
    const err = validateEducationEntry(draft);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError('');

    const combinedYearSem = [draft.currentYear, draft.currentSemester].filter(Boolean).join(' | ');
    const normalized: EducationEntry = {
      ...draft,
      status: getDisplayEducationStatus(draft),
      currentYearOrSemester: combinedYearSem || draft.currentYearOrSemester || '',
      percentage:
        draft.scoreType === 'Percentage' && draft.percentage !== null && draft.percentage !== undefined
          ? Number(draft.percentage)
          : null,
      cgpa:
        draft.scoreType === 'CGPA' && draft.cgpa !== null && draft.cgpa !== undefined
          ? Number(draft.cgpa)
          : null,
      cgpaScale:
        draft.scoreType === 'CGPA' ? Number(draft.cgpaScale || 10) : null,
      grade: draft.scoreType === 'Grade' ? (draft.grade || '').trim() : '',
      gradingSystem: draft.scoreType === 'Grade' ? (draft.gradingSystem || '').trim() : ''
    };

    if (editingIdx !== null) {
      const next = [...educationList];
      next[editingIdx] = normalized;
      onChange(next);
      setEditingIdx(null);
    } else {
      onChange([...educationList, normalized]);
    }
    setDraft(createEmptyDraft());
    setScaleChoice('10');
  };

  const handleEdit = (idx: number) => {
    const target = educationList[idx];
    setValidationError('');
    setDraft({
      ...createEmptyDraft(target.level),
      ...target,
      status: getDisplayEducationStatus(target),
      scoreType: target.scoreType || (target.cgpa != null ? 'CGPA' : target.percentage != null ? 'Percentage' : target.grade ? 'Grade' : 'Percentage')
    });
    const sc = target.cgpaScale;
    if (sc === 4 || sc === 5 || sc === 10) {
      setScaleChoice(String(sc) as '4' | '5' | '10');
    } else if (sc) {
      setScaleChoice('custom');
    } else {
      setScaleChoice('10');
    }
    setEditingIdx(idx);
  };

  const handleDelete = (idx: number) => {
    onChange(educationList.filter((_, i) => i !== idx));
    if (editingIdx === idx) {
      setEditingIdx(null);
      setDraft(createEmptyDraft());
    }
  };

  const pursuing = isQualificationPursuing(draft);
  const scoreSectionLabel = pursuing ? 'Current Academic Score' : 'Final Academic Score';

  const isClass10OrBelow =
    draft.level === 'Class 10 completed' || draft.level === 'Below Class 10';
  const isClass12 = draft.level === 'Class 12 completed';
  const isDiplomaOrIti = draft.level === 'ITI' || draft.level === 'Diploma';
  const isUndergrad = draft.level === 'Undergraduate student';
  const isGradOrPg =
    draft.level === 'Graduate' ||
    draft.level === 'Postgraduate' ||
    draft.level === 'Doctorate' ||
    draft.level === 'Other qualifications';

  return (
    <div className="space-y-5">
      {/* Qualification Form */}
      <div className="p-5 rounded-3xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-4">
        {/* Level Selector */}
        <div>
          <label className="block text-xs font-semibold text-[#334155] mb-2">
            Qualification Level
          </label>
          {compactLevelSelector ? (
            <select
              value={draft.level}
              onChange={(e) => handleLevelChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs font-semibold outline-none focus:ring-2 focus:ring-[#BDE0FE]"
            >
              {EDUCATION_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {EDUCATION_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleLevelChange(lvl)}
                  className={`px-3 py-2 rounded-2xl border text-xs font-semibold transition text-center ${
                    draft.level === lvl
                      ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] border-[#60B6F8] text-[#1E3A5F] shadow-baby-sm'
                      : 'bg-white border-[#D8ECFA] text-[#64748B] hover:border-[#A2D2FF] hover:text-[#334155]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CLASS 10 / BELOW CLASS 10 */}
        {isClass10OrBelow && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                School Name <span className="text-[#64748B] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={draft.schoolName || ''}
                onChange={(e) => setDraft({ ...draft, schoolName: e.target.value })}
                placeholder="e.g. Kendriya Vidyalaya"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Board</label>
              <input
                type="text"
                value={draft.board || ''}
                onChange={(e) => setDraft({ ...draft, board: e.target.value })}
                placeholder="e.g. CBSE, ICSE, HBSE, State Board"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Year of Completion
              </label>
              <input
                type="text"
                value={draft.graduationYear || ''}
                onChange={(e) => setDraft({ ...draft, graduationYear: e.target.value })}
                placeholder="e.g. 2023"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Education Status
              </label>
              <select
                value={draft.status || 'Completed'}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              >
                <option value="Completed">Completed</option>
                <option value="Pursuing">Pursuing</option>
              </select>
            </div>
          </div>
        )}

        {/* CLASS 12 */}
        {isClass12 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                School Name <span className="text-[#64748B] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={draft.schoolName || ''}
                onChange={(e) => setDraft({ ...draft, schoolName: e.target.value })}
                placeholder="School name"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Board</label>
              <input
                type="text"
                value={draft.board || ''}
                onChange={(e) => setDraft({ ...draft, board: e.target.value })}
                placeholder="e.g. CBSE, ICSE, State Board"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Stream</label>
              <select
                value={draft.stream || ''}
                onChange={(e) => setDraft({ ...draft, stream: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              >
                <option value="">Select stream</option>
                {STREAM_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={draft.specialization || ''}
                onChange={(e) => setDraft({ ...draft, specialization: e.target.value })}
                placeholder="e.g. PCM, PCB, Non-Medical, Commerce with Maths"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Year of Completion
              </label>
              <input
                type="text"
                value={draft.graduationYear || ''}
                onChange={(e) => setDraft({ ...draft, graduationYear: e.target.value })}
                placeholder="e.g. 2025"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Education Status
              </label>
              <select
                value={draft.status || 'Completed'}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              >
                <option value="Completed">Completed</option>
                <option value="Pursuing">Pursuing</option>
              </select>
            </div>
          </div>
        )}

        {/* DIPLOMA / ITI */}
        {isDiplomaOrIti && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Institution Name
              </label>
              <input
                type="text"
                value={draft.institution || ''}
                onChange={(e) => setDraft({ ...draft, institution: e.target.value })}
                placeholder="Polytechnic / ITI Institute name"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Course or Trade
              </label>
              <input
                type="text"
                value={draft.degree || ''}
                onChange={(e) => setDraft({ ...draft, degree: e.target.value })}
                placeholder="e.g. Diploma in Computer Engineering, ITI Electrician"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Duration</label>
              <input
                type="text"
                value={draft.duration || ''}
                onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                placeholder="e.g. 2 Years, 3 Years"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Completion / Expected Year
              </label>
              <input
                type="text"
                value={draft.graduationYear || ''}
                onChange={(e) => setDraft({ ...draft, graduationYear: e.target.value })}
                placeholder="e.g. 2025"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Education Status
              </label>
              <select
                value={draft.status || 'Completed'}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              >
                <option value="Completed">Completed</option>
                <option value="Pursuing">Pursuing</option>
              </select>
            </div>
          </div>
        )}

        {/* UNDERGRADUATE STUDENT */}
        {isUndergrad && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Degree</label>
              <input
                type="text"
                value={draft.degree || ''}
                onChange={(e) => setDraft({ ...draft, degree: e.target.value })}
                placeholder="e.g. B.Tech, BCA, B.Com, BBA"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={draft.specialization || ''}
                onChange={(e) => setDraft({ ...draft, specialization: e.target.value })}
                placeholder="e.g. CSE (AI & ML), Data Science"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                College / University
              </label>
              <input
                type="text"
                value={draft.institution || ''}
                onChange={(e) => setDraft({ ...draft, institution: e.target.value })}
                placeholder="e.g. K.R. Mangalam University"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Current Year
                </label>
                <input
                  type="text"
                  value={draft.currentYear || ''}
                  onChange={(e) => setDraft({ ...draft, currentYear: e.target.value })}
                  placeholder="e.g. 2nd Year"
                  className="w-full px-3 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Current Semester
                </label>
                <input
                  type="text"
                  value={draft.currentSemester || ''}
                  onChange={(e) => setDraft({ ...draft, currentSemester: e.target.value })}
                  placeholder="e.g. 3rd Semester"
                  className="w-full px-3 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Expected Graduation Year
              </label>
              <input
                type="text"
                value={draft.expectedGraduationYear || ''}
                onChange={(e) => setDraft({ ...draft, expectedGraduationYear: e.target.value })}
                placeholder="e.g. 2029"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Education Status
              </label>
              <select
                value={draft.status || 'Pursuing'}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              >
                <option value="Pursuing">Pursuing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        )}

        {/* GRADUATE / POSTGRADUATE / DOCTORATE / OTHER */}
        {isGradOrPg && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                {draft.level === 'Other qualifications' ? 'Qualification / Certificate Name' : 'Degree'}
              </label>
              <input
                type="text"
                value={draft.degree || ''}
                onChange={(e) => setDraft({ ...draft, degree: e.target.value })}
                placeholder="e.g. B.Tech, MBA, M.Sc, PhD"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={draft.specialization || ''}
                onChange={(e) => setDraft({ ...draft, specialization: e.target.value })}
                placeholder="e.g. Computer Science, Finance, Marketing"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                University / Institution
              </label>
              <input
                type="text"
                value={draft.institution || ''}
                onChange={(e) => setDraft({ ...draft, institution: e.target.value })}
                placeholder="University or institute name"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Graduation Year
                </label>
                <input
                  type="text"
                  value={draft.graduationYear || ''}
                  onChange={(e) => setDraft({ ...draft, graduationYear: e.target.value })}
                  placeholder="e.g. 2025"
                  className="w-full px-3 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Education Status
                </label>
                <select
                  value={draft.status || 'Completed'}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                >
                  <option value="Completed">Completed</option>
                  <option value="Pursuing">Pursuing</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ACADEMIC SCORE SECTION (Percentage / CGPA / Grade) */}
        <div className="p-4 rounded-2xl bg-white border border-[#D8ECFA] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-[#334155]">{scoreSectionLabel}</p>
              <p className="text-[11px] text-[#64748B]">
                {pursuing
                  ? 'Enter your current aggregate percentage, CGPA, or grade (final score is not required while pursuing).'
                  : 'Enter the final percentage, CGPA, or grade obtained for this qualification.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Academic Score Type
              </label>
              <select
                value={draft.scoreType || 'Percentage'}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    scoreType: e.target.value as 'Percentage' | 'CGPA' | 'Grade'
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs font-semibold"
              >
                <option value="Percentage">Percentage</option>
                <option value="CGPA">CGPA</option>
                <option value="Grade">Grade</option>
              </select>
            </div>

            {draft.scoreType === 'Percentage' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Percentage Obtained (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={draft.percentage ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      percentage: e.target.value === '' ? null : Number(e.target.value)
                    })
                  }
                  placeholder="e.g. 85 (0 to 100)"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                />
              </div>
            )}

            {draft.scoreType === 'CGPA' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    CGPA Obtained
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={draft.cgpaScale || 10}
                    value={draft.cgpa ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        cgpa: e.target.value === '' ? null : Number(e.target.value)
                      })
                    }
                    placeholder="e.g. 8.2"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Maximum CGPA Scale
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={scaleChoice}
                      onChange={(e) => {
                        const val = e.target.value as '4' | '5' | '10' | 'custom';
                        setScaleChoice(val);
                        if (val !== 'custom') {
                          setDraft({ ...draft, cgpaScale: Number(val) });
                        }
                      }}
                      className="flex-1 px-3 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                    >
                      <option value="10">Out of 10</option>
                      <option value="4">Out of 4</option>
                      <option value="5">Out of 5</option>
                      <option value="custom">Custom</option>
                    </select>
                    {scaleChoice === 'custom' && (
                      <input
                        type="number"
                        min={1}
                        max={100}
                        step="0.1"
                        value={draft.cgpaScale ?? ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            cgpaScale: e.target.value === '' ? null : Number(e.target.value)
                          })
                        }
                        placeholder="Scale"
                        className="w-20 px-2.5 py-2 rounded-2xl border border-[#D8ECFA] text-xs"
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {draft.scoreType === 'Grade' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Grade</label>
                  <input
                    type="text"
                    value={draft.grade || ''}
                    onChange={(e) => setDraft({ ...draft, grade: e.target.value })}
                    placeholder="e.g. A+, O, First Class"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Grading System
                  </label>
                  <input
                    type="text"
                    value={draft.gradingSystem || ''}
                    onChange={(e) => setDraft({ ...draft, gradingSystem: e.target.value })}
                    placeholder="e.g. CBSE 9-Point, Letter Grade"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {validationError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {editingIdx !== null && (
            <button
              type="button"
              onClick={() => {
                setEditingIdx(null);
                setDraft(createEmptyDraft());
                setValidationError('');
              }}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#EAF7FF] text-[#64748B] border border-[#D8ECFA] text-xs font-semibold transition"
            >
              Cancel Edit
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveEntry}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{editingIdx !== null ? 'Update Qualification' : 'Add Qualification'}</span>
          </button>
        </div>
      </div>

      {/* Added Qualifications Display */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[#3B9EE8]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Added Qualifications ({educationList.length})
          </h3>
        </div>

        {educationList.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-[#BDE0FE] bg-[#F8FCFF] text-center text-xs text-[#64748B]">
            No qualifications added yet. Fill in your education details above and click{' '}
            <strong>Add Qualification</strong>.
          </div>
        ) : (
          <div className="space-y-3">
            {educationList.map((ed, idx) => {
              const displayStatus = getDisplayEducationStatus(ed);
              const scoreText = formatAcademicScore(ed);
              const titleText = formatEducationTitle(ed);
              const instText = ed.institution || ed.schoolName || '';
              const pursuingEntry = isQualificationPursuing(ed);

              const yearSemesterParts = [
                ed.currentYear,
                ed.currentSemester,
                !ed.currentYear && !ed.currentSemester ? ed.currentYearOrSemester : ''
              ].filter(Boolean);

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-[#D8ECFA] flex items-start justify-between gap-4 shadow-baby-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE]">
                        {ed.level}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          pursuingEntry
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {displayStatus}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-[#334155]">{titleText}</p>

                    {(instText || ed.board) && (
                      <p className="text-xs text-[#475569] font-medium">
                        {[instText, ed.board && !titleText.includes(ed.board) ? `${ed.board} Board` : '']
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B]">
                      {yearSemesterParts.length > 0 && (
                        <span>
                          {yearSemesterParts.join(' | ')} | {displayStatus}
                        </span>
                      )}
                      {ed.duration && <span>Duration: {ed.duration}</span>}
                      {pursuingEntry && ed.expectedGraduationYear && (
                        <span>Expected Graduation: {ed.expectedGraduationYear}</span>
                      )}
                      {!pursuingEntry && ed.graduationYear && (
                        <span>Completed: {ed.graduationYear}</span>
                      )}
                    </div>

                    {scoreText && (
                      <p className="text-xs font-bold text-[#1E3A5F] bg-[#EAF7FF]/80 inline-block px-3 py-1 rounded-xl border border-[#D8ECFA]">
                        {scoreText}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(idx)}
                      className="p-2 rounded-xl text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF]"
                      aria-label="Edit qualification"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="p-2 rounded-xl text-[#64748B] hover:text-rose-500 hover:bg-rose-50"
                      aria-label="Delete qualification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
