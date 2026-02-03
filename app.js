/* ====================================
   HeatENE Calculator - Simplified Logic
   Version: 2026-02-03-v3
   ==================================== */

// ============ STATE ============

let state = {
    housingType: null,
    era: null,
    bedrooms: null,
    bathrooms: null,
    sqft: null,
    climateZone: null,
    currentHeating: null
};

// ============ DEFAULT CONSTANTS ============

const DEFAULT_PARAMS = {
    // HeatENE specs
    wattsPerFoot: 21,      // 70W per meter (21W per foot)
    
    // Average electricity rate (US)
    electricityRate: 0.16, // $/kWh
    
    // Heat loss factors by housing type (W per sq ft base requirement)
    housingHeatFactors: {
        house: 12,      // Standard single-family, moderate exposure
        townhouse: 10,  // Shared walls reduce heat loss
        apartment: 8,   // Most insulated (neighbors above/below/sides)
        rural: 15       // Larger, older, more exposed
    },
    
    // Era multiplier (older = more heat loss)
    eraMultipliers: {
        'pre1920': 1.35,    // Historic - minimal insulation
        '1920-1950': 1.25,  // Pre-war - basic construction
        '1950-1980': 1.10,  // Post-war - improving standards
        '1980-2000': 1.00,  // Modern - decent insulation
        '2000+': 0.85       // Contemporary - good insulation
    },
    
    // Climate zone parameters (days, hours/day, duty cycle)
    climateZones: {
        mild: { days: 150, hours: 5, duty: 0.40, name: 'Mild', desc: 'Southern states' },
        moderate: { days: 180, hours: 6, duty: 0.50, name: 'Moderate', desc: 'Mid-Atlantic' },
        cold: { days: 210, hours: 8, duty: 0.60, name: 'Cold', desc: 'Northern states' },
        verycold: { days: 240, hours: 10, duty: 0.70, name: 'Very Cold', desc: 'Minnesota, Alaska' }
    },
    
    // HeatENE version pricing
    ecoPricePerFoot: 29,
    performancePricePerFoot: 39,
    
    // HeatENE efficiency advantages
    zonalSavings: 0.25,  // 25% savings from only heating occupied rooms
    thermostatEfficiency: 0.90,  // Precise control reduces waste
    
    // Heating system costs and maintenance
    heatingCosts: {
        gas: { costPerKwh: 0.07, maintenance: 200 },
        oil: { costPerKwh: 0.14, maintenance: 300 },
        heatpump: { costPerKwh: 0.08, maintenance: 200 },
        electric: { costPerKwh: 0.16, maintenance: 0 },
        baseboard: { costPerKwh: 0.16, maintenance: 0 },
        wood: { costPerKwh: 0.10, maintenance: 150 }
    }
};

// Load parameters from localStorage or use defaults
function getParams() {
    try {
        const stored = localStorage.getItem('heateneParams');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Deep merge with defaults to ensure all keys exist
            return deepMerge(DEFAULT_PARAMS, parsed);
        }
    } catch (e) {
        console.warn('Could not load stored params:', e);
    }
    return DEFAULT_PARAMS;
}

function deepMerge(target, source) {
    const output = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            output[key] = source[key];
        }
    }
    return output;
}

// ============ DYNAMIC CONSTANTS (read from params) ============

function getWattsPerFoot() { return getParams().wattsPerFoot; }
function getElectricityRate() { return getParams().electricityRate; }
function getHousingHeatFactors() { return getParams().housingHeatFactors; }
function getEraMultipliers() { return getParams().eraMultipliers; }
function getZonalSavings() { return getParams().zonalSavings; }
function getThermostatEfficiency() { return getParams().thermostatEfficiency; }

// Legacy compatibility constants (computed from params)
const WATTS_PER_FOOT = 21;      // For reference only - use getWattsPerFoot()
const ELECTRICITY_RATE = 0.16; // For reference only - use getElectricityRate()

// Heat loss factors (computed from params)
const HOUSING_HEAT_FACTORS = {
    house: 12, townhouse: 10, apartment: 8, rural: 15
};

// Era multipliers (computed from params)
const ERA_MULTIPLIERS = {
    'pre1920': 1.35, '1920-1950': 1.25, '1950-1980': 1.10, '1980-2000': 1.00, '2000+': 0.85
};

// Current heating system costs ($ per kWh equivalent delivered heat)
// Based on US average fuel prices and typical system efficiencies
// Note: These reflect real-world performance, not lab conditions
function getHeatingCosts() {
    const params = getParams();
    return {
        gas: {
            name: 'Gas Boiler',
            icon: '🔥',
            costPerKwh: params.heatingCosts.gas.costPerKwh,
            efficiency: 0.80,
            maintenance: params.heatingCosts.gas.maintenance
        },
        oil: {
            name: 'Oil Boiler',
            icon: '🛢️',
            costPerKwh: params.heatingCosts.oil.costPerKwh,
            efficiency: 0.75,
            maintenance: params.heatingCosts.oil.maintenance
        },
        heatpump: {
            name: 'Heat Pump',
            icon: '♨️',
            costPerKwh: params.heatingCosts.heatpump.costPerKwh,
            efficiency: 2.0,
            maintenance: params.heatingCosts.heatpump.maintenance
        },
        electric: {
            name: 'Electric Radiators',
            icon: '⚡',
            costPerKwh: params.heatingCosts.electric.costPerKwh,
            efficiency: 1.0,
            maintenance: params.heatingCosts.electric.maintenance
        },
        baseboard: {
            name: 'Baseboard Heaters',
            icon: '📏',
            costPerKwh: params.heatingCosts.baseboard.costPerKwh,
            efficiency: 1.0,
            maintenance: params.heatingCosts.baseboard.maintenance
        },
        wood: {
            name: 'Wood/Pellet',
            icon: '🪵',
            costPerKwh: params.heatingCosts.wood.costPerKwh,
            efficiency: 0.65,
            maintenance: params.heatingCosts.wood.maintenance
        }
    };
}

const HEATING_COSTS = getHeatingCosts();

// HeatENE installation options (aluminum on all walls, heating film varies)
function getHeateneVersions() {
    const params = getParams();
    return {
        eco: {
            name: 'Eco',
            heatOutput: 0.60,
            pricePerFoot: params.ecoPricePerFoot,
            description: 'Heating on 2 longest walls — great for mild climates'
        },
        performance: {
            name: 'Performance',
            heatOutput: 1.0,
            pricePerFoot: params.performancePricePerFoot,
            description: 'Heating on all walls — recommended for cold climates'
        }
    };
}

const HEATENE_VERSIONS = getHeateneVersions();

// HeatENE efficiency advantages
const HEATENE_ZONAL_SAVINGS = 0.25;  // For reference - use getZonalSavings()
const HEATENE_THERMOSTAT_EFFICIENCY = 0.90;  // For reference - use getThermostatEfficiency()

// Typical room breakdown based on bedroom/bathroom count
// Returns array of {name, icon, sqft, pctOfHome}
function getRoomBreakdown(bedrooms, bathrooms, totalSqft) {
    const rooms = [];
    
    // Living room (typically 12-15% of home)
    rooms.push({
        name: 'Living Room',
        icon: '🛋️',
        pct: 0.14
    });
    
    // Kitchen (8-12% of home)
    rooms.push({
        name: 'Kitchen',
        icon: '🍳',
        pct: 0.10
    });
    
    // Bedrooms (10-15% each depending on count)
    const bedroomPct = bedrooms <= 2 ? 0.14 : bedrooms <= 4 ? 0.11 : 0.09;
    for (let i = 1; i <= Math.min(bedrooms, 6); i++) {
        rooms.push({
            name: i === 1 ? 'Master Bedroom' : `Bedroom ${i}`,
            icon: '🛏️',
            pct: i === 1 ? bedroomPct * 1.2 : bedroomPct // Master is bigger
        });
    }
    
    // Bathrooms (3-6% each)
    const bathroomCount = Math.floor(bathrooms);
    const hasHalfBath = bathrooms % 1 !== 0;
    
    for (let i = 1; i <= bathroomCount; i++) {
        rooms.push({
            name: i === 1 ? 'Main Bathroom' : `Bathroom ${i}`,
            icon: '🚿',
            pct: 0.04
        });
    }
    
    if (hasHalfBath) {
        rooms.push({
            name: 'Half Bath',
            icon: '🚽',
            pct: 0.02
        });
    }
    
    // Hallways/Other (~8%)
    rooms.push({
        name: 'Hallways & Other',
        icon: '🚪',
        pct: 0.08
    });
    
    // Calculate actual sq ft and normalize percentages
    const totalPct = rooms.reduce((sum, r) => sum + r.pct, 0);
    
    return rooms.map(room => ({
        ...room,
        sqft: Math.round((room.pct / totalPct) * totalSqft)
    }));
}

// ============ UI INTERACTIONS ============

function selectHousing(element) {
    // Remove selection from all
    document.querySelectorAll('.housing-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select clicked
    element.classList.add('selected');
    state.housingType = element.dataset.value;
}

function selectEra(era, element) {
    // Remove selection from all
    document.querySelectorAll('.era-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Select clicked
    element.classList.add('selected');
    state.era = era;
}

function selectNumber(field, value, element) {
    // Update state
    state[field] = value;
    
    // Update UI
    const selector = field === 'bedrooms' ? 'bedroomSelector' : 'bathroomSelector';
    document.querySelectorAll(`#${selector} .num-btn`).forEach(btn => {
        btn.classList.remove('selected');
    });
    element.classList.add('selected');
}

function selectHeating(element) {
    // Remove selection from all
    document.querySelectorAll('.heating-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select clicked
    element.classList.add('selected');
    state.currentHeating = element.dataset.value;
}

function selectClimate(element) {
    // Remove selection from all
    document.querySelectorAll('.climate-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select clicked
    element.classList.add('selected');
    state.climateZone = element.dataset.value;
}

function toggleCalcInfo() {
    const details = document.getElementById('calcDetails');
    const icon = document.getElementById('toggleIcon');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        icon.classList.add('open');
    } else {
        details.style.display = 'none';
        icon.classList.remove('open');
    }
}

function startOver() {
    // Reset state
    state = {
        housingType: null,
        era: null,
        bedrooms: null,
        bathrooms: null,
        sqft: null,
        climateZone: null,
        currentHeating: null
    };
    
    // Reset UI
    document.querySelectorAll('.housing-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.heating-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.climate-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.era-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('sqft').value = '';
    
    // Show calculator, hide results
    document.getElementById('calculator').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ VALIDATION ============

function validate() {
    let valid = true;
    
    // Clear previous errors
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Housing type
    if (!state.housingType) {
        valid = false;
        showError('q1', 'Please select your housing type');
    }
    
    // Era
    if (!state.era) {
        valid = false;
        showError('q2', 'Please select when your home was built');
    }
    
    // Bedrooms
    if (!state.bedrooms) {
        valid = false;
        showError('q3', 'Please select number of bedrooms');
    }
    
    // Bathrooms
    if (!state.bathrooms) {
        valid = false;
        showError('q4', 'Please select number of bathrooms');
    }
    
    // Square footage
    const sqftInput = document.getElementById('sqft');
    const sqft = parseInt(sqftInput.value);
    if (!sqft || sqft < 100 || sqft > 20000) {
        valid = false;
        sqftInput.classList.add('error');
        showError('q5', 'Please enter a valid square footage (100-20,000)');
    } else {
        state.sqft = sqft;
    }
    
    // Climate zone
    if (!state.climateZone) {
        valid = false;
        showError('q6', 'Please select your climate zone');
    }
    
    // Current heating
    if (!state.currentHeating) {
        valid = false;
        showError('q7', 'Please select your current heating system');
    }
    
    return valid;
}

function showError(questionId, message) {
    const question = document.getElementById(questionId);
    const existing = question.querySelector('.error-message');
    if (!existing) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        question.appendChild(errorEl);
    }
}

// ============ CALCULATION ============

function calculate() {
    console.log('Calculate clicked, state:', JSON.stringify(state));
    if (!validate()) {
        console.log('Validation failed');
        return;
    }
    console.log('Validation passed');
    
    // Get current params (may be modified via admin)
    const params = getParams();
    const housingHeatFactors = params.housingHeatFactors;
    const eraMultipliers = params.eraMultipliers;
    const wattsPerFoot = params.wattsPerFoot;
    const electricityRate = params.electricityRate;
    const zonalSavings = params.zonalSavings;
    const thermostatEfficiency = params.thermostatEfficiency;
    const heatingCosts = getHeatingCosts();
    const heateneVersions = getHeateneVersions();
    
    // Get base heat factor for housing type
    const baseHeatFactor = housingHeatFactors[state.housingType];
    
    // Apply era multiplier
    const eraMultiplier = eraMultipliers[state.era];
    
    // Total watts needed
    const wattsNeeded = state.sqft * baseHeatFactor * eraMultiplier;
    
    // Convert to linear feet of HeatENE baseboard
    const totalFeet = Math.ceil(wattsNeeded / wattsPerFoot);
    
    // Get room breakdown
    const rooms = getRoomBreakdown(state.bedrooms, state.bathrooms, state.sqft);
    
    // Calculate feet per room (proportional to sq ft)
    const roomsWithFeet = rooms.map(room => ({
        ...room,
        feet: Math.ceil((room.sqft / state.sqft) * totalFeet)
    }));
    
    // Get climate zone data for annual calculations
    const climateZones = params.climateZones;
    const climate = climateZones[state.climateZone];
    const heatingDays = climate.days;
    const hoursPerDay = climate.hours;
    const dutyCycle = climate.duty;
    
    // Estimate annual heat energy needed (kWh)
    // Uses climate zone specific: days, hours/day, duty cycle
    const annualKwh = (wattsNeeded / 1000) * hoursPerDay * heatingDays * dutyCycle;
    
    // Current heating annual cost (whole-house heating, no zonal control)
    const currentSystem = heatingCosts[state.currentHeating];
    const currentAnnualCost = (annualKwh * currentSystem.costPerKwh) + currentSystem.maintenance;
    
    // HeatENE annual cost with advantages:
    // - Zonal control: only heat rooms you're using (25% savings)
    // - Precise thermostat: reduces overshoot and waste
    // - Zero maintenance
    const heateneEffectiveKwh = annualKwh * (1 - zonalSavings) * thermostatEfficiency;
    const heateneAnnualCost = heateneEffectiveKwh * electricityRate;
    
    // Calculate savings
    const annualSavings = currentAnnualCost - heateneAnnualCost;
    
    // Estimate room perimeter based on sq ft (assuming ~1.2:1 aspect ratio typical room)
    // Perimeter ≈ 2 * (L + W) where L*W = sqft and L/W ≈ 1.2
    // Simplified: perimeter in feet ≈ 4.4 * sqrt(sqft)
    const estimatedPerimeterFt = 4.4 * Math.sqrt(state.sqft);
    
    // Determine recommendation based on home characteristics
    // Recommend Performance for: older homes, rural properties, or poor insulation (implied by era)
    const needsMoreHeat = ['pre1920', '1920-1950', '1950-1980'].includes(state.era) || 
                          state.housingType === 'rural';
    const recommendedVersion = needsMoreHeat ? 'performance' : 'eco';
    
    // Both versions cover full perimeter (aluminum everywhere)
    const fullPerimeterFt = Math.ceil(estimatedPerimeterFt);
    
    // Calculate for all versions (same footage, different heat output and price)
    const versions = Object.entries(heateneVersions).map(([key, version]) => {
        const versionWatts = Math.round(fullPerimeterFt * wattsPerFoot * version.heatOutput);
        // Running cost based on actual heat output, using climate zone values
        const versionEffectiveKwh = (versionWatts / 1000) * hoursPerDay * heatingDays * dutyCycle * (1 - zonalSavings) * thermostatEfficiency;
        const versionAnnualCost = versionEffectiveKwh * electricityRate;
        const versionSavings = currentAnnualCost - versionAnnualCost;
        
        return {
            key,
            ...version,
            feet: fullPerimeterFt,
            watts: versionWatts,
            equipmentCost: fullPerimeterFt * version.pricePerFoot,
            annualCost: versionAnnualCost,
            annualSavings: versionSavings,
            recommended: key === recommendedVersion
        };
    });
    
    // Calculate comparison vs ALL heating systems (for PDF)
    const allSystemsComparison = Object.entries(heatingCosts).map(([key, system]) => {
        const systemAnnualCost = (annualKwh * system.costPerKwh) + system.maintenance;
        return {
            key,
            name: system.name,
            icon: system.icon,
            annualCost: systemAnnualCost,
            tenYearCost: systemAnnualCost * 10
        };
    });
    
    // Store results globally for PDF/email
    window.calculationResults = {
        state: { ...state },
        totalFeet,
        totalWatts: Math.round(wattsNeeded),
        rooms: roomsWithFeet,
        heateneAnnualCost,
        currentAnnualCost,
        annualSavings,
        currentSystem,
        versions,
        allSystemsComparison,
        annualKwh,
        params,
        climate
    };
    
    // Display results
    displayResults({
        totalFeet,
        totalWatts: Math.round(wattsNeeded),
        rooms: roomsWithFeet,
        heateneAnnualCost,
        currentAnnualCost,
        annualSavings,
        currentSystem,
        versions
    });
}

// ============ DISPLAY RESULTS ============

function displayResults(results) {
    console.log('displayResults called with:', results);
    // Hide calculator, show results
    document.getElementById('calculator').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Housing type display name
    const typeNames = {
        house: 'house',
        townhouse: 'townhouse',
        apartment: 'apartment/condo',
        rural: 'farmhouse'
    };
    
    // Update summary
    document.getElementById('resultsSqft').textContent = state.sqft.toLocaleString();
    document.getElementById('resultsType').textContent = typeNames[state.housingType];
    
    // Get recommended version for main display
    const recommendedVersion = results.versions.find(v => v.recommended) || results.versions[0];
    
    // Update main result
    document.getElementById('totalFeet').textContent = recommendedVersion.feet;
    document.getElementById('totalWatts').textContent = recommendedVersion.watts.toLocaleString() + 'W';
    document.getElementById('estimatedCost').textContent = '$' + Math.round(recommendedVersion.equipmentCost).toLocaleString();
    document.getElementById('roomCount').textContent = results.rooms.length;
    
    // Room breakdown
    const breakdownHtml = results.rooms.map(room => `
        <div class="room-row">
            <div class="room-name">
                <span class="room-icon">${room.icon}</span>
                <div>
                    <span class="room-label">${room.name}</span>
                    <span class="room-sqft">${room.sqft} sq ft</span>
                </div>
            </div>
            <span class="room-feet">${room.feet} ft</span>
        </div>
    `).join('');
    
    document.getElementById('roomBreakdown').innerHTML = breakdownHtml;
    
    // Cost comparison - current heating
    document.getElementById('currentHeatingIcon').textContent = results.currentSystem.icon;
    document.getElementById('currentHeatingName').textContent = results.currentSystem.name;
    document.getElementById('currentAnnualCost').textContent = '$' + Math.round(results.currentAnnualCost).toLocaleString() + '/yr';
    
    // Store versions globally for click handler
    window.calculatedVersions = results.versions;
    window.currentSystem = results.currentSystem;
    window.currentAnnualCost = results.currentAnnualCost;
    
    // Version options (clickable)
    const versionsHtml = results.versions.map(v => `
        <div class="version-card ${v.recommended ? 'recommended selected' : ''}" onclick="selectVersion('${v.key}')" data-version="${v.key}">
            ${v.recommended ? '<span class="version-badge">Recommended</span>' : ''}
            <div class="version-name">${v.name}</div>
            <div class="version-feet">${v.feet} ft</div>
            <div class="version-watts">${v.watts.toLocaleString()}W output</div>
            <div class="version-price">$${Math.round(v.equipmentCost).toLocaleString()}</div>
            <div class="version-desc">${v.description}</div>
        </div>
    `).join('');
    
    document.getElementById('versionOptions').innerHTML = versionsHtml;
    
    // Show savings for recommended version initially
    const recommendedV = results.versions.find(v => v.recommended);
    if (recommendedV) {
        updateSavingsDisplay(recommendedV);
    }
}

function selectVersion(versionKey) {
    console.log('selectVersion called with:', versionKey);
    
    // Update selected state
    document.querySelectorAll('.version-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`.version-card[data-version="${versionKey}"]`).classList.add('selected');
    
    // Find version and update display
    const version = window.calculatedVersions.find(v => v.key === versionKey);
    console.log('Found version:', version);
    if (version) {
        updateSavingsDisplay(version);
        
        // Also update main result display
        document.getElementById('totalFeet').textContent = version.feet;
        document.getElementById('totalWatts').textContent = version.watts.toLocaleString() + 'W';
        document.getElementById('estimatedCost').textContent = '$' + Math.round(version.equipmentCost).toLocaleString();
    }
}

function updateSavingsDisplay(version) {
    document.getElementById('heateneAnnualCost').textContent = '$' + Math.round(version.annualCost).toLocaleString() + '/yr';
    
    const savingsRow = document.getElementById('savingsRow');
    
    if (version.annualSavings > 0) {
        savingsRow.classList.remove('negative');
        savingsRow.classList.add('positive');
        savingsRow.innerHTML = `<span class="savings-text">You could save <strong>$${Math.round(version.annualSavings).toLocaleString()}</strong> per year!</span>`;
    } else if (version.annualSavings < 0) {
        savingsRow.classList.remove('positive');
        savingsRow.classList.add('negative');
        savingsRow.innerHTML = `<span class="savings-text">HeatENE costs <strong>$${Math.round(Math.abs(version.annualSavings)).toLocaleString()}</strong> more per year, but offers zero maintenance and 10-year warranty.</span>`;
    } else {
        savingsRow.classList.remove('positive', 'negative');
        savingsRow.innerHTML = `<span class="savings-text">Similar running costs — but HeatENE offers zero maintenance and 10-year warranty.</span>`;
    }
}

// ============ PDF QUOTE GENERATOR ============

function generatePDF() {
    if (!window.calculationResults) {
        alert('Please calculate your estimate first.');
        return null;
    }
    
    const results = window.calculationResults;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const orange = [241, 90, 41]; // #f15a29
    const darkBlue = [29, 53, 87]; // #1d3557
    const gray = [100, 116, 139];
    
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    
    // Header with logo placeholder
    doc.setFillColor(...orange);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('HeatENE', margin, 22);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Infrared Heating Solutions', margin, 30);
    
    y = 50;
    
    // Title
    doc.setTextColor(...darkBlue);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Personalized Heating Quote', margin, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated on ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin, y);
    y += 15;
    
    // Home Details Section
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'F');
    
    doc.setTextColor(...darkBlue);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Home Details', margin + 10, y + 12);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    
    const typeNames = { house: 'House', townhouse: 'Townhouse', apartment: 'Apartment/Condo', rural: 'Rural/Farmhouse' };
    const eraNames = { 'pre1920': 'Pre-1920 (Historic)', '1920-1950': '1920-1950 (Pre-war)', '1950-1980': '1950-1980 (Post-war)', '1980-2000': '1980-2000 (Modern)', '2000+': '2000+ (Contemporary)' };
    
    const col1 = margin + 10;
    const col2 = margin + 95;
    
    doc.text('Home Type:', col1, y + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(typeNames[results.state.housingType], col1 + 35, y + 24);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Built:', col2, y + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(eraNames[results.state.era], col2 + 20, y + 24);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Square Footage:', col1, y + 34);
    doc.setFont('helvetica', 'bold');
    doc.text(results.state.sqft.toLocaleString() + ' sq ft', col1 + 45, y + 34);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Bedrooms:', col2, y + 34);
    doc.setFont('helvetica', 'bold');
    doc.text(results.state.bedrooms.toString(), col2 + 30, y + 34);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Bathrooms:', col2 + 50, y + 34);
    doc.setFont('helvetica', 'bold');
    doc.text(results.state.bathrooms.toString(), col2 + 80, y + 34);
    
    y += 55;
    
    // Selected Version
    const selectedVersion = results.versions.find(v => 
        document.querySelector(`.version-card[data-version="${v.key}"]`)?.classList.contains('selected')
    ) || results.versions.find(v => v.recommended);
    
    doc.setFillColor(...orange);
    doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommended: HeatENE ' + selectedVersion.name, margin + 10, y + 14);
    
    doc.setFontSize(24);
    doc.text(selectedVersion.feet + ' linear feet', margin + 10, y + 32);
    
    doc.setFontSize(12);
    doc.text('$' + Math.round(selectedVersion.equipmentCost).toLocaleString() + ' equipment cost', margin + 100, y + 32);
    
    y += 50;
    
    // Comparison Table vs ALL heating systems
    doc.setTextColor(...darkBlue);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Annual Cost Comparison', margin, y);
    y += 8;
    
    // Table header
    doc.setFillColor(29, 53, 87);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Heating System', margin + 5, y + 7);
    doc.text('Annual Cost', margin + 70, y + 7);
    doc.text('vs HeatENE', margin + 110, y + 7);
    doc.text('10-Year Cost', margin + 150, y + 7);
    y += 10;
    
    // HeatENE row first (highlighted)
    doc.setFillColor(255, 237, 230);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setTextColor(...orange);
    doc.setFont('helvetica', 'bold');
    doc.text('HeatENE ' + selectedVersion.name, margin + 5, y + 7);
    doc.text('$' + Math.round(selectedVersion.annualCost).toLocaleString(), margin + 70, y + 7);
    doc.text('—', margin + 120, y + 7);
    doc.text('$' + Math.round(selectedVersion.annualCost * 10).toLocaleString(), margin + 150, y + 7);
    y += 10;
    
    // Other systems
    doc.setFont('helvetica', 'normal');
    let alternate = false;
    results.allSystemsComparison.forEach(system => {
        if (alternate) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, contentWidth, 10, 'F');
        }
        alternate = !alternate;
        
        doc.setTextColor(...gray);
        doc.text(system.name, margin + 5, y + 7);
        doc.text('$' + Math.round(system.annualCost).toLocaleString(), margin + 70, y + 7);
        
        const savings = system.annualCost - selectedVersion.annualCost;
        if (savings > 0) {
            doc.setTextColor(42, 157, 143); // green
            doc.text('Save $' + Math.round(savings).toLocaleString() + '/yr', margin + 110, y + 7);
        } else if (savings < 0) {
            doc.setTextColor(239, 68, 68); // red
            doc.text('+$' + Math.round(Math.abs(savings)).toLocaleString() + '/yr', margin + 110, y + 7);
        } else {
            doc.setTextColor(...gray);
            doc.text('Same', margin + 110, y + 7);
        }
        
        doc.setTextColor(...gray);
        doc.text('$' + Math.round(system.tenYearCost).toLocaleString(), margin + 150, y + 7);
        y += 10;
    });
    
    y += 10;
    
    // Check if we need a new page
    if (y > 200) {
        doc.addPage();
        y = 20;
    }
    
    // Room-by-Room Breakdown
    doc.setTextColor(...darkBlue);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Room-by-Room Breakdown', margin, y);
    y += 8;
    
    doc.setFillColor(29, 53, 87);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Room', margin + 5, y + 6);
    doc.text('Size', margin + 80, y + 6);
    doc.text('HeatENE Footage', margin + 130, y + 6);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    alternate = false;
    results.rooms.forEach(room => {
        if (alternate) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, contentWidth, 8, 'F');
        }
        alternate = !alternate;
        
        doc.setTextColor(...gray);
        doc.text(room.name, margin + 5, y + 6);
        doc.text(room.sqft + ' sq ft', margin + 80, y + 6);
        doc.setTextColor(...orange);
        doc.setFont('helvetica', 'bold');
        doc.text(room.feet + ' ft', margin + 130, y + 6);
        doc.setFont('helvetica', 'normal');
        y += 8;
    });
    
    y += 15;
    
    // Check if we need a new page
    if (y > 230) {
        doc.addPage();
        y = 20;
    }
    
    // HeatENE Benefits
    doc.setFillColor(241, 90, 41, 0.1);
    doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F');
    
    doc.setTextColor(...darkBlue);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Why Choose HeatENE?', margin + 10, y + 12);
    
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'normal');
    
    const benefits = [
        '✓ 99.69% Energy Efficiency — near-perfect heat conversion',
        '✓ Zero Maintenance Required — no filters, no servicing, no hassle',
        '✓ 10-Year Warranty — industry-leading coverage',
        '✓ DIY Safe Installation — simple snap-fit, no specialist tools needed'
    ];
    
    let benefitY = y + 22;
    benefits.forEach(benefit => {
        doc.text(benefit, margin + 10, benefitY);
        benefitY += 8;
    });
    
    y += 60;
    
    // Trust Badges Section
    if (y > 230) {
        doc.addPage();
        y = 20;
    }
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
    
    doc.setTextColor(...darkBlue);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Why Choose HeatENE?', margin + 10, y + 10);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    
    const trustCol1 = margin + 10;
    const trustCol2 = margin + 65;
    const trustCol3 = margin + 120;
    
    doc.text('✓ 10-Year Warranty', trustCol1, y + 20);
    doc.text('✓ UL Listed (Safety)', trustCol2, y + 20);
    doc.text('✓ IPX5 Water Rated', trustCol3, y + 20);
    
    doc.text('✓ 99.69% Efficiency', trustCol1, y + 28);
    doc.text('✓ Zero Maintenance', trustCol2, y + 28);
    doc.text('✓ Made in USA', trustCol3, y + 28);
    
    // Footer
    doc.setFillColor(...orange);
    doc.rect(0, doc.internal.pageSize.getHeight() - 20, pageWidth, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Questions? Contact us at warmth@heatene.com', margin, doc.internal.pageSize.getHeight() - 8);
    doc.text('www.heatene.com', pageWidth - margin - 35, doc.internal.pageSize.getHeight() - 8);
    
    return doc;
}

function downloadPDF() {
    const doc = generatePDF();
    if (doc) {
        doc.save('HeatENE-Quote-' + new Date().toISOString().split('T')[0] + '.pdf');
    }
}

// ============ EMAIL QUOTE ============

async function sendQuoteEmail() {
    const emailInput = document.getElementById('customerEmail');
    const email = emailInput?.value?.trim();
    
    if (!email || !email.includes('@')) {
        alert('Please enter a valid email address.');
        emailInput?.focus();
        return;
    }
    
    if (!window.calculationResults) {
        alert('Please calculate your estimate first.');
        return;
    }
    
    const sendBtn = document.getElementById('sendEmailBtn');
    const originalText = sendBtn.textContent;
    sendBtn.textContent = 'Sending...';
    sendBtn.disabled = true;
    
    try {
        // Generate PDF as base64
        const doc = generatePDF();
        const pdfBase64 = doc.output('datauristring');
        
        const results = window.calculationResults;
        const selectedVersion = results.versions.find(v => 
            document.querySelector(`.version-card[data-version="${v.key}"]`)?.classList.contains('selected')
        ) || results.versions.find(v => v.recommended);
        
        // Create form data for Formspree
        const formData = {
            email: email,
            _cc: 'warmth@heatene.com',
            _subject: 'Your HeatENE Heating Quote',
            message: `
HeatENE Heating Quote

Home Details:
- Type: ${results.state.housingType}
- Era: ${results.state.era}
- Size: ${results.state.sqft.toLocaleString()} sq ft
- Bedrooms: ${results.state.bedrooms}
- Bathrooms: ${results.state.bathrooms}

Recommendation: HeatENE ${selectedVersion.name}
- Linear Feet: ${selectedVersion.feet} ft
- Equipment Cost: $${Math.round(selectedVersion.equipmentCost).toLocaleString()}
- Annual Running Cost: $${Math.round(selectedVersion.annualCost).toLocaleString()}

Thank you for your interest in HeatENE!
Visit www.heatene.com for more information.
            `.trim(),
            _replyto: email
        };
        
        // Send via Formspree (placeholder form ID - Joe will update)
        const response = await fetch('https://formspree.io/f/xyzformid', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            // Also trigger PDF download
            doc.save('HeatENE-Quote-' + new Date().toISOString().split('T')[0] + '.pdf');
            
            document.getElementById('emailSuccess').style.display = 'block';
            emailInput.value = '';
            
            setTimeout(() => {
                document.getElementById('emailSuccess').style.display = 'none';
            }, 5000);
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        console.error('Email send error:', error);
        alert('Sorry, there was a problem sending your quote. Please try downloading the PDF instead.');
    } finally {
        sendBtn.textContent = originalText;
        sendBtn.disabled = false;
    }
}

// ============ INITIALIZE ============

document.addEventListener('DOMContentLoaded', () => {
    // Set up input listeners
    document.getElementById('sqft').addEventListener('input', (e) => {
        e.target.classList.remove('error');
    });
});
