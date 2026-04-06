/**
 * Limb Symmetry Index (LSI) Utility
 * Formula: LSI = (injured_score / uninjured_score) × 100
 *
 * Clinical thresholds (ACL/RTP protocols):
 *   LSI >= 90%  → Cleared for return-to-play consideration
 *   LSI 75-89%  → Moderate risk — continue rehabilitation
 *   LSI < 75%   → High risk — not cleared, escalate to clinician
 *
 * INFORMATIONAL USE ONLY — not a substitute for licensed clinical judgment.
 */

export const LSI_THRESHOLDS = {
  CLEARED:     { min: 90,  max: 100, label: 'Cleared',       color: 'text-vellera-green', bg: 'bg-vellera-green/20 border-vellera-green/40' },
  MODERATE:    { min: 75,  max: 89,  label: 'Moderate Risk', color: 'text-yellow-400',    bg: 'bg-yellow-500/20 border-yellow-500/40' },
  HIGH_RISK:   { min: 0,   max: 74,  label: 'High Risk',     color: 'text-red-400',       bg: 'bg-red-500/20 border-red-500/40' },
};

/**
 * Calculate LSI for a single limb pair measurement
 * @param {number} injuredScore  - Test value from injured limb (any unit, e.g. N, cm, seconds)
 * @param {number} uninjuredScore - Test value from uninjured (contralateral) limb
 * @returns {{ lsi: number, category: object, clearance: string, interpretation: string }}
 */
export function calculateLSI(injuredScore, uninjuredScore) {
  if (!uninjuredScore || uninjuredScore <= 0) {
    throw new Error('Uninjured score must be a positive number');
  }
  if (injuredScore < 0) {
    throw new Error('Injured score cannot be negative');
  }

  const lsi = (injuredScore / uninjuredScore) * 100;
  const rounded = Math.round(lsi * 10) / 10;

  let category;
  if (rounded >= LSI_THRESHOLDS.CLEARED.min) {
    category = LSI_THRESHOLDS.CLEARED;
  } else if (rounded >= LSI_THRESHOLDS.MODERATE.min) {
    category = LSI_THRESHOLDS.MODERATE;
  } else {
    category = LSI_THRESHOLDS.HIGH_RISK;
  }

  const clearance = rounded >= 90
    ? 'May progress to return-to-play protocol with clinical supervision'
    : rounded >= 75
    ? 'Continue rehabilitation — re-test in 2-4 weeks'
    : '⚠ HIGH RISK — Do not clear for return-to-play. Escalate to supervising clinician.';

  return {
    lsi: rounded,
    deficit: Math.round((100 - rounded) * 10) / 10,
    category,
    clearance,
    interpretation: `LSI ${rounded}% — ${category.label}. ${clearance}`,
    is_high_risk: rounded < 90,
  };
}

/**
 * Calculate LSI for a battery of tests (e.g., hop tests, strength)
 * @param {Array<{name: string, injured: number, uninjured: number}>} tests
 * @returns {{ tests: Array, composite_lsi: number, overall_risk: string }}
 */
export function calculateBatteryLSI(tests = []) {
  if (!tests.length) throw new Error('At least one test required');

  const results = tests.map(t => ({
    name: t.name,
    injured: t.injured,
    uninjured: t.uninjured,
    ...calculateLSI(t.injured, t.uninjured),
  }));

  const composite = results.reduce((sum, r) => sum + r.lsi, 0) / results.length;
  const compositeRounded = Math.round(composite * 10) / 10;

  const overallHighRisk = results.some(r => r.is_high_risk);

  return {
    tests: results,
    composite_lsi: compositeRounded,
    overall_risk: compositeRounded >= 90 ? 'CLEARED' : compositeRounded >= 75 ? 'MODERATE' : 'HIGH_RISK',
    any_high_risk: overallHighRisk,
    clearance_recommendation: compositeRounded >= 90 && !overallHighRisk
      ? 'Composite LSI meets threshold. Proceed with clinical RTP decision.'
      : 'One or more tests below threshold. Full RTP clearance not recommended.',
  };
}