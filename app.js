const SUPABASE_URL = 'https://xujsnnbmrpozejxjzpvdc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DL1a4b2geMbD5OwmhGAvlg_TwDh-5BH';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let user = null;

async function init(){
  const { data } = await sb.auth.getSession();
  if(data.session){ user = data.session.user; document.getElementById('status').innerHTML = 'Signed in: ' + user.email + ' ✅'; loadProfile(); }
  else{ document.getElementById('status').innerHTML = 'Not signed in - Ready! ✅'; }
  loadAuctions();
}
init();

sb.auth.onAuthStateChange((e,s)=>{ if(s?.user){ user=s.user; document.getElementById('status').innerHTML='Signed in: '+user.email+' ✅'; loadProfile(); } });

async function register(){
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const display_name = document.getElementById('display_name').value;
  const referred_by = document.getElementById('ref_code_input').value.trim() || null;
  document.getElementById('status').innerHTML='Registering...';
  const { data, error } = await sb.auth.signUp({ email, password, options:{ data:{ display_name, referred_by } } });
  if(error){ document.getElementById('status').innerHTML='❌ '+error.message; } 
  else{ document.getElementById('status').innerHTML='✅ Registered! Check email if needed, now Login.'; user=data.user; }
}

async function login(){
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  document.getElementById('status').innerHTML='Logging in...';
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if(error) document.getElementById('status').innerHTML='❌ '+error.message;
  else{ user=data.user; document.getElementById('status').innerHTML='✅ Logged in '+user.email; loadProfile(); }
}

async function logout(){ await sb.auth.signOut(); user=null; document.getElementById('status').innerHTML='Logged out'; }

async function loadProfile(){
  if(!user) return;
  const { data: p } = await sb.from('profiles').select('*').eq('id', user.id).single();
  const { data: w } = await sb.from('wallets').select('*').eq('user_id', user.id).single();
  if(p){ document.getElementById('mycode').innerText = p.ref_code; document.getElementById('myrefs').innerText = p.ref_count; document.getElementById('mylevel').innerText = p.level; }
  if(w){ document.getElementById('balance').innerText = w.balance; }
}

async function depositVoucher(){
  if(!user){ alert('Login first'); return; }
  const amount = parseInt(document.getElementById('voucher_amount').value);
  const pin = document.getElementById('voucher_pin').value;
  if(amount < 50){ alert('Min R50'); return; }
  const { data: profile } = await sb.from('profiles').select('ref_code,referred_by').eq('id', user.id).single();
  const { error } = await sb.from('deposits').insert({ user_id: user.id, amount, pin, status:'pending', referred_by_code: profile?.referred_by || null });
  if(error) alert(error.message);
  else{ alert('Voucher submitted! Admin will approve with R5-R20 bonus.'); 
  // Auto-approve for demo (you can remove later)
  const { data: dep } = await sb.from('deposits').select('id').eq('user_id', user.id).order('created_at',{ascending:false}).limit(1).single();
  if(dep){ const { data: res } = await sb.rpc('approve_voucher_and_pay_referrer', { dep_id: dep.id }); alert(res); loadProfile(); }
  }
}

async function createAuction(){
  if(!user){ alert('Login'); return; }
  const title = document.getElementById('auction_title').value;
  const description = document.getElementById('auction_desc').value;
  const start_price = parseInt(document.getElementById('auction_price').value);
  const { error } = await sb.from('auctions').insert({ owner_id: user.id, title, description, start_price, current_price: start_price });
  if(error) alert(error.message); else { alert('Auction created!'); loadAuctions(); }
}

async function loadAuctions(){
  try{
    const { data, error } = await sb.from('auctions').select('*').order('created_at',{ascending:false});
    if(error) throw error;
    const div = document.getElementById('auctions');
    if(!data || data.length==0) div.innerHTML='<h3>Auctions</h3>No auctions yet - Create one!';
    else div.innerHTML='<h3>Auctions</h3>'+data.map(a=>`<div style="border:1px solid #444;padding:8px;margin:5px;border-radius:8px"><b>${a.title}</b> - R${a.current_price||a.start_price} <br>${a.description||''}<br><button onclick="bid('${a.id}',${(a.current_price||a.start_price)+10})">Bid R${(a.current_price||a.start_price)+10}</button></div>`).join('');
  }catch(e){
    document.getElementById('auctions').innerHTML = 'Error: '+e.message;
    document.getElementById('status').innerHTML = 'Ready! ✅ (Auctions: '+e.message+')';
  }
}

async function bid(auction_id, amount){
  if(!user){ alert('Login'); return; }
  const { data: w } = await sb.from('wallets').select('balance').eq('user_id', user.id).single();
  if(!w || w.balance < amount){ alert('Not enough balance. Deposit voucher first! Balance: R'+(w?.balance||0)); return; }
  const { error } = await sb.from('bids').insert({ auction_id, user_id: user.id, amount });
  if(!error){ await sb.from('auctions').update({ current_price: amount, current_winner: user.id }).eq('id', auction_id); await sb.from('wallets').update({ balance: w.balance - amount }).eq('user_id', user.id); alert('Bid placed R'+amount); loadAuctions(); loadProfile(); }
  else alert(error.message);
}
window.register=register; window.login=login; window.logout=logout; window.depositVoucher=depositVoucher; window.createAuction=createAuction; window.bid=bid;
