export const SUPABASE_URL = 'https://xujsnnbmrpozejxjzpvdc.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_DL1a4b2geMbD5OwmhGAvlg_TwDh-5BH';

export const LEVELS = {
  1: { min: 1, max: 50, pay: 5, name: 'LVL 1 - R5/ref', level: 1 },
  2: { min: 51, max: 100, pay: 9, name: 'LVL 2 - R9/ref', level: 2 },
  3: { min: 101, max: 200, pay: 13, name: 'LVL 3 - R13/ref', level: 3 },
  4: { min: 201, max: 500, pay: 15, name: 'LVL 4 - R15/ref', level: 4 },
  5: { min: 501, max: 1000, pay: 20, name: 'LVL 5 - R20/ref', level: 5 }
};

export function getLevelInfo(count) {
  if (count >= 501) return LEVELS[5];
  if (count >= 201) return LEVELS[4];
  if (count >= 101) return LEVELS[3];
  if (count >= 51) return LEVELS[2];
  return LEVELS[1];
}

export const RULES = {
  SERVICE_FEE: 50,
  WITHDRAW_MIN: 100,
  WITHDRAW_FEE: 10,
  WITHDRAW_LIMIT_MONTH: 500
};
