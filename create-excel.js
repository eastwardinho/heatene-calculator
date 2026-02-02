const ExcelJS = require('exceljs');
const path = require('path');

async function createCalculator() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Frank Best';
  workbook.created = new Date();
  
  // ============ INPUTS SHEET ============
  const inputs = workbook.addWorksheet('Inputs', { properties: { tabColor: { argb: '4472C4' } } });
  
  // Title styling
  const titleStyle = { font: { bold: true, size: 16, color: { argb: 'FFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E7D32' } }, alignment: { horizontal: 'center' } };
  const headerStyle = { font: { bold: true, size: 12 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } } };
  const inputStyle = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
  
  // Column widths
  inputs.columns = [
    { width: 5 }, { width: 30 }, { width: 20 }, { width: 15 }, { width: 40 }
  ];
  
  // Title
  inputs.mergeCells('A1:E1');
  inputs.getCell('A1').value = 'HeatENE Whole-Home Heating Calculator';
  inputs.getCell('A1').style = titleStyle;
  inputs.getRow(1).height = 30;
  
  // Property Details Section
  inputs.getCell('B3').value = 'PROPERTY DETAILS';
  inputs.getCell('B3').style = headerStyle;
  
  const propertyInputs = [
    ['Property Type', '1', 'E3', '1=Flat, 2=Terrace, 3=Semi, 4=Detached, 5=Bungalow'],
    ['Property Age', '3', 'E4', '1=Pre-1920, 2=1920-50, 3=1950-80, 4=1980-2000, 5=2000+'],
    ['Insulation Rating', '2', 'E5', '1=Poor, 2=Average, 3=Good, 4=Excellent'],
    ['UK Region', '5', 'E6', '1=Scotland, 2=N.England, 3=Midlands, 4=Wales, 5=S.England, 6=London'],
    ['Current Heating', '1', 'E7', '1=Gas, 2=Electric, 3=Storage, 4=Oil, 5=LPG, 6=None'],
  ];
  
  let row = 4;
  propertyInputs.forEach(([label, defaultVal, helpCell, helpText]) => {
    inputs.getCell(`B${row}`).value = label;
    inputs.getCell(`C${row}`).value = parseInt(defaultVal);
    inputs.getCell(`C${row}`).style = inputStyle;
    inputs.getCell(`C${row}`).name = label.replace(/\s/g, '_');
    inputs.getCell(helpCell.replace('E', 'E')).value = helpText;
    inputs.getCell(`E${row}`).font = { italic: true, size: 10, color: { argb: '666666' } };
    row++;
  });
  
  // Energy Costs Section
  row += 1;
  inputs.getCell(`B${row}`).value = 'ENERGY COSTS';
  inputs.getCell(`B${row}`).style = headerStyle;
  row++;
  
  inputs.getCell(`B${row}`).value = 'Electricity Rate (p/kWh)';
  inputs.getCell(`C${row}`).value = 22;
  inputs.getCell(`C${row}`).style = inputStyle;
  inputs.getCell(`E${row}`).value = 'UK average ~22p (Jan 2026)';
  inputs.getCell(`E${row}`).font = { italic: true, size: 10, color: { argb: '666666' } };
  row++;
  
  inputs.getCell(`B${row}`).value = 'Gas Rate (p/kWh)';
  inputs.getCell(`C${row}`).value = 5.5;
  inputs.getCell(`C${row}`).style = inputStyle;
  inputs.getCell(`E${row}`).value = 'UK average ~5.5p (Jan 2026)';
  inputs.getCell(`E${row}`).font = { italic: true, size: 10, color: { argb: '666666' } };
  row++;
  
  inputs.getCell(`B${row}`).value = 'Annual Heating Bill (£)';
  inputs.getCell(`C${row}`).value = 1200;
  inputs.getCell(`C${row}`).style = inputStyle;
  inputs.getCell(`E${row}`).value = 'Your current annual heating cost';
  inputs.getCell(`E${row}`).font = { italic: true, size: 10, color: { argb: '666666' } };
  
  // ============ ROOMS SHEET ============
  const rooms = workbook.addWorksheet('Rooms', { properties: { tabColor: { argb: 'FF9800' } } });
  
  rooms.columns = [
    { width: 5 }, { width: 20 }, { width: 12 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 18 }, { width: 15 }
  ];
  
  // Title
  rooms.mergeCells('A1:L1');
  rooms.getCell('A1').value = 'Room-by-Room Heat Loss Calculator';
  rooms.getCell('A1').style = titleStyle;
  rooms.getRow(1).height = 30;
  
  // Headers
  const roomHeaders = ['#', 'Room Name', 'Type', 'Length(m)', 'Width(m)', 'Height(m)', 'Ext. Walls', 'Windows', 'Floor Type', 'Heat Loss (W)', 'Panel Size (W)', 'HeatENE Model'];
  roomHeaders.forEach((header, i) => {
    rooms.getCell(3, i + 1).value = header;
    rooms.getCell(3, i + 1).style = headerStyle;
  });
  
  // Room type lookup values (for reference)
  // 1=Living, 2=Bedroom, 3=Kitchen, 4=Bathroom, 5=Office, 6=Hallway, 7=Dining
  
  // Pre-fill 10 room rows with formulas
  for (let r = 0; r < 10; r++) {
    const rowNum = 4 + r;
    rooms.getCell(rowNum, 1).value = r + 1;
    rooms.getCell(rowNum, 2).value = r === 0 ? 'Living Room' : (r === 1 ? 'Bedroom 1' : '');
    rooms.getCell(rowNum, 2).style = inputStyle;
    rooms.getCell(rowNum, 3).value = r === 0 ? 1 : (r === 1 ? 2 : '');
    rooms.getCell(rowNum, 3).style = inputStyle;
    rooms.getCell(rowNum, 4).value = r === 0 ? 5 : (r === 1 ? 4 : '');
    rooms.getCell(rowNum, 4).style = inputStyle;
    rooms.getCell(rowNum, 5).value = r === 0 ? 4 : (r === 1 ? 3 : '');
    rooms.getCell(rowNum, 5).style = inputStyle;
    rooms.getCell(rowNum, 6).value = r === 0 ? 2.4 : (r === 1 ? 2.4 : '');
    rooms.getCell(rowNum, 6).style = inputStyle;
    rooms.getCell(rowNum, 7).value = r === 0 ? 2 : (r === 1 ? 1 : '');
    rooms.getCell(rowNum, 7).style = inputStyle;
    rooms.getCell(rowNum, 8).value = r === 0 ? 2 : (r === 1 ? 1 : '');
    rooms.getCell(rowNum, 8).style = inputStyle;
    rooms.getCell(rowNum, 9).value = r === 0 ? 1 : (r === 1 ? 2 : '');
    rooms.getCell(rowNum, 9).style = inputStyle;
    
    // Heat Loss formula: Area × Base heat loss × multipliers
    // Base: 50 W/m², adjusted by insulation, windows, external walls
    const formula = `=IF(D${rowNum}="","",D${rowNum}*E${rowNum}*(50+G${rowNum}*5+H${rowNum}*10)*(1+IF(Inputs!C5=1,0.3,IF(Inputs!C5=2,0.15,IF(Inputs!C5=3,0,-0.15))))*(F${rowNum}/2.4))`;
    rooms.getCell(rowNum, 10).value = { formula: formula };
    rooms.getCell(rowNum, 10).numFmt = '0';
    
    // Panel size formula (round up to nearest 100)
    rooms.getCell(rowNum, 11).value = { formula: `=IF(J${rowNum}="","",CEILING(J${rowNum},100))` };
    rooms.getCell(rowNum, 11).numFmt = '0';
    
    // Recommended model
    rooms.getCell(rowNum, 12).value = { formula: `=IF(K${rowNum}="","",IF(K${rowNum}<=400,"HeatENE 400",IF(K${rowNum}<=600,"HeatENE 600",IF(K${rowNum}<=800,"HeatENE 800","HeatENE 1000"))))` };
  }
  
  // Room type reference
  rooms.getCell('B16').value = 'Room Types:';
  rooms.getCell('B16').font = { bold: true };
  rooms.getCell('B17').value = '1=Living, 2=Bedroom, 3=Kitchen, 4=Bathroom, 5=Office, 6=Hallway, 7=Dining';
  rooms.getCell('B17').font = { italic: true, size: 10 };
  
  rooms.getCell('B18').value = 'Windows:';
  rooms.getCell('B18').font = { bold: true };
  rooms.getCell('B19').value = '1=Small, 2=Medium, 3=Large, 4=Extensive';
  rooms.getCell('B19').font = { italic: true, size: 10 };
  
  rooms.getCell('B20').value = 'Floor Type:';
  rooms.getCell('B20').font = { bold: true };
  rooms.getCell('B21').value = '1=Ground, 2=Upper, 3=Over unheated space';
  rooms.getCell('B21').font = { italic: true, size: 10 };
  
  // ============ RESULTS SHEET ============
  const results = workbook.addWorksheet('Results', { properties: { tabColor: { argb: '4CAF50' } } });
  
  results.columns = [
    { width: 5 }, { width: 35 }, { width: 20 }, { width: 20 }, { width: 30 }
  ];
  
  // Title
  results.mergeCells('A1:E1');
  results.getCell('A1').value = 'HeatENE Results & Savings';
  results.getCell('A1').style = titleStyle;
  results.getRow(1).height = 30;
  
  // Summary Section
  results.getCell('B3').value = 'SYSTEM SUMMARY';
  results.getCell('B3').style = headerStyle;
  
  const summaryRows = [
    ['Total Heat Requirement (W)', '=SUM(Rooms!J4:J13)', '0'],
    ['Number of Panels Needed', '=COUNTIF(Rooms!K4:K13,">0")', '0'],
    ['Total Panel Capacity (W)', '=SUM(Rooms!K4:K13)', '0'],
  ];
  
  row = 4;
  summaryRows.forEach(([label, formula, fmt]) => {
    results.getCell(`B${row}`).value = label;
    results.getCell(`C${row}`).value = { formula: formula };
    results.getCell(`C${row}`).numFmt = fmt;
    results.getCell(`C${row}`).font = { bold: true };
    row++;
  });
  
  // Costs Section
  row++;
  results.getCell(`B${row}`).value = 'EQUIPMENT COSTS';
  results.getCell(`B${row}`).style = headerStyle;
  row++;
  
  // Panel costs (based on mid-market positioning)
  results.getCell(`B${row}`).value = 'HeatENE 400 panels (£280 each)';
  results.getCell(`C${row}`).value = { formula: '=COUNTIF(Rooms!L4:L13,"HeatENE 400")*280' };
  results.getCell(`C${row}`).numFmt = '"£"#,##0';
  row++;
  
  results.getCell(`B${row}`).value = 'HeatENE 600 panels (£350 each)';
  results.getCell(`C${row}`).value = { formula: '=COUNTIF(Rooms!L4:L13,"HeatENE 600")*350' };
  results.getCell(`C${row}`).numFmt = '"£"#,##0';
  row++;
  
  results.getCell(`B${row}`).value = 'HeatENE 800 panels (£420 each)';
  results.getCell(`C${row}`).value = { formula: '=COUNTIF(Rooms!L4:L13,"HeatENE 800")*420' };
  results.getCell(`C${row}`).numFmt = '"£"#,##0';
  row++;
  
  results.getCell(`B${row}`).value = 'HeatENE 1000 panels (£500 each)';
  results.getCell(`C${row}`).value = { formula: '=COUNTIF(Rooms!L4:L13,"HeatENE 1000")*500' };
  results.getCell(`C${row}`).numFmt = '"£"#,##0';
  row++;
  
  results.getCell(`B${row}`).value = 'Total Equipment Cost';
  results.getCell(`C${row}`).value = { formula: `=SUM(C${row-4}:C${row-1})` };
  results.getCell(`C${row}`).numFmt = '"£"#,##0';
  results.getCell(`C${row}`).font = { bold: true };
  results.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C8E6C9' } };
  const equipmentCostRow = row;
  row++;
  
  results.getCell(`B${row}`).value = 'Installation (£50/panel, optional)';
  results.getCell(`C${row}`).value = { formula: '=C5*50' };
  results.getCell(`C${row}`).numFmt = '"£"#,##0';
  row++;
  
  results.getCell(`B${row}`).value = 'Total with Installation';
  results.getCell(`C${row}`).value = { formula: `=C${equipmentCostRow}+C${row-1}` };
  results.getCell(`C${row}`).numFmt = '"£"#,##0';
  results.getCell(`C${row}`).font = { bold: true };
  
  // Running Costs Section
  row += 2;
  results.getCell(`B${row}`).value = 'ANNUAL RUNNING COSTS';
  results.getCell(`B${row}`).style = headerStyle;
  row++;
  
  results.getCell(`B${row}`).value = 'Current Annual Heating Cost';
  results.getCell(`C${row}`).value = { formula: '=Inputs!C12' };
  results.getCell(`C${row}`).numFmt = '"£"#,##0';
  const currentCostRow = row;
  row++;
  
  // HeatENE running cost: Total wattage × 8 hrs/day × 180 days × electricity rate / 1000
  results.getCell(`B${row}`).value = 'HeatENE Annual Running Cost';
  results.getCell(`C${row}`).value = { formula: '=C6*8*180*(Inputs!C10/100)/1000' };
  results.getCell(`C${row}`).numFmt = '"£"#,##0';
  results.getCell(`E${row}`).value = '(Based on 8 hrs/day, 180 heating days)';
  results.getCell(`E${row}`).font = { italic: true, size: 10, color: { argb: '666666' } };
  const heateneRunningRow = row;
  row++;
  
  results.getCell(`B${row}`).value = 'Annual Savings';
  results.getCell(`C${row}`).value = { formula: `=C${currentCostRow}-C${heateneRunningRow}` };
  results.getCell(`C${row}`).numFmt = '"£"#,##0';
  results.getCell(`C${row}`).font = { bold: true, color: { argb: '2E7D32' } };
  results.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C8E6C9' } };
  const savingsRow = row;
  row++;
  
  results.getCell(`B${row}`).value = 'Break-even Point (years)';
  results.getCell(`C${row}`).value = { formula: `=IF(C${savingsRow}>0,C${equipmentCostRow}/C${savingsRow},"N/A")` };
  results.getCell(`C${row}`).numFmt = '0.0';
  results.getCell(`C${row}`).font = { bold: true };
  row++;
  
  // Environmental
  row++;
  results.getCell(`B${row}`).value = 'ENVIRONMENTAL IMPACT';
  results.getCell(`B${row}`).style = headerStyle;
  row++;
  
  results.getCell(`B${row}`).value = 'CO₂ Saved per Year (kg)';
  results.getCell(`C${row}`).value = { formula: `=IF(Inputs!C8=1,(C${currentCostRow}/(Inputs!C11/100))*0.182-(C${heateneRunningRow}/(Inputs!C10/100))*0.207,0)` };
  results.getCell(`C${row}`).numFmt = '0';
  results.getCell(`E${row}`).value = '(Gas: 0.182 kg/kWh, Electric: 0.207 kg/kWh)';
  results.getCell(`E${row}`).font = { italic: true, size: 10, color: { argb: '666666' } };
  
  // ============ 10-YEAR PROJECTION ============
  row += 2;
  results.getCell(`B${row}`).value = '10-YEAR PROJECTION';
  results.getCell(`B${row}`).style = headerStyle;
  row++;
  
  results.getCell('B' + row).value = 'Year';
  results.getCell('C' + row).value = 'Current System';
  results.getCell('D' + row).value = 'HeatENE';
  results.getCell('B' + row).font = { bold: true };
  results.getCell('C' + row).font = { bold: true };
  results.getCell('D' + row).font = { bold: true };
  row++;
  
  const projStartRow = row;
  for (let y = 0; y <= 10; y++) {
    results.getCell(`B${row}`).value = y;
    results.getCell(`C${row}`).value = { formula: `=C${currentCostRow}*${y}` };
    results.getCell(`C${row}`).numFmt = '"£"#,##0';
    results.getCell(`D${row}`).value = { formula: `=C${equipmentCostRow}+C${heateneRunningRow}*${y}` };
    results.getCell(`D${row}`).numFmt = '"£"#,##0';
    row++;
  }
  
  // ============ PRICING SHEET ============
  const pricing = workbook.addWorksheet('Pricing', { properties: { tabColor: { argb: '9C27B0' } } });
  
  pricing.columns = [
    { width: 5 }, { width: 20 }, { width: 15 }, { width: 15 }, { width: 30 }
  ];
  
  pricing.mergeCells('A1:E1');
  pricing.getCell('A1').value = 'HeatENE Panel Pricing';
  pricing.getCell('A1').style = titleStyle;
  pricing.getRow(1).height = 30;
  
  pricing.getCell('B3').value = 'Model';
  pricing.getCell('C3').value = 'Wattage';
  pricing.getCell('D3').value = 'Price (£)';
  pricing.getCell('E3').value = 'Best For';
  ['B3', 'C3', 'D3', 'E3'].forEach(c => pricing.getCell(c).style = headerStyle);
  
  const panelData = [
    ['HeatENE 400', 400, 280, 'Small rooms, bathrooms, offices'],
    ['HeatENE 600', 600, 350, 'Bedrooms, medium rooms'],
    ['HeatENE 800', 800, 420, 'Living rooms, open spaces'],
    ['HeatENE 1000', 1000, 500, 'Large rooms, high ceilings'],
  ];
  
  row = 4;
  panelData.forEach(([model, watts, price, bestFor]) => {
    pricing.getCell(`B${row}`).value = model;
    pricing.getCell(`C${row}`).value = watts;
    pricing.getCell(`C${row}`).numFmt = '0"W"';
    pricing.getCell(`D${row}`).value = price;
    pricing.getCell(`D${row}`).numFmt = '"£"#,##0';
    pricing.getCell(`D${row}`).style = inputStyle;
    pricing.getCell(`E${row}`).value = bestFor;
    row++;
  });
  
  pricing.getCell(`B${row + 1}`).value = '💡 Tip: Edit prices above to update all calculations';
  pricing.getCell(`B${row + 1}`).font = { italic: true };
  
  // Save
  const outputPath = path.join(__dirname, 'HeatENE_Calculator.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log('✓ Excel calculator created:', outputPath);
}

createCalculator().catch(console.error);
