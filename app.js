import { SUPABASE_URL, SUPABASE_ANON_KEY, getLevelInfo, RULES } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elements from your HTML
const els = {
  userStatus: document.getElementById('userStatus'),
  message: document.getElementById('message'),
  signedOut: document.getElementById('signedOut'),
  signedIn: document.getElementById('signedIn'),
  signedInEmail: document.getElementById('signedInEmail'),
  myReferralCode: document.getElementById('myReferralCode'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  displayName: document.getElementById('displayName'),
  referralCode: document.getElementById('referralCode'),
  signupBtn: document.getElementById('signupBtn'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  copyReferralBtn: document.getElementById('copyReferralBtn'),
  auctionCount: document.getElementById('auctionCount'),
  leaderCount: document.getElementById('leaderCount'),
  auctions: document.getElementById('auctions'),
  leaderboard: document.getElementById('leaderboard'),
  wallet: document.getElementById('wallet'),
  createAuctionArea: document.getElementById('createAuctionArea'),
  newTitle: document.getElementById('newTitle'),
  newDescription: document.getElementById('newDescription'),
  newStartPrice: document.getElementById('newStartPrice'),
  createAuctionBtn: document.getElementById('createAuctionBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  voucherAmount: document.getElementById('voucherAmount'),
  voucherPin: document.getElementById('voucherPin'),
  voucherName: document.getElementById('voucherName'),
  addVoucherBtn: document.getElementById('addVoucherBtn'),
  withdrawAmount: document.getElementById('withdrawAmount'),
  withdrawBank: document.getElementById('withdrawBank'),
  withdrawAcc: document.getElementById('withdrawAcc'),
  withdrawBtn: document.getElementById('withdrawBtn'),
  streakBanner: document.getElementById('streakBanner'),
  levelUpModal: document.getElementById('levelUpModal'),
};

function showMessage(text, type='notice'){
  if(!els.message) return;
  els.message.textContent = text;
  els.message.className = type === 'error' ? 'notice error' : type === 'success' ? 'notice success
