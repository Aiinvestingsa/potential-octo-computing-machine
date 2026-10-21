// PHUZA AUCTION - FIXED NO ERROR VERSION
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

async function refreshAuthUI(){
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || null;

    if(user){
      if(els.userStatus) els.userStatus.textContent = 'Loading profile...';
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
      }
      loadWallet();
    } else {
      els.signedOut?.classList.remove('hidden');
      els.signedIn?.classList.add('hidden');
      els.createAuctionArea?.classList.add('hidden');
      if(els.userStatus) els.userStatus.textContent = 'Not signed in - Ready! ✅';
    }
  } catch(e){
    console.log('Auth check', e.message);
    if(e.message.includes('Auth session missing')){
      if(els.userStatus) els.userStatus.textContent = 'Not signed in - Ready! ✅';
      els.signedOut?.classList.remove('hidden');
      els.signedIn?.classList.add('hidden');
    } else {
      if(els.userStatus) els.userStatus.textContent = 'Ready';
    }
  }
  loadAuctions(); loadLeaderboard();
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
  showMessage(`✅ Registered! Check email if confirmation required. Code ${refCode||'none'} saved!`, 'success');
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
    if(els.auctions) els.auctions.innerHTML = data && data.length ? data.map(a => `<div class="auction"><div class="between"><h3>${a.title}</h3><span class="tag">R${a.current_price || a.start_price}</span></div><p class="small">${a.description||''}</p><p class="small">Ends: ${new Date(a.ends_at).toLocaleString()}</p><div class="row"><input id="bid_${a.id}" type="number" placeholder="Bid"><button onclick="placeBid('${a.id}')">Bid - Need R50</button></div></div>`).join('') : '<p class="muted">No auctions yet - Create after adding R50 voucher! If you see this and you ran SQL, create first listing!</p>';
  } catch(e){ if(els.auctions) els.auctions.innerHTML = `<p class="error">Run SQL schema.sql in Supabase! Tables missing.</p>`; }
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
  showMessage('✅ Auction published!', 'success'); loadAuctions();
}

window.placeBid = async function(auctionId){
  const input = document.getElementById(`bid_${auctionId}`);
  const amount = parseFloat(input?.value);
  if(!amount){ showMessage('Enter bid amount', 'error'); return; }
  const { data: { session } } = await supabase.auth.getSession();
  if(!session){ showMessage('Login to bid', 'error'); return; }
  const { error } = await supabase.from('bids').insert({ auction_id: auctionId, user_id: session.user.id, amount });
  if(error){ showMessage(error.message, 'error'); return; }
  await supabase.from('auctions').update({ current_price: amount }).eq('id', auctionId);
  showMessage(`✅ Bid R${amount}!`, 'success'); loadAuctions();
}

async function loadLeaderboard(){
  try{
    const { data } = await supabase.from('profiles').select('*').order('ref_count',{ascending:false}).limit(20);
    if(els.leaderCount) els.leaderCount.textContent = data ? data.length : 0;
    if(els.leaderboard) els.leaderboard.innerHTML = data ? data.map((u,i) => { const li=getLevelInfo(u.ref_count); const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`; const prize=i===0?'Bottle+R200':i===1?'Bottle+R100':i===2?'Bottle+R50':''; return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #292929"><span>${medal} ${u.ref_code} - ${u.ref_count} refs - ${li.name}</span><span class="small">${prize}</span></div>`; }).join('') : 'Run SQL schema.sql!';
  } catch(e){ if(els.leaderboard) els.leaderboard.textContent = 'Run SQL schema.sql - tables missing'; }
}

async function loadWallet(){
  const { data: { session } } = await supabase.auth.getSession();
  if(!session){ if(els.wallet) els.wallet.textContent = 'Sign in to view wallet.'; return; }
  try{
    const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', session.user.id).single();
    const { data: deposits } = await supabase.from('deposits').select('*').eq('user_id', session.user.id).order('created_at',{ascending:false}).limit(10);
    if(!wallet){ if(els.wallet) els.wallet.textContent = 'No wallet - Run SQL schema.sql! Trigger missing.'; return; }
    const depText = deposits ? deposits.map(d => `<div style="padding:6px 0;border-bottom:1px solid #292929"><b>R${d.amount} ${d.method}</b> - ${d.status} ${d.bonus_paid ? `→ Ref got R${d.bonus_paid}` : ''}</div>`).join('') : 'No deposits';
    if(els.wallet) els.wallet.innerHTML = `<p class="small">Balance: R${wallet.balance} • Withdrawn: R${wallet.withdraw_this_month}/500<br>Only R50+ voucher triggers bonus!</p>${depText}`;
  } catch(e){ if(els.wallet) els.wallet.textContent = 'Wallet table missing - Run SQL schema.sql!'; }
}

async function addVoucher(){
  const { data: { session } } = await supabase.auth.getSession();
  if(!session){ showMessage('Login first', 'error'); return; }
  const amount=parseInt(els.voucherAmount?.value)||50;
  const pin=els.voucherPin?.value.trim();
  const name=els.voucherName?.value.trim();
  if(amount < 50){ showMessage('Min R50!', 'error'); return; }
  if(!pin||pin.length<10){ showMessage('Enter PIN 16 digits', 'error'); return; }
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
  const { data, error } = await supabase.from('deposits').insert({ user_id: session.user.id, amount: amount, method: 'voucher', status: 'pending', pin: pin, ref_name: name, referred_by_code: profile?.referred_by || null }).select();
  if(error){ showMessage(error.message, 'error'); return; }
  showMessage(`✅ R${amount} voucher sent! ID: ${data[0].id}`, 'success');
  window.open(`https://wa.me/27789313670?text=${encodeURIComponent('💳 PHUZA R'+amount+' VOUCHER! '+name+' PIN '+pin+' Ref '+(profile?.referred_by||'none')+' ID '+data[0].id)}`,'_blank');
  loadWallet();
}

async function requestWithdraw(){
  const { data: { session } } = await supabase.auth.getSession();
  if(!session){ showMessage('Login first', 'error'); return; }
  const amount=parseInt(els.withdrawAmount?.value);
  const bank=els.withdrawBank?.value.trim();
  const acc=els.withdrawAcc?.value.trim();
  if(!amount||amount<100){ showMessage('Min R100', 'error'); return; }
  if(!bank||!acc){ showMessage('Enter bank + account', 'error'); return; }
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', session.user.id).single();
  if(!wallet || wallet.balance < amount){ showMessage('Not enough balance', 'error'); return; }
  if(wallet.withdraw_this_month + amount > 500){ showMessage(`R500/m limit! Remaining R${500-wallet.withdraw_this_month}`, 'error'); return; }
  const { error } = await supabase.from('withdrawals').insert({ user_id: session.user.id, amount: amount, fee: 10, you_get: amount-10, bank: bank, account: acc, status:'pending', month: new Date().toISOString().slice(0,7) });
  if(error){ showMessage(error.message, 'error'); return; }
  await supabase.from('wallets').update({balance: wallet.balance - amount, withdraw_this_month: wallet.withdraw_this_month + amount}).eq('user_id', session.user.id);
  showMessage(`✅ Withdraw R${amount} → R${amount-10} Pending`, 'success'); loadWallet();
}

els.signupBtn?.addEventListener('click', signUp);
els.loginBtn?.addEventListener('click', logIn);
els.logoutBtn?.addEventListener('click', logOut);
els.createAuctionBtn?.addEventListener('click', createAuction);
els.refreshBtn?.addEventListener('click', () => { loadAuctions(); loadLeaderboard(); loadWallet(); });
els.addVoucherBtn?.addEventListener('click', addVoucher);
els.withdrawBtn?.addEventListener('click', requestWithdraw);
els.copyReferralBtn?.addEventListener('click', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if(!session) return;
  const { data: profile } = await supabase.from('profiles').select('ref_code, ref_count, level').eq('id', session.user.id).single();
  if(!profile) return;
  const li=getLevelInfo(profile.ref_count);
  const link = `${window.location.origin}${window.location.pathname}?ref=${profile.ref_code}`;
  const text = `Join Phuza Durban 🍻 with code ${profile.ref_code}! Pay R50 voucher via 1Voucher! I am ${li.name} Level ${profile.level} R${li.pay}/ref! ${link}`;
  try{ await navigator.clipboard.writeText(text); showMessage('✅ Link copied!', 'success'); }catch{ prompt('Copy:', text); }
});

const urlParams = new URLSearchParams(window.location.search);
const refFromUrl = urlParams.get('ref');
if(refFromUrl && els.referralCode){ els.referralCode.value = refFromUrl.toUpperCase(); }

supabase.auth.onAuthStateChange(() => refreshAuthUI());
refreshAuthUI();
