/* ====================================
   HeatENE Calculator - Application Logic
   ==================================== */

// ============ STATE MANAGEMENT ============

const STATE_KEY = 'heatene_calculator_state';

let state = {
    currentStep: 0, // Start at market selection
    market: null, // 'uk' or 'us'
    units: null, // 'metric' or 'imperial'
    property: {
        type: null,
        age: null,
        insulation: null,
        region: null,
        currentHeating: null
    },
    rooms: [],
    costs: {
        inputType: 'annual',
        annualCost: null,
        monthlyCost: null,
        electricityTariff: null, // Will be set based on market
        gasTariff: null,
        heatingPattern: null
    },
    results: null,
    editingRoomIndex: null
};

// Market-specific defaults
const MARKET_DEFAULTS = {
    uk: {
        currency: '£',
        currencyName: 'GBP',
        electricityTariff: 22, // pence/kWh
        gasTariff: 5.5, // pence/kWh
        tariffUnit: 'p/kWh',
        units: 'metric',
        flag: '🇬🇧'
    },
    us: {
        currency: '$',
        currencyName: 'USD',
        electricityTariff: 0.16, // $/kWh
        gasTariff: 0.012, // $/kWh (roughly $1.20/therm)
        tariffUnit: '$/kWh',
        units: 'imperial',
        flag: '🇺🇸'
    }
};

// Conversion factors
const CONVERSIONS = {
    sqmToSqft: 10.7639,
    sqftToSqm: 0.092903,
    mToFt: 3.28084,
    ftToM: 0.3048
};

// Load state from localStorage
function loadState() {
    try {
        const saved = localStorage.getItem(STATE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
            restoreUIFromState();
        }
    } catch (e) {
        console.error('Failed to load state:', e);
    }
}

// Save state to localStorage
function saveState() {
    try {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save state:', e);
    }
}

// ============ CONSTANTS & DATA ============

// Room type configurations
const ROOM_PRESETS = {
    living: { icon: '🛋️', name: 'Living Room', tempTarget: 21, defaultSize: 'large' },
    bedroom: { icon: '🛏️', name: 'Bedroom', tempTarget: 18, defaultSize: 'medium' },
    'master-bedroom': { icon: '🛏️', name: 'Master Bedroom', tempTarget: 18, defaultSize: 'large' },
    kitchen: { icon: '🍳', name: 'Kitchen', tempTarget: 18, defaultSize: 'medium' },
    bathroom: { icon: '🚿', name: 'Bathroom', tempTarget: 22, defaultSize: 'small' },
    office: { icon: '💻', name: 'Home Office', tempTarget: 20, defaultSize: 'small' },
    dining: { icon: '🍽️', name: 'Dining Room', tempTarget: 20, defaultSize: 'medium' },
    hallway: { icon: '🚪', name: 'Hallway', tempTarget: 16, defaultSize: 'small' },
    conservatory: { icon: '🌿', name: 'Conservatory', tempTarget: 18, defaultSize: 'large' },
    utility: { icon: '🧺', name: 'Utility Room', tempTarget: 15, defaultSize: 'small' },
    other: { icon: '📦', name: 'Other', tempTarget: 19, defaultSize: 'medium' }
};

// Size presets in m²
const SIZE_PRESETS = {
    small: { area: 8, height: 2.4 },
    medium: { area: 14, height: 2.4 },
    large: { area: 22, height: 2.5 },
    xlarge: { area: 30, height: 2.7 }
};

// Heat loss factors
const HEAT_LOSS = {
    // Base heat loss W/m² by insulation quality
    baseByInsulation: {
        poor: 85,
        average: 65,
        good: 50,
        excellent: 35
    },
    
    // Property age multiplier
    ageMultiplier: {
        'pre1920': 1.25,
        '1920-1950': 1.15,
        '1950-1980': 1.05,
        '1980-2000': 0.95,
        '2000+': 0.85
    },
    
    // Property type multiplier (heat loss through external surfaces)
    typeMultiplier: {
        // UK types
        flat: 0.85,
        terrace: 0.9,
        semi: 1.0,
        detached: 1.15,
        bungalow: 1.2,  // More roof surface area
        // US types
        apartment: 0.85,
        condo: 0.88,
        townhouse: 0.9,
        'single-family': 1.15,
        ranch: 1.2  // Single story = more roof surface
    },
    
    // External wall adjustment (W/m² per wall)
    externalWallAdd: 5,
    
    // Window area adjustment
    windowMultiplier: {
        none: 0.9,
        small: 1.0,
        medium: 1.1,
        large: 1.25,
        extensive: 1.5
    },
    
    // Floor type adjustment
    floorMultiplier: {
        ground: 1.05,
        upper: 1.0,
        unheated: 1.15
    },
    
    // Ceiling height adjustment (per 10cm above 2.4m)
    heightAdjustPer10cm: 0.03,
    
    // UK climate zone multiplier
    climateMultiplier: {
        uk: {
            'scotland-north': 1.2,
            'scotland-central': 1.15,
            'northern-ireland': 1.1,
            'north-england': 1.1,
            'north-west': 1.08,
            'yorkshire': 1.05,
            'east-midlands': 1.0,
            'west-midlands': 1.0,
            'wales': 1.05,
            'east-anglia': 0.98,
            'south-west': 0.95,
            'south-east': 0.95,
            'london': 0.92
        },
        // US states by IECC climate zone
        us: {
            // Zone 1-2 (Hot-Humid/Hot-Dry)
            'FL': 0.7, 'HI': 0.6, 'TX-S': 0.75, 'AZ-S': 0.75, 'LA': 0.75,
            // Zone 3 (Warm)
            'CA-S': 0.8, 'TX-N': 0.85, 'AZ-N': 0.85, 'NM': 0.85, 
            'GA': 0.85, 'SC': 0.85, 'AL': 0.85, 'MS': 0.85,
            // Zone 4 (Mixed)
            'CA-N': 0.9, 'NC': 0.92, 'TN': 0.95, 'VA': 0.95, 
            'KY': 0.95, 'OK': 0.92, 'KS': 0.95, 'MO': 0.98,
            'NV': 0.9, 'UT': 0.95,
            // Zone 5 (Cool)
            'NY': 1.05, 'PA': 1.02, 'NJ': 1.0, 'OH': 1.05, 
            'IN': 1.05, 'IL': 1.08, 'IA': 1.1, 'NE': 1.1,
            'CO': 1.05, 'OR': 0.98, 'WA': 1.0, 'ID': 1.05,
            'MA': 1.05, 'CT': 1.02,
            // Zone 6 (Cold)
            'MI': 1.15, 'WI': 1.18, 'MN': 1.22, 'MT': 1.2,
            'WY': 1.18, 'VT': 1.15, 'NH': 1.15, 'ME': 1.18,
            // Zone 7-8 (Very Cold/Subarctic)
            'ND': 1.25, 'SD': 1.22, 'AK': 1.35
        }
    },
    
    // Room type temperature target affects sizing
    roomTypeMultiplier: {
        living: 1.1,
        bedroom: 0.9,
        'master-bedroom': 0.95,
        kitchen: 0.85,  // Appliance heat
        bathroom: 1.2,
        office: 1.0,
        dining: 1.0,
        hallway: 0.7,
        conservatory: 1.3,
        utility: 0.75,
        other: 1.0
    },
    
    // Usage pattern affects sizing
    usageMultiplier: {
        'all-day': 1.0,
        'regular': 0.9,
        'occasional': 0.75
    }
};

// HeatENE Skirting Specifications
// Product: Graphene heating film at 580W/m², outputs 70W per linear metre of skirting
const HEATENE_SPECS = {
    wattsPerMetre: 70,           // W per linear metre of skirting
    filmRating: 580,             // W/m² of the graphene film
    maxSurfaceTemp: 55,          // °C (child safe)
    efficiency: 0.9969,          // 99.69% thermal conversion
    profileHeight: 0.139,        // metres (139mm)
    profileDepth: 0.018,         // metres (18mm)
    maxLength: 6,                // metres per piece
    warranty: 10                 // years
};

// Pricing per metre (by market)
const HEATENE_PRICING = {
    uk: {
        pricePerMetre: 45,       // £ per linear metre
        installPerMetre: 15,     // £ installation per metre
        thermostat: 85,          // £ per room thermostat
        currency: '£'
    },
    us: {
        pricePerMetre: 57,       // $ per linear metre (~£45 × 1.27)
        installPerMetre: 19,     // $ installation per metre
        thermostat: 108,         // $ per room thermostat
        currency: '$'
    }
};

// Legacy panel mappings (for backwards compatibility)
// These convert to equivalent metres of skirting
const PANELS = {
    uk: [
        { wattage: 400, price: 280, name: 'HeatENE 400', metres: 5.7 },
        { wattage: 600, price: 350, name: 'HeatENE 600', metres: 8.6 },
        { wattage: 800, price: 420, name: 'HeatENE 800', metres: 11.4 },
        { wattage: 1000, price: 500, name: 'HeatENE 1000', metres: 14.3 }
    ],
    us: [
        { wattage: 400, price: 355, name: 'HeatENE 400', metres: 5.7 },
        { wattage: 600, price: 445, name: 'HeatENE 600', metres: 8.6 },
        { wattage: 800, price: 535, name: 'HeatENE 800', metres: 11.4 },
        { wattage: 1000, price: 635, name: 'HeatENE 1000', metres: 14.3 }
    ]
};

const INSTALL_COST_PER_PANEL = {
    uk: 50,
    us: 65 // ~£50 × 1.27 + slight markup for US labor
};

// Heating system efficiency and characteristics
const HEATING_SYSTEMS = {
    // UK Systems
    'gas-modern': {
        name: 'Modern Gas Boiler',
        efficiency: 0.92,
        fuelType: 'gas',
        maintenance: 'Annual service',
        lifespan: '10-15 years',
        zoneControl: 'Limited'
    },
    'gas-old': {
        name: 'Older Gas Boiler',
        efficiency: 0.72,
        fuelType: 'gas',
        maintenance: 'Annual service',
        lifespan: '5-10 years',
        zoneControl: 'Limited'
    },
    'electric-radiators': {
        name: 'Electric Radiators',
        efficiency: 1.0,
        fuelType: 'electricity',
        maintenance: 'Minimal',
        lifespan: '15-20 years',
        zoneControl: 'Per-room'
    },
    'storage-heaters': {
        name: 'Storage Heaters',
        efficiency: 0.9,
        fuelType: 'electricity',
        maintenance: 'Minimal',
        lifespan: '15-20 years',
        zoneControl: 'Limited'
    },
    'oil': {
        name: 'Oil Boiler',
        efficiency: 0.85,
        fuelType: 'oil',
        maintenance: 'Annual service',
        lifespan: '15-20 years',
        zoneControl: 'Limited'
    },
    'lpg': {
        name: 'LPG Boiler',
        efficiency: 0.88,
        fuelType: 'lpg',
        maintenance: 'Annual service',
        lifespan: '10-15 years',
        zoneControl: 'Limited'
    },
    
    // US Systems
    'gas-furnace-modern': {
        name: 'Modern Gas Furnace',
        efficiency: 0.95,
        fuelType: 'gas',
        maintenance: 'Annual service',
        lifespan: '15-20 years',
        zoneControl: 'Limited'
    },
    'gas-furnace-old': {
        name: 'Older Gas Furnace',
        efficiency: 0.78,
        fuelType: 'gas',
        maintenance: 'Annual service',
        lifespan: '5-10 years',
        zoneControl: 'Limited'
    },
    'electric-furnace': {
        name: 'Electric Furnace',
        efficiency: 1.0,
        fuelType: 'electricity',
        maintenance: 'Minimal',
        lifespan: '20-30 years',
        zoneControl: 'Limited'
    },
    'electric-baseboard': {
        name: 'Electric Baseboard',
        efficiency: 1.0,
        fuelType: 'electricity',
        maintenance: 'None',
        lifespan: '20+ years',
        zoneControl: 'Per-room'
    },
    'oil-furnace': {
        name: 'Oil Furnace',
        efficiency: 0.83,
        fuelType: 'oil',
        maintenance: 'Annual service',
        lifespan: '15-25 years',
        zoneControl: 'Limited'
    },
    'propane': {
        name: 'Propane Furnace',
        efficiency: 0.90,
        fuelType: 'propane',
        maintenance: 'Annual service',
        lifespan: '15-20 years',
        zoneControl: 'Limited'
    },
    'wood-pellet': {
        name: 'Wood/Pellet Stove',
        efficiency: 0.75,
        fuelType: 'wood',
        maintenance: 'Regular cleaning',
        lifespan: '15-20 years',
        zoneControl: 'Zoned'
    },
    
    // Shared
    'heat-pump': {
        name: 'Heat Pump',
        efficiency: 3.0,  // COP
        fuelType: 'electricity',
        maintenance: 'Annual check',
        lifespan: '20-25 years',
        zoneControl: 'Zoned'
    },
    'none': {
        name: 'No Central Heating',
        efficiency: 0.8,
        fuelType: 'mixed',
        maintenance: 'N/A',
        lifespan: 'N/A',
        zoneControl: 'N/A'
    }
};

// CO2 emissions kg per kWh by fuel type
const CO2_FACTORS = {
    uk: {
        gas: 0.182,
        electricity: 0.193,  // UK grid average
        oil: 0.245,
        lpg: 0.214,
        mixed: 0.2
    },
    us: {
        gas: 0.181,
        electricity: 0.386,  // US grid average (higher due to more coal/gas)
        oil: 0.250,
        propane: 0.215,
        wood: 0.039,  // Considered carbon-neutral-ish
        mixed: 0.25
    }
};

// ============ UI INITIALIZATION ============

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initializeSelectCards();
    initializeToggleGroups();
    initializeDimensionInputs();
    initializeInstallCheckbox();
    
    // If market already selected, apply it
    if (state.market) {
        applyMarketSettings(state.market, false);
        document.getElementById('headerSettings').style.display = 'flex';
    }
    
    updateProgress();
    goToStep(state.currentStep);
});

// ============ MARKET SELECTION ============

function selectMarket(market) {
    state.market = market;
    
    // Update UI
    document.querySelectorAll('.market-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.market === market);
    });
    
    // Set default units based on market
    state.units = MARKET_DEFAULTS[market].units;
    
    // Show unit preferences
    document.getElementById('unitPreferences').style.display = 'block';
    
    // Set the correct toggle button active
    document.querySelectorAll('#unitToggle .toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === state.units);
    });
    
    // Enable start button
    document.getElementById('startCalculatorBtn').disabled = false;
    
    saveState();
}

function startCalculator() {
    if (!state.market) return;
    
    // Apply market settings
    applyMarketSettings(state.market, true);
    
    // Show header settings
    document.getElementById('headerSettings').style.display = 'flex';
    
    // Move to step 1
    goToStep(1);
}

function applyMarketSettings(market, setDefaults = false) {
    const defaults = MARKET_DEFAULTS[market];
    
    // Set default tariffs if not already set or if forcing defaults
    if (setDefaults || state.costs.electricityTariff === null) {
        state.costs.electricityTariff = defaults.electricityTariff;
        document.getElementById('electricityTariff').value = defaults.electricityTariff;
    }
    if (setDefaults || state.costs.gasTariff === null) {
        state.costs.gasTariff = defaults.gasTariff;
        document.getElementById('gasTariff').value = defaults.gasTariff;
    }
    
    // Update currency symbols
    document.querySelectorAll('.currency-symbol').forEach(el => {
        el.textContent = defaults.currency;
    });
    
    // Update tariff units
    document.querySelectorAll('.tariff-unit').forEach(el => {
        el.textContent = defaults.tariffUnit;
    });
    
    // Update tooltips
    if (market === 'us') {
        document.querySelector('.tariff-tooltip')?.setAttribute('data-tip', 
            'Your electricity rate per kWh. US average is ~$0.16/kWh but varies by state ($0.10-$0.35).');
        document.querySelector('.gas-tooltip')?.setAttribute('data-tip', 
            'Your natural gas rate per kWh. US average is ~$0.012/kWh (~$1.20/therm).');
    } else {
        document.querySelector('.tariff-tooltip')?.setAttribute('data-tip', 
            'Your electricity rate per kWh. The UK average in 2026 is around 22p/kWh.');
        document.querySelector('.gas-tooltip')?.setAttribute('data-tip', 
            'Your gas rate per kWh. The UK average is around 5.5p/kWh.');
    }
    
    // Show/hide market-specific elements
    document.querySelectorAll('.market-uk').forEach(el => {
        el.style.display = market === 'uk' ? '' : 'none';
    });
    document.querySelectorAll('.market-us').forEach(el => {
        el.style.display = market === 'us' ? '' : 'none';
    });
    
    // Update header indicator
    document.getElementById('marketIndicator').textContent = defaults.flag;
    
    // Apply unit settings
    applyUnitSettings(state.units);
    
    // Re-initialize select cards for the visible market
    initializeSelectCards();
    
    saveState();
}

function toggleUnits() {
    state.units = state.units === 'metric' ? 'imperial' : 'metric';
    applyUnitSettings(state.units);
    
    // Update toggle buttons
    document.querySelectorAll('#unitToggle .toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === state.units);
    });
    
    // Re-render room list with new units
    renderRoomList();
    
    saveState();
}

function applyUnitSettings(units) {
    const isMetric = units === 'metric';
    
    // Update header indicator
    document.getElementById('unitIndicator').textContent = isMetric ? 'm²' : 'ft²';
    
    // Update dimension labels in room modal
    const lengthLabel = isMetric ? 'Length (m)' : 'Length (ft)';
    const widthLabel = isMetric ? 'Width (m)' : 'Width (ft)';
    const heightLabel = isMetric ? 'Height (m)' : 'Height (ft)';
    
    document.querySelector('.dimension-label-length')?.textContent && 
        (document.querySelector('.dimension-label-length').textContent = lengthLabel);
    document.querySelector('.dimension-label-width')?.textContent && 
        (document.querySelector('.dimension-label-width').textContent = widthLabel);
    document.querySelector('.dimension-label-height')?.textContent && 
        (document.querySelector('.dimension-label-height').textContent = heightLabel);
    
    // Update area unit
    document.querySelectorAll('.area-unit').forEach(el => {
        el.textContent = isMetric ? 'm²' : 'ft²';
    });
    
    // Update size presets visibility
    document.querySelectorAll('.size-label-metric').forEach(el => {
        el.style.display = isMetric ? '' : 'none';
    });
    document.querySelectorAll('.size-label-imperial').forEach(el => {
        el.style.display = isMetric ? 'none' : '';
    });
    
    // Update default height placeholder
    const heightInput = document.getElementById('roomHeight');
    if (heightInput) {
        heightInput.placeholder = isMetric ? '2.4' : '8';
        if (!heightInput.value) {
            heightInput.value = isMetric ? '2.4' : '8';
        }
    }
}

function initializeSelectCards() {
    document.querySelectorAll('.select-cards').forEach(container => {
        const field = container.dataset.field;
        container.querySelectorAll('.select-card').forEach(card => {
            card.addEventListener('click', () => {
                // Remove selected from siblings
                container.querySelectorAll('.select-card').forEach(c => c.classList.remove('selected'));
                // Add selected to clicked
                card.classList.add('selected');
                
                // Update state
                const value = card.dataset.value;
                updateStateField(field, value);
                saveState();
            });
        });
    });
}

function initializeToggleGroups() {
    document.querySelectorAll('.toggle-group').forEach(group => {
        group.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const value = btn.dataset.value;
                const groupId = group.id;
                
                if (groupId === 'costInputType') {
                    state.costs.inputType = value;
                    document.getElementById('annualCostGroup').style.display = value === 'annual' ? 'block' : 'none';
                    document.getElementById('monthlyCostGroup').style.display = value === 'monthly' ? 'block' : 'none';
                } else if (groupId === 'sizeInputType') {
                    document.getElementById('presetSizeGroup').style.display = value === 'preset' ? 'block' : 'none';
                    document.getElementById('customSizeGroup').style.display = value === 'custom' ? 'flex' : 'none';
                } else if (groupId === 'unitToggle') {
                    state.units = value;
                    applyUnitSettings(value);
                }
                
                saveState();
            });
        });
    });
}

function initializeDimensionInputs() {
    ['roomLength', 'roomWidth', 'roomHeight'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateCalculatedArea);
        }
    });
    
    // Also bind change events for main form inputs
    ['ukRegion', 'usRegion', 'currentHeating', 'currentHeatingUS'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (id === 'ukRegion' || id === 'usRegion') state.property.region = el.value;
                if (id === 'currentHeating' || id === 'currentHeatingUS') state.property.currentHeating = el.value;
                saveState();
            });
        }
    });
    
    // Costs inputs
    ['annualCost', 'monthlyCost', 'electricityTariff', 'gasTariff'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                state.costs[id] = parseFloat(el.value) || null;
                saveState();
            });
        }
    });
}

function initializeInstallCheckbox() {
    const checkbox = document.getElementById('includeInstall');
    if (checkbox) {
        checkbox.addEventListener('change', updateInvestmentDisplay);
    }
}

function updateCalculatedArea() {
    const length = parseFloat(document.getElementById('roomLength').value) || 0;
    const width = parseFloat(document.getElementById('roomWidth').value) || 0;
    let area = length * width;
    
    // Display in current units
    if (state.units === 'imperial') {
        document.getElementById('calculatedArea').textContent = area.toFixed(0);
    } else {
        document.getElementById('calculatedArea').textContent = area.toFixed(1);
    }
}

function updateStateField(field, value) {
    if (field in state.property) {
        state.property[field] = value;
    } else if (field === 'propertyType') {
        state.property.type = value;
    } else if (field === 'propertyAge') {
        state.property.age = value;
    } else if (field === 'heatingPattern') {
        state.costs.heatingPattern = value;
    } else if (field === 'roomSize') {
        // Handled separately in room modal
    }
}

// ============ NAVIGATION ============

function goToStep(step) {
    state.currentStep = step;
    
    // Update wizard steps visibility (step0 is market selection)
    document.querySelectorAll('.wizard-step').forEach((el) => {
        const elStep = parseInt(el.id.replace('step', ''));
        el.classList.toggle('active', elStep === step);
    });
    
    // Update progress steps (only for steps 1-5)
    document.querySelectorAll('.progress-steps .step').forEach((el, i) => {
        const stepNum = i + 1;
        el.classList.toggle('active', stepNum === step);
        el.classList.toggle('completed', stepNum < step && step > 0);
    });
    
    // Show/hide progress bar (hide on step 0)
    document.querySelector('.progress-container').style.display = step === 0 ? 'none' : '';
    
    updateProgress();
    saveState();
    
    // Special actions per step
    if (step === 4) {
        renderResults();
    } else if (step === 5) {
        renderReport();
    }
}

function nextStep() {
    if (validateCurrentStep()) {
        goToStep(state.currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevStep() {
    goToStep(state.currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
    const fill = document.getElementById('progressFill');
    const percent = (state.currentStep / 5) * 100;
    fill.style.width = `${percent}%`;
}

function validateCurrentStep() {
    switch (state.currentStep) {
        case 1:
            if (!state.property.type) {
                alert('Please select your property type');
                return false;
            }
            if (!state.property.age) {
                alert('Please select your property age');
                return false;
            }
            if (!state.property.insulation) {
                alert('Please select your insulation rating');
                return false;
            }
            if (!state.property.region) {
                alert(state.market === 'uk' ? 'Please select your UK region' : 'Please select your state');
                return false;
            }
            if (!state.property.currentHeating) {
                alert('Please select your current heating type');
                return false;
            }
            return true;
            
        case 2:
            if (state.rooms.length === 0) {
                alert('Please add at least one room');
                return false;
            }
            return true;
            
        case 3:
            const cost = state.costs.inputType === 'annual' 
                ? state.costs.annualCost 
                : state.costs.monthlyCost;
            if (!cost || cost <= 0) {
                alert('Please enter your current heating costs');
                return false;
            }
            if (!state.costs.heatingPattern) {
                alert('Please select your heating usage pattern');
                return false;
            }
            return true;
            
        default:
            return true;
    }
}

// ============ ROOM MANAGEMENT ============

function openRoomModal(index = null) {
    state.editingRoomIndex = index;
    
    // Reset modal
    document.getElementById('roomType').value = '';
    document.getElementById('roomName').value = '';
    document.querySelectorAll('#roomModal [data-field="roomSize"] .select-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('roomLength').value = '';
    document.getElementById('roomWidth').value = '';
    document.getElementById('roomHeight').value = '2.4';
    document.getElementById('windowArea').value = 'medium';
    document.getElementById('externalWalls').value = '1';
    document.getElementById('floorType').value = 'ground';
    document.getElementById('usagePattern').value = 'regular';
    document.getElementById('calculatedArea').textContent = '0';
    
    // Reset to preset size view
    document.querySelectorAll('#sizeInputType .toggle-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.value === 'preset');
    });
    document.getElementById('presetSizeGroup').style.display = 'block';
    document.getElementById('customSizeGroup').style.display = 'none';
    
    if (index !== null) {
        // Editing existing room
        const room = state.rooms[index];
        document.getElementById('roomModalTitle').textContent = 'Edit Room';
        document.getElementById('saveRoomBtn').textContent = 'Save Changes';
        
        document.getElementById('roomType').value = room.type;
        document.getElementById('roomName').value = room.customName || '';
        document.getElementById('windowArea').value = room.windowArea;
        document.getElementById('externalWalls').value = room.externalWalls.toString();
        document.getElementById('floorType').value = room.floorType;
        document.getElementById('usagePattern').value = room.usagePattern;
        
        if (room.sizeType === 'preset') {
            document.querySelector(`#roomModal [data-field="roomSize"] [data-value="${room.size}"]`)?.classList.add('selected');
        } else {
            // Switch to custom
            document.querySelectorAll('#sizeInputType .toggle-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.value === 'custom');
            });
            document.getElementById('presetSizeGroup').style.display = 'none';
            document.getElementById('customSizeGroup').style.display = 'flex';
            document.getElementById('roomLength').value = room.length;
            document.getElementById('roomWidth').value = room.width;
            document.getElementById('roomHeight').value = room.height;
            updateCalculatedArea();
        }
    } else {
        document.getElementById('roomModalTitle').textContent = 'Add Room';
        document.getElementById('saveRoomBtn').textContent = 'Add Room';
    }
    
    document.getElementById('roomModal').classList.add('open');
}

function closeRoomModal() {
    document.getElementById('roomModal').classList.remove('open');
    state.editingRoomIndex = null;
}

function applyRoomPreset() {
    const type = document.getElementById('roomType').value;
    if (type && ROOM_PRESETS[type]) {
        const preset = ROOM_PRESETS[type];
        // Select the default size
        document.querySelectorAll('#roomModal [data-field="roomSize"] .select-card').forEach(c => {
            c.classList.toggle('selected', c.dataset.value === preset.defaultSize);
        });
    }
}

function saveRoom() {
    const type = document.getElementById('roomType').value;
    if (!type) {
        alert('Please select a room type');
        return;
    }
    
    const customName = document.getElementById('roomName').value.trim();
    const sizeType = document.querySelector('#sizeInputType .toggle-btn.active').dataset.value;
    
    let area, height, length, width, size;
    
    if (sizeType === 'preset') {
        const selectedSize = document.querySelector('#roomModal [data-field="roomSize"] .select-card.selected');
        if (!selectedSize) {
            alert('Please select a room size');
            return;
        }
        size = selectedSize.dataset.value;
        const sizeData = SIZE_PRESETS[size];
        area = sizeData.area;
        height = sizeData.height;
        length = Math.sqrt(area);
        width = Math.sqrt(area);
    } else {
        length = parseFloat(document.getElementById('roomLength').value);
        width = parseFloat(document.getElementById('roomWidth').value);
        height = parseFloat(document.getElementById('roomHeight').value);
        
        if (!length || !width || !height) {
            alert('Please enter room dimensions');
            return;
        }
        
        // Convert from imperial to metric if needed (store internally as metric)
        if (state.units === 'imperial') {
            length = length * CONVERSIONS.ftToM;
            width = width * CONVERSIONS.ftToM;
            height = height * CONVERSIONS.ftToM;
        }
        
        area = length * width;
    }
    
    const room = {
        type,
        customName,
        sizeType,
        size,
        area,
        length,
        width,
        height,
        windowArea: document.getElementById('windowArea').value,
        externalWalls: parseInt(document.getElementById('externalWalls').value),
        floorType: document.getElementById('floorType').value,
        usagePattern: document.getElementById('usagePattern').value
    };
    
    // Calculate heat requirements
    const calc = calculateRoomHeat(room);
    room.heatLoss = calc.heatLoss;
    room.recommendedWattage = calc.recommendedWattage;
    room.panel = calc.panel;
    room.calculation = calc.calculation;
    
    if (state.editingRoomIndex !== null) {
        state.rooms[state.editingRoomIndex] = room;
    } else {
        state.rooms.push(room);
    }
    
    saveState();
    renderRoomList();
    closeRoomModal();
}

function deleteRoom(index) {
    if (confirm('Remove this room?')) {
        state.rooms.splice(index, 1);
        saveState();
        renderRoomList();
    }
}

function renderRoomList() {
    const list = document.getElementById('roomList');
    const empty = document.getElementById('emptyRooms');
    const summary = document.getElementById('roomSummary');
    const continueBtn = document.getElementById('step2Continue');
    
    if (state.rooms.length === 0) {
        list.innerHTML = '';
        list.appendChild(empty);
        empty.style.display = 'block';
        summary.style.display = 'none';
        continueBtn.disabled = true;
        return;
    }
    
    empty.style.display = 'none';
    continueBtn.disabled = false;
    
    list.innerHTML = state.rooms.map((room, i) => {
        const preset = ROOM_PRESETS[room.type];
        const name = room.customName || preset.name;
        const areaDisplay = formatArea(room.area);
        
        return `
            <div class="room-card">
                <div class="room-icon">${preset.icon}</div>
                <div class="room-info">
                    <div class="room-title">${name}</div>
                    <div class="room-details">${areaDisplay} • ${room.externalWalls} external wall${room.externalWalls !== 1 ? 's' : ''}</div>
                </div>
                <div class="room-wattage">
                    <div class="room-wattage-value">${room.recommendedWattage}W</div>
                    <div class="room-wattage-label">${room.panel.name}</div>
                </div>
                <div class="room-actions">
                    <button onclick="openRoomModal(${i})" title="Edit">✏️</button>
                    <button onclick="deleteRoom(${i})" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Update summary
    const totalArea = state.rooms.reduce((sum, r) => sum + r.area, 0);
    const totalWattage = state.rooms.reduce((sum, r) => sum + r.recommendedWattage, 0);
    
    document.getElementById('totalRooms').textContent = state.rooms.length;
    document.getElementById('totalArea').textContent = totalArea.toFixed(0);
    document.getElementById('estWattage').textContent = totalWattage.toLocaleString();
    
    summary.style.display = 'grid';
}

// ============ HEAT CALCULATIONS ============

function calculateRoomHeat(room) {
    const calc = {
        steps: []
    };
    
    // Base heat loss from insulation
    const baseHeatLoss = HEAT_LOSS.baseByInsulation[state.property.insulation];
    calc.steps.push(`Base heat loss (${state.property.insulation} insulation): ${baseHeatLoss} W/m²`);
    
    // Age multiplier
    const ageMultiplier = HEAT_LOSS.ageMultiplier[state.property.age];
    calc.steps.push(`Age multiplier (${state.property.age}): ×${ageMultiplier}`);
    
    // Property type multiplier
    const typeMultiplier = HEAT_LOSS.typeMultiplier[state.property.type];
    calc.steps.push(`Property type multiplier (${state.property.type}): ×${typeMultiplier}`);
    
    // External walls adjustment
    const wallAdjust = room.externalWalls * HEAT_LOSS.externalWallAdd;
    calc.steps.push(`External walls (${room.externalWalls}): +${wallAdjust} W/m²`);
    
    // Window multiplier
    const windowMultiplier = HEAT_LOSS.windowMultiplier[room.windowArea];
    calc.steps.push(`Window area (${room.windowArea}): ×${windowMultiplier}`);
    
    // Floor multiplier
    const floorMultiplier = HEAT_LOSS.floorMultiplier[room.floorType];
    calc.steps.push(`Floor type (${room.floorType}): ×${floorMultiplier}`);
    
    // Height adjustment
    const heightAbove24 = Math.max(0, (room.height - 2.4) * 10); // in 10cm units
    const heightMultiplier = 1 + (heightAbove24 * HEAT_LOSS.heightAdjustPer10cm);
    if (heightMultiplier > 1) {
        calc.steps.push(`Ceiling height (${room.height}m): ×${heightMultiplier.toFixed(2)}`);
    }
    
    // Climate multiplier
    const climateData = HEAT_LOSS.climateMultiplier[state.market] || HEAT_LOSS.climateMultiplier.uk;
    const climateMultiplier = climateData[state.property.region] || 1;
    const regionLabel = state.market === 'uk' ? 'UK region' : 'US state';
    calc.steps.push(`${regionLabel} (${state.property.region}): ×${climateMultiplier}`);
    
    // Room type multiplier
    const roomTypeMultiplier = HEAT_LOSS.roomTypeMultiplier[room.type];
    calc.steps.push(`Room type (${room.type}): ×${roomTypeMultiplier}`);
    
    // Usage multiplier
    const usageMultiplier = HEAT_LOSS.usageMultiplier[room.usagePattern];
    calc.steps.push(`Usage pattern (${room.usagePattern}): ×${usageMultiplier}`);
    
    // Calculate total heat loss per m²
    let heatLossPerM2 = baseHeatLoss + wallAdjust;
    heatLossPerM2 *= ageMultiplier * typeMultiplier * windowMultiplier * floorMultiplier;
    heatLossPerM2 *= heightMultiplier * climateMultiplier * roomTypeMultiplier * usageMultiplier;
    
    calc.steps.push(`Heat loss per m²: ${heatLossPerM2.toFixed(1)} W/m²`);
    
    // Total wattage needed
    const totalWattage = heatLossPerM2 * room.area;
    calc.steps.push(`Room area: ${room.area.toFixed(1)} m²`);
    calc.steps.push(`Total heat requirement: ${totalWattage.toFixed(0)} W`);
    
    // Calculate metres of HeatENE skirting needed
    const metresRequired = totalWattage / HEATENE_SPECS.wattsPerMetre;
    calc.steps.push(`HeatENE output: ${HEATENE_SPECS.wattsPerMetre}W per metre`);
    calc.steps.push(`Skirting required: ${metresRequired.toFixed(1)} linear metres`);
    
    // Calculate room perimeter for reference
    // Assuming roughly square room: perimeter ≈ 4 × √area
    const estimatedPerimeter = 4 * Math.sqrt(room.area);
    const perimeterCoverage = (metresRequired / estimatedPerimeter * 100).toFixed(0);
    calc.steps.push(`Estimated room perimeter: ${estimatedPerimeter.toFixed(1)}m`);
    calc.steps.push(`Wall coverage needed: ~${perimeterCoverage}%`);
    
    // Select appropriate panel(s) for backwards compatibility
    const panel = selectPanel(totalWattage);
    calc.steps.push(`Equivalent panel: ${panel.name} (${panel.wattage}W)`);
    
    return {
        heatLoss: heatLossPerM2,
        recommendedWattage: panel.wattage,
        metresRequired: metresRequired,
        perimeterCoverage: parseFloat(perimeterCoverage),
        panel,
        calculation: calc.steps.join('\n')
    };
}

function selectPanel(wattage) {
    const panels = PANELS[state.market] || PANELS.uk;
    // Find smallest panel that meets or exceeds requirement
    for (const panel of panels) {
        if (panel.wattage >= wattage * 0.85) { // Allow 15% under for efficiency
            return panel;
        }
    }
    // If requirement exceeds max single panel, return the largest
    return panels[panels.length - 1];
}

// ============ RESULTS CALCULATION ============

function calculateResults() {
    if (!validateCurrentStep()) return;
    
    // Get annual heating cost
    let currentAnnualCost;
    if (state.costs.inputType === 'annual') {
        currentAnnualCost = state.costs.annualCost;
    } else {
        currentAnnualCost = state.costs.monthlyCost * 12;
    }
    
    // Current system details
    const currentSystem = HEATING_SYSTEMS[state.property.currentHeating];
    
    // Calculate total panel requirements
    let totalPanelCost = 0;
    let totalPanels = 0;
    let totalWattage = 0;
    
    const roomResults = state.rooms.map(room => {
        totalPanelCost += room.panel.price;
        totalPanels++;
        totalWattage += room.recommendedWattage;
        return {
            ...room,
            panelCost: room.panel.price
        };
    });
    
    const installCostPerPanel = INSTALL_COST_PER_PANEL[state.market] || INSTALL_COST_PER_PANEL.uk;
    const installCost = totalPanels * installCostPerPanel;
    
    // Calculate running costs
    // Assume average daily usage hours based on pattern
    const usageHours = {
        full: 8,
        zoned: 5,
        minimal: 3
    }[state.costs.heatingPattern] || 6;
    
    // Heating season days - varies by climate
    const climateData = HEAT_LOSS.climateMultiplier[state.market] || HEAT_LOSS.climateMultiplier.uk;
    const climateFactor = climateData[state.property.region] || 1;
    // Base heating days adjusted by climate (colder = more days)
    const baseHeatingDays = state.market === 'uk' ? 210 : 180;
    const heatingDays = Math.round(baseHeatingDays * climateFactor);
    
    // Infrared efficiency factor - they don't run 100% of time (thermostat cycling)
    const infraredCycleRate = 0.6; // Typically on 60% of "heating time"
    
    // Annual kWh for HeatENE
    const heateneAnnualKwh = (totalWattage / 1000) * usageHours * heatingDays * infraredCycleRate;
    
    // Calculate annual cost - UK uses pence, US uses dollars directly
    let heateneAnnualCost;
    if (state.market === 'uk') {
        heateneAnnualCost = heateneAnnualKwh * (state.costs.electricityTariff / 100); // Convert pence to pounds
    } else {
        heateneAnnualCost = heateneAnnualKwh * state.costs.electricityTariff; // Already in dollars
    }
    
    // Calculate savings
    const annualSavings = currentAnnualCost - heateneAnnualCost;
    
    // CO2 calculation
    const currentCO2 = calculateCurrentCO2(currentAnnualCost, currentSystem);
    const co2Factors = CO2_FACTORS[state.market] || CO2_FACTORS.uk;
    const heateneCO2 = heateneAnnualKwh * co2Factors.electricity;
    const co2Reduction = Math.max(0, currentCO2 - heateneCO2);
    
    // Payback period
    const totalInvestment = totalPanelCost + installCost;
    const paybackYears = annualSavings > 0 ? totalInvestment / annualSavings : Infinity;
    
    // 10-year projection
    const projection = [];
    let currentCumulative = 0;
    let heateneCumulative = totalInvestment; // Initial investment
    
    for (let year = 0; year <= 10; year++) {
        projection.push({
            year,
            current: currentCumulative,
            heatene: heateneCumulative
        });
        currentCumulative += currentAnnualCost;
        heateneCumulative += heateneAnnualCost;
    }
    
    const tenYearSavings = (currentAnnualCost * 10) - (totalInvestment + heateneAnnualCost * 10);
    
    state.results = {
        currentSystem,
        currentAnnualCost,
        roomResults,
        totalPanels,
        totalWattage,
        totalPanelCost,
        installCost,
        totalInvestment,
        heateneAnnualKwh,
        heateneAnnualCost,
        annualSavings,
        paybackYears,
        currentCO2,
        heateneCO2,
        co2Reduction,
        projection,
        tenYearSavings
    };
    
    saveState();
    nextStep();
}

function calculateCurrentCO2(annualCost, system) {
    const co2Factors = CO2_FACTORS[state.market] || CO2_FACTORS.uk;
    
    // Estimate kWh from cost and fuel type
    let kwhCost;
    if (state.market === 'uk') {
        switch (system.fuelType) {
            case 'gas':
                kwhCost = state.costs.gasTariff / 100; // pence to pounds
                break;
            case 'electricity':
                kwhCost = state.costs.electricityTariff / 100;
                break;
            case 'oil':
                kwhCost = 0.065;
                break;
            case 'lpg':
                kwhCost = 0.075;
                break;
            default:
                kwhCost = state.costs.gasTariff / 100;
        }
    } else {
        // US - costs already in dollars per kWh
        switch (system.fuelType) {
            case 'gas':
                kwhCost = state.costs.gasTariff;
                break;
            case 'electricity':
                kwhCost = state.costs.electricityTariff;
                break;
            case 'oil':
                kwhCost = 0.04; // ~$4/gallon heating oil
                break;
            case 'propane':
                kwhCost = 0.035;
                break;
            case 'wood':
                kwhCost = 0.02;
                break;
            default:
                kwhCost = state.costs.gasTariff;
        }
    }
    
    const estimatedKwh = annualCost / kwhCost;
    return estimatedKwh * (co2Factors[system.fuelType] || 0.2);
}

// ============ HELPER FUNCTIONS ============

function formatCurrency(amount) {
    const symbol = MARKET_DEFAULTS[state.market]?.currency || '£';
    return `${symbol}${Math.round(amount).toLocaleString()}`;
}

function formatArea(sqMeters) {
    if (state.units === 'imperial') {
        return `${(sqMeters * CONVERSIONS.sqmToSqft).toFixed(0)} ft²`;
    }
    return `${sqMeters.toFixed(1)} m²`;
}

function formatLength(meters) {
    if (state.units === 'imperial') {
        return `${(meters * CONVERSIONS.mToFt).toFixed(1)} ft`;
    }
    return `${meters.toFixed(1)} m`;
}

function getAreaInDisplayUnits(sqMeters) {
    if (state.units === 'imperial') {
        return (sqMeters * CONVERSIONS.sqmToSqft).toFixed(0);
    }
    return sqMeters.toFixed(1);
}

function getAreaUnit() {
    return state.units === 'imperial' ? 'ft²' : 'm²';
}

// ============ RESULTS DISPLAY ============

function renderResults() {
    if (!state.results) return;
    
    const r = state.results;
    
    const currency = MARKET_DEFAULTS[state.market]?.currency || '£';
    
    // Summary cards
    document.getElementById('annualSavings').textContent = formatCurrency(r.annualSavings);
    document.getElementById('totalWattage').textContent = `${(r.totalWattage / 1000).toFixed(1)}kW`;
    document.getElementById('panelCount').textContent = r.totalPanels;
    document.getElementById('co2Reduction').textContent = `${Math.round(r.co2Reduction)}kg`;
    
    // Calculate hourly cost label
    let hourlyCostUnit;
    if (state.market === 'uk') {
        hourlyCostUnit = 'p';
    } else {
        hourlyCostUnit = '¢';
    }
    
    // Room results
    const roomResultsHtml = r.roomResults.map(room => {
        const preset = ROOM_PRESETS[room.type];
        const name = room.customName || preset.name;
        
        // Calculate hourly running cost
        let hourlyCost;
        if (state.market === 'uk') {
            hourlyCost = ((room.recommendedWattage / 1000) * state.costs.electricityTariff * 0.6).toFixed(1);
        } else {
            hourlyCost = ((room.recommendedWattage / 1000) * state.costs.electricityTariff * 100 * 0.6).toFixed(1);
        }
        
        return `
            <div class="room-result-card">
                <div class="room-result-header">
                    <div class="room-result-name">${preset.icon} ${name}</div>
                    <div class="room-result-recommendation">
                        <div class="panel-recommendation">${room.panel.name}</div>
                        <div class="panel-price">${currency}${room.panel.price}</div>
                    </div>
                </div>
                <div class="room-result-details">
                    <div class="detail-item">
                        <span class="detail-value">${getAreaInDisplayUnits(room.area)} ${getAreaUnit()}</span>
                        <span class="detail-label">Floor Area</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-value">${room.heatLoss.toFixed(0)} W/m²</span>
                        <span class="detail-label">Heat Loss</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-value">${room.recommendedWattage}W</span>
                        <span class="detail-label">Recommended</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-value">${hourlyCost}${hourlyCostUnit}</span>
                        <span class="detail-label">Cost/Hour</span>
                    </div>
                </div>
                <div class="room-result-math" id="math-${room.type}">
                    <pre>${room.calculation}</pre>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('roomResults').innerHTML = roomResultsHtml;
    
    // Comparison table
    document.getElementById('currentRunningCost').textContent = formatCurrency(r.currentAnnualCost);
    document.getElementById('heateneRunningCost').textContent = formatCurrency(r.heateneAnnualCost);
    document.getElementById('currentEfficiency').textContent = r.currentSystem.efficiency < 1 
        ? `${Math.round(r.currentSystem.efficiency * 100)}%`
        : r.currentSystem.efficiency > 1 
            ? `COP ${r.currentSystem.efficiency}`
            : '100%';
    document.getElementById('currentZoneControl').textContent = r.currentSystem.zoneControl;
    document.getElementById('currentMaintenance').textContent = r.currentSystem.maintenance;
    document.getElementById('currentLifespan').textContent = r.currentSystem.lifespan;
    
    // Investment summary
    document.getElementById('panelCost').textContent = formatCurrency(r.totalPanelCost);
    document.getElementById('installCost').textContent = formatCurrency(r.installCost);
    updateInvestmentDisplay();
    
    const paybackText = r.paybackYears === Infinity 
        ? '∞' 
        : r.paybackYears < 1 
            ? '<1' 
            : r.paybackYears.toFixed(1);
    document.getElementById('paybackYears').textContent = paybackText;
    
    // 10-year savings
    document.getElementById('tenYearSavings').textContent = formatCurrency(r.tenYearSavings);
    
    // Render chart
    renderProjectionChart();
}

function updateInvestmentDisplay() {
    if (!state.results) return;
    
    const includeInstall = document.getElementById('includeInstall').checked;
    const total = state.results.totalPanelCost + (includeInstall ? state.results.installCost : 0);
    document.getElementById('totalInvestment').textContent = formatCurrency(total);
    
    // Update payback
    const payback = state.results.annualSavings > 0 ? total / state.results.annualSavings : Infinity;
    const paybackText = payback === Infinity ? '∞' : payback < 1 ? '<1' : payback.toFixed(1);
    document.getElementById('paybackYears').textContent = paybackText;
}

let showingMath = false;

function toggleMath() {
    showingMath = !showingMath;
    document.querySelectorAll('.room-result-math').forEach(el => {
        el.classList.toggle('show', showingMath);
    });
    document.getElementById('mathToggleText').textContent = showingMath ? 'Hide calculations' : 'Show calculations';
}

// ============ CHART ============

function renderProjectionChart() {
    const canvas = document.getElementById('projectionChart');
    const ctx = canvas.getContext('2d');
    const data = state.results.projection;
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Find max value
    const maxValue = Math.max(...data.map(d => Math.max(d.current, d.heatene)));
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight * i / 5);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        
        // Y-axis labels
        const value = maxValue - (maxValue * i / 5);
        const currency = MARKET_DEFAULTS[state.market]?.currency || '£';
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${currency}${Math.round(value / 1000)}k`, padding.left - 10, y + 4);
    }
    
    // X-axis labels
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
        const x = padding.left + (chartWidth * i / 10);
        ctx.fillText(`${i}`, x, height - padding.bottom + 20);
    }
    ctx.fillText('Years', width / 2, height - 5);
    
    // Draw lines
    function drawLine(key, color) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        
        data.forEach((d, i) => {
            const x = padding.left + (chartWidth * i / 10);
            const y = padding.top + chartHeight - (chartHeight * d[key] / maxValue);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }
    
    drawLine('current', '#94a3b8');
    drawLine('heatene', '#e63946');
    
    // Draw break-even point
    const breakEvenYear = state.results.paybackYears;
    if (breakEvenYear > 0 && breakEvenYear <= 10) {
        const x = padding.left + (chartWidth * breakEvenYear / 10);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#2a9d8f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#2a9d8f';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('Break-even', x, padding.top - 5);
    }
}

// ============ REPORT GENERATION ============

function renderReport() {
    if (!state.results) return;
    
    const r = state.results;
    const currency = MARKET_DEFAULTS[state.market]?.currency || '£';
    const dateLocale = state.market === 'us' ? 'en-US' : 'en-GB';
    const date = new Date().toLocaleDateString(dateLocale, { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    const propertyTypes = {
        // UK
        flat: 'Flat/Apartment',
        terrace: 'Terraced House',
        semi: 'Semi-Detached House',
        detached: 'Detached House',
        bungalow: 'Bungalow',
        // US
        apartment: 'Apartment',
        condo: 'Condominium',
        townhouse: 'Townhouse',
        'single-family': 'Single-Family Home',
        ranch: 'Ranch House'
    };
    const propertyType = propertyTypes[state.property.type] || state.property.type;
    
    const includeInstall = document.getElementById('includeInstall')?.checked ?? true;
    const totalCost = r.totalPanelCost + (includeInstall ? r.installCost : 0);
    
    const regionLabel = state.market === 'uk' ? 'UK Region' : 'State';
    
    const html = `
        <div class="report-header">
            <div class="report-logo">
                <span style="color: #e63946;">Heat</span><span>ENE</span>
            </div>
            <div class="report-title">Whole-Home Heating Assessment</div>
            <div class="report-date">Generated: ${date}</div>
        </div>
        
        <div class="report-section">
            <h3>Property Details</h3>
            <div class="report-grid">
                <div class="report-item">
                    <span class="report-item-label">Property Type</span>
                    <span class="report-item-value">${propertyType}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">Property Age</span>
                    <span class="report-item-value">${state.property.age}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">Insulation</span>
                    <span class="report-item-value">${state.property.insulation.charAt(0).toUpperCase() + state.property.insulation.slice(1)}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">${regionLabel}</span>
                    <span class="report-item-value">${state.property.region}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">Current Heating</span>
                    <span class="report-item-value">${r.currentSystem.name}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">Total Rooms</span>
                    <span class="report-item-value">${state.rooms.length}</span>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h3>Recommended Panels</h3>
            <table class="report-room-table">
                <thead>
                    <tr>
                        <th>Room</th>
                        <th>Area</th>
                        <th>Heat Loss</th>
                        <th>Panel</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.roomResults.map(room => {
                        const preset = ROOM_PRESETS[room.type];
                        const name = room.customName || preset.name;
                        return `
                            <tr>
                                <td>${name}</td>
                                <td>${getAreaInDisplayUnits(room.area)} ${getAreaUnit()}</td>
                                <td>${room.heatLoss.toFixed(0)} W/m²</td>
                                <td>${room.panel.name}</td>
                                <td>${currency}${room.panel.price}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3"><strong>Total</strong></td>
                        <td><strong>${r.totalWattage.toLocaleString()}W</strong></td>
                        <td><strong>${currency}${r.totalPanelCost.toLocaleString()}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <div class="report-section">
            <h3>Investment Summary</h3>
            <div class="report-grid">
                <div class="report-item">
                    <span class="report-item-label">Panel Equipment</span>
                    <span class="report-item-value">${currency}${r.totalPanelCost.toLocaleString()}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">Installation${!includeInstall ? ' (excluded)' : ''}</span>
                    <span class="report-item-value">${includeInstall ? currency + r.installCost.toLocaleString() : 'DIY'}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label"><strong>Total Investment</strong></span>
                    <span class="report-item-value"><strong>${currency}${totalCost.toLocaleString()}</strong></span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">Payback Period</span>
                    <span class="report-item-value">${r.paybackYears < 100 ? r.paybackYears.toFixed(1) + ' years' : 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h3>Annual Cost Comparison</h3>
            <div class="report-grid">
                <div class="report-item">
                    <span class="report-item-label">Current System</span>
                    <span class="report-item-value">${currency}${Math.round(r.currentAnnualCost).toLocaleString()}/year</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">HeatENE System</span>
                    <span class="report-item-value">${currency}${Math.round(r.heateneAnnualCost).toLocaleString()}/year</span>
                </div>
            </div>
            <div class="report-highlight" style="margin-top: var(--space-4);">
                <div class="report-highlight-value">${currency}${Math.round(r.annualSavings).toLocaleString()}</div>
                <div class="report-highlight-label">Projected Annual Savings</div>
            </div>
        </div>
        
        <div class="report-section">
            <h3>Environmental Impact</h3>
            <div class="report-grid">
                <div class="report-item">
                    <span class="report-item-label">Current CO₂ Emissions</span>
                    <span class="report-item-value">${Math.round(r.currentCO2)} kg/year</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">HeatENE CO₂ Emissions</span>
                    <span class="report-item-value">${Math.round(r.heateneCO2)} kg/year</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label"><strong>CO₂ Reduction</strong></span>
                    <span class="report-item-value"><strong>${Math.round(r.co2Reduction)} kg/year</strong></span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">10-Year CO₂ Saved</span>
                    <span class="report-item-value">${(r.co2Reduction * 10 / 1000).toFixed(1)} tonnes</span>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h3>10-Year Financial Projection</h3>
            <div class="report-highlight">
                <div class="report-highlight-value">${currency}${Math.round(r.tenYearSavings).toLocaleString()}</div>
                <div class="report-highlight-label">Total 10-Year Savings vs Current System</div>
            </div>
            <p style="text-align: center; color: var(--gray-600); margin-top: var(--space-4); font-size: var(--font-size-sm);">
                Based on current electricity tariff of ${state.market === 'uk' ? state.costs.electricityTariff + 'p' : '$' + state.costs.electricityTariff}/kWh. 
                Actual savings may vary based on usage patterns and energy price changes.
            </p>
        </div>
        
        <div class="report-footer">
            <p>This assessment is provided for estimation purposes only. 
            Actual heating requirements may vary based on individual circumstances. 
            A professional survey is recommended before purchase.</p>
            <div class="report-contact">
                <p>Ready to transform your home heating?</p>
                <p>Contact HeatENE today for a detailed quote</p>
            </div>
        </div>
    `;
    
    document.getElementById('reportContainer').innerHTML = html;
}

// ============ UTILITIES ============

function startOver() {
    if (confirm('Start a new calculation? This will clear all your data.')) {
        localStorage.removeItem(STATE_KEY);
        location.reload();
    }
}

function restoreUIFromState() {
    // Restore market selection
    if (state.market) {
        document.querySelectorAll('.market-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.market === state.market);
        });
        document.getElementById('unitPreferences').style.display = 'block';
        document.getElementById('startCalculatorBtn').disabled = false;
    }
    
    // Restore unit toggle
    if (state.units) {
        document.querySelectorAll('#unitToggle .toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === state.units);
        });
    }
    
    // Restore property selections - check both UK and US versions
    Object.entries(state.property).forEach(([key, value]) => {
        if (value) {
            // Try both market-specific and generic selectors
            const fieldName = key === 'type' ? 'propertyType' : key === 'age' ? 'propertyAge' : key;
            const cards = document.querySelectorAll(`[data-field="${fieldName}"] [data-value="${value}"]`);
            cards.forEach(card => card.classList.add('selected'));
        }
    });
    
    // Restore region selects (both UK and US)
    if (state.property.region) {
        const ukSelect = document.getElementById('ukRegion');
        const usSelect = document.getElementById('usRegion');
        if (ukSelect) ukSelect.value = state.property.region;
        if (usSelect) usSelect.value = state.property.region;
    }
    
    // Restore heating selects (both UK and US)
    if (state.property.currentHeating) {
        const ukSelect = document.getElementById('currentHeating');
        const usSelect = document.getElementById('currentHeatingUS');
        if (ukSelect) ukSelect.value = state.property.currentHeating;
        if (usSelect) usSelect.value = state.property.currentHeating;
    }
    
    // Restore costs
    if (state.costs.annualCost) {
        document.getElementById('annualCost').value = state.costs.annualCost;
    }
    if (state.costs.monthlyCost) {
        document.getElementById('monthlyCost').value = state.costs.monthlyCost;
    }
    if (state.costs.electricityTariff) {
        document.getElementById('electricityTariff').value = state.costs.electricityTariff;
    }
    if (state.costs.gasTariff) {
        document.getElementById('gasTariff').value = state.costs.gasTariff;
    }
    if (state.costs.heatingPattern) {
        const card = document.querySelector(`[data-field="heatingPattern"] [data-value="${state.costs.heatingPattern}"]`);
        if (card) card.classList.add('selected');
    }
    
    // Restore cost input type
    if (state.costs.inputType === 'monthly') {
        document.querySelectorAll('#costInputType .toggle-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.value === 'monthly');
        });
        document.getElementById('annualCostGroup').style.display = 'none';
        document.getElementById('monthlyCostGroup').style.display = 'block';
    }
    
    // Render room list
    renderRoomList();
}

// Handle window resize for chart
window.addEventListener('resize', () => {
    if (state.currentStep === 4 && state.results) {
        renderProjectionChart();
    }
});
