/* ====================================
   HeatENE Calculator - Application Logic
   USA Edition
   ==================================== */

// ============ STATE MANAGEMENT ============

const STATE_KEY = 'heatene_calculator_state';

let state = {
    currentStep: 0, // Start at welcome/path selection
    market: 'us', // USA only
    units: 'imperial', // Default to imperial
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
        electricityTariff: 0.16, // $/kWh US default
        gasTariff: 0.012, // $/kWh US default
        heatingPattern: null
    },
    results: null,
    editingRoomIndex: null
};

// Market defaults (US only)
const MARKET_DEFAULTS = {
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
            // Always ensure US market
            state.market = 'us';
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

// Room type configurations with wall availability
// wallAvailability = percentage of perimeter that can have baseboard (accounts for doors, fixtures, etc.)
const ROOM_PRESETS = {
    living: { icon: '🛋️', name: 'Living Room', tempTarget: 70, defaultSize: 'large', wallAvailability: 0.75 },
    bedroom: { icon: '🛏️', name: 'Bedroom', tempTarget: 65, defaultSize: 'medium', wallAvailability: 0.85 },
    'master-bedroom': { icon: '🛏️', name: 'Master Bedroom', tempTarget: 65, defaultSize: 'large', wallAvailability: 0.80 },
    kitchen: { icon: '🍳', name: 'Kitchen', tempTarget: 65, defaultSize: 'medium', wallAvailability: 0.50 },
    bathroom: { icon: '🚿', name: 'Bathroom', tempTarget: 72, defaultSize: 'small', wallAvailability: 0.60 },
    office: { icon: '💻', name: 'Home Office', tempTarget: 68, defaultSize: 'small', wallAvailability: 0.80 },
    dining: { icon: '🍽️', name: 'Dining Room', tempTarget: 68, defaultSize: 'medium', wallAvailability: 0.80 },
    hallway: { icon: '🚪', name: 'Hallway', tempTarget: 62, defaultSize: 'small', wallAvailability: 0.60 },
    sunroom: { icon: '🌿', name: 'Sunroom', tempTarget: 65, defaultSize: 'large', wallAvailability: 0.30 },
    utility: { icon: '🧺', name: 'Utility Room', tempTarget: 60, defaultSize: 'small', wallAvailability: 0.60 },
    basement: { icon: '🏚️', name: 'Basement', tempTarget: 62, defaultSize: 'xlarge', wallAvailability: 0.70 },
    other: { icon: '📦', name: 'Other', tempTarget: 66, defaultSize: 'medium', wallAvailability: 0.70 }
};

// Size presets in m² (converted to ft² for display)
const SIZE_PRESETS = {
    small: { area: 8, height: 2.4 },      // ~86 ft²
    medium: { area: 14, height: 2.4 },    // ~150 ft²
    large: { area: 22, height: 2.5 },     // ~237 ft²
    xlarge: { area: 30, height: 2.7 }     // ~323 ft²
};

// Heat loss factors
// Thermostat duty cycle - how often heating runs to maintain temperature
// Better insulation = less cycling needed
const DUTY_CYCLE = {
    poor: 0.70,      // 70% - old/uninsulated homes, heating runs most of the time
    average: 0.55,   // 55% - typical home
    good: 0.40,      // 40% - well insulated, less cycling needed
    excellent: 0.30  // 30% - passive house territory, minimal heating needed
};

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
        apartment: 0.85,
        condo: 0.88,
        townhouse: 0.9,
        'single-family': 1.15,
        ranch: 1.2,  // Single story = more roof surface
        'mobile-home': 1.3
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
    
    // Ceiling height adjustment (per 10cm above 2.4m / 8ft)
    heightAdjustPer10cm: 0.03,
    
    // US climate zone multiplier by state
    climateMultiplier: {
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
        sunroom: 1.3,
        utility: 0.75,
        basement: 1.1,
        other: 1.0
    },
    
    // Usage pattern affects sizing
    usageMultiplier: {
        'all-day': 1.0,
        'regular': 0.9,
        'occasional': 0.75
    }
};

// HeatENE Baseboard Specifications
// Product: Graphene heating film at 580W/m², outputs 70W per linear foot of baseboard
const HEATENE_SPECS = {
    wattsPerFoot: 21.3,          // W per linear foot of baseboard (~70W/m)
    wattsPerMetre: 70,           // W per linear meter of baseboard
    filmRating: 580,             // W/m² of the graphene film
    maxSurfaceTemp: 131,         // °F (child safe, ~55°C)
    efficiency: 0.9969,          // 99.69% thermal conversion
    profileHeight: 5.5,          // inches (139mm)
    profileDepth: 0.7,           // inches (18mm)
    maxLength: 20,               // feet per piece (~6m)
    warranty: 10                 // years
};

// Pricing per foot (US)
const HEATENE_PRICING = {
    pricePerFoot: 17.50,      // $ per linear foot (~$57/m)
    installPerFoot: 5.80,     // $ installation per foot (~$19/m)
    thermostat: 108,          // $ per room thermostat
    currency: '$'
};

// Panel configurations for backwards compatibility
const PANELS = [
    { wattage: 400, price: 355, name: 'HeatENE 400', feet: 19 },
    { wattage: 600, price: 445, name: 'HeatENE 600', feet: 28 },
    { wattage: 800, price: 535, name: 'HeatENE 800', feet: 37 },
    { wattage: 1000, price: 635, name: 'HeatENE 1000', feet: 47 }
];

const INSTALL_COST_PER_PANEL = 65;

// Heating system efficiency and characteristics
const HEATING_SYSTEMS = {
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
    'heat-pump': {
        name: 'Heat Pump',
        efficiency: 3.0,  // COP
        fuelType: 'electricity',
        maintenance: 'Annual check',
        lifespan: '20-25 years',
        zoneControl: 'Zoned'
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
    gas: 0.181,
    electricity: 0.386,  // US grid average (higher due to more coal/gas)
    oil: 0.250,
    propane: 0.215,
    wood: 0.039,  // Considered carbon-neutral-ish
    mixed: 0.25
};

// ============ UI INITIALIZATION ============

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initializeSelectCards();
    initializeToggleGroups();
    initializeDimensionInputs();
    initializeInstallCheckbox();
    
    // Apply US market settings
    applyMarketSettings();
    document.getElementById('headerSettings').style.display = 'flex';
    
    updateProgress();
    goToStep(state.currentStep);
});

// ============ MARKET SETTINGS ============

function applyMarketSettings() {
    const defaults = MARKET_DEFAULTS.us;
    
    // Set default tariffs if not already set
    if (state.costs.electricityTariff === null) {
        state.costs.electricityTariff = defaults.electricityTariff;
    }
    document.getElementById('electricityTariff').value = state.costs.electricityTariff;
    
    if (state.costs.gasTariff === null) {
        state.costs.gasTariff = defaults.gasTariff;
    }
    document.getElementById('gasTariff').value = state.costs.gasTariff;
    
    // Update currency symbols
    document.querySelectorAll('.currency-symbol').forEach(el => {
        el.textContent = defaults.currency;
    });
    
    // Update tariff units
    document.querySelectorAll('.tariff-unit').forEach(el => {
        el.textContent = defaults.tariffUnit;
    });
    
    // Apply unit settings
    applyUnitSettings(state.units);
    
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
    
    const lengthEl = document.querySelector('.dimension-label-length');
    const widthEl = document.querySelector('.dimension-label-width');
    const heightEl = document.querySelector('.dimension-label-height');
    
    if (lengthEl) lengthEl.textContent = lengthLabel;
    if (widthEl) widthEl.textContent = widthLabel;
    if (heightEl) heightEl.textContent = heightLabel;
    
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
    
    // Bind change events for form inputs
    const regionEl = document.getElementById('usRegion');
    if (regionEl) {
        regionEl.addEventListener('change', () => {
            state.property.region = regionEl.value;
            saveState();
        });
    }
    
    const heatingEl = document.getElementById('currentHeating');
    if (heatingEl) {
        heatingEl.addEventListener('change', () => {
            state.property.currentHeating = heatingEl.value;
            saveState();
        });
    }
    
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
    
    // Update wizard steps visibility
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
                alert('Please select your state');
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

// Called from step 0 to start the full calculator
function startCalculator() {
    goToStep(1);
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
    document.getElementById('roomHeight').value = state.units === 'imperial' ? '8' : '2.4';
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
    try {
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
        // Wall availability and installation options
        room.estimatedPerimeter = calc.estimatedPerimeter;
        room.availableWallLength = calc.availableWallLength;
        room.wallAvailability = calc.wallAvailability;
        room.hasEnoughWall = calc.hasEnoughWall;
        room.feetIdeal = calc.feetIdeal;
        room.feetPerformance = calc.feetPerformance;
        room.wattsPerformance = calc.wattsPerformance;
        room.coveragePerformance = calc.coveragePerformance;
        room.feetEco = calc.feetEco;
        room.wattsEco = calc.wattsEco;
        room.coverageEco = calc.coverageEco;
        
        if (state.editingRoomIndex !== null) {
            state.rooms[state.editingRoomIndex] = room;
        } else {
            state.rooms.push(room);
        }
        
        saveState();
        renderRoomList();
        closeRoomModal();
    } catch (error) {
        console.error('Error saving room:', error);
        alert('Error saving room: ' + error.message);
    }
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
    const summary = document.getElementById('roomSummary');
    const continueBtn = document.getElementById('step2Continue');
    
    if (state.rooms.length === 0) {
        list.innerHTML = `
            <div class="empty-state" id="emptyRooms">
                <span class="empty-icon">🏠</span>
                <p>No rooms added yet</p>
                <p class="empty-hint">Click "Add Room" to get started</p>
            </div>
        `;
        summary.style.display = 'none';
        continueBtn.disabled = true;
        return;
    }
    
    continueBtn.disabled = false;
    
    list.innerHTML = state.rooms.map((room, i) => {
        const preset = ROOM_PRESETS[room.type];
        const name = room.customName || preset.name;
        const areaDisplay = formatArea(room.area);
        const feetPerf = room.feetPerformance ? Math.ceil(room.feetPerformance) : '-';
        const feetEco = room.feetEco ? Math.ceil(room.feetEco) : '-';
        const wallWarning = room.hasEnoughWall === false ? '<span class="wall-warning" title="Limited wall space">⚠️</span>' : '';
        const availableFeet = room.availableWallLength ? Math.ceil(room.availableWallLength * CONVERSIONS.mToFt) : 0;
        
        return `
            <div class="room-card">
                <div class="room-icon">${preset.icon}</div>
                <div class="room-info">
                    <div class="room-title">${name} ${wallWarning}</div>
                    <div class="room-details">${areaDisplay} • ${availableFeet}ft available</div>
                </div>
                <div class="room-options">
                    <div class="room-option performance">
                        <span class="option-label">⚡ Performance</span>
                        <span class="option-value">${feetPerf}ft</span>
                    </div>
                    <div class="room-option eco">
                        <span class="option-label">🌿 Eco</span>
                        <span class="option-value">${feetEco}ft</span>
                    </div>
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
    document.getElementById('totalArea').textContent = Math.round(totalArea * CONVERSIONS.sqmToSqft);
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
        calc.steps.push(`Ceiling height (${(room.height * CONVERSIONS.mToFt).toFixed(1)}ft): ×${heightMultiplier.toFixed(2)}`);
    }
    
    // Climate multiplier
    const climateMultiplier = HEAT_LOSS.climateMultiplier[state.property.region] || 1;
    calc.steps.push(`State (${state.property.region}): ×${climateMultiplier}`);
    
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
    
    // Total wattage needed for full heating
    const totalWattage = heatLossPerM2 * room.area;
    const areaFt = room.area * CONVERSIONS.sqmToSqft;
    calc.steps.push(`Room area: ${areaFt.toFixed(0)} ft² (${room.area.toFixed(1)} m²)`);
    calc.steps.push(`Total heat requirement: ${totalWattage.toFixed(0)} W`);
    
    // Calculate room perimeter and available wall length
    const estimatedPerimeter = 4 * Math.sqrt(room.area);
    const perimeterFt = estimatedPerimeter * CONVERSIONS.mToFt;
    const roomPreset = ROOM_PRESETS[room.type] || ROOM_PRESETS.other;
    const wallAvailability = roomPreset.wallAvailability;
    const availableWallLength = estimatedPerimeter * wallAvailability;
    const availableFt = availableWallLength * CONVERSIONS.mToFt;
    
    calc.steps.push(`--- Wall Availability ---`);
    calc.steps.push(`Estimated perimeter: ${Math.ceil(perimeterFt)}ft`);
    calc.steps.push(`${roomPreset.name} usable walls: ${(wallAvailability * 100).toFixed(0)}%`);
    calc.steps.push(`Available wall length: ${Math.ceil(availableFt)}ft`);
    
    // Calculate feet of HeatENE baseboard needed (ideal)
    const feetIdeal = totalWattage / HEATENE_SPECS.wattsPerFoot;
    
    // PERFORMANCE MODE: Use all available walls
    const feetPerformance = Math.min(feetIdeal, availableFt);
    const wattsPerformance = feetPerformance * HEATENE_SPECS.wattsPerFoot;
    const coveragePerformance = (wattsPerformance / totalWattage * 100);
    
    // ECO MODE: Use ~60% of available walls (2 longest opposite walls)
    const feetEco = availableFt * 0.6;
    const wattsEco = feetEco * HEATENE_SPECS.wattsPerFoot;
    const coverageEco = (wattsEco / totalWattage * 100);
    
    calc.steps.push(`--- Installation Options ---`);
    calc.steps.push(`⚡ PERFORMANCE: ${Math.ceil(feetPerformance)}ft (${coveragePerformance.toFixed(0)}% of heating need)`);
    calc.steps.push(`🌿 ECO: ${Math.ceil(feetEco)}ft on 2 opposite walls (${coverageEco.toFixed(0)}% of heating need)`);
    
    // Check if there's enough wall space
    const hasEnoughWall = availableFt >= feetIdeal * 0.7; // At least 70% coverage possible
    if (!hasEnoughWall) {
        calc.steps.push(`⚠️ Limited wall space - consider supplementary heating`);
    }
    
    // Select appropriate panel(s) for backwards compatibility
    const panel = selectPanel(totalWattage);
    
    return {
        heatLoss: heatLossPerM2,
        recommendedWattage: panel.wattage,
        // Ideal (unconstrained)
        feetIdeal: feetIdeal,
        // Performance mode (all available walls)
        feetPerformance: feetPerformance,
        wattsPerformance: wattsPerformance,
        coveragePerformance: coveragePerformance,
        // Eco mode (2 opposite walls)
        feetEco: feetEco,
        wattsEco: wattsEco,
        coverageEco: coverageEco,
        // Wall info
        estimatedPerimeter: estimatedPerimeter,
        availableWallLength: availableWallLength,
        wallAvailability: wallAvailability,
        hasEnoughWall: hasEnoughWall,
        panel,
        calculation: calc.steps.join('\n')
    };
}

function selectPanel(wattage) {
    // Find smallest panel that meets or exceeds requirement
    for (const panel of PANELS) {
        if (panel.wattage >= wattage * 0.85) { // Allow 15% under for efficiency
            return panel;
        }
    }
    // If requirement exceeds max single panel, return the largest
    return PANELS[PANELS.length - 1];
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
    
    const installCost = totalPanels * INSTALL_COST_PER_PANEL;
    
    // Calculate running costs
    // Assume average daily usage hours based on pattern
    const usageHours = {
        full: 8,
        zoned: 5,
        minimal: 3
    }[state.costs.heatingPattern] || 6;
    
    // Heating season days - varies by climate
    const climateFactor = HEAT_LOSS.climateMultiplier[state.property.region] || 1;
    // Base heating days adjusted by climate (colder = more days)
    const baseHeatingDays = 180;
    const heatingDays = Math.round(baseHeatingDays * climateFactor);
    
    // Thermostat duty cycle - based on insulation quality
    const insulation = state.property.insulation || 'average';
    const infraredCycleRate = DUTY_CYCLE[insulation] || 0.55;
    
    // Annual kWh for HeatENE
    const heateneAnnualKwh = (totalWattage / 1000) * usageHours * heatingDays * infraredCycleRate;
    
    // Calculate annual cost - US uses dollars directly
    const heateneAnnualCost = heateneAnnualKwh * state.costs.electricityTariff;
    
    // Calculate savings
    const annualSavings = currentAnnualCost - heateneAnnualCost;
    
    // CO2 calculation
    const currentCO2 = calculateCurrentCO2(currentAnnualCost, currentSystem);
    const heateneCO2 = heateneAnnualKwh * CO2_FACTORS.electricity;
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
    // Estimate kWh from cost and fuel type
    let kwhCost;
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
    
    const estimatedKwh = annualCost / kwhCost;
    return estimatedKwh * (CO2_FACTORS[system.fuelType] || 0.25);
}

// ============ HELPER FUNCTIONS ============

function formatCurrency(amount) {
    return `$${Math.round(amount).toLocaleString()}`;
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
    
    // Summary cards
    document.getElementById('annualSavings').textContent = formatCurrency(r.annualSavings);
    document.getElementById('totalWattage').textContent = `${(r.totalWattage / 1000).toFixed(1)}kW`;
    document.getElementById('panelCount').textContent = r.totalPanels;
    document.getElementById('co2Reduction').textContent = `${Math.round(r.co2Reduction)}kg`;
    
    // Room results
    const roomResultsHtml = r.roomResults.map(room => {
        const preset = ROOM_PRESETS[room.type];
        const name = room.customName || preset.name;
        
        // Calculate hourly running cost (adjusted for thermostat duty cycle)
        const dutyCycle = DUTY_CYCLE[state.property.insulation] || 0.55;
        const hourlyCost = ((room.recommendedWattage / 1000) * state.costs.electricityTariff * 100 * dutyCycle).toFixed(1);
        
        return `
            <div class="room-result-card">
                <div class="room-result-header">
                    <div class="room-result-name">${preset.icon} ${name}</div>
                    <div class="room-result-recommendation">
                        <div class="panel-recommendation">${room.panel.name}</div>
                        <div class="panel-price">$${room.panel.price}</div>
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
                        <span class="detail-value">${hourlyCost}¢</span>
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
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Poppins, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`$${Math.round(value / 1000)}k`, padding.left - 10, y + 4);
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
    drawLine('heatene', '#f15a29');
    
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
        ctx.font = '11px Poppins, sans-serif';
        ctx.fillText('Break-even', x, padding.top - 5);
    }
}

// ============ REPORT GENERATION ============

function renderReport() {
    if (!state.results) return;
    
    const r = state.results;
    const date = new Date().toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    const propertyTypes = {
        apartment: 'Apartment',
        condo: 'Condominium',
        townhouse: 'Townhouse',
        'single-family': 'Single-Family Home',
        ranch: 'Ranch House',
        'mobile-home': 'Mobile Home'
    };
    const propertyType = propertyTypes[state.property.type] || state.property.type;
    
    const includeInstall = document.getElementById('includeInstall')?.checked ?? true;
    const totalCost = r.totalPanelCost + (includeInstall ? r.installCost : 0);
    
    const html = `
        <div class="report-header">
            <div class="report-logo">
                <span style="color: #f15a29;">Heat</span><span>ENE</span>
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
                    <span class="report-item-label">State</span>
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
                                <td>$${room.panel.price}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3"><strong>Total</strong></td>
                        <td><strong>${r.totalWattage.toLocaleString()}W</strong></td>
                        <td><strong>$${r.totalPanelCost.toLocaleString()}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <div class="report-section">
            <h3>Investment Summary</h3>
            <div class="report-grid">
                <div class="report-item">
                    <span class="report-item-label">Panel Equipment</span>
                    <span class="report-item-value">$${r.totalPanelCost.toLocaleString()}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">Installation${!includeInstall ? ' (excluded)' : ''}</span>
                    <span class="report-item-value">${includeInstall ? '$' + r.installCost.toLocaleString() : 'DIY'}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label"><strong>Total Investment</strong></span>
                    <span class="report-item-value"><strong>$${totalCost.toLocaleString()}</strong></span>
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
                    <span class="report-item-value">$${Math.round(r.currentAnnualCost).toLocaleString()}/year</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">HeatENE System</span>
                    <span class="report-item-value">$${Math.round(r.heateneAnnualCost).toLocaleString()}/year</span>
                </div>
            </div>
            <div class="report-highlight" style="margin-top: var(--space-4);">
                <div class="report-highlight-value">$${Math.round(r.annualSavings).toLocaleString()}</div>
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
                <div class="report-highlight-value">$${Math.round(r.tenYearSavings).toLocaleString()}</div>
                <div class="report-highlight-label">Total 10-Year Savings vs Current System</div>
            </div>
            <p style="text-align: center; color: var(--gray-600); margin-top: var(--space-4); font-size: var(--font-size-sm);">
                Based on current electricity tariff of $${state.costs.electricityTariff}/kWh. 
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

function resetCalculator() {
    localStorage.removeItem(STATE_KEY);
    location.reload();
}

function restoreUIFromState() {
    // Restore unit toggle
    if (state.units) {
        document.querySelectorAll('#unitToggle .toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === state.units);
        });
    }
    
    // Restore property selections
    Object.entries(state.property).forEach(([key, value]) => {
        if (value) {
            const fieldName = key === 'type' ? 'propertyType' : key === 'age' ? 'propertyAge' : key;
            const cards = document.querySelectorAll(`[data-field="${fieldName}"] [data-value="${value}"]`);
            cards.forEach(card => card.classList.add('selected'));
        }
    });
    
    // Restore region select
    if (state.property.region) {
        const regionSelect = document.getElementById('usRegion');
        if (regionSelect) regionSelect.value = state.property.region;
    }
    
    // Restore heating select
    if (state.property.currentHeating) {
        const heatingSelect = document.getElementById('currentHeating');
        if (heatingSelect) heatingSelect.value = state.property.currentHeating;
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

// ============ QUICK CALCULATE ============

function openQuickCalc() {
    document.getElementById('quickCalcModal').classList.add('open');
    document.getElementById('quickCalcResults').style.display = 'none';
    document.getElementById('quickCalcArea').value = '';
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
}

// Direct Quick Calc from Step 0
function openQuickCalcDirect() {
    openQuickCalc();
}

function closeQuickCalc() {
    document.getElementById('quickCalcModal').classList.remove('open');
}

function quickCalcSize(area) {
    // Update button selection
    document.querySelectorAll('.size-btn').forEach(b => {
        b.classList.toggle('selected', parseInt(b.dataset.area) === area);
    });
    document.getElementById('quickCalcArea').value = area;
    calculateQuickEstimate(area);
}

function quickCalcCustom() {
    const area = parseFloat(document.getElementById('quickCalcArea').value);
    if (area && area > 0) {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
        calculateQuickEstimate(area);
    }
}

function calculateQuickEstimate(area) {
    // Area is in ft² for US, convert to m² for calculations
    const areaM2 = area * CONVERSIONS.sqftToSqm;
    
    // Use average heat loss of 75 W/m² (typical for medium insulation)
    const avgHeatLoss = 75;
    const wattsNeeded = Math.round(areaM2 * avgHeatLoss);
    
    // Calculate perimeter and available wall (assume 75% for average room)
    const perimeterM = 4 * Math.sqrt(areaM2);
    const perimeterFt = perimeterM * CONVERSIONS.mToFt;
    const availableFt = perimeterFt * 0.75;
    
    // Performance mode: all available walls (rounded up to nearest foot)
    const feetPerf = Math.ceil(Math.min(wattsNeeded / HEATENE_SPECS.wattsPerFoot, availableFt));
    
    // Eco mode: 2 longest opposite walls (~60% of available, rounded up)
    const feetEco = Math.ceil(availableFt * 0.6);
    
    // Performance cost
    const perfProductCost = Math.round(feetPerf * HEATENE_PRICING.pricePerFoot);
    const perfInstallCost = Math.round(feetPerf * HEATENE_PRICING.installPerFoot);
    const perfTotalCost = perfProductCost + perfInstallCost + HEATENE_PRICING.thermostat;
    
    // Eco cost
    const ecoProductCost = Math.round(feetEco * HEATENE_PRICING.pricePerFoot);
    const ecoInstallCost = Math.round(feetEco * HEATENE_PRICING.installPerFoot);
    const ecoTotalCost = ecoProductCost + ecoInstallCost + HEATENE_PRICING.thermostat;
    
    // Display results
    document.getElementById('qcWatts').textContent = wattsNeeded + 'W';
    document.getElementById('qcFeet').innerHTML = `
        <span style="display:block">⚡ ${feetPerf}ft</span>
        <span style="display:block; font-size:0.9em; opacity:0.8">🌿 ${feetEco}ft</span>
    `;
    document.getElementById('qcCost').innerHTML = `
        <span style="display:block">⚡ $${perfTotalCost.toLocaleString()}</span>
        <span style="display:block; font-size:0.9em; opacity:0.8">🌿 $${ecoTotalCost.toLocaleString()}</span>
    `;
    document.getElementById('quickCalcResults').style.display = 'block';
}

function quickCalcToFull() {
    closeQuickCalc();
    const area = parseFloat(document.getElementById('quickCalcArea').value);
    
    // If on step 0, start the full calculator first
    if (state.currentStep === 0) {
        startCalculator();
    }
    
    // Open room modal
    if (area) {
        openRoomModal();
    }
}
