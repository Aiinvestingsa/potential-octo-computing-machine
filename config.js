// PHUZA AUCTION - SUPABASE CONFIG
// Project: xujsnnbmrpozejxjzpvdc
// This key is safe to push to GitHub - it's publishable (not secret)

export const SUPABASE_URL = 'https://xujsnnbmrpozejxjzpvdc.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_DL1a4b2geMbD5OwmhGAvlg_TwDh-5BH';

// 5 LEVELS CONFIG - R5/R9/R13/R15/R20
export const LEVELS = {
  1: { min: 1, max: 50, pay: 5, name: 'LVL 1 - R5/ref' },
  2: { min: 51, max: 100, pay: 9, name: 'LVL 2 - R9/ref - Level-Up Notify!' },
  3: { min: 101, max: 200, pay: 13, name: 'LVL 3 - R13/ref - Level-Up Notify!' },
  4: { min: 201, max: 500, pay: 15, name: 'LVL 4 - R15/ref - Level-Up Notify!' },
  5: { min: 501, max: 1000, pay: 20, name: 'LVL 5 - R20/ref - Level-Up Notify!' }
};

// BUSINESS RULES
export const RULES = {
  SERVICE_FEE: 50, // R50 voucher service fee required
  VOUCHER_ONLY: true, // Only voucher triggers referral bonus
  WITHDRAW_MIN: 100,
  WITHDRAW_FEE: 10,
  WITHDRAW_LIMIT_MONTH: 500, // R500/m limit
  STREAK_DAYS: 7, // 7 days streak
