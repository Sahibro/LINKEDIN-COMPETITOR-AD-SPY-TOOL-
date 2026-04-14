/* ==========================================================================
   Real Estate Agent Website — app.js (Offline-first, Premium)
   Tech: Vanilla JS (ES6+), localStorage, optional IndexedDB hooks
   Author intent: production-ready client portal experience for real estate
   ========================================================================== */

/** =========================
 *  CONFIG (edit here)
 *  ========================= */
// TODO: Connect to your backend API
const APP_CONFIG = {
  agent: {
    name: "Your Agent Name",
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
  },
  offlineQueueMax: 200,
  listingDefaults: {
    pageSize: 24,
  },
};

/** =========================
 *  UTILITIES
 *  ========================= */
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
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
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
function isOnline() {
  return navigator.onLine;
}
function smoothScrollTo(selector) {
  const el = $(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** =========================
 *  TOAST
 *  ========================= */
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

/** =========================
 *  SAMPLE DATA (replace later)
 *  ========================= */
// TODO: Replace with real IDX/MLS feed / your backend API
const LISTINGS = [
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
    description:
      "Bright, open-plan home with a modern kitchen, spacious living areas, and a private backyard. Close to schools, parks, and shopping.",
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
    description:
      "Premium high-rise condo with city views, modern finishes, and building amenities including gym and concierge.",
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
    description:
      "Comfortable townhouse in a quiet community. Great schools nearby. Easy commute.",
  },
];

const TESTIMONIALS = [
  { name: "Aman K.", role: "Buyer", text: "Got our dream home in 2 weeks. Negotiation was amazing, saved us a lot!" },
  { name: "Priya S.", role: "Seller", text: "Sold in 7 days above asking. The marketing + staging advice worked." },
  { name: "John D.", role: "Investor", text: "Helped me pick a high-yield rental. Smooth process and clear numbers." },
  { name: "Sara M.", role: "First-time Buyer", text: "Explained everything step-by-step. Super responsive and honest." },
];

const NEIGHBORHOODS = [
  { id: "downtown", name: "Downtown", vibe: "Walkable, vibrant, premium condos", avgPrice: 610000, schools: "A-", commute: "10-20 min" },
  { id: "suburbs", name: "Suburbs", vibe: "Family-friendly, parks, schools", avgPrice: 480000, schools: "A", commute: "25-45 min" },
  { id: "waterfront", name: "Waterfront", vibe: "Luxury views, lifestyle, high demand", avgPrice: 820000, schools: "B+", commute: "15-30 min" },
];

/** =========================
 *  STATE
 *  ========================= */
const state = {
  listings: [...LISTINGS],
  view: {
    filter: {
      query: "",
      type: "any",
      beds: "any",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
      favoritesOnly: false,
    },
  },
  ui: {
    currentTestimonialIndex: 0,
    deferredInstallPrompt: null,
  },
};

/** =========================
 *  LISTINGS FILTER / SORT
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
        l.title, l.type, l.status, l.address, l.area, l.city, l.zip,
        (l.tags || []).join(" "),
        String(l.price), String(l.beds), String(l.baths), String(l.sqft)
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  if (f.type !== "any") out = out.filter(l => l.type.toLowerCase() === f.type);
  if (f.beds !== "any") out = out.filter(l => l.beds >= Number(f.beds));

  const minP = f.minPrice !== "" ? Number(f.minPrice) : null;
  const maxP = f.maxPrice !== "" ? Number(f.maxPrice) : null;
  if (minP != null && !Number.isNaN(minP)) out = out.filter(l => l.price >= minP);
  if (maxP != null && !Number.isNaN(maxP)) out = out.filter(l => l.price <= maxP);

  // Sort
  switch (f.sort) {
    case "price_asc": out.sort((a,b) => a.price - b.price); break;
    case "price_desc": out.sort((a,b) => b.price - a.price); break;
    case "sqft_desc": out.sort((a,b) => (b.sqft||0) - (a.sqft||0)); break;
    case "newest":
    default:
      // If real feed, use createdAt. Here use id as proxy.
      out.sort((a,b) => b.id.localeCompare(a.id));
  }

  return out;
}

/** =========================
 *  RENDER LISTINGS
 *  ========================= */
function listingCardHTML(l) {
  const fav = isFavorite(l.id);
  return `
    <article class="listing-card" data-id="${l.id}">
      <div class="listing-thumb" style="background-image:url('${escapeAttr(l.heroImage)}')">
        <button class="fav-btn" data-fav="${l.id}" aria-label="Save listing">
          ${fav ? "❤️" : "🤍"}
        </button>
        <div class="listing-badges">
          <span class="badge">${escapeHtml(l.status)}</span>
          <span class="badge badge-dark">${escapeHtml(l.type)}</span>
        </div>
      </div>
      <div class="listing-body">
        <div class="listing-price">${formatMoney(l.price)}</div>
        <h3 class="listing-title">${escapeHtml(l.title)}</h3>
        <div class="listing-loc">${escapeHtml(l.address)}, ${escapeHtml(l.area)}</div>

        <div class="listing-meta">
          <span>🛏 ${l.beds}</span>
          <span>🛁 ${l.baths}</span>
          <span>📐 ${formatNumber(l.sqft)} sqft</span>
        </div>

        <div class="listing-actions">
          <button class="btn-sm btn-primary" data-open="${l.id}">View Details</button>
          <button class="btn-sm" data-showing="${l.id}">Request Showing</button>
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
    grid.innerHTML = `
      <div class="empty">
        <h3>No matching properties found</h3>
        <p>Try adjusting filters or search keywords.</p>
      </div>
    `;
  }
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
  const imgs = (l.images || []).map((src, idx) => `
    <button class="thumb-btn" data-img="${escapeAttr(src)}" aria-label="Image ${idx+1}">
      <img src="${escapeAttr(src)}" alt="Property image ${idx+1}" loading="lazy"/>
    </button>
  `).join("");

  content.innerHTML = `
    <div class="pm-grid">
      <div class="pm-left">
        <div class="pm-hero">
          <img id="pmHeroImg" src="${escapeAttr(l.heroImage)}" alt="${escapeHtml(l.title)}" />
          <button class="pm-fav" data-fav="${l.id}">${fav ? "❤️ Saved" : "🤍 Save"}</button>
        </div>
        <div class="pm-thumbs">${imgs}</div>
      </div>

      <div class="pm-right">
        <div class="pm-top">
          <div class="pm-price">${formatMoney(l.price)} <span class="pm-status">${escapeHtml(l.status)}</span></div>
          <h2 class="pm-title">${escapeHtml(l.title)}</h2>
          <div class="pm-sub">${escapeHtml(l.address)}, ${escapeHtml(l.area)}, ${escapeHtml(l.city)} ${escapeHtml(l.zip)}</div>
        </div>

        <div class="pm-stats">
          <div class="pm-stat"><div class="k">Beds</div><div class="v">${l.beds}</div></div>
          <div class="pm-stat"><div class="k">Baths</div><div class="v">${l.baths}</div></div>
          <div class="pm-stat"><div class="k">Sqft</div><div class="v">${formatNumber(l.sqft)}</div></div>
          <div class="pm-stat"><div class="k">Year</div><div class="v">${l.year || "—"}</div></div>
        </div>

        <div class="pm-desc">
          <h3>About this property</h3>
          <p>${escapeHtml(l.description || "—")}</p>
        </div>

        <div class="pm-tags">
          ${(l.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
        </div>

        <div class="pm-actions">
          <button class="btn btn-primary" data-showing="${l.id}">📅 Book Showing</button>
          <button class="btn" data-cta="whatsapp" data-listing="${l.id}">💬 WhatsApp</button>
          <button class="btn" data-cta="call">📞 Call</button>
        </div>

        <div class="pm-links">
          ${l.virtualTourUrl ? `<a href="${escapeAttr(l.virtualTourUrl)}" target="_blank" rel="noopener">▶ Virtual Tour</a>` : ""}
          ${l.brochureUrl ? `<a href="${escapeAttr(l.brochureUrl)}" target="_blank" rel="noopener">⬇ Download Brochure</a>` : ""}
        </div>

        <div class="pm-mini">
          <div class="mini-card">
            <h4>Need help choosing?</h4>
            <p>Get a shortlist based on your budget, location, and timeline.</p>
            <button class="btn btn-primary" data-cta="consult">Book Free Consultation</button>
          </div>

          <div class="mini-card">
            <h4>Mortgage snapshot</h4>
            <p>Use the calculator below to estimate monthly payments.</p>
            <button class="btn" onclick="document.getElementById('mortgageSection')?.scrollIntoView({behavior:'smooth'})">Open Calculator</button>
          </div>
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
 *  FORMS (Lead Capture)
 *  ========================= */
function validateForm(formEl) {
  const required = $$("[required]", formEl);
  for (const el of required) {
    if (!String(el.value || "").trim()) {
      el.focus();
      return { ok:false, message:`Please fill: ${el.name || el.id || "required field"}` };
    }
  }
  // Basic email validation
  const emailEl = formEl.querySelector('input[type="email"]');
  if (emailEl && emailEl.value) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
    if (!ok) { emailEl.focus(); return { ok:false, message:"Please enter a valid email." }; }
  }
  return { ok:true };
}

// TODO: Connect to your backend API
async function submitLeadToBackend(lead) {
  // Example:
  // return fetch('/api/leads', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(lead)})
  //   .then(r=>r.json());

  // For market test: simulate server latency
  await new Promise(r => setTimeout(r, 650));
  return { success:true, id: uid("lead") };
}

async function handleLeadSubmit(formEl, leadType) {
  const v = validateForm(formEl);
  if (!v.ok) {
    showToast("Validation", v.message, "error");
    return;
  }

  const formData = new FormData(formEl);
  const lead = {
    id: uid("lead"),
    leadType,
    createdAt: nowISO(),
    onlineAtSubmit: isOnline(),
    payload: Object.fromEntries(formData.entries()),
  };

  // Always store locally first (offline-first)
  const qLen = enqueueLead(lead);

  if (!isOnline()) {
    showToast("Saved Offline", `No internet. Lead queued (#${qLen}).`, "warning");
    formEl.reset();
    return;
  }

  try {
    const res = await submitLeadToBackend(lead);
    if (res && res.success) {
      showToast("Submitted", "Thanks! We'll contact you shortly.", "success");
      localStorage.setItem(APP_CONFIG.storageKeys.lastSync, nowISO());
      formEl.reset();
      // Optionally: mark queued item as synced (advanced: keep status in queue)
      // For simplicity: keep queue as "audit log"
    } else {
      showToast("Saved", "Saved locally. We'll retry sync later.", "warning");
    }
  } catch (err) {
    showToast("Saved", "Network issue. Saved locally and will retry later.", "warning");
  }
}

async function trySyncOfflineQueue() {
  if (!isOnline()) return;
  const queue = loadLeadQueue();
  if (!queue.length) return;

  // Try to submit last 10 leads (throttle)
  const batch = queue.slice(-10);

  let okCount = 0;
  for (const lead of batch) {
    try {
      const res = await submitLeadToBackend(lead);
      if (res && res.success) okCount++;
    } catch {}
  }

  if (okCount) {
    localStorage.setItem(APP_CONFIG.storageKeys.lastSync, nowISO());
    showToast("Synced", `Synced ${okCount} queued lead(s).`, "success");
  }
}

/** =========================
 *  MORTGAGE CALCULATOR (EMI)
 *  ========================= */
function calcEMI({ price, downPayment, annualRate, years }) {
  const P = Math.max(0, price - downPayment); // principal
  const r = (annualRate / 100) / 12;          // monthly rate
  const n = years * 12;                       // months

  if (P <= 0 || n <= 0) return { emi: 0, totalPay: 0, totalInterest: 0, principal: P };
  if (r === 0) {
    const emi = P / n;
    return { emi, totalPay: P, totalInterest: 0, principal: P };
  }

  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPay = emi * n;
  const totalInterest = totalPay - P;
  return { emi, totalPay, totalInterest, principal: P };
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
    const price = Number(loanAmountEl?.value || 0);
    const down = Number(downEl?.value || 0);
    const rate = Number(rateEl?.value || 0);
    const years = Number(yearsEl?.value || 0);

    const r = calcEMI({ price, downPayment: down, annualRate: rate, years });
    if (outEmi) outEmi.textContent = formatMoney(r.emi);
    if (outTotal) outTotal.textContent = formatMoney(r.totalPay);
    if (outInt) outInt.textContent = formatMoney(r.totalInterest);
  };

  form.addEventListener("input", debounce(update, 80));
  form.addEventListener("submit", (e) => { e.preventDefault(); update(); });

  update();
}

/** =========================
 *  TESTIMONIALS CAROUSEL
 *  ========================= */
function renderTestimonials() {
  const track = $("#testimonialsTrack");
  if (!track) return;

  track.innerHTML = TESTIMONIALS.map(t => `
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

function updateTestimonialPosition() {
  const track = $("#testimonialsTrack");
  if (!track) return;
  const idx = state.ui.currentTestimonialIndex;
  track.style.transform = `translateX(${-idx * 100}%)`;
}

function nextTestimonial() {
  state.ui.currentTestimonialIndex = (state.ui.currentTestimonialIndex + 1) % TESTIMONIALS.length;
  updateTestimonialPosition();
}
function prevTestimonial() {
  state.ui.currentTestimonialIndex = (state.ui.currentTestimonialIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length;
  updateTestimonialPosition();
}

/** =========================
 *  NEIGHBORHOODS (optional rendering)
 *  ========================= */
function renderNeighborhoods() {
  const el = $("#neighborhoodGrid");
  if (!el) return;
  el.innerHTML = NEIGHBORHOODS.map(n => `
    <div class="nb-card" data-nb="${escapeAttr(n.id)}">
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
 *  CTA actions
 *  ========================= */
function doCall() {
  window.location.href = `tel:${APP_CONFIG.agent.phoneE164}`;
}
function doWhatsApp(listingId = null) {
  const l = listingId ? state.listings.find(x => x.id === listingId) : null;
  const msg = l
    ? `Hi! I'm interested in ${l.title} (${l.address}, ${l.area}). Please share details.`
    : APP_CONFIG.agent.whatsappMessage;

  const url = `https://wa.me/${APP_CONFIG.agent.whatsappE164.replace(/\+/g,"")}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener");
}

/** =========================
 *  EVENT WIRING
 *  ========================= */
function wireFilters() {
  const searchInput = $("#searchInput");
  const filterType = $("#filterType");
  const filterBeds = $("#filterBeds");
  const minPrice = $("#filterMinPrice");
  const maxPrice = $("#filterMaxPrice");
  const sort = $("#filterSort");
  const favBtn = $("#favoritesBtn");

  if (searchInput) {
    searchInput.addEventListener("input", debounce((e) => {
      state.view.filter.query = e.target.value || "";
      renderListings();
    }, 150));
  }
  if (filterType) {
    filterType.addEventListener("change", (e) => {
      state.view.filter.type = (e.target.value || "any").toLowerCase();
      renderListings();
    });
  }
  if (filterBeds) {
    filterBeds.addEventListener("change", (e) => {
      state.view.filter.beds = e.target.value || "any";
      renderListings();
    });
  }
  if (minPrice) {
    minPrice.addEventListener("input", debounce((e) => {
      state.view.filter.minPrice = e.target.value;
      renderListings();
    }, 150));
  }
  if (maxPrice) {
    maxPrice.addEventListener("input", debounce((e) => {
      state.view.filter.maxPrice = e.target.value;
      renderListings();
    }, 150));
  }
  if (sort) {
    sort.addEventListener("change", (e) => {
      state.view.filter.sort = e.target.value || "newest";
      renderListings();
    });
  }
  if (favBtn) {
    favBtn.addEventListener("click", () => {
      state.view.filter.favoritesOnly = !state.view.filter.favoritesOnly;
      favBtn.classList.toggle("active", state.view.filter.favoritesOnly);
      renderListings();
      showToast("Favorites", state.view.filter.favoritesOnly ? "Showing saved listings" : "Showing all listings", "success");
    });
  }
}

function wireGlobalClicks() {
  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-open]");
    const favBtn = e.target.closest("[data-fav]");
    const showingBtn = e.target.closest("[data-showing]");
    const ctaBtn = e.target.closest("[data-cta]");
    const nbBtn = e.target.closest("[data-nb-open]");
    const thumbBtn = e.target.closest(".thumb-btn");

    if (openBtn) {
      openPropertyModal(openBtn.dataset.open);
      return;
    }
    if (showingBtn) {
      const id = showingBtn.dataset.showing;
      // If modal is open, focus showing form; else open modal first.
      openPropertyModal(id);
      setTimeout(() => smoothScrollTo("#showingSection"), 200);
      return;
    }
    if (favBtn) {
      const id = favBtn.dataset.fav;
      toggleFavorite(id);
      renderListings(); // update hearts on cards
      // update modal heart if open
      const modalFav = $(".pm-fav");
      if (modalFav && modalFav.dataset.fav === id) {
        modalFav.textContent = isFavorite(id) ? "❤️ Saved" : "🤍 Save";
      }
      showToast("Saved", isFavorite(id) ? "Added to favorites" : "Removed from favorites", "success");
      return;
    }
    if (ctaBtn) {
      const type = ctaBtn.dataset.cta;
      const listingId = ctaBtn.dataset.listing || null;
      if (type === "call") doCall();
      if (type === "whatsapp") doWhatsApp(listingId);
      if (type === "consult") smoothScrollTo("#consultSection");
      if (type === "valuation") smoothScrollTo("#valuationSection");
      return;
    }
    if (nbBtn) {
      const id = nbBtn.dataset.nbOpen;
      const n = NEIGHBORHOODS.find(x => x.id === id);
      if (!n) return;
      alert(`${n.name}\n\nVibe: ${n.vibe}\nAvg Price: ${formatMoney(n.avgPrice)}\nSchools: ${n.schools}\nCommute: ${n.commute}`);
      return;
    }
    if (thumbBtn) {
      const src = thumbBtn.dataset.img;
      const hero = $("#pmHeroImg");
      if (hero && src) hero.src = src;
      return;
    }
  });
}

function wireModalClose() {
  const modal = $("#propertyModal");
  const closeBtn = $("#modalClose");
  if (closeBtn) closeBtn.addEventListener("click", closePropertyModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closePropertyModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePropertyModal();
  });
}

function wireForms() {
  const consult = $("#consultForm");
  const showing = $("#showingForm");
  const valuation = $("#valuationForm");

  if (consult) consult.addEventListener("submit", (e) => { e.preventDefault(); handleLeadSubmit(consult, "consultation"); });
  if (showing) showing.addEventListener("submit", (e) => { e.preventDefault(); handleLeadSubmit(showing, "showing"); });
  if (valuation) valuation.addEventListener("submit", (e) => { e.preventDefault(); handleLeadSubmit(valuation, "valuation"); });

  // Retry sync when coming online
  window.addEventListener("online", trySyncOfflineQueue);
}

/** =========================
 *  PWA Install Prompt helper
 *  ========================= */
function wirePWAInstall() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    state.ui.deferredInstallPrompt = e;
    const btn = $("#installAppBtn");
    if (btn) btn.style.display = "inline-flex";
  });

  const btn = $("#installAppBtn");
  if (btn) {
    btn.addEventListener("click", async () => {
      if (!state.ui.deferredInstallPrompt) return;
      state.ui.deferredInstallPrompt.prompt();
      const { outcome } = await state.ui.deferredInstallPrompt.userChoice;
      showToast("Install", outcome === "accepted" ? "App installed!" : "Install dismissed.", "success");
      state.ui.deferredInstallPrompt = null;
      btn.style.display = "none";
    });
  }
}

/** =========================
 *  Testimonials wiring
 *  ========================= */
function wireTestimonials() {
  const prev = $("#testPrev");
  const next = $("#testNext");
  if (prev) prev.addEventListener("click", prevTestimonial);
  if (next) next.addEventListener("click", nextTestimonial);

  // Auto-rotate
  setInterval(() => {
    // only if section exists
    if ($("#testimonialsTrack")) nextTestimonial();
  }, 6000);
}

/** =========================
 *  Escaping helpers
 *  ========================= */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`", "&#096;");
}

/** =========================
 *  INIT
 *  ========================= */
function init() {
  // Set agent phone/whatsapp in UI if placeholders exist
  const phoneEls = $$("[data-agent-phone]");
  phoneEls.forEach(el => el.textContent = APP_CONFIG.agent.phoneDisplay);

  const callLinks = $$("[data-agent-call-link]");
  callLinks.forEach(el => el.setAttribute("href", `tel:${APP_CONFIG.agent.phoneE164}`));

  const waLinks = $$("[data-agent-wa-link]");
  waLinks.forEach(el => el.setAttribute("href", `https://wa.me/${APP_CONFIG.agent.whatsappE164.replace(/\+/g,"")}`));

  wireFilters();
  wireGlobalClicks();
  wireModalClose();
  wireForms();
  wireMortgageCalculator();
  wireTestimonials();
  wirePWAInstall();

  renderListings();
  renderTestimonials();
  renderNeighborhoods();

  // Try sync at startup
  trySyncOfflineQueue();

  // Online/offline status indicator optional
  window.addEventListener("offline", () => showToast("Offline", "You're offline. Forms will be saved locally.", "warning"));
  window.addEventListener("online", () => showToast("Online", "Back online. Syncing queued leads…", "success"));

  // Smooth scroll for nav anchors
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
