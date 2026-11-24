export interface PasswordCheckItem {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordEvaluation {
  checks: PasswordCheckItem[];
  score: number; // 0-5
  label: 'Too weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  barColor: string;
  textColor: string;
  allMet: boolean;
}

export const evaluatePasswordStrength = (password: string): PasswordEvaluation => {
  const checks: PasswordCheckItem[] = [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'upper', label: 'One uppercase letter (A–Z)', met: /[A-Z]/.test(password) },
    { id: 'lower', label: 'One lowercase letter (a–z)', met: /[a-z]/.test(password) },
    { id: 'number', label: 'One number (0–9)', met: /[0-9]/.test(password) },
    {
      id: 'special',
      label: 'One special character (!@#$%...)',
      met: /[^A-Za-z0-9]/.test(password)
    }
  ];

  const score = checks.filter((c) => c.met).length;
  const allMet = score === checks.length;

  if (score <= 1) {
    return {
      checks,
      score,
      label: 'Too weak',
      barColor: 'bg-rose-500',
      textColor: 'text-rose-600 dark:text-[#F87171]',
      allMet
    };
  }
  if (score === 2) {
    return {
      checks,
      score,
      label: 'Weak',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-[#FBBF24]',
      allMet
    };
  }
  if (score === 3) {
    return {
      checks,
      score,
      label: 'Fair',
      barColor: 'bg-amber-400',
      textColor: 'text-amber-600 dark:text-[#FBBF24]',
      allMet
    };
  }
  if (score === 4) {
    return {
      checks,
      score,
      label: 'Good',
      barColor: 'bg-[#3B9EE8]',
      textColor: 'text-[#2589D6] dark:text-[#60A5FA]',
      allMet
    };
  }
  return {
    checks,
    score,
    label: 'Strong',
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-[#34D399]',
    allMet
  };
};
