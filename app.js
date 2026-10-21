const SUPABASE_URL = 'https://xujsnnbmrpozejxjzpvdc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DL1a4b2geMbD5OwmhGAvlg_TwDh-5BH';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let user = null;
let waUser = null;

function setStatus(t){ const el=document.getElementById('status'); if(el) el.innerHTML=t; }
function cleanPhone(p){ return p.replace(/\D/g,'').slice(-10); }

async function init(){
  setStatus('Ready - WhatsApp Login ✅');
  const { data } = await sb.auth.getSession();
  if(data.session){ user=data.session.user; setStatus('Signed in: '+user.email+' ✅'); loadProfile(); }
  // Check WhatsApp session in localStorage
  const saved = localStorage.getItem('phuza_wa');
  if(saved){
    waUser = JSON.parse(saved);
    setStatus('📱 WhatsApp: '+waUser.phone+' ✅');
    document.getElementById('mycode').innerText = waUser.ref_code||'---';
    document.getElementById('balance').innerText = waUser.balance||0;
  }
  loadAuctions();
}
init();

// WHATSAPP REGISTER
async function registerWhatsApp(){
  const phoneRaw = document.getElementById('wa_phone').value;
  const pin = document.getElementById('wa_pin').value;
  const name = document.getElementById('wa_name').value || 'User';
  const refBy = document.getElementById('wa_ref').value.trim() || null;
  
  const phone = cleanPhone(phoneRaw);
  if(phone.length < 10){ alert('Enter valid WhatsApp e.g. 0761234567'); return; }
  if(pin.length < 4){ alert('PIN must be 4+ digits'); return; }
  
  setStatus('Registering WhatsApp '+phone+'...');
  try{
    // Check if exists
    const { data: exists } = await sb.from('whatsapp_accounts').select('phone').eq('phone', phone).single();
    if(exists){ alert('This WhatsApp already registered - Click Login'); return; }
    
    // Create fake email account for Supabase auth
    const fakeEmail = phone+'@phuza.whatsapp';
    const fakePass = pin + 'PhuzaSecure2024!';
    
    const { data, error } = await sb.auth.signUp({ email: fakeEmail, password: fakePass, options:{ data:{ display_name: name, referred_by: refBy } } });
    if(error && !error.message.includes('already registered')){ setStatus('❌ '+error.message); alert(error.message); return; }
    
    // If already registered error, try sign in
    let uid = data?.user?.id;
    if(!uid){
      const { data: loginData } = await sb.auth.signInWithPassword({ email: fakeEmail, password: fakePass });
      uid = loginData?.user?.id;
    }
    
    // Generate ref code
    const refCode = 'PHUZA-'+phone.slice(-4)+Math.floor(Math.random()*100);
    
    const { error: waErr } = await sb.from('whatsapp_accounts').insert({ phone, pin, user_id: uid, display_name: name, ref_code: refCode, balance: 0 });
    if(waErr){ setStatus('❌ '+waErr.message); alert(waErr.message); return; }
    
    // Also create profile/wallet if referral
    if(refBy){
      // Pay referral later via voucher
    }
    
    const newWa = { phone, pin, display_name: name, ref_code: refCode, balance: 0, user_id: uid };
    localStorage.setItem('phuza_wa', JSON.stringify(newWa));
    waUser = newWa;
    setStatus('✅ WhatsApp Registered! '+phone+' Code: '+refCode);
    document.getElementById('mycode').innerText = refCode;
    alert('✅ Registered! Your Code: '+refCode+'\nLogin next time with '+phone+' + PIN '+pin);
    
  }catch(e){ setStatus('❌ '+e.message); alert(e.message); }
}

// WHATSAPP LOGIN
async function loginWhatsApp(){
  const phoneRaw = document.getElementById('wa_phone').value;
  const pin = document.getElementById('wa_pin').value;
  const phone = cleanPhone(phoneRaw);
  
  if(phone.length < 10 || pin.length < 4){ alert('Enter phone + PIN'); return; }
  setStatus('Logging in '+phone+'...');
  
  try{
    const { data, error } = await sb.from('whatsapp_accounts').select('*').eq('phone', phone).eq('pin', pin).single();
    if(error || !data){ setStatus('❌ Wrong number or PIN'); alert('Wrong number or PIN - Register first'); return; }
    
    // Also login to Supabase auth for auctions
    const fakeEmail = phone+'@phuza.whatsapp';
    const fakePass = pin + 'PhuzaSecure2024!';
    const { data: authData } = await sb.auth.signInWithPassword({ email: fakeEmail, password: fakePass });
    if(authData?.user) user = authData.user;
    
    localStorage.setItem('phuza_wa', JSON.stringify(data));
    waUser = data;
    setStatus('✅ WhatsApp Login: '+phone+' ✅ Code: '+data.ref_code);
    document.getElementById('mycode').innerText = data.ref_code;
    document.getElementById('myrefs').innerText = data.ref_count||0;
    document.getElementById('balance').innerText = data.balance||0;
    loadProfile();
    alert('Welcome back! '+data.display_name);
  }catch(e){ setStatus('❌ '+e.message); }
}

// Keep old email functions
async function register(){ const email=document.getElementById('email').value; const password=document.getElementById('password').value; const { error }=await sb.auth.signUp({email,password}); if(error) alert(error.message); else alert('Email registered - Login'); }
async function login(){ const email=document.getElementById('email').value; const password=document.getElementById('password').value; const { data, error }=await sb.auth.signInWithPassword({email,password}); if(error) alert(error.message); else { user=data.user; setStatus('✅ '+user.email); loadProfile(); } }
async function logout(){ await sb.auth.signOut(); localStorage.removeItem('phuza_wa'); waUser=null; user=null; setStatus('Logged out'); location.reload(); }

async function loadProfile(){
  if(user){
    const { data: p } = await sb.from('profiles').select('*').eq('id', user.id).single();
    const { data: w } = await sb.from('wallets').select('*').eq('user_id', user.id).single();
    if(p){ document.getElementById('mycode').innerText=p.ref_code; document.getElementById('myrefs').innerText=p.ref_count||0; document.getElementById('mylevel').innerText=p.level||1; }
    if(w) document.getElementById('balance').innerText=w.balance||0;
  }
  if(waUser){
    document.getElementById('mycode').innerText=waUser.ref_code;
    document.getElementById('balance').innerText=waUser.balance||0;
  }
}
async function depositVoucher(){
  const amount=parseInt(document.getElementById('voucher_amount').value); const pin=document.getElementById('voucher_pin').value;
  if(amount<50){ alert('Min R50'); return; }
  let uid = user?.id || waUser?.user_id; let phone = waUser?.phone;
  if(!uid && !phone){ alert('Login first with WhatsApp'); return; }
  if(phone){
    const { data: acc } = await sb.from('whatsapp_accounts').select('*').eq('phone', phone).single();
    const newBal = (acc.balance||0)+amount;
    await sb.from('whatsapp_accounts').update({ balance: newBal }).eq('phone', phone);
    acc.balance=newBal; localStorage.setItem('phuza_wa', JSON.stringify(acc)); waUser=acc;
    setStatus('✅ Deposited R'+amount+' New Balance R'+newBal);
    document.getElementById('balance').innerText=newBal;
    alert('✅ Voucher R'+amount+' added! Balance R'+newBal);
  } else {
    const { data: prof } = await sb.from('profiles').select('referred_by').eq('id', uid).single();
    const { data: dep } = await sb.from('deposits').insert({ user_id: uid, amount, pin, status:'pending', referred_by_code: prof?.referred_by }).select().single();
    const { data: res } = await sb.rpc('approve_voucher_and_pay_referrer', { dep_id: dep.id });
    setStatus('✅ '+res); loadProfile();
  }
}
async function createAuction(){ const title=document.getElementById('auction_title').value; const desc=document.getElementById('auction_desc').value; const price=parseInt(document.getElementById('auction_price').value); const uid=user?.id||waUser?.user_id; if(!uid){ alert('Login'); return; } const { error }=await sb.from('auctions').insert({ owner_id: uid, title, description: desc, start_price: price, current_price: price }); if(error) alert(error.message); else { alert('Auction created!'); loadAuctions(); } }
async function loadAuctions(){ try{ const { data }=await sb.from('auctions').select('*').order('created_at',{ascending:false}); const div=document.getElementById('auctions'); if(!data||data.length==0) div.innerHTML='<h3>Auctions</h3>No auctions yet'; else div.innerHTML='<h3>Auctions</h3>'+data.map(a=>`<div style="border:1px solid #444;padding:8px;margin:5px;border-radius:8px"><b>${a.title}</b> - R${a.current_price||a.start_price}<br>${a.description||''}<br><button onclick="bid('${a.id}',${(a.current_price||a.start_price)+10})">Bid R${(a.current_price||a.start_price)+10}</button></div>`).join(''); }catch(e){ document.getElementById('auctions').innerHTML='Error '+e.message; } }
async function bid(id, amt){ let uid=user?.id||waUser?.user_id; if(!uid){ alert('Login'); return; } let bal=0; if(waUser){ const { data }=await sb.from('whatsapp_accounts').select('balance').eq('phone', waUser.phone).single(); bal=data?.balance||0; if(bal<amt){ alert('No balance R'+bal); return; } await sb.from('whatsapp_accounts').update({ balance: bal-amt }).eq('phone', waUser.phone); waUser.balance=bal-amt; localStorage.setItem('phuza_wa', JSON.stringify(waUser)); document.getElementById('balance').innerText=waUser.balance; } else { const { data: w }=await sb.from('wallets').select('balance').eq('user_id', uid).single(); if((w?.balance||0)<amt){ alert('No balance'); return; } await sb.from('wallets').update({ balance: w.balance-amt }).eq('user_id', uid); } await sb.from('bids').insert({ auction_id: id, user_id: uid, amount: amt }); await sb.from('auctions').update({ current_price: amt, current_winner: uid }).eq('id', id); alert('Bid R'+amt); loadAuctions(); }

window.registerWhatsApp=registerWhatsApp; window.loginWhatsApp=loginWhatsApp; window.register=register; window.login=login; window.logout=logout; window.depositVoucher=depositVoucher; window.createAuction=createAuction; window.bid=bid;
