/* ====================================
   HeatENE Calculator - Simplified Logic
// Logo for PDF
const LOGO_BASE64 = 'data:image/png;base64,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';
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
    ecoPricePerFoot: 25,
    performancePricePerFoot: 29,
    
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
    
    // Header with logo
    doc.setFillColor(...orange);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Add logo image
    try {
        doc.addImage(LOGO_BASE64, 'PNG', margin, 8, 50, 24);
    } catch (e) {
        // Fallback to text if image fails
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('HeatENE', margin, 22);
    }
    
    // Tagline on right side
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Infrared Baseboard Heating', pageWidth - margin - 55, 20);
    doc.text('www.heatene.com', pageWidth - margin - 40, 30);
    
    y = 55;
    
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
