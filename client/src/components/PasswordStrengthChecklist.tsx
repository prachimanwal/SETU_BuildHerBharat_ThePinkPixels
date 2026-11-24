import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { evaluatePasswordStrength } from '../utils/passwordStrength';

interface PasswordStrengthChecklistProps {
  password: string;
}

export const PasswordStrengthChecklist: React.FC<PasswordStrengthChecklistProps> = ({
  password
}) => {
  const evalResult = evaluatePasswordStrength(password);
  const pct = (evalResult.score / 5) * 100;

  return (
    <div className="p-3.5 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155] space-y-2.5">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-[#64748B] dark:text-[#94A3B8]">Password Strength</span>
        <span className={evalResult.textColor}>{password ? evalResult.label : 'Enter password'}</span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-[#EAF7FF] dark:bg-[#1E293B] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${evalResult.barColor}`}
          style={{ width: `${password ? Math.max(pct, 10) : 0}%` }}
        />
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {evalResult.checks.map((chk) => (
          <li
            key={chk.id}
            className={`flex items-center gap-1.5 text-[11px] font-medium ${
              chk.met
                ? 'text-emerald-700 dark:text-[#34D399]'
                : 'text-[#64748B] dark:text-[#94A3B8]'
            }`}
          >
            {chk.met ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 shrink-0 opacity-60" />
            )}
            <span>{chk.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
