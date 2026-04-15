/* ==================== 10-STAR ULTRA-PREMIUM REAL ESTATE WEBSITE ==================== */
/* Author: Premium Real Estate Agent Website
/* Version: 1.0.0
/* Description: Real-time functionality, API integrations, calculators, and interactive features
/* ==================================================================================== */

// ==================== CONFIGURATION & CONSTANTS ====================
const CONFIG = {
    // API Keys (Replace with your actual keys)
    GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
    MLS_IDX_API_KEY: 'YOUR_MLS_IDX_API_KEY',
    MLS_IDX_ENDPOINT: 'https://api.mlsidx.com/v1',
    
    // Contact Information
    AGENT_PHONE: '+1234567890',
    AGENT_EMAIL: 'agent@example.com',
    AGENT_WHATSAPP: '1234567890',
    
    // CRM Integration
    CRM_API_ENDPOINT: 'https://api.yourcrm.com/leads',
    CRM_API_KEY: 'YOUR_CRM_API_KEY',
    
    // Email Service (e.g., SendGrid, Mailgun)
    EMAIL_SERVICE_ENDPOINT: 'https://api.sendgrid.com/v3/mail/send',
    EMAIL_API_KEY: 'YOUR_EMAIL_API_KEY',
    
    // SMS Service (e.g., Twilio)
    SMS_SERVICE_ENDPOINT: 'https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json',
    SMS_API_KEY: 'YOUR_TWILIO_API_KEY',
    
    // Calendar Integration (Calendly or Google Calendar)
    CALENDAR_EMBED_URL: 'https://calendly.com/your-username',
    
    // Real-time Interest Rates API
    INTEREST_RATE_API: 'https://api.freddiemac.com/v1/rates',
    
    // Property Valuation API (AVM)
    AVM_API_ENDPOINT: 'https://api.housecanary.com/v2/property/value',
    AVM_API_KEY: 'YOUR_AVM_API_KEY',
    
    // Settings
    PROPERTY_UPDATE_INTERVAL: 300000, // 5 minutes in milliseconds
    MARKET_DATA_UPDATE_INTERVAL: 3600000, // 1 hour
    REVIEWS_UPDATE_INTERVAL: 3600000, // 1 hour
    DEFAULT_SEARCH_RADIUS: 10, // miles
    PROPERTIES_PER_PAGE: 12,
};

// ==================== STATE MANAGEMENT ====================
const STATE = {
    currentUser: null,
    savedSearches: [],
    favoriteProperties: [],
    searchFilters: {},
    currentPage: 1,
    totalResults: 0,
    properties: [],
    marketData: {},
    currentInterestRate: 6.5,
    map: null,
    markers: [],
    chatbotActive: false,
    lastMLSUpdate: null,
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Initializing 10-Star Real Estate Website...');
    
    // Initialize core features
    initializeHeader();
    initializeHeroSearch();
    initializePropertySearch();
    initializeCalculators();
    initializeChatbot();
    initializeModals();
    initializeAnimations();
    initializeMobileMenu();
    initializeFloatingCTA();
    
    // Load real-time data
    loadLiveMLSData();
    loadMarketData();
    loadCurrentInterestRate();
    loadLiveReviews();
    loadAgentAvailability();
    
    // Set up auto-updates
    startAutoUpdates();
    
    // Load user preferences from localStorage
    loadUserPreferences();
    
    console.log('✅ Website initialized successfully!');
}

// ==================== HEADER & NAVIGATION ====================
function initializeHeader() {
    const header = document.getElementById('main-header');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');
    
    // Sticky header on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // Smooth scroll for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update active link
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    
                    // Close mobile menu
                    mainNav.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                }
            }
        });
    });
}

function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            mainNav.classList.toggle('active');
        });
    }
}

// ==================== HERO SECTION ====================
function initializeHeroSearch() {
    // Search tabs switching
    const searchTabs = document.querySelectorAll('.search-tab');
    const searchContents = document.querySelectorAll('.search-content');
    
    searchTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Update active tab
            searchTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            searchContents.forEach(content => {
                if (content.getAttribute('data-content') === tabName) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
    
    // Animate hero stats
    animateCounters();
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        // Start animation when element is visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.disconnect();
                }
            });
        });
        
        observer.observe(counter);
    });
}

function handleQuickSearch(event, type = 'buy') {
    event.preventDefault();
    
    const location = document.getElementById(type === 'rent' ? 'rentSearchLocation' : 'quickSearchLocation').value;
    
    if (!location) {
        showNotification('Please enter a location', 'warning');
        return;
    }
    
    // Set search filters
    STATE.searchFilters = {
        location: location,
        type: type,
        propertyType: type === 'rent' ? null : document.getElementById('quickPropertyType')?.value,
        beds: type === 'rent' ? document.getElementById('rentBeds')?.value : document.getElementById('quickBeds')?.value,
        baths: type === 'rent' ? null : document.getElementById('quickBaths')?.value,
    };
    
    // Scroll to search section
    scrollToSearch();
    
    // Trigger search
    applyFilters();
}

function handleQuickValuation(event) {
    event.preventDefault();
    
    const address = document.getElementById('valuationAddress').value;
    
    if (!address) {
        showNotification('Please enter your property address', 'warning');
        return;
    }
    
    // Open valuation modal with address
    openValuationModal(address);
}

function scrollToSearch() {
    const searchSection = document.getElementById('search');
    const headerHeight = document.getElementById('main-header').offsetHeight;
    const targetPosition = searchSection.offsetTop - headerHeight;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

// ==================== PROPERTY SEARCH ====================
function initializePropertySearch() {
    // Initialize filters
    initializeFilterControls();
    
    // Initialize map
    if (typeof google !== 'undefined') {
        initializeMap();
    } else {
        loadGoogleMapsAPI().then(() => initializeMap());
    }
}

function initializeFilterControls() {
    // Price range sliders
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const minPriceLabel = document.getElementById('minPriceLabel');
    const maxPriceLabel = document.getElementById('maxPriceLabel');
    
    if (minPrice && maxPrice) {
        minPrice.addEventListener('input', () => {
            minPriceLabel.textContent = formatCurrency(minPrice.value);
            STATE.searchFilters.minPrice = parseInt(minPrice.value);
        });
        
        maxPrice.addEventListener('input', () => {
            const value = parseInt(maxPrice.value);
            maxPriceLabel.textContent = value >= 10000000 ? '$10M+' : formatCurrency(value);
            STATE.searchFilters.maxPrice = value;
        });
    }
    
    // Location autocomplete
    const locationInput = document.getElementById('searchLocation');
    if (locationInput) {
        locationInput.addEventListener('input', debounce(handleLocationAutocomplete, 300));
    }
}

function handleLocationAutocomplete(event) {
    const query = event.target.value;
    
    if (query.length < 3) {
        document.getElementById('locationSuggestions').style.display = 'none';
        return;
    }
    
    // Call location API (Google Places Autocomplete)
    // This is a placeholder - implement actual API call
    const suggestions = [
        { name: 'Downtown, City Name', lat: 0, lng: 0 },
        { name: 'Suburb Area, City Name', lat: 0, lng: 0 },
        { name: 'ZIP Code 12345', lat: 0, lng: 0 },
    ];
    
    displayLocationSuggestions(suggestions);
}

function displayLocationSuggestions(suggestions) {
    const container = document.getElementById('locationSuggestions');
    
    if (!suggestions || suggestions.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" onclick="selectLocation('${suggestion.name}', ${suggestion.lat}, ${suggestion.lng})">
            <i class="fas fa-map-marker-alt"></i>
            <span>${suggestion.name}</span>
        </div>
    `).join('');
    
    container.style.display = 'block';
}

function selectLocation(name, lat, lng) {
    document.getElementById('searchLocation').value = name;
    document.getElementById('locationSuggestions').style.display = 'none';
    
    STATE.searchFilters.location = name;
    STATE.searchFilters.coordinates = { lat, lng };
}

function selectBeds(button) {
    document.querySelectorAll('.button-group .btn-chip').forEach(btn => {
        if (btn.parentElement === button.parentElement) {
            btn.classList.remove('active');
        }
    });
    button.classList.add('active');
    STATE.searchFilters.beds = button.getAttribute('data-value');
}

function selectBaths(button) {
    document.querySelectorAll('.button-group .btn-chip').forEach(btn => {
        if (btn.parentElement === button.parentElement) {
            btn.classList.remove('active');
        }
    });
    button.classList.add('active');
    STATE.searchFilters.baths = button.getAttribute('data-value');
}

function resetFilters() {
    STATE.searchFilters = {};
    STATE.currentPage = 1;
    
    // Reset UI
    document.getElementById('searchLocation').value = '';
    document.getElementById('minPrice').value = 0;
    document.getElementById('maxPrice').value = 10000000;
    document.getElementById('minPriceLabel').textContent = '$0';
    document.getElementById('maxPriceLabel').textContent = '$10M+';
    
    document.querySelectorAll('.btn-chip').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    
    // Reload properties
    loadLiveMLSData();
}

async function applyFilters() {
    showLoadingState();
    
    try {
        // Build filter query
        const filters = buildFilterQuery();
        
        // Fetch properties from MLS/IDX API
        const properties = await fetchMLSProperties(filters);
        
        STATE.properties = properties;
        STATE.totalResults = properties.length;
        
        // Display results
        displayProperties(properties);
        updateResultsInfo();
        
    } catch (error) {
        console.error('Error applying filters:', error);
        showNotification('Failed to load properties. Please try again.', 'error');
    }
}

function buildFilterQuery() {
    const filters = { ...STATE.searchFilters };
    
    // Add checkbox filters
    const checkboxes = document.querySelectorAll('.filter-checkbox:checked');
    checkboxes.forEach(cb => {
        filters[cb.id] = true;
    });
    
    // Add other input filters
    const minSqft = document.getElementById('minSqft')?.value;
    const maxSqft = document.getElementById('maxSqft')?.value;
    if (minSqft) filters.minSqft = parseInt(minSqft);
    if (maxSqft) filters.maxSqft = parseInt(maxSqft);
    
    return filters;
}

async function fetchMLSProperties(filters) {
    // This is a placeholder - implement actual MLS/IDX API integration
    // Example using fetch:
    
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${CONFIG.MLS_IDX_ENDPOINT}/properties?${queryParams}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${CONFIG.MLS_IDX_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        STATE.lastMLSUpdate = new Date();
        updateLastUpdateTime();
        
        return data.properties || [];
        
    } catch (error) {
        console.error('MLS API Error:', error);
        
        // Return mock data for demonstration
        return generateMockProperties();
    }
}

function generateMockProperties() {
    // Mock data generator for demonstration
    return Array.from({ length: 12 }, (_, i) => ({
        id: `prop-${i + 1}`,
        address: `${1000 + i * 100} Premium Street`,
        city: 'Luxury City',
        state: 'CA',
        zip: '90210',
        price: 500000 + (i * 100000),
        beds: 3 + (i % 3),
        baths: 2 + (i % 2),
        sqft: 2000 + (i * 200),
        lotSize: 0.25 + (i * 0.1),
        yearBuilt: 2015 + (i % 8),
        propertyType: ['Single Family', 'Condo', 'Townhouse'][i % 3],
        status: ['Active', 'Pending', 'Sold'][i % 3],
        images: [`https://picsum.photos/800/600?random=${i + 1}`],
        description: 'Beautiful property in prime location with modern amenities.',
        daysOnMarket: 5 + (i * 2),
        pricePerSqft: 250 + (i * 10),
        features: ['Pool', 'Garage', 'Smart Home', 'Waterfront'][i % 4],
    }));
}

function displayProperties(properties) {
    const container = document.getElementById('gridView');
    
    if (!properties || properties.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-home" style="font-size: 4rem; color: var(--medium-gray); margin-bottom: 1rem;"></i>
                <h3>No Properties Found</h3>
                <p>Try adjusting your search filters</p>
                <button class="btn btn-primary" onclick="resetFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = properties.map(property => createPropertyCard(property)).join('');
    
    // Add event listeners
    container.querySelectorAll('.property-card').forEach((card, index) => {
        card.addEventListener('click', () => openPropertyModal(properties[index]));
    });
}

function createPropertyCard(property) {
    const statusClass = property.status.toLowerCase();
    const statusColor = {
        'active': 'success',
        'pending': 'warning',
        'sold': 'error'
    }[statusClass] || 'success';
    
    return `
        <div class="property-card" data-id="${property.id}">
            <div class="property-image">
                <img src="${property.images[0]}" alt="${property.address}" loading="lazy">
                <div class="property-badge ${statusColor}">${property.status}</div>
                <button class="favorite-btn" onclick="toggleFavorite('${property.id}', event)">
                    <i class="far fa-heart"></i>
                </button>
                <div class="property-overlay">
                    <button class="btn btn-primary">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
            <div class="property-info">
                <div class="property-price">${formatCurrency(property.price)}</div>
                <div class="property-address">
                    ${property.address}<br>
                    ${property.city}, ${property.state} ${property.zip}
                </div>
                <div class="property-features">
                    <span><i class="fas fa-bed"></i> ${property.beds} Beds</span>
                    <span><i class="fas fa-bath"></i> ${property.baths} Baths</span>
                    <span><i class="fas fa-ruler-combined"></i> ${property.sqft.toLocaleString()} sqft</span>
                </div>
                <div class="property-meta">
                    <span class="property-type">${property.propertyType}</span>
                    <span class="days-on-market">${property.daysOnMarket} days on market</span>
                </div>
            </div>
        </div>
    `;
}

function updateResultsInfo() {
    document.getElementById('resultsCount').textContent = 
        `${STATE.totalResults} Properties Found`;
    document.getElementById('resultsLocation').textContent = 
        STATE.searchFilters.location || 'All Areas';
}

function showLoadingState() {
    const container = document.getElementById('gridView');
    container.innerHTML = `
        <div class="loading-skeleton">
            ${Array(6).fill('<div class="skeleton-card"></div>').join('')}
        </div>
    `;
}

// View switcher
function switchView(view) {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === view) {
            btn.classList.add('active');
        }
    });
    
    if (view === 'map') {
        document.getElementById('mapView').style.display = 'block';
        document.getElementById('gridView').style.display = 'none';
        updateMapMarkers();
    } else {
        document.getElementById('mapView').style.display = 'none';
        document.getElementById('gridView').style.display = 'grid';
    }
}

function sortResults(sortBy) {
    let sorted = [...STATE.properties];
    
    switch(sortBy) {
        case 'price-low':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'beds':
            sorted.sort((a, b) => b.beds - a.beds);
            break;
        case 'sqft':
            sorted.sort((a, b) => b.sqft - a.sqft);
            break;
        case 'price-drop':
            // Implement price drop logic
            break;
        default:
            sorted.sort((a, b) => a.daysOnMarket - b.daysOnMarket);
    }
    
    STATE.properties = sorted;
    displayProperties(sorted);
}

// ==================== GOOGLE MAPS INTEGRATION ====================
function loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
        if (typeof google !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places,drawing`;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function initializeMap() {
    const mapContainer = document.getElementById('propertyMap');
    if (!mapContainer) return;
    
    STATE.map = new google.maps.Map(mapContainer, {
        center: { lat: 34.0522, lng: -118.2437 }, // Default to LA
        zoom: 12,
        styles: getMapStyles(),
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
    });
    
    updateMapMarkers();
}

function updateMapMarkers() {
    if (!STATE.map) return;
    
    // Clear existing markers
    STATE.markers.forEach(marker => marker.setMap(null));
    STATE.markers = [];
    
    // Add markers for properties
    STATE.properties.forEach(property => {
        const marker = new google.maps.Marker({
            position: { lat: property.lat || 34.0522, lng: property.lng || -118.2437 },
            map: STATE.map,
            title: property.address,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#d4af37',
                fillOpacity: 1,
                strokeColor: '#1a2332',
                strokeWeight: 2,
            },
        });
        
        const infoWindow = new google.maps.InfoWindow({
            content: createMapInfoWindow(property),
        });
        
        marker.addListener('click', () => {
            infoWindow.open(STATE.map, marker);
        });
        
        STATE.markers.push(marker);
    });
    
    // Fit bounds to show all markers
    if (STATE.markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        STATE.markers.forEach(marker => bounds.extend(marker.getPosition()));
        STATE.map.fitBounds(bounds);
    }
}

function createMapInfoWindow(property) {
    return `
        <div style="max-width: 250px;">
            <img src="${property.images[0]}" style="width: 100%; border-radius: 8px; margin-bottom: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #1a2332;">${formatCurrency(property.price)}</h4>
            <p style="margin: 0 0 8px 0; font-size: 14px;">${property.address}</p>
            <p style="margin: 0; font-size: 13px; color: #4b5563;">
                ${property.beds} beds • ${property.baths} baths • ${property.sqft.toLocaleString()} sqft
            </p>
            <button onclick="openPropertyModal(${JSON.stringify(property).replace(/"/g, '&quot;')})" 
                    style="margin-top: 12px; padding: 8px 16px; background: #d4af37; color: #1a2332; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                View Details
            </button>
        </div>
    `;
}

function getMapStyles() {
    return [
        { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
        {
            featureType: "administrative.land_parcel",
            elementType: "labels.text.fill",
            stylers: [{ color: "#bdbdbd" }],
        },
        {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#eeeeee" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9c9c9" }],
        },
    ];
}

function toggleMapType() {
    if (!STATE.map) return;
    
    const currentType = STATE.map.getMapTypeId();
    STATE.map.setMapTypeId(currentType === 'satellite' ? 'roadmap' : 'satellite');
}

function drawPolygon() {
    if (!STATE.map) return;
    
    const drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['polygon'],
        },
    });
    
    drawingManager.setMap(STATE.map);
}

function toggleHeatmap() {
    showNotification('Price heatmap feature coming soon!', 'info');
}

// ==================== VOICE SEARCH ====================
function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window)) {
        showNotification('Voice search is not supported in your browser', 'warning');
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        showNotification('Listening... Speak now!', 'info');
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        parseVoiceQuery(transcript);
    };
    
    recognition.onerror = (event) => {
        showNotification('Voice search error. Please try again.', 'error');
    };
    
    recognition.start();
}

function parseVoiceQuery(query) {
    console.log('Voice query:', query);
    
    // Parse natural language query
    const filters = {};
    
    // Extract bedrooms
    const bedsMatch = query.match(/(\d+)\s*(bed|bedroom)/i);
    if (bedsMatch) filters.beds = bedsMatch[1];
    
    // Extract price
    const priceMatch = query.match(/under\s*\$?(\d+\.?\d*)\s*(million|m|k)/i);
    if (priceMatch) {
        const amount = parseFloat(priceMatch[1]);
        const unit = priceMatch[2].toLowerCase();
        filters.maxPrice = unit.startsWith('m') ? amount * 1000000 : amount * 1000;
    }
    
    // Extract features
    if (query.toLowerCase().includes('pool')) filters.pool = true;
    if (query.toLowerCase().includes('garage')) filters.garage = true;
    if (query.toLowerCase().includes('waterfront')) filters.waterfront = true;
    
    // Extract location (simplified)
    const locationMatch = query.match(/in\s+([a-z\s]+)/i);
    if (locationMatch) filters.location = locationMatch[1].trim();
    
    STATE.searchFilters = { ...STATE.searchFilters, ...filters };
    
    showNotification(`Searching for: ${query}`, 'success');
    applyFilters();
}

// ==================== CALCULATORS ====================
function initializeCalculators() {
    // Calculator tabs
    const calcTabs = document.querySelectorAll('.calc-tab');
    const calcPanels = document.querySelectorAll('.calculator-panel');
    
    calcTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const calcType = tab.getAttribute('data-calc');
            
            calcTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            calcPanels.forEach(panel => {
                if (panel.getAttribute('data-panel') === calcType) {
                    panel.classList.add('active');
                } else {
                    panel.classList.remove('active');
                }
            });
        });
    });
    
    // Initialize mortgage calculator
    calculateMortgage();
}

function calculateMortgage() {
    const price = parseFloat(document.getElementById('mortgagePrice')?.value) || 500000;
    const downPayment = parseFloat(document.getElementById('downPaymentAmount')?.value) || 100000;
    const rate = parseFloat(document.getElementById('interestRate')?.value) || 6.5;
    const term = parseInt(document.getElementById('loanTerm')?.value) || 30;
    const propertyTax = parseFloat(document.getElementById('propertyTax')?.value) || 6000;
    const insurance = parseFloat(document.getElementById('homeInsurance')?.value) || 1500;
    const hoa = parseFloat(document.getElementById('hoaFees')?.value) || 200;
    
    const loanAmount = price - downPayment;
    const monthlyRate = (rate / 100) / 12;
    const numPayments = term * 12;
    
    // Calculate principal & interest
    const monthlyPI = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                     (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Calculate total monthly payment
    const monthlyTax = propertyTax / 12;
    const monthlyInsurance = insurance / 12;
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + hoa;
    
    // Calculate totals
    const totalInterest = (monthlyPI * numPayments) - loanAmount;
    const totalCost = loanAmount + totalInterest;
    
    // Update UI
    document.getElementById('monthlyPayment').textContent = formatCurrency(totalMonthly);
    document.getElementById('principalInterest').textContent = formatCurrency(monthlyPI);
    document.getElementById('taxMonthly').textContent = formatCurrency(monthlyTax);
    document.getElementById('insuranceMonthly').textContent = formatCurrency(monthlyInsurance);
    document.getElementById('hoaMonthly').textContent = formatCurrency(hoa);
    document.getElementById('loanAmount').textContent = formatCurrency(loanAmount);
    document.getElementById('totalInterest').textContent = formatCurrency(totalInterest);
    document.getElementById('totalCost').textContent = formatCurrency(totalCost);
    
    // Update chart
    updateMortgageChart(loanAmount, totalInterest);
}

function updateDownPaymentPercent() {
    const price = parseFloat(document.getElementById('mortgagePrice').value) || 500000;
    const amount = parseFloat(document.getElementById('downPaymentAmount').value) || 0;
    const percent = (amount / price) * 100;
    document.getElementById('downPaymentPercent').value = percent.toFixed(1);
    calculateMortgage();
}

function updateDownPaymentAmount() {
    const price = parseFloat(document.getElementById('mortgagePrice').value) || 500000;
    const percent = parseFloat(document.getElementById('downPaymentPercent').value) || 20;
    const amount = (price * percent) / 100;
    document.getElementById('downPaymentAmount').value = amount.toFixed(0);
    calculateMortgage();
}

function updateMortgageChart(principal, interest) {
    const ctx = document.getElementById('mortgageChart');
    if (!ctx) return;
    
    // This would use Chart.js or similar library
    // Placeholder for chart implementation
    console.log('Chart data:', { principal, interest });
}

function emailCalculation(type) {
    const email = prompt('Enter your email address:');
    if (!email) return;
    
    showNotification('Calculation sent to your email!', 'success');
    
    // Implement email sending logic
    sendEmail({
        to: email,
        subject: `Your ${type} Calculation`,
        body: 'Calculation details...'
    });
}

// ==================== CHATBOT ====================
function initializeChatbot() {
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotWindow = document.getElementById('chatbotWindow');
    
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', () => {
            toggleChatbot();
        });
    }
}

function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbotWindow');
    chatbotWindow.classList.toggle('active');
    STATE.chatbotActive = chatbotWindow.classList.contains('active');
    
    if (STATE.chatbotActive) {
        document.getElementById('chatbotBadge').style.display = 'none';
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    
    // Simulate bot response
    setTimeout(() => {
        const response = generateChatbotResponse(message);
        addChatMessage(response, 'bot');
    }, 1000);
}

function sendQuickReply(message) {
    addChatMessage(message, 'user');
    
    setTimeout(() => {
        const response = generateChatbotResponse(message);
        addChatMessage(response, 'bot');
    }, 1000);
}

function addChatMessage(message, type) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const messageClass = type === 'user' ? 'user-message' : 'bot-message';
    
    const messageHTML = `
        <div class="message ${messageClass}">
            <div class="message-content">
                <p>${message}</p>
            </div>
            <span class="message-time">${formatTime(new Date())}</span>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateChatbotResponse(message) {
    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('search') || lowercaseMessage.includes('properties')) {
        return "I can help you search for properties! What's your budget and preferred location?";
    } else if (lowercaseMessage.includes('valuation') || lowercaseMessage.includes('value')) {
        return "I can provide a free home valuation! Please share your property address.";
    } else if (lowercaseMessage.includes('tour') || lowercaseMessage.includes('showing')) {
        return "I'd be happy to schedule a property tour for you! Which property interests you?";
    } else if (lowercaseMessage.includes('market') || lowercaseMessage.includes('data')) {
        return `The current median home price in our area is ${formatCurrency(750000)}. The market is ${Math.random() > 0.5 ? 'hot' : 'balanced'} right now!`;
    } else {
        return "Thanks for your message! How can I assist you with your real estate needs today?";
    }
}

function transferToAgent() {
    showNotification('Connecting you with the agent...', 'info');
    setTimeout(() => {
        window.location.href = `tel:${CONFIG.AGENT_PHONE}`;
    }, 1500);
}

// ==================== MODALS ====================
function initializeModals() {
    // Close modals when clicking overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.parentElement.id);
            }
        });
    });
}

function openContactModal() {
    document.getElementById('contactModal')?.classList.add('active');
}

function openValuationModal(address = '') {
    const modal = document.getElementById('valuationModal');
    if (modal) {
        modal.classList.add('active');
        if (address) {
            modal.querySelector('input[type="text"]').value = address;
        }
    }
}

function openCalendarModal() {
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.classList.add('active');
        loadCalendarWidget();
    }
}

function openOffMarketModal() {
    document.getElementById('offMarketModal')?.classList.add('active');
}

function openPropertyModal(property) {
    const modal = document.getElementById('propertyModal');
    if (!modal) return;
    
    const content = document.getElementById('propertyDetailContent');
    content.innerHTML = createPropertyDetailView(property);
    
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function createPropertyDetailView(property) {
    return `
        <div class="property-detail-view">
            <div class="property-gallery">
                <img src="${property.images[0]}" alt="${property.address}" class="main-image">
            </div>
            <div class="property-detail-info">
                <div class="property-header">
                    <h2>${formatCurrency(property.price)}</h2>
                    <div class="property-badges">
                        <span class="badge ${property.status.toLowerCase()}">${property.status}</span>
                    </div>
                </div>
                <p class="address">
                    <i class="fas fa-map-marker-alt"></i>
                    ${property.address}, ${property.city}, ${property.state} ${property.zip}
                </p>
                <div class="property-highlights">
                    <div class="highlight">
                        <i class="fas fa-bed"></i>
                        <strong>${property.beds}</strong>
                        <span>Bedrooms</span>
                    </div>
                    <div class="highlight">
                        <i class="fas fa-bath"></i>
                        <strong>${property.baths}</strong>
                        <span>Bathrooms</span>
                    </div>
                    <div class="highlight">
                        <i class="fas fa-ruler-combined"></i>
                        <strong>${property.sqft.toLocaleString()}</strong>
                        <span>Sqft</span>
                    </div>
                    <div class="highlight">
                        <i class="fas fa-dollar-sign"></i>
                        <strong>${property.pricePerSqft}</strong>
                        <span>Per Sqft</span>
                    </div>
                </div>
                <div class="property-description">
                    <h3>Description</h3>
                    <p>${property.description}</p>
                </div>
                <div class="property-actions">
                    <button class="btn btn-primary btn-large" onclick="bookTour('${property.id}')">
                        <i class="fas fa-calendar-check"></i> Book a Tour
                    </button>
                    <button class="btn btn-secondary btn-large" onclick="requestInfo('${property.id}')">
                        <i class="fas fa-info-circle"></i> Request Info
                    </button>
                </div>
            </div>
        </div>
    `;
}

function loadCalendarWidget() {
    const container = document.getElementById('calendarEmbed');
    if (!container) return;
    
    // Load Calendly widget
    container.innerHTML = `
        <iframe src="${CONFIG.CALENDAR_EMBED_URL}" 
                width="100%" 
                height="600" 
                frameborder="0">
        </iframe>
    `;
}

// ==================== FORMS & LEAD CAPTURE ====================
function handleContactForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    submitLead(data, 'contact_form');
}

function handleValuation(event) {
    event.preventDefault();
    
    const address = document.getElementById('valuationAddressMain').value;
    
    if (!address) {
        showNotification('Please enter your property address', 'warning');
        return;
    }
    
    showNotification('Generating your free valuation report...', 'info');
    
    generateValuationReport(address);
}

async function generateValuationReport(address) {
    try {
        // Call AVM API
        const valuation = await fetchPropertyValuation(address);
        
        // Create and download PDF report
        const reportData = {
            address: address,
            estimatedValue: valuation.value,
            confidenceScore: valuation.confidence,
            comparables: valuation.comparables,
            marketTrends: valuation.trends,
        };
        
        // Show success modal
        document.getElementById('successMessage').textContent = 
            `Your home is valued at approximately ${formatCurrency(valuation.value)}. A detailed report has been sent to your email.`;
        document.getElementById('successModal').classList.add('active');
        
    } catch (error) {
        showNotification('Failed to generate valuation. Please try again.', 'error');
    }
}

async function fetchPropertyValuation(address) {
    // Placeholder - implement actual AVM API call
    return {
        value: 750000 + Math.random() * 250000,
        confidence: 85 + Math.random() * 10,
        comparables: [],
        trends: {},
    };
}

async function submitLead(data, source) {
    try {
        // Submit to CRM
        const response = await fetch(CONFIG.CRM_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.CRM_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                source: source,
                timestamp: new Date().toISOString(),
            }),
        });
        
        if (!response.ok) throw new Error('CRM submission failed');
        
        // Send auto-response email
        sendAutoResponseEmail(data.email);
        
        // Send SMS notification to agent
        sendSMSNotification(`New lead from ${data.name}`);
        
        // Show success
        showNotification('Thank you! We\'ll contact you within 15 minutes.', 'success');
        
        // Close modal
        setTimeout(() => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        }, 2000);
        
    } catch (error) {
        console.error('Lead submission error:', error);
        
        // Fallback: store in localStorage
        saveLeadToLocalStorage(data);
        
        showNotification('Thank you! Your information has been received.', 'success');
    }
}

function saveLeadToLocalStorage(data) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    leads.push({
        ...data,
        timestamp: new Date().toISOString(),
        synced: false,
    });
    localStorage.setItem('leads', JSON.stringify(leads));
}

async function sendAutoResponseEmail(email) {
    // Implement email sending logic
    console.log('Sending auto-response to:', email);
}

async function sendSMSNotification(message) {
    // Implement SMS sending logic
    console.log('Sending SMS:', message);
}

function sendEmail(params) {
    // Implement email sending
    console.log('Sending email:', params);
}

// ==================== REAL-TIME DATA UPDATES ====================
function loadLiveMLSData() {
    fetchMLSProperties(STATE.searchFilters).then(properties => {
        STATE.properties = properties;
        displayProperties(properties);
        updateLiveListingCount(properties.length);
    });
}

function loadMarketData() {
    // Fetch and display market statistics
    const mockData = {
        inventory: 1250,
        medianPrice: 750000,
        daysOnMarket: 18,
        listToSoldRatio: 98,
    };
    
    document.getElementById('marketInventory').textContent = mockData.inventory.toLocaleString();
    document.getElementById('medianPrice').textContent = formatCurrency(mockData.medianPrice);
    document.getElementById('daysOnMarket').textContent = mockData.daysOnMarket;
    document.getElementById('listToSoldRatio').textContent = mockData.listToSoldRatio + '%';
    
    // Update change indicators
    document.getElementById('inventoryChange').textContent = '+5% vs last month';
    document.getElementById('priceChange').textContent = '+8% YoY';
    document.getElementById('domChange').textContent = '-3 days';
    document.getElementById('ratioChange').textContent = '+2%';
}

async function loadCurrentInterestRate() {
    try {
        // Fetch current interest rates from API
        // This is a placeholder
        const rate = 6.5 + (Math.random() - 0.5);
        STATE.currentInterestRate = rate;
        
        document.querySelectorAll('#currentRate').forEach(el => {
            el.textContent = rate.toFixed(2) + '%';
        });
        
        document.getElementById('interestRate').value = rate.toFixed(2);
        
    } catch (error) {
        console.error('Failed to load interest rates:', error);
    }
}

function loadLiveReviews() {
    // Fetch reviews from Google/Zillow/Facebook APIs
    // This is a placeholder
    console.log('Loading live reviews...');
}

function loadAgentAvailability() {
    const now = new Date();
    const hour = now.getHours();
    
    const isAvailable = hour >= 8 && hour < 21;
    
    const statusEl = document.getElementById('agentAvailability');
    if (statusEl) {
        statusEl.textContent = isAvailable ? 'Available Now' : 'Offline - Will respond soon';
        statusEl.style.color = isAvailable ? '#10b981' : '#f59e0b';
    }
}

function updateLiveListingCount(count) {
    document.getElementById('liveListingCount').textContent = count;
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeAgo = getTimeAgo(STATE.lastMLSUpdate || now);
    document.getElementById('lastUpdateTime').textContent = timeAgo;
}

function startAutoUpdates() {
    // Update MLS data every 5 minutes
    setInterval(loadLiveMLSData, CONFIG.PROPERTY_UPDATE_INTERVAL);
    
    // Update market data every hour
    setInterval(loadMarketData, CONFIG.MARKET_DATA_UPDATE_INTERVAL);
    
    // Update interest rates every hour
    setInterval(loadCurrentInterestRate, CONFIG.MARKET_DATA_UPDATE_INTERVAL);
    
    // Update "last updated" time every minute
    setInterval(updateLastUpdateTime, 60000);
    
    // Update agent availability every 5 minutes
    setInterval(loadAgentAvailability, 300000);
}

// ==================== ANIMATIONS ====================
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.animate-fade-in-up').forEach(el => {
        observer.observe(el);
    });
}

function initializeFloatingCTA() {
    const floatingCTA = document.getElementById('floatingCTA');
    if (!floatingCTA) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 500) {
            floatingCTA.style.transform = 'translateY(0)';
        } else {
            floatingCTA.style.transform = 'translateY(100%)';
        }
        
        lastScroll = currentScroll;
    });
}

// ==================== UTILITIES ====================
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    }).format(date);
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function toggleFavorite(propertyId, event) {
    event.stopPropagation();
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(propertyId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showNotification('Removed from favorites', 'info');
    } else {
        favorites.push(propertyId);
        showNotification('Added to favorites', 'success');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteUI(propertyId, index === -1);
}

function updateFavoriteUI(propertyId, isFavorite) {
    const card = document.querySelector(`[data-id="${propertyId}"]`);
    if (!card) return;
    
    const icon = card.querySelector('.favorite-btn i');
    if (icon) {
        icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
    }
}

function saveSearch() {
    const searchName = prompt('Name this search:');
    if (!searchName) return;
    
    const searches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    searches.push({
        name: searchName,
        filters: STATE.searchFilters,
        timestamp: new Date().toISOString(),
    });
    
    localStorage.setItem('savedSearches', JSON.stringify(searches));
    showNotification('Search saved! You\'ll receive alerts for new matching properties.', 'success');
}

function loadUserPreferences() {
    // Load saved searches, favorites, etc.
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    STATE.favoriteProperties = favorites;
    
    const searches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    STATE.savedSearches = searches;
}

function bookTour(propertyId) {
    showNotification('Opening booking calendar...', 'info');
    setTimeout(() => openCalendarModal(), 500);
}

function requestInfo(propertyId) {
    openContactModal();
}

function downloadBuyerGuide() {
    showNotification('Downloading Buyer\'s Guide...', 'info');
    // Implement PDF download
}

function downloadSellerGuide() {
    showNotification('Downloading Seller\'s Playbook...', 'info');
    // Implement PDF download
}

function openMarketReportModal() {
    showNotification('Feature coming soon!', 'info');
}

function openQuickActionModal() {
    scrollToSearch();
}

function openPrivacyModal() {
    showNotification('Privacy Policy - Feature coming soon!', 'info');
}

function openTermsModal() {
    showNotification('Terms of Service - Feature coming soon!', 'info');
}

function openAccessibilityModal() {
    showNotification('Accessibility Statement - Feature coming soon!', 'info');
}

function openSellerConsultation() {
    openCalendarModal();
}

function handleMarketReport(event) {
    event.preventDefault();
    showNotification('Market report will be sent to your email!', 'success');
}

function playAgentVideo() {
    showNotification('Video player coming soon!', 'info');
}

function playTestimonial(id) {
    showNotification(`Playing testimonial ${id}...`, 'info');
}

function prevReview() {
    console.log('Previous review');
}

function nextReview() {
    console.log('Next review');
}

function updateChart(period) {
    console.log('Updating chart for period:', period);
}

// ==================== NOTIFICATION STYLES (Add to CSS) ====================
const notificationStyles = `
.notification {
    position: fixed;
    top: -100px;
    right: 2rem;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 9999;
    transition: all 0.3s ease;
    min-width: 300px;
}

.notification.show {
    top: 2rem;
}

.notification-success {
    border-left: 4px solid #10b981;
}

.notification-error {
    border-left: 4px solid #ef4444;
}

.notification-warning {
    border-left: 4px solid #f59e0b;
}

.notification-info {
    border-left: 4px solid #3b82f6;
}

.notification i {
    font-size: 1.25rem;
}

.notification-success i {
    color: #10b981;
}

.notification-error i {
    color: #ef4444;
}

.notification-warning i {
    color: #f59e0b;
}

.notification-info i {
    color: #3b82f6;
}
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// ==================== CONSOLE BRANDING ====================
console.log('%c🏆 10-STAR ULTRA-PREMIUM REAL ESTATE WEBSITE', 'color: #d4af37; font-size: 20px; font-weight: bold;');
console.log('%cPowered by Advanced Real-Time Technology', 'color: #1a2332; font-size: 14px;');
console.log('%c© 2024 - All Rights Reserved', 'color: #4b5563; font-size: 12px;');

// ==================== END OF app.js ====================
