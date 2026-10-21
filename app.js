// PHUZA AUCTION - STANDALONE APP.JS - NO CONFIG.JS NEEDED
// Project: xujsnnbmrpozejxjzpvdc
const SUPABASE_URL = 'https://xujsnnbmrpozejxjzpvdc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DL1a4b2geMbD5OwmhGAvlg_TwDh-5BH';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LEVELS = {
  1: { min: 1, max: 50, pay: 5, name: 'LVL 1 - R5/ref', level: 1 },
  2: { min: 51, max: 100, pay: 9, name: 'LVL 2 - R9/ref', level: 2 },
  3: { min: 101, max: 200, pay: 13, name: 'LVL 3 - R13/ref', level: 3 },
  4: { min: 201, max: 500, pay: 15, name: 'LVL 4 - R15/ref', level: 4 },
  5: { min: 501, max: 1000, pay: 20, name: 'LVL 5 - R20/ref', level: 5 }
};
function getLevelInfo(count) {
  if (count >= 501) return LEVELS[5];
  if (count >= 201) return LEVELS[4];
  if (count >= 101) return LEVELS[3];
  if (count >= 51) return LEVELS[2];
  return LEVELS[1];
}
const RULES = { SERVICE_FEE: 50, WITHDRAW_MIN: 100, WITHDRAW_FEE: 10, WITHDRAW_LIMIT_MONTH: 500 };

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
  els.message.className = type === 'error' ? 'notice error' : type === 'success' ? 'notice success' : 'notice';
  els.message.classList.remove('hidden');
  setTimeout(()=> { if(els.message) els.message.classList.add('hidden'); }, 7000);
}

function showLevelUp(oldCount, newCount, oldInfo, newInfo){
  const t1 = document.getElementById('luTitle');
  const t2 = document.getElementById('luLevel');
  const t3 = document.getElementById('luDesc');
  const t4 = document.getElementById('luOld');
  const t5 = document.getElementById('luNew');
  const t6 = document.getElementById('luEarn');
  if(t1) t1.textContent = `🎉 LEVEL UP! 🎉`;
  if(t2) t2.textContent = `LEVEL ${newInfo.level} REACHED!`;
  if(t3) t3.textContent = `You had ${oldCount} refs → Now ${newCount} refs!`;
  if(t4) t4.textContent = `Old: ${oldInfo.name} - R${oldInfo.pay}/ref`;
  if(t5) t5.textContent = `New: ${newInfo.name} - R${newInfo.pay}/ref!`;
  if(t6) t6.textContent = `Weekly top 3 win bottle! Daily streak 7 days = R50!`;
  if(els.levelUpModal) els.levelUpModal.style.display = 'flex';
  if(navigator.vibrate) navigator.vibrate([200,100,200,100,500]);
}

async function refreshAuthUI(){
  try {
    if(els.userStatus) els.userStatus.textContent = 'Connecting to Supabase...';
    const { data: { user }, error } = await supabase.auth.getUser();
    if(error) throw error;
    if(user){
      els.signedOut?.classList.add('hidden');
      els.signedIn?.classList.remove('hidden');
      els.createAuctionArea?.classList.remove('hidden');
      if(els.signedInEmail) els.signedInEmail.textContent = user.email;
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if(profile){
        const li = getLevelInfo(profile.ref_count || 0);
        if(els.myReferralCode) els.myReferralCode.textContent = `${profile.ref_code} | ${li.name} | ${profile.ref_count} refs | R${profile.ref_earned}`;
        if(els.userStatus) els.userStatus.textContent = `Lvl ${profile.level} • R${li.pay}/ref • ${profile.ref_count} refs`;
        for(let i=1;i<=5;i++){ let seg=document.getElementById('seg'+i); if(seg) seg.className='level-segment'+(i<=profile.level?' filled':'')+(i==profile.level?' active':''); }
        const lastLevel = parseInt(localStorage.getItem('phuza_last_level')||'0');
        const lastCount = parseInt(localStorage.getItem('phuza_last_count')||'0');
        if(profile.level > lastLevel && lastCount>0){
          const oldInfo = getLevelInfo(lastCount);
          showLevelUp(lastCount, profile.ref_count, oldInfo, li);
        }
        localStorage.setItem('phuza_last_level', profile.level);
        localStorage.setItem('phuza_last_count', profile.ref_count);
      } else {
        if(els.userStatus) els.userStatus.textContent = `Logged in - Profile creating...`;
      }
      const { data: streak } = await supabase.from('referral_streaks').select('*').eq('user_id', user.id).single();
      if(streak && els.streakBanner){
        els.streakBanner.classList.remove('hidden');
        els.streakBanner.textContent = `🔥 Streak: ${streak.streak_count}/7 days - ${7-streak.streak_count} left for R50!`;
      }
    } else {
      els.signedOut?.classList.remove('hidden');
      els.signedIn?.classList.add('hidden');
      els.createAuctionArea?.classList.add('hidden');
      if(els.userStatus) els.userStatus.textContent = 'Not signed in - Ready!';
    }
  } catch(e){
    console.error(e);
    if(els.userStatus) els.userStatus.textContent = 'Error: ' + e.message;
    showMessage('Supabase error: ' + e.message + ' - Check if SQL was run!', 'error');
  }
  loadAuctions(); loadLeaderboard(); loadWallet();
}

async function signUp(){
  const email = els.email?.value.trim();
  const password = els.password?.value.trim();
  const displayName = els.displayName?.value.trim();
  const refCode = els.referralCode?.value.trim().toUpperCase();
  if(!email || !password || password.length < 8){ showMessage('Email + 8 char password required', 'error'); return; }
  if(els.signupBtn) els.signupBtn.disabled = true;
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName, referred_by: refCode } } });
  if(els.signupBtn) els.signupBtn.disabled = false;
  if(error){ showMessage(error.message, 'error'); return; }
  showMessage(`✅ Registered! ${refCode ? `Code ${refCode} saved!` : ''} Now login.`, 'success');
}

async function logIn(){
  const email = els.email?.value.trim();
  const password = els.password?.value.trim();
  if(!email || !password){ showMessage('Enter email + password', 'error'); return; }
  if(els.loginBtn) els.loginBtn.disabled = true;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if(els.loginBtn) els.loginBtn.disabled = false;
  if(error){ showMessage(error.message, 'error'); return; }
  showMessage('✅ Logged in!', 'success');
  refreshAuthUI();
}

async function logOut(){ await supabase.auth.signOut(); localStorage.clear(); refreshAuthUI(); showMessage('Logged out', 'success'); }

async function loadAuctions(){
  try{
    const { data } = await supabase.from('auctions').select('*').order('created_at', {ascending:false}).limit(20);
    if(els.auctionCount) els.auctionCount.textContent = data ? data.length : 0;
    if(els.auctions) els.auctions.innerHTML = data && data.length ? data.map(a => `
      <div class="auction"><div class="between"><h3>${a.title}</h3><span class="tag">R${a.current_price || a.start_price}</span></div>
      <p class="small">${a.description || ''}</p><p class="small">Ends: ${new Date(a.ends_at).toLocaleString()}</p>
      <div class="row"><input id="bid_${a.id}" type="number" placeholder="Bid"><button onclick="placeBid('${a.id}')">Bid - Need R50</button></div></div>
    `).join('') : '<p class="muted">No auctions yet - Need R50 voucher to create! Did you run SQL schema?</p>';
  } catch(e){ if(els.auctions) els.auctions.innerHTML = `<p class="error">Auctions table not found - Run SQL schema.sql in Supabase!</p>`; }
}

async function createAuction(){
  const title = els.newTitle?.value.trim();
  const description = els.newDescription?.value.trim();
  const startPrice = parseFloat(els.newStartPrice?.value);
  if(!title || !startPrice){ showMessage('Title + Start price required', 'error'); return; }
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){ showMessage('Login first', 'error'); return; }
  const { error } = await supabase.from('auctions').insert({ owner_id: user.id, title, description, start_price: startPrice, current_price: startPrice });
  if(error){ showMessage(error.message, 'error'); return; }
  showMessage('✅ Auction published!', 'success');
  loadAuctions();
}

window.placeBid = async function(auctionId){
  const input = document.getElementById(`bid_${auctionId}`);
  const amount = parseFloat(input?.value);
  if(!amount){ showMessage('Enter bid amount', 'error'); return; }
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){ showMessage('Login to bid', 'error'); return; }
  const { error } = await supabase.from('bids').insert({ auction_id: auctionId, user_id: user.id, amount });
  if(error){ showMessage(error.message, 'error'); return; }
  await supabase.from('auctions').update({ current_price: amount }).eq('id', auctionId);
  showMessage(`✅ Bid R${amount} placed!`, 'success');
  loadAuctions();
}

async function loadLeaderboard(){
  try{
    const { data } = await supabase.from('profiles').select('*').order('ref_count',{ascending:false}).limit(20);
    if(els.leaderCount) els.leaderCount.textContent = data ? data.length : 0;
    if(els.leaderboard) els.leaderboard.innerHTML = data ? data.map((u,i) => {
      const li=getLevelInfo(u.ref_count); const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`;
      const prize=i===0?'Bottle+R200':i===1?'Bottle+R100':i===2?'Bottle+R50':'';
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #292929"><span>${medal} ${u.ref_code} - ${u.ref_count} refs - ${li.name}</span><span class="small">${prize}</span></div>`;
    }).join('') : 'Run SQL schema.sql first!';
  } catch(e){ if(els.leaderboard) els.leaderboard.textContent = 'Run SQL schema.sql - leaderboard table missing'; }
}

async function loadWallet(){
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){ if(els.wallet) els.wallet.textContent = 'Sign in to view.'; return; }
  try{
    const { data: deposits } = await supabase.from('deposits').select('*').eq('user_id', user.id).order('created_at',{ascending:false}).limit(10);
    const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
    if(!wallet){ if(els.wallet) els.wallet.textContent = 'No wallet yet - SQL trigger missing! Run schema.sql!'; return; }
    const depText = deposits ? deposits.map(d => `<div style="padding:6px 0;border-bottom:1px solid #292929"><b>R${d.amount} ${d.method}</b> - ${d.status} ${d.bonus_paid ? `→ Ref got R${d.bonus_paid}` : ''}<br><span class="small">${new Date(d.created_at).toLocaleString()}</span></div>`).join('') : 'No deposits';
    if(els.wallet) els.wallet.innerHTML = `<p class="small">Balance: R${wallet.balance} • Withdrawn: R${wallet.withdraw_this_month}/500<br>Only R50+ voucher triggers bonus!</p>${depText}`;
  } catch(e){ if(els.wallet) els.wallet.textContent = 'Tables missing - Run SQL schema.sql!'; }
}

async function addVoucher(){
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){ showMessage('Login first', 'error'); return; }
  const amount=parseInt(els.voucherAmount?.value)||50;
  const pin=els.voucherPin?.value.trim();
  const name=els.voucherName?.value.trim();
  if(amount < 50){ showMessage('Min R50!', 'error'); return; }
  if(!pin||pin.length<10){ showMessage('Enter PIN 16 digits', 'error'); return; }
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data, error } = await supabase.from('deposits').insert({ user_id: user.id, amount: amount, method: 'voucher', status: 'pending', pin: pin, ref_name: name, referred_by_code: profile?.referred_by || null }).select();
  if(error){ showMessage(error.message, 'error'); return; }
  showMessage(`✅ R${amount} voucher sent! Admin: SELECT approve_voucher_and_pay_referrer('${data[0].id}');`, 'success');
  window.open(`https://wa.me/27789313670?text=${encodeURIComponent('💳 PHUZA R'+amount+' VOUCHER! User '+name+' PIN '+pin+' Ref '+(profile?.referred_by||'none')+' Approve ID '+data[0].id)}`,'_blank');
  loadWallet();
}

async function requestWithdraw(){
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){ showMessage('Login first', 'error'); return; }
  const amount=parseInt(els.withdrawAmount?.value);
  const bank=els.withdrawBank?.value.trim();
  const acc=els.withdrawAcc?.value.trim();
  if(!amount||amount<100){ showMessage('Min R100', 'error'); return; }
  if(!bank||!acc){ showMessage('Enter bank + account', 'error'); return; }
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
  if(!wallet || wallet.balance < amount){ showMessage('Not enough balance', 'error'); return; }
  if(wallet.withdraw_this_month + amount > 500){ showMessage(`R500/m limit! Remaining R${500-wallet.withdraw_this_month}`, 'error'); return; }
  const { error } = await supabase.from('withdrawals').insert({ user_id: user.id, amount: amount, fee: 10, you_get: amount-10, bank: bank, account: acc, status:'pending', month: new Date().toISOString().slice(0,7) });
  if(error){ showMessage(error.message, 'error'); return; }
  await supabase.from('wallets').update({balance: wallet.balance - amount, withdraw_this_month: wallet.withdraw_this_month + amount}).eq('user_id', user.id);
  showMessage(`✅ Withdraw R${amount} → R${amount-10} Pending`, 'success');
  loadWallet();
}

els.signupBtn?.addEventListener('click', signUp);
els.loginBtn?.addEventListener('click', logIn);
els.logoutBtn?.addEventListener('click', logOut);
els.createAuctionBtn?.addEventListener('click', createAuction);
els.refreshBtn?.addEventListener('click', () => { loadAuctions(); loadLeaderboard(); loadWallet(); });
els.addVoucherBtn?.addEventListener('click', addVoucher);
els.withdrawBtn?.addEventListener('click', requestWithdraw);
els.copyReferralBtn?.addEventListener('click', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return;
  const { data: profile } = await supabase.from('profiles').select('ref_code, ref_count, level').eq('id', user.id).single();
  if(!profile) return;
  const li=getLevelInfo(profile.ref_count);
  const link = `${window.location.origin}${window.location.pathname}?ref=${profile.ref_code}`;
  const text = `Join Phuza Durban 🍻 with code ${profile.ref_code}! Pay R50 voucher via 1Voucher! I am ${li.name} Level ${profile.level} R${li.pay}/ref! Level-Up at 51/101/201/501 + Streak 7 days R50! ${link}`;
  try{ await navigator.clipboard.writeText(text); showMessage('✅ Link copied!', 'success'); }catch{ prompt('Copy:', text); }
});

const urlParams = new URLSearchParams(window.location.search);
const refFromUrl = urlParams.get('ref');
if(refFromUrl && els.referralCode){ els.referralCode.value = refFromUrl.toUpperCase(); }

supabase.auth.onAuthStateChange(() => refreshAuthUI());
refreshAuthUI();
