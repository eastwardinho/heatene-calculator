/* ====================================
   HeatENE Calculator - Simplified Logic
   ==================================== */

// ============ STATE ============

let state = {
    housingType: null,
    era: null,
    bedrooms: null,
    bathrooms: null,
    sqft: null,
    currentHeating: null
};

// ============ CONSTANTS ============

// HeatENE specs
const WATTS_PER_FOOT = 21;      // 70W per meter (21W per foot)

// Average electricity rate (US)
const ELECTRICITY_RATE = 0.16; // $/kWh

// Heat loss factors by housing type (W per sq ft base requirement)
// These account for typical insulation and exposure
const HOUSING_HEAT_FACTORS = {
    house: 12,      // Standard single-family, moderate exposure
    townhouse: 10,  // Shared walls reduce heat loss
    apartment: 8,   // Most insulated (neighbors above/below/sides)
    rural: 15       // Larger, older, more exposed
};

// Era multiplier (older = more heat loss)
const ERA_MULTIPLIERS = {
    'pre1920': 1.35,    // Historic - minimal insulation
    '1920-1950': 1.25,  // Pre-war - basic construction
    '1950-1980': 1.10,  // Post-war - improving standards
    '1980-2000': 1.00,  // Modern - decent insulation
    '2000+': 0.85       // Contemporary - good insulation
};

// Current heating system costs ($ per kWh equivalent delivered heat)
// Based on US average fuel prices and typical system efficiencies
// Note: These reflect real-world performance, not lab conditions
const HEATING_COSTS = {
    gas: {
        name: 'Gas Boiler',
        icon: '🔥',
        costPerKwh: 0.07,      // ~$1.50/therm at 80% real-world efficiency
        efficiency: 0.80,
        maintenance: 200       // Annual maintenance cost
    },
    oil: {
        name: 'Oil Boiler',
        icon: '🛢️',
        costPerKwh: 0.14,      // ~$4/gallon at 75% real-world efficiency
        efficiency: 0.75,
        maintenance: 300
    },
    heatpump: {
        name: 'Heat Pump',
        icon: '♨️',
        costPerKwh: 0.08,      // Real-world COP ~2.0 (drops in cold weather)
        efficiency: 2.0,
        maintenance: 200
    },
    electric: {
        name: 'Electric Radiators',
        icon: '⚡',
        costPerKwh: 0.16,      // 100% efficient but no zonal control
        efficiency: 1.0,
        maintenance: 0
    },
    baseboard: {
        name: 'Baseboard Heaters',
        icon: '📏',
        costPerKwh: 0.16,      // Traditional baseboards, whole-house heating
        efficiency: 1.0,
        maintenance: 0
    },
    wood: {
        name: 'Wood/Pellet',
        icon: '🪵',
        costPerKwh: 0.10,      // ~$250/cord at 65% real-world efficiency
        efficiency: 0.65,
        maintenance: 150
    }
};

// HeatENE installation options (same 70W/m product, different wall coverage)
const HEATENE_VERSIONS = {
    eco: {
        name: 'Eco',
        coveragePercent: 0.60,   // 2 opposite walls = 60% of full power
        pricePerFoot: 29,        // $29/ft selling price
        description: '2 longest walls — great for mild climates'
    },
    performance: {
        name: 'Performance',
        coveragePercent: 1.0,    // All walls = 100% power
        pricePerFoot: 39,        // $39/ft selling price
        description: 'All walls — recommended for cold climates'
    }
};

// HeatENE efficiency advantages
const HEATENE_ZONAL_SAVINGS = 0.25;  // 25% savings from only heating occupied rooms
const HEATENE_THERMOSTAT_EFFICIENCY = 0.90;  // Precise control reduces waste

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
        currentHeating: null
    };
    
    // Reset UI
    document.querySelectorAll('.housing-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.heating-card').forEach(c => c.classList.remove('selected'));
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
    
    // Current heating
    if (!state.currentHeating) {
        valid = false;
        showError('q6', 'Please select your current heating system');
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
    if (!validate()) {
        return;
    }
    
    // Get base heat factor for housing type
    const baseHeatFactor = HOUSING_HEAT_FACTORS[state.housingType];
    
    // Apply era multiplier
    const eraMultiplier = ERA_MULTIPLIERS[state.era];
    
    // Total watts needed
    const wattsNeeded = state.sqft * baseHeatFactor * eraMultiplier;
    
    // Convert to linear feet of HeatENE baseboard
    const totalFeet = Math.ceil(wattsNeeded / WATTS_PER_FOOT);
    
    // Get room breakdown
    const rooms = getRoomBreakdown(state.bedrooms, state.bathrooms, state.sqft);
    
    // Calculate feet per room (proportional to sq ft)
    const roomsWithFeet = rooms.map(room => ({
        ...room,
        feet: Math.ceil((room.sqft / state.sqft) * totalFeet)
    }));
    
    // Estimate annual heat energy needed (kWh)
    // Assume 6 hours/day average, 180 heating days, 50% thermostat duty cycle
    const annualKwh = (wattsNeeded / 1000) * 6 * 180 * 0.5;
    
    // Current heating annual cost (whole-house heating, no zonal control)
    const currentSystem = HEATING_COSTS[state.currentHeating];
    const currentAnnualCost = (annualKwh * currentSystem.costPerKwh) + currentSystem.maintenance;
    
    // HeatENE annual cost with advantages:
    // - Zonal control: only heat rooms you're using (25% savings)
    // - Precise thermostat: reduces overshoot and waste
    // - Zero maintenance
    const heateneEffectiveKwh = annualKwh * (1 - HEATENE_ZONAL_SAVINGS) * HEATENE_THERMOSTAT_EFFICIENCY;
    const heateneAnnualCost = heateneEffectiveKwh * ELECTRICITY_RATE;
    
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
    
    // Calculate for all versions based on wall coverage
    const versions = Object.entries(HEATENE_VERSIONS).map(([key, version]) => {
        const versionFeet = Math.ceil(estimatedPerimeterFt * version.coveragePercent);
        const versionWatts = versionFeet * WATTS_PER_FOOT;
        return {
            key,
            ...version,
            feet: versionFeet,
            watts: versionWatts,
            equipmentCost: versionFeet * version.pricePerFoot,
            recommended: key === recommendedVersion
        };
    });
    
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
    
    // Cost comparison
    document.getElementById('currentHeatingIcon').textContent = results.currentSystem.icon;
    document.getElementById('currentHeatingName').textContent = results.currentSystem.name;
    document.getElementById('currentAnnualCost').textContent = '$' + Math.round(results.currentAnnualCost).toLocaleString() + '/yr';
    document.getElementById('heateneAnnualCost').textContent = '$' + Math.round(results.heateneAnnualCost).toLocaleString() + '/yr';
    
    // Savings display
    const savingsRow = document.getElementById('savingsRow');
    const annualSavingsEl = document.getElementById('annualSavings');
    
    if (results.annualSavings > 0) {
        savingsRow.classList.remove('negative');
        savingsRow.classList.add('positive');
        annualSavingsEl.textContent = '$' + Math.round(results.annualSavings).toLocaleString();
        savingsRow.innerHTML = `<span class="savings-text">You could save <strong id="annualSavings">$${Math.round(results.annualSavings).toLocaleString()}</strong> per year!</span>`;
    } else if (results.annualSavings < 0) {
        savingsRow.classList.remove('positive');
        savingsRow.classList.add('negative');
        savingsRow.innerHTML = `<span class="savings-text">HeatENE costs <strong>$${Math.round(Math.abs(results.annualSavings)).toLocaleString()}</strong> more per year, but offers zero maintenance and 10-year warranty.</span>`;
    } else {
        savingsRow.classList.remove('positive', 'negative');
        savingsRow.innerHTML = `<span class="savings-text">Similar running costs — but HeatENE offers zero maintenance and 10-year warranty.</span>`;
    }
    
    // Version options
    const versionsHtml = results.versions.map(v => `
        <div class="version-card ${v.recommended ? 'recommended' : ''}">
            ${v.recommended ? '<span class="version-badge">Recommended</span>' : ''}
            <div class="version-name">${v.name}</div>
            <div class="version-feet">${v.feet} ft</div>
            <div class="version-watts">${v.watts.toLocaleString()}W</div>
            <div class="version-price">$${Math.round(v.equipmentCost).toLocaleString()}</div>
            <div class="version-desc">${v.description}</div>
        </div>
    `).join('');
    
    document.getElementById('versionOptions').innerHTML = versionsHtml;
}

// ============ INITIALIZE ============

document.addEventListener('DOMContentLoaded', () => {
    // Set up input listeners
    document.getElementById('sqft').addEventListener('input', (e) => {
        e.target.classList.remove('error');
    });
});
