// backend/tests/referral.test.ts
// 51. TESTING & QUALITY ASSURANCE

import { VALID_TRANSITIONS } from '../src/modules/referrals/referral.controller';

describe('Referral State Machine', () => {
  it('should allow valid initial transitions from CREATED', () => {
    expect(VALID_TRANSITIONS['CREATED']).toBeDefined();
    expect(VALID_TRANSITIONS['CREATED'].includes('SUBMITTED')).toBe(true);
    expect(VALID_TRANSITIONS['CREATED'].includes('CANCELLED')).toBe(true);
  });

  it('should allow valid doctor intake transitions from SUBMITTED', () => {
    expect(VALID_TRANSITIONS['SUBMITTED'].includes('ACCEPTED')).toBe(true);
    expect(VALID_TRANSITIONS['SUBMITTED'].includes('REJECTED')).toBe(true);
  });

  it('should allow clinic arrival and consultation transitions', () => {
    expect(VALID_TRANSITIONS['ACCEPTED'].includes('PATIENT_ARRIVED')).toBe(true);
    expect(VALID_TRANSITIONS['PATIENT_ARRIVED'].includes('IN_CONSULTATION')).toBe(true);
    expect(VALID_TRANSITIONS['IN_CONSULTATION'].includes('COUNTER_REFERRED')).toBe(true);
  });

  it('should allow counter-referral to follow-up loop', () => {
    expect(VALID_TRANSITIONS['COUNTER_REFERRED'].includes('FOLLOW_UP_REQUIRED')).toBe(true);
    expect(VALID_TRANSITIONS['FOLLOW_UP_REQUIRED'].includes('COMPLETED')).toBe(true);
  });

  it('should reject invalid skip transitions', () => {
    // Cannot skip directly from CREATED to COMPLETED
    expect(VALID_TRANSITIONS['CREATED'].includes('COMPLETED')).toBe(false);
    // Cannot jump from SUBMITTED to IN_CONSULTATION without doctor ACCEPTED
    expect(VALID_TRANSITIONS['SUBMITTED'].includes('IN_CONSULTATION')).toBe(false);
    // Cannot go backwards from COMPLETED
    expect(VALID_TRANSITIONS['COMPLETED']).toBeUndefined();
  });
});
