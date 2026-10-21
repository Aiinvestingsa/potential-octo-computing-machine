import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const els = {
  userStatus: document.getElementById('userStatus'),
  configWarning: document.getElementById('configWarning'),
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
};

function getLevelInfo(count){
  if(count>=501) return {level:5, pay:20, name:`LVL 5 - R20/ref`, range:`501-1000`};
  if(count>=201) return {level:4, pay:15, name:`LVL 4 - R15/ref`, range:`201-500`};
  if(count>=101) return {level:3, pay:13, name:`LVL 3 - R13/ref`, range:`101-200`};
  if(count>=51) return {level:2, pay:9, name:`LVL 2 - R9/ref`, range:`51-100`};
  return {level:1, pay:5, name:`LVL 1 - R5/ref`, range:`1-50`};
}

function showMessage(text, type='notice'){
  els.message.textContent = text;
  els.message.className = type === 'error' ? 'notice error' : type === 'success' ? 'notice success' : 'notice';
  els.message.classList.remove('hidden');
  setTimeout(()=> els.message.classList.add('hidden'), 7000);
}

function showLevelUp(oldCount, newCount, oldInfo, newInfo){
  document.getElementById('luTitle').textContent = `🎉 LEVEL UP! 🎉`;
  document.getElementById('luLevel').textContent = `LEVEL ${newInfo.level} REACHED!`;
  document.getElementById('luDesc').textContent = `You had ${oldCount} refs (Level ${oldInfo.level}) → Now ${newCount} refs (Level ${newInfo.level})!`;
  document.getElementById('luOld').textContent = `Old: ${oldInfo.name} - R${oldInfo.pay}/ref`;
  document.getElementById('luNew').textContent = `New: ${newInfo.name} - R${newInfo.pay}/ref! Next referral R${newInfo.pay}!`;
  document.getElementById('luEarn').textContent = `Keep referring! Weekly leaderboard top 3 win bottle + R50-R200! Daily streak 7 days = R50 extra!`;
  document.getElementById('levelUpModal').style.display = 'flex';
  if(navigator.vibrate) navigator.vibrate([200,100,200,100,200,100,500]);
  if("Notification" in window && Notification.permission === "granted"){
    try{ new Notification(`🎉 LEVEL UP! LEVEL ${newInfo.level} REACHED!`, {body: `You had ${oldCount} refs → Now ${newCount} refs! Old R${oldInfo.pay}/ref → New R${newInfo.pay}/ref!`, requireInteraction:true}); }catch{}
  }
}

async function refreshAuthUI(){
  const { data: { user } } = await supabase.auth.getUser();
  if(user){
    els.signedOut.classList.add('hidden');
    els.signedIn.classList.remove('hidden');
    els.createAuctionArea.classList.remove('hidden');
    els.signedInEmail.textContent = user.email;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if(profile){
      const li = getLevelInfo(profile.ref_count);
      els.myReferralCode.textContent = `${profile.ref_code} | ${li.name} | ${profile.ref_count} refs | R${profile.ref_earned} earned`;
      els.userStatus.textContent = `Lvl ${profile.level} • R${li.pay}/ref • ${profile.ref_count} refs`;
      for(let i=1;i<=5;i++){ let seg=document.getElementById('seg'+i); if(seg) seg.className='level-segment'+(i<=profile.level?' filled':'')+(i==profile.level?' active':''); }
      document.getElementById('levelInfoText').textContent = `You: ${li.name} (${li.range}) | ${profile.ref_count} refs | Earned R${profile.ref_earned} | Next level at ${li.level==1?51:li.level==2?101:li.level==3?201:li.level==4?501:1000} refs`;
      const lastLevel = parseInt(localStorage.getItem('phuza_last_level')||'1');
      const lastCount = parseInt(localStorage.getItem('phuza_last_count')||'0');
      if(profile.level > lastLevel || (profile.ref_count > lastCount && profile.ref_count >= 51 && lastCount < 51) || (profile.ref_count >= 101 && lastCount < 101) || (profile.ref_count >= 201 && lastCount < 201) || (profile.ref_count >= 501 && lastCount < 501)){
        const oldInfo = getLevelInfo(lastCount);
        showLevelUp(lastCount, profile.ref_count, oldInfo, li);
      }
      localStorage.setItem('phuza_last_level', profile.level);
      localStorage.setItem('phuza_last_count', profile.ref_count);
    }
    const { data: streak } = await supabase.from('referral_streaks').select('*').eq('user_id', user.id).single();
    if(streak){
      els.streakBanner.classList.remove('hidden');
      els.streakBanner.textContent = `🔥 Daily Streak: ${streak.streak_count}/7 days - Refer 1 per day for 7 days get R50 extra bonus! Last: ${streak.last_referral_date || 'never'} | ${streak.streak_count >= 6 ? '1 more day for R50!' : `${7-streak.streak_count} days left for R50!`}`;
    }
  } else {
    els.signedOut.classList.remove('hidden');
    els.signedIn.classList.add('hidden');
    els.createAuctionArea.classList.add('hidden');
    els.userStatus.textContent = 'Not signed in';
    els.myReferralCode.textContent = '—';
  }
  loadAuctions(); loadLeaderboard(); loadWallet();
}

async function signUp(){
  const email = els.email.value.trim();
  const password = els.password.value.trim();
  const displayName = els.displayName.value.trim();
  const refCode = els.referralCode.value.trim().toUpperCase();
  if(!email || !password || password.length < 8){ showMessage('Valid email + 8 char password required', 'error'); return; }
  els.signupBtn.disabled = true;
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: displayName, referred_by: refCode, whatsapp: '' } }
  });
  els.signupBtn.disabled = false;
  if(error){ showMessage(error.message, 'error'); return; }
  showMessage(`✅ Registered! ${refCode ? `Code ${refCode} saved - Pay R50 voucher to give friend R5-R20 + Level-Up Notify at 51/101/201/501 + 7-day streak R50!` : 'Check email if confirmation enabled.'}`, 'success');
}

async function logIn(){
  const email = els.email.value.trim();
  const password = els.password.value.trim();
  if(!email || !password){ showMessage('Enter email + password', 'error'); return; }
  els.loginBtn.disabled = true;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  els.loginBtn.disabled = false;
  if(error){ showMessage(error.message, 'error'); return; }
  showMessage('✅ Logged in!', 'success');
  refreshAuthUI();
}

async function logOut(){ await supabase.auth.signOut(); refreshAuthUI(); showMessage('Logged out', 'success'); }

async function loadAuctions(){
  const { data } = await supabase.from('auctions').select('*').order('created_at', {ascending:false}).limit(20);
  if(!data){ els.auctions.innerHTML = '<p class="muted">No auctions</p>'; return; }
  els.auctionCount.textContent = data.length;
  els.auctions.innerHTML = data.length ? data.map(a => `
    <div class="auction">
      <div class="between"><h3>${a.title}</h3><span class="tag">R${a.current_price || a.start_price}</span></div>
      <p class="small">${a.description || ''}</p>
      <p class="small">Ends: ${new Date(a.ends_at).toLocaleString()}</p>
      <div class="row"><input id="bid_${a.id}" type="number" min="${(a.current_price||a.start_price)+1}" placeholder="Bid R${(a.current_price||a.start_price)+10}"><button onclick="placeBid('${a.id}')">Bid - Need R50 voucher</button></div>
    </div>
  `).join('') : '<p class="muted">No auctions yet - Create one! Need R50 voucher fee in wallet!</p>';
}

async function createAuction(){
  const title = els.newTitle.value.trim();
  const description = els.newDescription.value.trim();
  const startPrice = parseFloat(els.newStartPrice.value);
  if(!title || !startPrice){ showMessage('Title + Start price required', 'error'); return; }
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){ showMessage('Login first', 'error'); return; }
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
  if(!wallet || wallet.balance < 50){ showMessage('Need R50 voucher service fee in wallet! Add R50 voucher first!', 'error'); return; }
  const { error } = await supabase.from('auctions').insert({ owner_id: user.id, title, description, start_price: startPrice, current_price: startPrice });
  if(error){ showMessage(error.message, 'error'); return; }
  els.newTitle.value = ''; els.newDescription.value = ''; els.newStartPrice.value = '';
  showMessage('✅ Auction published! Shared live!', 'success');
  loadAuctions();
}

window.placeBid = async function(auctionId){
  const input = document.getElementById(`bid_${auctionId}`);
  const amount = parseFloat(input.value);
  if(!amount){ showMessage('Enter bid amount', 'error'); return; }
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){ showMessage('Login to bid - Need R50 voucher fee!', 'error'); return; }
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
  if(!wallet || wallet.balance < 50){ showMessage('Need R50 voucher service fee! Add R50 voucher!', 'error'); return; }
  const { error } = await supabase.from('bids').insert({ auction_id: auctionId, user_id: user.id, amount });
  if(error){ showMessage(error.message, 'error'); return; }
  await supabase.from('auctions').update({ current_price: amount, current_winner: user.id }).eq('id', auctionId);
  showMessage(`✅ Bid R${amount} placed!`, 'success');
  loadAuctions();
}

async function loadLeaderboard(){
  const { data } = await supabase.from('profiles').select('*').order('ref_count',{ascending:false}).limit(20);
  if(!data){ els.leaderboard.textContent = 'Loading...'; return; }
  els.leaderCount.textContent = data.length;
  els.leaderboard.innerHTML = data.map((u,i) => {
    const li=getLevelInfo(u.ref_count); const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`;
    const prize=i===0?'Bottle+R200':i===1?'Bottle+R100':i===2?'Bottle+R50':'';
    return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #292929"><span>${medal} ${u.ref_code} - ${u.ref_count} refs - ${li.name} R${li.pay}/ref - R${u.ref_earned}</span><span class="small">${prize}</span></div>`;
  }).join('') || 'No referrals yet - Be first! Must pay R50 voucher fee to count! Level-Up Notify at 51/101/201/501 + Streak 7 days R50!';
}

async function loadWallet(){
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){ els.wallet.textContent = 'Sign in to view your records.'; return; }
  const { data: deposits } = await supabase.from('deposits').select('*').eq('user_id', user.id).order('created_at',{ascending:false}).limit(10);
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
  const { data: withdrawals } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at',{ascending:false}).limit(5);
  if(!wallet){ els.wallet.textContent = 'No wallet yet - Trigger will create'; return; }
  const depText = deposits ? deposits.map(d => `<div style="padding:6px 0;border-bottom:1px solid #292929"><b>R${d.amount} ${d.method}</b> - <span style="color:${d.status=='approved'?'#22dd55':'#ffcc00'}">${d.status}</span> ${d.bonus_paid ? `→ Referrer got R${d.bonus_paid} Lvl ${d.level_paid}` : ''}<br><span class="small">${new Date(d.created_at).toLocaleString()} ${d.referred_by_code ? `Ref by ${d.referred_by_code}` : ''} ${d.pin ? `PIN ${d.pin}` : ''}</span></div>`).join('') : 'No deposits';
  const wdText = withdrawals ? withdrawals.map(w => `<div style="padding:4px 0"><b>R${w.amount} → R${w.you_get}</b> - ${w.status} - ${w.bank} ${w.account}<br><span class="small">${w.month} - R500/m limit</span></div>`).join('') : '';
  els.wallet.innerHTML = `<p class="small">Balance: R${wallet.balance} • Withdrawn: R${wallet.withdraw_this_month}/500 this month • Fee R10 Min R100<br>Withdraw limit R500/m • Only R50+ voucher triggers referral bonus R5-R20 + Level-Up Notify + Streak R50! Weekly leaderboard top 3 win bottle!</p>${depText}<div style="margin-top:8px"><b>Withdrawals:</b>${wdText||' None'}</div>`;
}

async function addVoucher(){
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){ showMessage('Login first', 'error'); return; }
  const amount=parseInt(els.voucherAmount.value)||50;
  const pin=els.voucherPin.value.trim();
  const name=els.voucherName.value.trim();
  if(amount<50){ showMessage('Min R50 voucher service fee!', 'error'); return; }
  if(!pin||pin.length<10){ showMessage('Enter 1Voucher PIN 16 digits', 'error'); return; }
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data, error } = await supabase.from('deposits').insert({ user_id: user.id, amount: amount, method: 'voucher', status: 'pending', pin: pin, ref_name: name, referred_by_code: profile?.referred_by || null }).select();
  if(error){ showMessage(error.message, 'error'); return; }
  showMessage(`✅ R${amount} voucher request sent! Admin approves: SELECT approve_voucher_and_pay_referrer('${data[0].id}'); If you used code ${profile?.referred_by||'none'}, friend gets R5-R20 + Level-Up Notify at 51/101/201/501!`, 'success');
  window.open(`https://wa.me/27789313670?text=${encodeURIComponent('💳 PHUZA R50 VOUCHER FEE! User '+name+' Amount R'+amount+' PIN '+pin+' Ref by '+(profile?.referred_by||'none')+' Approve: SELECT approve_voucher_and_pay_referrer(\''+data[0].id+'\')')}`,'_blank');
  els.voucherPin.value=''; els.voucherName.value='';
  loadWallet();
}

async function requestWithdraw(){
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){ showMessage('Login first', 'error'); return; }
  const amount=parseInt(els.withdrawAmount.value);
  const bank=els.withdrawBank.value.trim();
  const acc=els.withdrawAcc.value.trim();
  if(!amount||amount<100){ showMessage('Min R100', 'error'); return; }
  if(!bank||!acc){ showMessage('Enter bank + account', 'error'); return; }
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
  if(!wallet){ showMessage('No wallet', 'error'); return; }
  if(wallet.balance < amount){ showMessage(`Not enough balance R${wallet.balance}`, 'error'); return; }
  const hasVoucher = await supabase.from('deposits').select('*').eq('user_id', user.id).eq('method','voucher').eq('status','approved').gte('amount',50).limit(1);
  if(!hasVoucher.data || hasVoucher.data.length===0){ showMessage('Must have at least 1 approved R50 voucher fee to withdraw!', 'error'); return; }
  if(wallet.withdraw_this_month + amount > 500){ showMessage(`R500/m limit! Used R${wallet.withdraw_this_month}, remaining R${500-wallet.withdraw_this_month}`, 'error'); return; }
  const { error } = await supabase.from('withdrawals').insert({ user_id: user.id, amount: amount, fee:10, you_get: amount-10, bank: bank, account: acc, status:'pending', month: new Date().toISOString().slice(0,7) });
  if(error){ showMessage(error.message, 'error'); return; }
  await supabase.from('wallets').update({balance: wallet.balance - amount, withdraw_this_month: wallet.withdraw_this_month + amount}).eq('user_id', user.id);
  showMessage(`✅ Withdraw R${amount} → You get R${amount-10} Pending - Used R${wallet.withdraw_this_month + amount}/500 this month`, 'success');
  window.open(`https://wa.me/27789313670?text=${encodeURIComponent('💸 WITHDRAW R'+amount+' User '+user.email+' Bank '+bank+' Acc '+acc+' Used '+(wallet.withdraw_this_month+amount)+'/500')}`,'_blank');
  loadWallet();
}

els.signupBtn.addEventListener('click', signUp);
els.loginBtn.addEventListener('click', logIn);
els.logoutBtn.addEventListener('click', logOut);
els.createAuctionBtn.addEventListener('click', createAuction);
els.refreshBtn.addEventListener('click', () => { loadAuctions(); loadLeaderboard(); loadWallet(); });
els.addVoucherBtn.addEventListener('click', addVoucher);
els.withdrawBtn.addEventListener('click', requestWithdraw);
els.copyReferralBtn.addEventListener('click', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return;
  const { data: profile } = await supabase.from('profiles').select('ref_code, ref_count, level').eq('id', user.id).single();
  if(!profile) return;
  const li=getLevelInfo(profile.ref_count);
  const link = `${window.location.origin}${window.location.pathname}?ref=${profile.ref_code}`;
  const text = `Join Phuza Auction Durban 🍻🏆 with code ${profile.ref_code}! Pay R50 voucher service fee via 1Voucher (Shoprite/Boxer) to alcohol wallet! I am ${li.name} (Level ${profile.level}) - I get R${li.pay}/ref! Level-Up Notify at 51/101/201/501 + Daily Streak 7 days R50 bonus! Weekly leaderboard top 3 win bottle + R50-R200! ${link}`;
  try{ await navigator.clipboard.writeText(text); showMessage('✅ Referral link copied! Share + friend must pay R50 voucher fee! Level-Up Notify at 51/101/201/501!', 'success'); }
  catch{ prompt('Copy link:', text); }
  if("Notification" in window && Notification.permission === "default"){ Notification.requestPermission(); }
});

const urlParams = new URLSearchParams(window.location.search);
const refFromUrl = urlParams.get('ref');
if(refFromUrl){ els.referralCode.value = refFromUrl.toUpperCase(); showMessage(`Referral code ${refFromUrl.toUpperCase()} from link applied! Register + pay R50 voucher to give friend R5-R20 + Level-Up!`, 'success'); }

supabase.auth.onAuthStateChange(() => refreshAuthUI());
refreshAuthUI();
if("Notification" in window){ Notification.requestPermission().catch(()=>{}); }
