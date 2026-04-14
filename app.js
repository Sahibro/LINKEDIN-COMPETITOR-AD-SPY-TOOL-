/* ==========================================================================
   Real Estate Agent Website — app.js (Ultra Premium / Offline-first)
   Features:
   - Listings: search/filter/sort + favorites
   - Property modal: gallery + share + WhatsApp/call
   - Lead forms: consult/showing/valuation (offline queue)
   - Map view: Leaflet markers + open modal from pin
   - Import listings: CSV/JSON
   - Export: leads + favorites + listings (JSON)
   - PWA install prompt helper
   ========================================================================== */

/** =========================
 *  CONFIG
 *  ========================= */
// TODO: Connect to your backend API
const APP_CONFIG = {
  agent: {
    name: "Agent Name",
    phoneDisplay: "+1 (555) 123-4567",
    phoneE164: "+15551234567",
    whatsappE164: "+15551234567",
    whatsappMessage: "Hi! I'm interested in a property. Please share details.",
  },
  currency: "USD",
  locale: "en-US",
  storageKeys: {
    favorites: "re_favorites_v1",
    leadsQueue: "re_leads_queue_v1",
    lastSync: "re_last_sync_v1",
    listings: "re_listings_v1"
  },
  offlineQueueMax: 200,

  // Map defaults (change to your city)
  map: {
    defaultLat: 40.748,
    defaultLng: -73.985,
    defaultZoom: 12
  }
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function formatMoney(n, currency = APP_CONFIG.currency, locale = APP_CONFIG.locale) {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(n || 0));
  } catch {
    return `$${Number(n || 0).toLocaleString()}`;
  }
}
function formatNumber(n, locale = APP_CONFIG.locale) {
  return new Intl.NumberFormat(locale).format(Number(n || 0));
}
function safeJsonParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}
function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}
function debounce(fn, ms = 200) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function isOnline() { return navigator.onLine; }
function smoothScrollTo(selector) {
  const el = $(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeAttr(str){ return escapeHtml(str).replaceAll("`","&#096;"); }
function nowISO(){ return new Date().toISOString(); }

function showToast(title, msg, type = "success", timeout = 2800) {
  const toast = $("#toast");
  if (!toast) return alert(`${title}\n\n${msg}`);

  const t = $("#toastTitle");
  const m = $("#toastMsg");

  if (t) t.textContent = title;
  if (m) m.textContent = msg;

  toast.dataset.type = type;
  toast.classList.add("show");

  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => toast.classList.remove("show"), timeout);
}

/** =========================
 *  STORAGE
 *  ========================= */
function loadFavorites() {
  return safeJsonParse(localStorage.getItem(APP_CONFIG.storageKeys.favorites), []);
}
function saveFavorites(favs) {
  localStorage.setItem(APP_CONFIG.storageKeys.favorites, JSON.stringify(favs));
}
function toggleFavorite(listingId) {
  const favs = loadFavorites();
  const idx = favs.indexOf(listingId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(listingId);
  saveFavorites(favs);
  return favs;
}
function isFavorite(listingId) {
  return loadFavorites().includes(listingId);
}

function loadLeadQueue() {
  return safeJsonParse(localStorage.getItem(APP_CONFIG.storageKeys.leadsQueue), []);
}
function saveLeadQueue(queue) {
  localStorage.setItem(APP_CONFIG.storageKeys.leadsQueue, JSON.stringify(queue.slice(-APP_CONFIG.offlineQueueMax)));
}
function enqueueLead(lead) {
  const queue = loadLeadQueue();
  queue.push(lead);
  saveLeadQueue(queue);
  return queue.length;
}

function loadListingsFromStorage() {
  return safeJsonParse(localStorage.getItem(APP_CONFIG.storageKeys.listings), null);
}
function saveListingsToStorage(listings) {
  localStorage.setItem(APP_CONFIG.storageKeys.listings, JSON.stringify(listings));
}

/** =========================
 *  DEFAULT DATA (demo)
 *  ========================= */
// TODO: Replace with real feed / backend
const DEFAULT_LISTINGS = [
  {
    id: "L-1001",
    title: "Modern Family Home",
    type: "House",
    status: "For Sale",
    price: 675000,
    beds: 4,
    baths: 3,
    sqft: 2450,
    year: 2016,
    address: "123 Maple Street",
    area: "Downtown",
    city: "Your City",
    zip: "10001",
    lat: 40.748,
    lng: -73.985,
    heroImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80&auto=format&fit=crop"
    ],
    tags: ["garage", "backyard", "open-plan"],
    virtualTourUrl: "https://example.com/virtual-tour",
    brochureUrl: "https://example.com/brochure.pdf",
    description: "Bright, open-plan home with a modern kitchen, spacious living areas, and a private backyard."
  },
  {
    id: "L-1002",
    title: "Luxury Downtown Condo",
    type: "Condo",
    status: "For Sale",
    price: 520000,
    beds: 2,
    baths: 2,
    sqft: 1120,
    year: 2020,
    address: "88 Skyline Ave #1204",
    area: "Downtown",
    city: "Your City",
    zip: "10001",
    lat: 40.742,
    lng: -73.99,
    heroImage: "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1200&q=80&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?w=1200&q=80&auto=format&fit=crop"
    ],
    tags: ["doorman", "gym", "city-view"],
    virtualTourUrl: "",
    brochureUrl: "",
    description: "Premium high-rise condo with city views, modern finishes, and building amenities."
  },
  {
    id: "L-1003",
    title: "Cozy Suburban Townhouse",
    type: "Townhouse",
    status: "For Rent",
    price: 3200,
    beds: 3,
    baths: 2,
    sqft: 1600,
    year: 2012,
    address: "45 Cedar Lane",
    area: "Suburbs",
    city: "Your City",
    zip: "10009",
    lat: 40.73,
    lng: -73.97,
    heroImage: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&auto=format&fit=crop"
    ],
    tags: ["pet-friendly", "community", "parking"],
    virtualTourUrl: "",
    brochureUrl: "",
    description: "Comfortable townhouse in a quiet community. Great schools nearby."
  }
];

const TESTIMONIALS = [
  { name: "Aman K.", role: "Buyer", text: "Got our dream home in 2 weeks. Negotiation was amazing." },
  { name: "Priya S.", role: "Seller", text: "Sold in 7 days above asking. Marketing was great." },
  { name: "John D.", role: "Investor", text: "Helped me pick a high-yield rental. Smooth process." },
  { name: "Sara M.", role: "First-time Buyer", text: "Explained everything step-by-step. Very responsive." }
];

const NEIGHBORHOODS = [
  { id: "downtown", name: "Downtown", vibe: "Walkable, vibrant, premium condos", avgPrice: 610000, schools: "A-", commute: "10-20 min" },
  { id: "suburbs", name: "Suburbs", vibe: "Family-friendly, parks, schools", avgPrice: 480000, schools: "A", commute: "25-45 min" },
  { id: "waterfront", name: "Waterfront", vibe: "Luxury views, lifestyle, high demand", avgPrice: 820000, schools: "B+", commute: "15-30 min" }
];

/** =========================
 *  STATE
 *  ========================= */
const state = {
  listings: [],
  view: {
    filter: {
      query: "",
      type: "any",
      beds: "any",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
      favoritesOnly: false
    }
  },
  ui: {
    currentTestimonialIndex: 0,
    deferredInstallPrompt: null
  },
  map: {
    instance: null,
    markersLayer: null
  }
};

/** =========================
 *  LISTINGS: filter/sort/render
 *  ========================= */
function applyFilters(listings) {
  const f = state.view.filter;
  const q = (f.query || "").trim().toLowerCase();
  let out = [...listings];

  if (f.favoritesOnly) {
    const favs = loadFavorites();
    out = out.filter(l => favs.includes(l.id));
  }
  if (q) {
    out = out.filter(l => {
      const hay = [
        l.title,l.type,l.status,l.address,l.area,l.city,l.zip,
        (l.tags||[]).join(" "), String(l.price), String(l.beds), String(l.baths), String(l.sqft)
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }
  if (f.type !== "any") out = out.filter(l => (l.type||"").toLowerCase() === f.type);
  if (f.beds !== "any") out = out.filter(l => Number(l.beds||0) >= Number(f.beds));

  const minP = f.minPrice !== "" ? Number(f.minPrice) : null;
  const maxP = f.maxPrice !== "" ? Number(f.maxPrice) : null;
  if (minP != null && !Number.isNaN(minP)) out = out.filter(l => Number(l.price||0) >= minP);
  if (maxP != null && !Number.isNaN(maxP)) out = out.filter(l => Number(l.price||0) <= maxP);

  switch (f.sort) {
    case "price_asc": out.sort((a,b)=>Number(a.price||0)-Number(b.price||0)); break;
    case "price_desc": out.sort((a,b)=>Number(b.price||0)-Number(a.price||0)); break;
    case "sqft_desc": out.sort((a,b)=>Number(b.sqft||0)-Number(a.sqft||0)); break;
    case "newest":
    default: out.sort((a,b)=>String(b.id).localeCompare(String(a.id)));
  }
  return out;
}

function listingCardHTML(l) {
  const fav = isFavorite(l.id);
  return `
    <article class="listing-card">
      <div class="listing-thumb" style="background-image:url('${escapeAttr(l.heroImage||"")}')">
        <button class="fav-btn" data-fav="${escapeAttr(l.id)}">${fav ? "❤️":"🤍"}</button>
        <div class="listing-badges">
          <span class="badge">${escapeHtml(l.status||"")}</span>
          <span class="badge badge-dark">${escapeHtml(l.type||"")}</span>
        </div>
      </div>
      <div class="listing-body">
        <div class="listing-price">${formatMoney(l.price)}</div>
        <h3 class="listing-title">${escapeHtml(l.title||"")}</h3>
        <div class="listing-loc">${escapeHtml(l.address||"")}, ${escapeHtml(l.area||"")}</div>
        <div class="listing-meta">
          <span>🛏 ${l.beds||0}</span>
          <span>🛁 ${l.baths||0}</span>
          <span>📐 ${formatNumber(l.sqft||0)} sqft</span>
        </div>
        <div class="listing-actions">
          <button class="btn-sm btn-primary" data-open="${escapeAttr(l.id)}">View Details</button>
          <button class="btn-sm" data-showing="${escapeAttr(l.id)}">Request Showing</button>
        </div>
      </div>
    </article>
  `;
}

function renderListings() {
  const grid = $("#listingsGrid");
  if (!grid) return;

  const filtered = applyFilters(state.listings);
  grid.innerHTML = filtered.map(listingCardHTML).join("");

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty"><h3>No matching properties found</h3><p>Try adjusting filters.</p></div>`;
  }

  // update map pins too (so filters affect map)
  renderMapPins(filtered);
}

/** =========================
 *  PROPERTY MODAL
 *  ========================= */
function openPropertyModal(listingId) {
  const l = state.listings.find(x => x.id === listingId);
  if (!l) return;

  const content = $("#propertyModalContent");
  const modal = $("#propertyModal");
  if (!content || !modal) return;

  const fav = isFavorite(l.id);
  const imgs = (l.images||[]).map((src, idx)=>`
    <button class="thumb-btn" data-img="${escapeAttr(src)}">
      <img src="${escapeAttr(src)}" alt="Image ${idx+1}" loading="lazy"/>
    </button>
  `).join("");

  const shareUrl = `${location.origin}${location.pathname}#property=${encodeURIComponent(l.id)}`;

  content.innerHTML = `
    <div class="pm-grid">
      <div class="pm-left">
        <div class="pm-hero">
          <img id="pmHeroImg" src="${escapeAttr(l.heroImage||"")}" alt="${escapeHtml(l.title||"")}"/>
          <button class="pm-fav" data-fav="${escapeAttr(l.id)}">${fav ? "❤️ Saved":"🤍 Save"}</button>
        </div>
        <div class="pm-thumbs">${imgs}</div>
      </div>

      <div class="pm-right">
        <div class="pm-price">${formatMoney(l.price)} <span class="pm-status">${escapeHtml(l.status||"")}</span></div>
        <h2 class="pm-title">${escapeHtml(l.title||"")}</h2>
        <div class="pm-sub">${escapeHtml(l.address||"")}, ${escapeHtml(l.area||"")}, ${escapeHtml(l.city||"")} ${escapeHtml(l.zip||"")}</div>

        <div class="pm-stats">
          <div class="pm-stat"><div class="k">Beds</div><div class="v">${l.beds||0}</div></div>
          <div class="pm-stat"><div class="k">Baths</div><div class="v">${l.baths||0}</div></div>
          <div class="pm-stat"><div class="k">Sqft</div><div class="v">${formatNumber(l.sqft||0)}</div></div>
          <div class="pm-stat"><div class="k">Year</div><div class="v">${l.year||"—"}</div></div>
        </div>

        <div class="pm-desc">
          <h3>About</h3>
          <p>${escapeHtml(l.description||"—")}</p>
        </div>

        <div class="pm-tags">${(l.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>

        <div class="pm-actions">
          <button class="btn btn-primary" data-showing="${escapeAttr(l.id)}">📅 Book Showing</button>
          <button class="btn" data-cta="whatsapp" data-listing="${escapeAttr(l.id)}">💬 WhatsApp</button>
          <button class="btn" data-cta="call">📞 Call</button>
          <button class="btn btn-outline" data-share="${escapeAttr(l.id)}">🔗 Share</button>
        </div>

        <div class="pm-links">
          ${l.virtualTourUrl ? `<a href="${escapeAttr(l.virtualTourUrl)}" target="_blank" rel="noopener">▶ Virtual Tour</a>` : ""}
          ${l.brochureUrl ? `<a href="${escapeAttr(l.brochureUrl)}" target="_blank" rel="noopener">⬇ Brochure</a>` : ""}
        </div>

        <div class="mini-card" style="margin-top:12px">
          <div class="muted" style="font-weight:800;font-size:12px">Share link:</div>
          <div style="word-break:break-all;font-weight:800;font-size:12px">${escapeHtml(shareUrl)}</div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closePropertyModal() {
  const modal = $("#propertyModal");
  if (!modal) return;
  modal.classList.remove("open");
  document.body.style.overflow = "";
}

/** =========================
 *  FORMS (offline queue)
 *  ========================= */
function validateForm(formEl) {
  const required = $$("[required]", formEl);
  for (const el of required) {
    if (!String(el.value||"").trim()) {
      el.focus();
      return { ok:false, message:`Please fill: ${el.name || el.id || "required field"}` };
    }
  }
  const emailEl = formEl.querySelector('input[type="email"]');
  if (emailEl && emailEl.value) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
    if (!ok) { emailEl.focus(); return { ok:false, message:"Please enter a valid email." }; }
  }
  return { ok:true };
}

// TODO: Connect to your backend API (HubSpot/Zoho/Webhook)
async function submitLeadToBackend(lead) {
  // Example webhook:
  // await fetch("https://your-webhook", {method:"POST", headers:{'Content-Type':'application/json'}, body:JSON.stringify(lead)})
  await new Promise(r=>setTimeout(r, 600));
  return { success:true, id: uid("lead") };
}

async function handleLeadSubmit(formEl, leadType) {
  const v = validateForm(formEl);
  if (!v.ok) return showToast("Validation", v.message, "error");

  const data = Object.fromEntries(new FormData(formEl).entries());
  const lead = { id: uid("lead"), leadType, createdAt: nowISO(), onlineAtSubmit: isOnline(), payload: data };

  const qLen = enqueueLead(lead);

  if (!isOnline()) {
    formEl.reset();
    return showToast("Saved Offline", `No internet. Lead queued (#${qLen}).`, "warning");
  }

  try {
    const res = await submitLeadToBackend(lead);
    formEl.reset();
    if (res?.success) {
      localStorage.setItem(APP_CONFIG.storageKeys.lastSync, nowISO());
      showToast("Submitted", "Thanks! We'll contact you shortly.", "success");
    } else {
      showToast("Saved", "Saved locally. We'll retry sync later.", "warning");
    }
  } catch {
    formEl.reset();
    showToast("Saved", "Network issue. Saved locally and will retry later.", "warning");
  }
}

async function trySyncOfflineQueue() {
  if (!isOnline()) return;
  const queue = loadLeadQueue();
  if (!queue.length) return;

  const batch = queue.slice(-10);
  let okCount = 0;

  for (const lead of batch) {
    try {
      const res = await submitLeadToBackend(lead);
      if (res?.success) okCount++;
    } catch {}
  }

  if (okCount) {
    localStorage.setItem(APP_CONFIG.storageKeys.lastSync, nowISO());
    showToast("Synced", `Synced ${okCount} queued lead(s).`, "success");
  }
}

/** =========================
 *  Mortgage Calculator
 *  ========================= */
function calcEMI({ price, downPayment, annualRate, years }) {
  const P = Math.max(0, Number(price||0) - Number(downPayment||0));
  const r = (Number(annualRate||0)/100)/12;
  const n = Number(years||0)*12;
  if (P<=0 || n<=0) return { emi:0,totalPay:0,totalInterest:0,principal:P };
  if (r===0){ const emi=P/n; return { emi,totalPay:P,totalInterest:0,principal:P }; }
  const emi = (P*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
  const totalPay = emi*n;
  return { emi, totalPay, totalInterest: totalPay-P, principal:P };
}

function wireMortgageCalculator() {
  const form = $("#mortgageForm");
  if (!form) return;

  const loanAmountEl = $("#loanAmount");
  const downEl = $("#downPayment");
  const rateEl = $("#interestRate");
  const yearsEl = $("#loanYears");

  const outEmi = $("#emiOut");
  const outTotal = $("#totalPayOut");
  const outInt = $("#totalIntOut");

  const update = () => {
    const r = calcEMI({
      price: Number(loanAmountEl?.value||0),
      downPayment: Number(downEl?.value||0),
      annualRate: Number(rateEl?.value||0),
      years: Number(yearsEl?.value||0)
    });
    outEmi.textContent = formatMoney(r.emi);
    outTotal.textContent = formatMoney(r.totalPay);
    outInt.textContent = formatMoney(r.totalInterest);
  };

  form.addEventListener("input", debounce(update, 80));
  form.addEventListener("submit", (e)=>{e.preventDefault(); update();});
  update();
}

/** =========================
 *  Testimonials
 *  ========================= */
function renderTestimonials() {
  const track = $("#testimonialsTrack");
  if (!track) return;
  track.innerHTML = TESTIMONIALS.map(t=>`
    <div class="test-card">
      <div class="stars">★★★★★</div>
      <p class="test-text">“${escapeHtml(t.text)}”</p>
      <div class="test-person">
        <div class="test-avatar">${escapeHtml(t.name.slice(0,1))}</div>
        <div>
          <div class="test-name">${escapeHtml(t.name)}</div>
          <div class="test-role">${escapeHtml(t.role)}</div>
        </div>
      </div>
    </div>
  `).join("");
  state.ui.currentTestimonialIndex = 0;
  updateTestimonialPosition();
}
function updateTestimonialPosition(){
  const track = $("#testimonialsTrack");
  if (!track) return;
  track.style.transform = `translateX(${-state.ui.currentTestimonialIndex*100}%)`;
}
function nextTestimonial(){
  state.ui.currentTestimonialIndex = (state.ui.currentTestimonialIndex + 1) % TESTIMONIALS.length;
  updateTestimonialPosition();
}
function prevTestimonial(){
  state.ui.currentTestimonialIndex = (state.ui.currentTestimonialIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length;
  updateTestimonialPosition();
}

/** =========================
 *  Neighborhoods
 *  ========================= */
function renderNeighborhoods(){
  const el = $("#neighborhoodGrid");
  if (!el) return;
  el.innerHTML = NEIGHBORHOODS.map(n=>`
    <div class="nb-card">
      <div class="nb-title">${escapeHtml(n.name)}</div>
      <div class="nb-vibe">${escapeHtml(n.vibe)}</div>
      <div class="nb-meta">
        <span>Avg: ${formatMoney(n.avgPrice)}</span>
        <span>Schools: ${escapeHtml(n.schools)}</span>
        <span>Commute: ${escapeHtml(n.commute)}</span>
      </div>
      <button class="btn-sm btn-primary" data-nb-open="${escapeAttr(n.id)}">View Area</button>
    </div>
  `).join("");
}

/** =========================
 *  CTAs
 *  ========================= */
function doCall(){ location.href = `tel:${APP_CONFIG.agent.phoneE164}`; }
function doWhatsApp(listingId=null){
  const l = listingId ? state.listings.find(x=>x.id===listingId) : null;
  const msg = l ? `Hi! I'm interested in ${l.title} (${l.address}, ${l.area}). Please share details.` : APP_CONFIG.agent.whatsappMessage;
  const url = `https://wa.me/${APP_CONFIG.agent.whatsappE164.replace(/\+/g,"")}?text=${encodeURIComponent(msg)}`;
  window.open(url,"_blank","noopener");
}

/** =========================
 *  Map (Leaflet)
 *  ========================= */
function initMap(){
  const mapEl = $("#map");
  if(!mapEl || typeof L === "undefined") return;

  const m = L.map(mapEl, { zoomControl: true, scrollWheelZoom: true })
    .setView([APP_CONFIG.map.defaultLat, APP_CONFIG.map.defaultLng], APP_CONFIG.map.defaultZoom);

  // Tiles (online); offline may not load, pins still work
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(m);

  state.map.instance = m;
  state.map.markersLayer = L.layerGroup().addTo(m);

  renderMapPins(state.listings);

  $("#btnRecenterMap")?.addEventListener("click", ()=>{
    m.setView([APP_CONFIG.map.defaultLat, APP_CONFIG.map.defaultLng], APP_CONFIG.map.defaultZoom);
  });

  $("#btnShowAllOnMap")?.addEventListener("click", ()=>{
    renderMapPins(state.listings);
  });
}

function markerColor(status){
  const s = String(status||"").toLowerCase();
  if(s.includes("rent")) return "#f59e0b";
  if(s.includes("sale")) return "#22c55e";
  return "#94a3b8";
}

function renderMapPins(listings){
  if(!state.map.instance || !state.map.markersLayer) return;
  state.map.markersLayer.clearLayers();

  listings.forEach(l=>{
    if(typeof l.lat !== "number" || typeof l.lng !== "number") return;

    const color = markerColor(l.status);
    const icon = L.divIcon({
      className: "custom-pin",
      html: `<div style="
        width:14px;height:14px;border-radius:999px;
        background:${color};
        box-shadow:0 0 0 6px rgba(0,0,0,.2);
        border:2px solid #fff;"></div>`
    });

    const mk = L.marker([l.lat, l.lng], { icon })
      .addTo(state.map.markersLayer)
      .bindPopup(`
        <div style="min-width:220px">
          <div style="font-weight:900">${escapeHtml(l.title)}</div>
          <div style="font-weight:800;color:#2563eb;margin-top:4px">${formatMoney(l.price)}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px">${escapeHtml(l.area)} • ${escapeHtml(l.type)}</div>
          <button style="margin-top:10px;padding:8px 10px;border-radius:10px;border:0;background:#2563eb;color:#fff;font-weight:800;cursor:pointer"
            onclick="window.__openListing('${escapeAttr(l.id)}')">View Details</button>
        </div>
      `);

    // click opens modal too
    mk.on("click", ()=>openPropertyModal(l.id));
  });

  // Fit bounds if multiple
  const coords = listings.filter(l=>typeof l.lat==="number" && typeof l.lng==="number").map(l=>[l.lat,l.lng]);
  if(coords.length >= 2){
    const b = L.latLngBounds(coords);
    state.map.instance.fitBounds(b, { padding:[30,30] });
  }
}

// expose for popup button
window.__openListing = (id)=>openPropertyModal(id);

/** =========================
 *  Import / Export
 *  ========================= */
function openImport(){ $("#importModal")?.classList.add("open"); }
function closeImport(){ $("#importModal")?.classList.remove("open"); }

function downloadText(filename, text, mime="text/plain"){
  const blob = new Blob([text], {type:mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

function csvTemplate(){
  const headers = [
    "id","title","type","status","price","beds","baths","sqft","year",
    "address","area","city","zip","lat","lng","heroImage","images","tags",
    "virtualTourUrl","brochureUrl","description"
  ];
  return headers.join(",") + "\n";
}

function parseCSV(text){
  // Simple CSV parser (supports quoted values)
  const rows = [];
  let i=0, field="", row=[], inQ=false;

  const pushField = ()=>{ row.push(field); field=""; };
  const pushRow = ()=>{ rows.push(row); row=[]; };

  while(i < text.length){
    const c = text[i];
    if(inQ){
      if(c === '"' && text[i+1] === '"'){ field+='"'; i+=2; continue; }
      if(c === '"'){ inQ=false; i++; continue; }
      field+=c; i++; continue;
    } else {
      if(c === '"'){ inQ=true; i++; continue; }
      if(c === ','){ pushField(); i++; continue; }
      if(c === '\n'){ pushField(); pushRow(); i++; continue; }
      if(c === '\r'){ i++; continue; }
      field+=c; i++; continue;
    }
  }
  pushField();
  if(row.length>1 || row[0]) pushRow();

  const headers = rows.shift().map(h=>h.trim());
  return rows.filter(r=>r.some(x=>String(x||"").trim().length)).map(r=>{
    const obj = {};
    headers.forEach((h,idx)=>obj[h]=r[idx] ?? "");
    return obj;
  });
}

function normalizeListing(raw){
  const images = String(raw.images||"")
    .split("|")
    .map(s=>s.trim())
    .filter(Boolean);
  const tags = String(raw.tags||"")
    .split("|")
    .map(s=>s.trim())
    .filter(Boolean);

  const lat = raw.lat!=="" ? Number(raw.lat) : null;
  const lng = raw.lng!=="" ? Number(raw.lng) : null;

  return {
    id: String(raw.id || uid("L")),
    title: String(raw.title||"Untitled"),
    type: String(raw.type||"House"),
    status: String(raw.status||"For Sale"),
    price: raw.price!=="" ? Number(raw.price) : 0,
    beds: raw.beds!=="" ? Number(raw.beds) : 0,
    baths: raw.baths!=="" ? Number(raw.baths) : 0,
    sqft: raw.sqft!=="" ? Number(raw.sqft) : 0,
    year: raw.year!=="" ? Number(raw.year) : null,
    address: String(raw.address||""),
    area: String(raw.area||""),
    city: String(raw.city||""),
    zip: String(raw.zip||""),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    heroImage: String(raw.heroImage||""),
    images: images.length ? images : (raw.heroImage ? [String(raw.heroImage)] : []),
    tags,
    virtualTourUrl: String(raw.virtualTourUrl||""),
    brochureUrl: String(raw.brochureUrl||""),
    description: String(raw.description||"")
  };
}

async function importListingsFromFile(file){
  if(!file) return;
  const status = $("#importStatus");
  try{
    status.textContent = "Reading file...";
    const text = await file.text();

    let imported = [];
    if(file.name.toLowerCase().endsWith(".json")){
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : (Array.isArray(data.listings) ? data.listings : []);
      imported = arr.map(normalizeListing);
    } else {
      // csv
      const rows = parseCSV(text);
      imported = rows.map(normalizeListing);
    }

    if(!imported.length) throw new Error("No listings found in file");

    // Merge by id
    const byId = new Map(state.listings.map(l=>[l.id,l]));
    imported.forEach(l=>byId.set(l.id, l));
    state.listings = Array.from(byId.values());

    saveListingsToStorage(state.listings);
    renderListings();
    renderMapPins(state.listings);

    status.textContent = `Imported ${imported.length} listings successfully.`;
    showToast("Imported", `Imported ${imported.length} listings.`, "success");
  }catch(err){
    status.textContent = `Import failed: ${err.message}`;
    showToast("Import Failed", err.message, "error");
  }
}

function exportAllData(){
  const payload = {
    exportedAt: nowISO(),
    agent: APP_CONFIG.agent,
    favorites: loadFavorites(),
    leadsQueue: loadLeadQueue(),
    listings: state.listings
  };
  downloadText(`real-estate-export-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(payload,null,2), "application/json");
  showToast("Exported", "All data exported as JSON.", "success");
}

function exportLeads(){
  const leads = loadLeadQueue();
  downloadText(`leads-export-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(leads,null,2), "application/json");
  showToast("Exported", "Leads exported as JSON.", "success");
}

function viewOfflineQueue(){
  const leads = loadLeadQueue();
  if(!leads.length) return showToast("Queue", "No offline leads stored yet.", "success");
  const last = leads.slice(-10).map(l=>`${l.leadType} • ${new Date(l.createdAt).toLocaleString()} • ${JSON.stringify(l.payload)}`).join("\n\n");
  alert(`Offline Queue (latest 10)\n\n${last}`);
}

/** =========================
 *  WIRING
 *  ========================= */
function wireFilters(){
  $("#searchInput")?.addEventListener("input", debounce(e=>{
    state.view.filter.query = e.target.value || "";
    renderListings();
  },150));

  $("#filterType")?.addEventListener("change", e=>{
    state.view.filter.type = (e.target.value||"any").toLowerCase();
    renderListings();
  });

  $("#filterBeds")?.addEventListener("change", e=>{
    state.view.filter.beds = e.target.value || "any";
    renderListings();
  });

  $("#filterMinPrice")?.addEventListener("input", debounce(e=>{
    state.view.filter.minPrice = e.target.value;
    renderListings();
  },150));

  $("#filterMaxPrice")?.addEventListener("input", debounce(e=>{
    state.view.filter.maxPrice = e.target.value;
    renderListings();
  },150));

  $("#filterSort")?.addEventListener("change", e=>{
    state.view.filter.sort = e.target.value || "newest";
    renderListings();
  });

  $("#favoritesBtn")?.addEventListener("click", ()=>{
    state.view.filter.favoritesOnly = !state.view.filter.favoritesOnly;
    $("#favoritesBtn").classList.toggle("active", state.view.filter.favoritesOnly);
    renderListings();
    showToast("Favorites", state.view.filter.favoritesOnly ? "Showing saved listings" : "Showing all listings", "success");
  });
}

function wireGlobalClicks(){
  document.addEventListener("click",(e)=>{
    const openBtn = e.target.closest("[data-open]");
    const favBtn = e.target.closest("[data-fav]");
    const showingBtn = e.target.closest("[data-showing]");
    const ctaBtn = e.target.closest("[data-cta]");
    const thumbBtn = e.target.closest(".thumb-btn");
    const shareBtn = e.target.closest("[data-share]");
    const nbBtn = e.target.closest("[data-nb-open]");

    if(openBtn){ openPropertyModal(openBtn.dataset.open); return; }

    if(showingBtn){
      openPropertyModal(showingBtn.dataset.showing);
      setTimeout(()=>smoothScrollTo("#contact"), 200);
      return;
    }

    if(favBtn){
      const id = favBtn.dataset.fav;
      toggleFavorite(id);
      renderListings();
      const modalFav = $(".pm-fav");
      if(modalFav && modalFav.dataset.fav===id){
        modalFav.textContent = isFavorite(id) ? "❤️ Saved" : "🤍 Save";
      }
      showToast("Saved", isFavorite(id) ? "Added to favorites" : "Removed from favorites", "success");
      return;
    }

    if(thumbBtn){
      const src = thumbBtn.dataset.img;
      const hero = $("#pmHeroImg");
      if(hero && src) hero.src = src;
      return;
    }

    if(shareBtn){
      const id = shareBtn.dataset.share;
      const l = state.listings.find(x=>x.id===id);
      const url = `${location.origin}${location.pathname}#property=${encodeURIComponent(id)}`;
      const text = l ? `Check this property: ${l.title} (${formatMoney(l.price)})` : "Property";
      if(navigator.share){
        navigator.share({ title: "Property", text, url }).catch(()=>{});
      }else{
        navigator.clipboard?.writeText(url).then(()=>showToast("Copied", "Share link copied to clipboard.", "success"))
          .catch(()=>showToast("Share", url, "success", 5000));
      }
      return;
    }

    if(ctaBtn){
      const t = ctaBtn.dataset.cta;
      const listingId = ctaBtn.dataset.listing || null;
      if(t==="call") doCall();
      if(t==="whatsapp") doWhatsApp(listingId);
      if(t==="consult") smoothScrollTo("#top");
      if(t==="valuation") smoothScrollTo("#contact");
      return;
    }

    if(nbBtn){
      const n = NEIGHBORHOODS.find(x=>x.id===nbBtn.dataset.nbOpen);
      if(!n) return;
      alert(`${n.name}\n\n${n.vibe}\nAvg Price: ${formatMoney(n.avgPrice)}\nSchools: ${n.schools}\nCommute: ${n.commute}`);
      return;
    }
  });
}

function wireModalClose(){
  $("#modalClose")?.addEventListener("click", closePropertyModal);
  $("#propertyModal")?.addEventListener("click",(e)=>{ if(e.target.id==="propertyModal") closePropertyModal(); });
  document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") closePropertyModal(); });

  // import modal
  $("#btnOpenImport")?.addEventListener("click", openImport);
  $("#importClose")?.addEventListener("click", closeImport);
  $("#importModal")?.addEventListener("click",(e)=>{ if(e.target.id==="importModal") closeImport(); });
}

function wireForms(){
  $("#consultForm")?.addEventListener("submit",(e)=>{e.preventDefault(); handleLeadSubmit($("#consultForm"), "consultation");});
  $("#showingForm")?.addEventListener("submit",(e)=>{e.preventDefault(); handleLeadSubmit($("#showingForm"), "showing");});
  $("#valuationForm")?.addEventListener("submit",(e)=>{e.preventDefault(); handleLeadSubmit($("#valuationForm"), "valuation");});

  window.addEventListener("online", trySyncOfflineQueue);
}

function wireTestimonials(){
  $("#testPrev")?.addEventListener("click", prevTestimonial);
  $("#testNext")?.addEventListener("click", nextTestimonial);
  setInterval(()=>{ if($("#testimonialsTrack")) nextTestimonial(); }, 6500);
}

function wirePWAInstall(){
  window.addEventListener("beforeinstallprompt",(e)=>{
    e.preventDefault();
    state.ui.deferredInstallPrompt = e;
    const btn = $("#installAppBtn");
    if(btn) btn.style.display = "inline-flex";
  });

  $("#installAppBtn")?.addEventListener("click", async ()=>{
    if(!state.ui.deferredInstallPrompt) return;
    state.ui.deferredInstallPrompt.prompt();
    const { outcome } = await state.ui.deferredInstallPrompt.userChoice;
    showToast("Install", outcome==="accepted" ? "App installed!" : "Install dismissed.", "success");
    state.ui.deferredInstallPrompt = null;
    $("#installAppBtn").style.display = "none";
  });
}

function wireImportExport(){
  $("#btnDownloadCsvTemplate")?.addEventListener("click", ()=>{
    downloadText("listings-template.csv", csvTemplate(), "text/csv");
  });

  $("#btnImportNow")?.addEventListener("click", ()=>{
    const file = $("#importFile")?.files?.[0];
    if(!file) return showToast("Import", "Please select a CSV or JSON file.", "warning");
    importListingsFromFile(file);
  });

  $("#btnExportData")?.addEventListener("click", exportAllData);
  $("#btnExportLeads")?.addEventListener("click", exportLeads);
  $("#btnViewOfflineQueue")?.addEventListener("click", viewOfflineQueue);

  $("#btnOpenImport")?.addEventListener("click", ()=>{
    $("#importStatus").textContent = "";
    $("#importFile").value = "";
  });

  $("#importFile")?.addEventListener("change", ()=>{
    const f = $("#importFile")?.files?.[0];
    $("#importStatus").textContent = f ? `Selected: ${f.name}` : "";
  });
}

/** =========================
 *  INIT
 *  ========================= */
function loadInitialListings(){
  const stored = loadListingsFromStorage();
  if(Array.isArray(stored) && stored.length){
    state.listings = stored;
  } else {
    state.listings = DEFAULT_LISTINGS;
    saveListingsToStorage(state.listings);
  }
}

function initAgentBindings(){
  $$("[data-agent-phone]").forEach(el=>el.textContent = APP_CONFIG.agent.phoneDisplay);
  $$("[data-agent-call-link]").forEach(el=>el.setAttribute("href", `tel:${APP_CONFIG.agent.phoneE164}`));
  $$("[data-agent-wa-link]").forEach(el=>el.setAttribute("href", `https://wa.me/${APP_CONFIG.agent.whatsappE164.replace(/\+/g,"")}`));
}

function handleDeepLink(){
  // open property if hash contains #property=ID
  const hash = location.hash || "";
  if(hash.includes("property=")){
    const id = decodeURIComponent(hash.split("property=")[1] || "").trim();
    if(id) setTimeout(()=>openPropertyModal(id), 300);
  }
}

function init(){
  initAgentBindings();
  loadInitialListings();

  wireFilters();
  wireGlobalClicks();
  wireModalClose();
  wireForms();
  wireMortgageCalculator();
  wireTestimonials();
  wirePWAInstall();
  wireImportExport();

  renderNeighborhoods();
  renderTestimonials();
  renderListings();

  initMap();
  handleDeepLink();

  trySyncOfflineQueue();

  window.addEventListener("offline", ()=>showToast("Offline", "You're offline. Forms will be saved locally.", "warning"));
  window.addEventListener("online", ()=>showToast("Online", "Back online. Syncing queued leads…", "success"));

  // smooth scroll
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener("click",(e)=>{
      const href = a.getAttribute("href");
      if(!href || href==="#") return;
      const target = $(href);
      if(!target) return;
      e.preventDefault();
      target.scrollIntoView({behavior:"smooth", block:"start"});
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
