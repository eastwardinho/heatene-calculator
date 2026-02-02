/* ====================================
   HeatENE Calculator - Simplified Logic
   ==================================== */

// ============ STATE ============

let state = {
    housingType: null,
    yearBuilt: null,
    bedrooms: null,
    bathrooms: null,
    sqft: null
};

// ============ CONSTANTS ============

// HeatENE specs: 21W per linear foot (70W per meter)
const WATTS_PER_FOOT = 21;
const PRICE_PER_FOOT = 17.50;

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

// Year built multiplier (older = more heat loss)
function getYearMultiplier(year) {
    if (year < 1950) return 1.35;
    if (year < 1970) return 1.20;
    if (year < 1990) return 1.10;
    if (year < 2000) return 1.00;
    if (year < 2010) return 0.90;
    return 0.85; // 2010+, modern insulation standards
}

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
        yearBuilt: null,
        bedrooms: null,
        bathrooms: null,
        sqft: null
    };
    
    // Reset UI
    document.querySelectorAll('.housing-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('yearBuilt').value = '';
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
    
    // Year built
    const yearInput = document.getElementById('yearBuilt');
    const year = parseInt(yearInput.value);
    if (!year || year < 1800 || year > 2025) {
        valid = false;
        yearInput.classList.add('error');
        showError('q2', 'Please enter a valid year (1800-2025)');
    } else {
        state.yearBuilt = year;
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
    
    // Apply year multiplier
    const yearMultiplier = getYearMultiplier(state.yearBuilt);
    
    // Total watts needed
    const wattsNeeded = state.sqft * baseHeatFactor * yearMultiplier;
    
    // Convert to linear feet of HeatENE baseboard
    const totalFeet = Math.ceil(wattsNeeded / WATTS_PER_FOOT);
    
    // Calculate costs
    const equipmentCost = totalFeet * PRICE_PER_FOOT;
    
    // Get room breakdown
    const rooms = getRoomBreakdown(state.bedrooms, state.bathrooms, state.sqft);
    
    // Calculate feet per room (proportional to sq ft)
    const roomsWithFeet = rooms.map(room => ({
        ...room,
        feet: Math.ceil((room.sqft / state.sqft) * totalFeet)
    }));
    
    // Estimate annual running cost
    // Assume 6 hours/day average, 180 heating days, 50% thermostat duty cycle
    const annualKwh = (wattsNeeded / 1000) * 6 * 180 * 0.5;
    const annualCost = annualKwh * ELECTRICITY_RATE;
    
    // Display results
    displayResults({
        totalFeet,
        totalWatts: Math.round(wattsNeeded),
        equipmentCost,
        rooms: roomsWithFeet,
        annualCost
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
    
    // Update main result
    document.getElementById('totalFeet').textContent = results.totalFeet;
    document.getElementById('totalWatts').textContent = results.totalWatts.toLocaleString() + 'W';
    document.getElementById('estimatedCost').textContent = '$' + Math.round(results.equipmentCost).toLocaleString();
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
    
    // Annual running cost
    document.getElementById('annualRunCost').textContent = '$' + Math.round(results.annualCost).toLocaleString() + '/yr';
}

// ============ INITIALIZE ============

document.addEventListener('DOMContentLoaded', () => {
    // Set up input listeners
    document.getElementById('yearBuilt').addEventListener('input', (e) => {
        e.target.classList.remove('error');
    });
    
    document.getElementById('sqft').addEventListener('input', (e) => {
        e.target.classList.remove('error');
    });
});
