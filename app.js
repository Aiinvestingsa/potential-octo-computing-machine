import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config.js";

const $ = (id) => document.getElementById(id);
const isConfigured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");

let supabase = null, currentUser = null, currentProfile = null, auctionChannel = null, bidsChannel = null;

function message(text, type = "notice") {
  const el = $("message"); el.textContent = text; el.className = type;
  el.classList.remove("hidden");
}
function money(value) { return "R" + Number(value || 0).toLocaleString("en-ZA", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function setSignedIn(user, profile) {
  currentUser = user; currentProfile = profile;
  $("signedOut").classList.toggle("hidden", !!user);
  $("signedIn").classList.toggle("hidden", !user);
  $("createAuctionArea").classList.toggle("hidden", !user);
  $("userStatus").textContent = user ? (user.email || "Signed in") : "Not signed in";
  $("signedInEmail").textContent = user?.email || "";
  $("myReferralCode").textContent = profile?.referral_code || "—";
}
async function loadProfile() {
  if (!currentUser) { currentProfile = null; setSignedIn(null, null); return; }
  const { data, error } = await supabase.from("profiles").select("id,display_name,referral_code,created_at").eq("id", currentUser.id).maybeSingle();
  if (error) console.error("Profile load:", error.message);
  setSignedIn(currentUser, data || null);
}
async function refreshAuctions() {
  const box = $("auctions");
  const { data, error } = await supabase.from("auctions")
    .select("id,title,description,start_price,current_price,status,ends_at,created_at,seller_id")
    .order("created_at", { ascending: false }).limit(100);
  if (error) { box.innerHTML = `<p class="error">Could not load auctions: ${escapeHtml(error.message)}</p>`; return; }
  const open = (data || []).filter(a => a.status === "open");
  $("auctionCount").textContent = open.length;
  if (!data?.length) { box.innerHTML = '<p class="muted">No listings yet. Sign in and create the first listing.</p>'; return; }
  box.innerHTML = data.map(a => `
    <article class="auction">
      <div class="between"><h3>${escapeHtml(a.title)}</h3><span class="tag">${escapeHtml(a.status)}</span></div>
      <p>${escapeHtml(a.description || "No description provided.")}</p>
      <p><b>Current bid: ${money(a.current_price ?? a.start_price)}</b></p>
      <p class="small">Starting price: ${money(a.start_price)} · Posted ${new Date(a.created_at).toLocaleString()}</p>
      ${a.ends_at ? `<p class="small">Ends: ${new Date(a.ends_at).toLocaleString()}</p>` : ""}
      ${a.status === "open" ? `<div class="row mobile"><input id="bid-${a.id}" type="number" min="${Number(a.current_price ?? a.start_price)+0.01}" step="0.01" placeholder="Your bid in R"><button data-bid="${a.id}" ${!currentUser ? "disabled" : ""}>Place bid</button></div>` : ""}
      <div id="bids-${a.id}" class="small muted">Latest bids load when refreshed.</div>
    </article>`).join("");
  box.querySelectorAll("[data-bid]").forEach(btn => btn.addEventListener("click", () => placeBid(btn.dataset.bid)));
  await loadLatestBids(data.map(a => a.id));
}
async function loadLatestBids(ids) {
  if (!ids.length) return;
  const { data, error } = await supabase.from("bids")
    .select("id,auction_id,bidder_id,amount,created_at")
    .in("auction_id", ids).order("created_at", {ascending:false}).limit(50);
  if (error) { console.warn("Bid history:", error.message); return; }
  const bidderIds = [...new Set((data || []).map(b => b.bidder_id))];
  let names = {};
  if (bidderIds.length) {
    const { data: people, error: peopleError } = await supabase.from("public_profiles")
      .select("id,display_name").in("id", bidderIds);
    if (!peopleError) (people || []).forEach(p => names[p.id] = p.display_name);
  }
  const grouped = {};
  (data || []).forEach(b => { (grouped[b.auction_id] ||= []).push(b); });
  ids.forEach(id => {
    const el = $(`bids-${id}`); if (!el) return;
    const rows = (grouped[id] || []).slice(0,5);
    el.innerHTML = rows.length ? "<b>Recent bids</b><br>" + rows.map(b =>
      `${escapeHtml(names[b.bidder_id] || "Member")} — ${money(b.amount)} <span class="muted">(${new Date(b.created_at).toLocaleString()})</span>`
    ).join("<br>") : "No bids yet.";
  });
}
async function placeBid(auctionId) {
  if (!currentUser) return message("Please log in before bidding.");
  const amount = Number($(`bid-${auctionId}`)?.value);
  if (!Number.isFinite(amount) || amount <= 0) return message("Enter a valid positive bid.");
  const { error } = await supabase.rpc("place_bid", { p_auction_id: auctionId, p_amount: amount });
  if (error) return message("Bid was not accepted: " + error.message);
  message("Bid submitted successfully.", "notice success");
  await refreshAuctions();
}
async function createAuction() {
  if (!currentUser) return message("Please log in first.");
  const title = $("newTitle").value.trim(), description = $("newDescription").value.trim(), startPrice = Number($("newStartPrice").value);
  if (title.length < 3) return message("Enter a title of at least 3 characters.");
  if (!Number.isFinite(startPrice) || startPrice <= 0) return message("Starting price must be greater than zero.");
  const { error } = await supabase.from("auctions").insert({
    title, description, start_price: startPrice, current_price: startPrice, seller_id: currentUser.id
  });
  if (error) return message("Listing not created: " + error.message);
  $("newTitle").value = ""; $("newDescription").value = ""; $("newStartPrice").value = "";
  message("Listing published for everyone to see.", "notice success");
  await refreshAuctions();
}
async function refreshLeaderboard() {
  const box = $("leaderboard");
  const { data, error } = await supabase.from("public_leaderboard").select("display_name,referral_count,joined_at").limit(50);
  if (error) { box.innerHTML = `<p class="error">Leaderboard unavailable: ${escapeHtml(error.message)}</p>`; return; }
  $("leaderCount").textContent = (data || []).length;
  box.innerHTML = data?.length ? data.map((p, i) => `<div><b>#${i+1} ${escapeHtml(p.display_name || "Member")}</b><span style="float:right">${Number(p.referral_count)} referrals</span></div>`).join("") : '<p class="muted">No registered members yet.</p>';
}
async function refreshWallet() {
  const box = $("wallet");
  if (!currentUser) { box.textContent = "Sign in to view your records."; return; }
  const { data, error } = await supabase.from("wallet_ledger").select("id,entry_type,amount,currency,description,created_at").order("created_at", {ascending:false}).limit(50);
  if (error) { box.innerHTML = `<p class="error">Wallet records unavailable: ${escapeHtml(error.message)}</p>`; return; }
  box.innerHTML = data?.length ? data.map(r => `<div><b>${escapeHtml(r.entry_type)}</b> · ${money(r.amount)} ${escapeHtml(r.currency)}<br><span class="muted">${escapeHtml(r.description || "")} · ${new Date(r.created_at).toLocaleString()}</span></div>`).join("") : '<p class="muted">No wallet ledger records yet.</p>';
}
async function refreshAll() { await Promise.all([refreshAuctions(), refreshLeaderboard(), refreshWallet()]); }
function subscribeRealtime() {
  if (auctionChannel) supabase.removeChannel(auctionChannel);
  auctionChannel = supabase.channel("phuza-auctions-live")
    .on("postgres_changes", {event:"*", schema:"public", table:"auctions"}, () => refreshAuctions())
    .subscribe();
  if (bidsChannel) supabase.removeChannel(bidsChannel);
  bidsChannel = supabase.channel("phuza-bids-live")
    .on("postgres_changes", {event:"INSERT", schema:"public", table:"bids"}, () => refreshAuctions())
    .subscribe();
}
async function register() {
  const email = $("email").value.trim(), password = $("password").value, displayName = $("displayName").value.trim();
  const referralCode = $("referralCode").value.trim().toUpperCase();
  if (!email || password.length < 8 || displayName.length < 2) return message("Enter a valid email, password of at least 8 characters, and display name.");
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: displayName, referral_code_used: referralCode || null } }
  });
  if (error) return message("Registration failed: " + error.message);
  if (data.session) {
    currentUser = data.user; await loadProfile(); await refreshAll();
    message("Registration successful.", "notice success");
  } else {
    message("Registration submitted. Check your email to confirm your account, then log in.", "notice success");
  }
}
async function login() {
  const email = $("email").value.trim(), password = $("password").value;
  const { data, error } = await supabase.auth.signInWithPassword({email, password});
  if (error) return message("Login failed: " + error.message);
  currentUser = data.user; await loadProfile(); await refreshAll();
  message("You are signed in.", "notice success");
}
async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) return message(error.message);
  currentUser = null; currentProfile = null; setSignedIn(null, null); await refreshWallet();
  message("You have logged out.");
}
async function copyReferral() {
  if (!currentProfile?.referral_code) return message("Referral code is not available yet.");
  const link = new URL(location.href); link.searchParams.set("ref", currentProfile.referral_code);
  try { await navigator.clipboard.writeText(link.toString()); message("Referral link copied.", "notice success"); }
  catch { message("Your referral code is " + currentProfile.referral_code + ". Copy it manually."); }
}
function init() {
  if (!isConfigured) { $("configWarning").classList.remove("hidden"); $("userStatus").textContent = "Setup required"; return; }
  supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const ref = new URLSearchParams(location.search).get("ref");
  if (ref) $("referralCode").value = ref.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,16);
  $("signupBtn").addEventListener("click", register);
  $("loginBtn").addEventListener("click", login);
  $("logoutBtn").addEventListener("click", logout);
  $("copyReferralBtn").addEventListener("click", copyReferral);
  $("createAuctionBtn").addEventListener("click", createAuction);
  $("refreshBtn").addEventListener("click", refreshAll);
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    setTimeout(async () => { await loadProfile(); await refreshAll(); }, 0);
  });
  supabase.auth.getSession().then(async ({data}) => {
    currentUser = data.session?.user || null;
    await loadProfile(); await refreshAll(); subscribeRealtime();
  });
}
init();
