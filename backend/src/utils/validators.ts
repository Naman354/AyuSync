/**
 * Reusable backend validation & sanitization utilities
 */

export interface PhoneValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

export function validatePhone(rawPhone: any): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { valid: false, normalized: '', error: 'Phone number is required' };
  }

  // Remove spaces, hyphens, and parenthesis
  const clean = rawPhone.trim().replace(/[\s\-()]/g, '');

  let normalized = clean;
  if (clean.length === 10 && !clean.startsWith('+')) {
    normalized = '+91' + clean;
  } else if (clean.startsWith('91') && clean.length === 12) {
    normalized = '+' + clean;
  }

  // Indian/E.164 phone regex: + followed by 10 to 15 digits
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  if (!phoneRegex.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: 'Invalid phone format. Please enter a valid 10-digit mobile number'
    };
  }

  return { valid: true, normalized };
}

export function sanitizeString(val: any, minLen = 1, maxLen = 255): { valid: boolean; value: string; error?: string } {
  if (val === undefined || val === null) {
    return { valid: minLen === 0, value: '', error: minLen > 0 ? 'Field is required' : undefined };
  }

  const str = String(val).trim();
  if (str.length < minLen) {
    return { valid: false, value: str, error: `Must be at least ${minLen} characters long` };
  }
  if (str.length > maxLen) {
    return { valid: false, value: str.slice(0, maxLen), error: `Cannot exceed ${maxLen} characters` };
  }

  return { valid: true, value: str };
}

export function validateAge(val: any): { valid: boolean; age?: number; error?: string } {
  if (val === undefined || val === null || val === '') {
    return { valid: true, age: undefined }; // optional age
  }

  const num = Number(val);
  if (!Number.isInteger(num) || num < 0 || num > 130) {
    return { valid: false, error: 'Age must be a whole number between 0 and 130' };
  }

  return { valid: true, age: num };
}

export function validateEnum<T extends string>(val: any, allowedValues: readonly T[], fieldName = 'Field'): { valid: boolean; value?: T; error?: string } {
  if (!val || !allowedValues.includes(val as T)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`
    };
  }
  return { valid: true, value: val as T };
}

export interface VitalItem {
  type: string;
  value: number | string;
  unit?: string;
}

export interface VitalValidationResult {
  valid: boolean;
  vitals: { type: string; value: number; unit: string }[];
  errors: string[];
}

export function validateVitals(rawVitals: any): VitalValidationResult {
  if (!Array.isArray(rawVitals)) {
    return { valid: false, vitals: [], errors: ['Vitals must be an array'] };
  }

  const validated: { type: string; value: number; unit: string }[] = [];
  const errors: string[] = [];

  for (const v of rawVitals) {
    if (!v || typeof v !== 'object') continue;
    const type = String(v.type || '').toUpperCase().trim();
    const num = parseFloat(String(v.value));

    if (isNaN(num)) {
      errors.push(`Vital ${type} has an invalid non-numeric value: ${v.value}`);
      continue;
    }

    let unit = String(v.unit || '').trim();

    // Physiological range validation
    switch (type) {
      case 'BP_SYSTOLIC':
      case 'SYSTOLIC':
        if (num < 50 || num > 280) errors.push(`Systolic BP (${num}) is outside plausible clinical range (50-280 mmHg)`);
        unit = unit || 'mmHg';
        break;
      case 'BP_DIASTOLIC':
      case 'DIASTOLIC':
        if (num < 30 || num > 180) errors.push(`Diastolic BP (${num}) is outside plausible clinical range (30-180 mmHg)`);
        unit = unit || 'mmHg';
        break;
      case 'SPO2':
        if (num < 40 || num > 100) errors.push(`SpO2 (${num}%) must be between 40% and 100%`);
        unit = unit || '%';
        break;
      case 'HEART_RATE':
      case 'PULSE':
        if (num < 30 || num > 250) errors.push(`Heart rate (${num} bpm) is outside plausible clinical range (30-250 bpm)`);
        unit = unit || 'bpm';
        break;
      case 'TEMP':
      case 'TEMPERATURE':
        if (num < 85 || num > 115) errors.push(`Temperature (${num}°F) is outside plausible clinical range (85-115°F)`);
        unit = unit || '°F';
        break;
      case 'GLUCOSE':
      case 'BLOOD_SUGAR':
        if (num < 20 || num > 700) errors.push(`Blood glucose (${num} mg/dL) is outside plausible clinical range (20-700 mg/dL)`);
        unit = unit || 'mg/dL';
        break;
      default:
        // Generic vitals
        break;
    }

    validated.push({ type, value: num, unit });
  }

  return {
    valid: errors.length === 0,
    vitals: validated,
    errors
  };
}
