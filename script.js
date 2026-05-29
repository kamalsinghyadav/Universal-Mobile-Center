// ===== GLOBAL STATE =====
const SB_URL = 'https://cmdfungrbzmujxcvdwlt.supabase.co';
const SB_KEY = 'sb_publishable_Xp76Evvclce4KwgQ59Z-sw_gyRrJ-tv';
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let billCounter = 1;
let savedBills = [];
let rowCounter = 0;
let currentTab = 'items';
let daySalesTotal = 0;
let dayBillsCount = 0;
let dayCashTotal = 0;
let dayCreditTotal = 0;

// Nepal VAT rate (13% standard)
const NEPAL_VAT_RATE = 13;

// ===== THEME SWITCHER =====
function setTheme(theme) {
  // Remove all theme classes
  document.body.className = document.body.className
    .replace(/theme-\w+/g, '').trim();
  if (theme !== 'pink') {
    document.body.classList.add('theme-' + theme);
  }
  // Mark active button
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  localStorage.setItem('um_theme', theme);
}

// Load saved theme
(function loadTheme() {
  const saved = localStorage.getItem('um_theme') || 'pink';
  setTheme(saved);
})();

// ===== INIT =====
window.onload = function () {
  setTodayDate();
  addRow();
  addRow();
  addRow();
  updateStatusBar();
  updateRightPanel();
  loadRecentBills();
  updatePayFields();
};

// ===== DATE (AD + BS approximate) =====
function setTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = yyyy + '-' + mm + '-' + dd;
  document.getElementById('billDate').value = dateStr;

  // Due date = 30 days
  const due = new Date(today);
  due.setDate(due.getDate() + 30);
  const dueMM = String(due.getMonth() + 1).padStart(2, '0');
  const dueDD = String(due.getDate()).padStart(2, '0');
  document.getElementById('dueDate').value = due.getFullYear() + '-' + dueMM + '-' + dueDD;

  document.getElementById('r_date').textContent = dd + '/' + mm + '/' + yyyy;

  const timeStr = today.getHours() + ':' + String(today.getMinutes()).padStart(2, '0');
  document.getElementById('sb_date').textContent = 'Date: ' + dd + '/' + mm + '/' + yyyy + ' ' + timeStr;

  // Approximate BS date (AD + 56 years 8.5 months roughly)
  const bsYear = yyyy + 56;
  const bsMonth = today.getMonth() + 9;
  const bsMonthFinal = bsMonth > 12 ? bsMonth - 12 : bsMonth;
  document.getElementById('billDateBS').value = bsYear + '-' + String(bsMonthFinal).padStart(2, '0') + '-' + dd;
}

function updateDueDate() {
  const d = document.getElementById('billDate').value;
  if (d) {
    const due = new Date(d);
    due.setDate(due.getDate() + 30);
    const y = due.getFullYear(), m = String(due.getMonth() + 1).padStart(2, '0'), dd = String(due.getDate()).padStart(2, '0');
    document.getElementById('dueDate').value = y + '-' + m + '-' + dd;
    const parts = d.split('-');
    document.getElementById('r_date').textContent = parts[2] + '/' + parts[1] + '/' + parts[0];
  }
}

function syncDate() {
  // If user types BS date, just update the field (full conversion needs a library)
  setStatus('BS date entered. Please verify AD date.');
}

// ===== TABS =====
function showTab(tab) {
  document.getElementById('tabItems').style.display = tab === 'items' ? 'block' : 'none';
  document.getElementById('tabPayment').style.display = tab === 'payment' ? 'block' : 'none';
  document.getElementById('tabOther').style.display = tab === 'other' ? 'block' : 'none';
  document.getElementById('tabRemarks').style.display = tab === 'remarks' ? 'block' : 'none';
  document.getElementById('tab1').className = 'tab' + (tab === 'items' ? ' active' : '');
  document.getElementById('tab2').className = 'tab' + (tab === 'payment' ? ' active' : '');
  document.getElementById('tab3').className = 'tab' + (tab === 'other' ? ' active' : '');
  document.getElementById('tab4').className = 'tab' + (tab === 'remarks' ? ' active' : '');
  currentTab = tab;
}

// ===== ITEMS TABLE =====
function addRow() {
  rowCounter++;
  const tbody = document.getElementById('itemsTbody');
  const tr = document.createElement('tr');
  tr.id = 'row_' + rowCounter;
  tr.innerHTML = `
    <td style="text-align:center;padding:1px 2px;font-size:9px;">${tbody.rows.length + 1}</td>
    <td>
      <select style="width:170px;border:none;background:transparent;font-size:10px;height:16px;" onchange="fillItemDetails(this, '${rowCounter}')">
        <option value="">-- Select Item --</option>
        <option value="i1" data-hscode="8517.12" data-rate="15000" data-taxtype="vat">Samsung Mobile (imported)</option>
        <option value="i2" data-hscode="8517.12" data-rate="25000" data-taxtype="vat">iPhone Accessories</option>
        <option value="i3" data-hscode="8518.30" data-rate="3500" data-taxtype="vat">Headphones Set</option>
        <option value="i4" data-hscode="8504.40" data-rate="1800" data-taxtype="vat">Charger / Adapter</option>
        <option value="i5" data-hscode="8517.70" data-rate="800" data-taxtype="vat">Phone Cover / Case</option>
        <option value="i6" data-hscode="8523.51" data-rate="600" data-taxtype="vat">Memory Card / SD Card</option>
        <option value="i7" data-hscode="9999.00" data-rate="500" data-taxtype="exempt">Repair Service (Exempt)</option>
        <option value="i8" data-hscode="8544.42" data-rate="200" data-taxtype="vat">Data Cable / USB</option>
        <option value="i9" data-hscode="8507.60" data-rate="5000" data-taxtype="vat">Power Bank</option>
        <option value="i10" data-hscode="8528.72" data-rate="45000" data-taxtype="vat">Smart TV (Excisable)</option>
      </select>
    </td>
    <td><input type="text" id="hsn_${rowCounter}" style="width:52px;" placeholder="HS Code"></td>
    <td><input type="number" id="qty_${rowCounter}" value="1" style="width:50px;text-align:right;" oninput="calcRow(${rowCounter})" min="0" step="0.01"></td>
    <td>
      <select id="unit_${rowCounter}" style="width:40px;border:none;background:transparent;font-size:10px;height:16px;">
        <option>Nos</option><option>Pcs</option><option>Kg</option>
        <option>Ltr</option><option>Mtr</option><option>Box</option>
        <option>Set</option><option>Pair</option>
      </select>
    </td>
    <td><input type="number" id="rate_${rowCounter}" value="0" style="width:68px;text-align:right;" oninput="calcRow(${rowCounter})" min="0" step="0.01"></td>
    <td><input type="number" id="disc_${rowCounter}" value="0" style="width:50px;text-align:right;" oninput="calcRow(${rowCounter})" min="0" max="100" step="0.01"></td>
    <td>
      <select id="taxtype_${rowCounter}" style="width:68px;border:none;background:transparent;font-size:10px;height:16px;" onchange="calcRow(${rowCounter})">
        <option value="vat">VAT 13%</option>
        <option value="exempt">Exempt</option>
        <option value="zero">Zero Rated</option>
        <option value="excise">Excise+VAT</option>
      </select>
    </td>
    <td><input type="number" id="amt_${rowCounter}" value="0.00" readonly style="width:75px;text-align:right;background:#fff0f5;" step="0.01"></td>
    <td style="text-align:center;"><button style="background:#ff6688;color:white;border:none;cursor:pointer;font-size:11px;width:20px;height:16px;line-height:1;" onclick="deleteRow('row_${rowCounter}')">×</button></td>
  `;
  tbody.appendChild(tr);
  renumberRows();
}

function fillItemDetails(sel, rowId) {
  const opt = sel.options[sel.selectedIndex];
  if (opt.value) {
    document.getElementById('hsn_' + rowId).value = opt.getAttribute('data-hscode') || '';
    document.getElementById('rate_' + rowId).value = opt.getAttribute('data-rate') || 0;
    const taxSel = document.getElementById('taxtype_' + rowId);
    const taxType = opt.getAttribute('data-taxtype') || 'vat';
    for (let i = 0; i < taxSel.options.length; i++) {
      if (taxSel.options[i].value === taxType) { taxSel.selectedIndex = i; break; }
    }
    calcRow(rowId);
  }
}

function calcRow(rowId) {
  const qty = parseFloat(document.getElementById('qty_' + rowId).value) || 0;
  const rate = parseFloat(document.getElementById('rate_' + rowId).value) || 0;
  const disc = parseFloat(document.getElementById('disc_' + rowId).value) || 0;
  const taxType = document.getElementById('taxtype_' + rowId).value;

  const base = qty * rate;
  const discAmt = base * disc / 100;
  const taxable = base - discAmt;

  let vatAmt = 0;
  let exciseAmt = 0;
  if (taxType === 'vat') {
    vatAmt = taxable * NEPAL_VAT_RATE / 100;
  } else if (taxType === 'excise') {
    exciseAmt = taxable * 0.05; // 5% excise example
    vatAmt = (taxable + exciseAmt) * NEPAL_VAT_RATE / 100;
  }
  // exempt / zero = no tax

  const total = taxable + vatAmt + exciseAmt;
  document.getElementById('amt_' + rowId).value = total.toFixed(2);
  recalculate();
}

function deleteRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) row.remove();
  renumberRows();
  recalculate();
}

function deleteLastRow() {
  const tbody = document.getElementById('itemsTbody');
  if (tbody.rows.length > 1) {
    tbody.deleteRow(tbody.rows.length - 1);
    recalculate();
  }
}

function renumberRows() {
  const rows = document.getElementById('itemsTbody').rows;
  for (let i = 0; i < rows.length; i++) {
    rows[i].cells[0].textContent = i + 1;
  }
}

function clearItems() {
  if (confirm('Clear all items? / सबै सामान हटाउने?')) {
    document.getElementById('itemsTbody').innerHTML = '';
    rowCounter = 0;
    addRow();
    recalculate();
  }
}

// ===== NEPAL VAT RECALCULATE =====
function recalculate() {
  const rows = document.getElementById('itemsTbody').rows;
  let subTotal = 0, totalDisc = 0, totalVAT = 0, totalExcise = 0, totalQty = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowId = rows[i].id.replace('row_', '');
    if (!rowId) continue;
    const qty = parseFloat(document.getElementById('qty_' + rowId)?.value) || 0;
    const rate = parseFloat(document.getElementById('rate_' + rowId)?.value) || 0;
    const disc = parseFloat(document.getElementById('disc_' + rowId)?.value) || 0;
    const taxType = document.getElementById('taxtype_' + rowId)?.value || 'vat';

    const base = qty * rate;
    const discAmt = base * disc / 100;
    const taxable = base - discAmt;
    let vat = 0, excise = 0;
    if (taxType === 'vat') vat = taxable * NEPAL_VAT_RATE / 100;
    else if (taxType === 'excise') {
      excise = taxable * 0.05;
      vat = (taxable + excise) * NEPAL_VAT_RATE / 100;
    }
    subTotal += base;
    totalDisc += discAmt;
    totalVAT += vat;
    totalExcise += excise;
    totalQty += qty;
  }

  const addDiscPct = parseFloat(document.getElementById('addDiscPct').value) || 0;
  const taxableBase = subTotal - totalDisc;
  const addDiscAmt = taxableBase * addDiscPct / 100;
  const taxableFinal = taxableBase - addDiscAmt;

  // Recalculate VAT on adjusted taxable (proportional)
  const ratio = taxableBase > 0 ? taxableFinal / taxableBase : 1;
  const vatFinal = totalVAT * ratio;
  const exciseFinal = totalExcise * ratio;

  const customsDuty = parseFloat(document.getElementById('customsDuty').value) || 0;
  const grandRaw = taxableFinal + vatFinal + exciseFinal + customsDuty;
  const roundOff = Math.round(grandRaw) - grandRaw;
  const grand = grandRaw + roundOff;

  document.getElementById('subTotal').value = subTotal.toFixed(2);
  document.getElementById('totalDiscount').value = (totalDisc + addDiscAmt).toFixed(2);
  document.getElementById('addDiscAmt').value = addDiscAmt.toFixed(2);
  document.getElementById('taxableAmt').value = taxableFinal.toFixed(2);
  document.getElementById('vatAmt').value = vatFinal.toFixed(2);
  document.getElementById('exciseDuty').value = exciseFinal.toFixed(2);
  document.getElementById('roundOff').value = roundOff.toFixed(2);
  document.getElementById('grandTotal').value = Math.round(grand).toFixed(2);

  // TDS
  const tdsPct = parseFloat(document.getElementById('tdsPct')?.value) || 0;
  const tdsAmt = taxableFinal * tdsPct / 100;
  const netPayable = Math.round(grand) - tdsAmt;
  if (document.getElementById('tdsAmt')) document.getElementById('tdsAmt').value = tdsAmt.toFixed(2);
  if (document.getElementById('netPayable')) document.getElementById('netPayable').value = netPayable.toFixed(2);

  // Payment tab
  const amtPaid = parseFloat(document.getElementById('amtPaid').value) || 0;
  document.getElementById('balance').value = (Math.round(grand) - amtPaid).toFixed(2);
  document.getElementById('totalOutstanding').value = Math.round(grand).toFixed(2);

  // Right panel
  document.getElementById('r_items').textContent = rows.length;
  document.getElementById('r_qty').textContent = totalQty.toFixed(2);
  document.getElementById('r_sub').textContent = subTotal.toFixed(2);
  document.getElementById('r_tax').textContent = vatFinal.toFixed(2);
  document.getElementById('r_grand').textContent = Math.round(grand).toFixed(2);
}

function updateBalance() {
  const grand = parseFloat(document.getElementById('grandTotal').value) || 0;
  const paid = parseFloat(document.getElementById('amtPaid').value) || 0;
  document.getElementById('balance').value = (grand - paid).toFixed(2);
}

// ===== CURRENCY UPDATE =====
function updateCurrency() {
  const cur = document.getElementById('currency').value;
  const rates = { NPR: 1, INR: 1.6, USD: 133, EUR: 145, CNY: 18 };
  document.getElementById('exRate').value = (rates[cur] || 1).toFixed(2);
}

// ===== PARTY LOAD - NEPAL =====
function loadParty() {
  const party = document.getElementById('partyName').value;
  const parties = {
    'Sharma Traders': { addr1: 'New Baneshwor', addr2: 'Ward No. 10', city: 'Kathmandu', pin: '44600', province: 'Bagmati Province (No. 3)', pan: '123456789', vat: 'VAT-123456789', mobile: '9841123456', email: 'sharma@traders.com.np' },
    'Kathmandu Enterprises': { addr1: 'Putalisadak', addr2: 'Near Civil Mall', city: 'Kathmandu', pin: '44601', province: 'Bagmati Province (No. 3)', pan: '987654321', vat: 'VAT-987654321', mobile: '9851098765', email: 'kte@enterprises.com.np' },
    'Pokhara Store': { addr1: 'Lakeside, Baidam', addr2: 'Ward No. 6', city: 'Pokhara', pin: '33700', province: 'Gandaki Province (No. 4)', pan: '456789123', vat: '', mobile: '9856045678', email: 'pokhara@store.np' },
    'Thapa & Co': { addr1: 'Dharan Bazaar', addr2: 'Main Road', city: 'Dharan', pin: '56700', province: 'Koshi Province (No. 1)', pan: '321654987', vat: 'VAT-321654987', mobile: '9847321654', email: 'thapa@co.np' },
    'Nepal Mobile Hub': { addr1: 'New Road', addr2: 'Opposite Bishal Bazaar', city: 'Kathmandu', pin: '44600', province: 'Bagmati Province (No. 3)', pan: '741852963', vat: 'VAT-741852963', mobile: '9801741852', email: 'hub@nepalmobile.com.np' },
    'Biratnagar Exports': { addr1: 'Traffic Chowk', addr2: 'Industrial Area', city: 'Biratnagar', pin: '56613', province: 'Koshi Province (No. 1)', pan: '159753486', vat: 'VAT-159753486', mobile: '9852159753', email: 'export@biratnagar.np' },
  };
  const p = parties[party];
  if (p) {
    document.getElementById('billAddr1').value = p.addr1;
    document.getElementById('billAddr2').value = p.addr2;
    document.getElementById('billCity').value = p.city;
    document.getElementById('billPin').value = p.pin;
    document.getElementById('billGST').value = p.pan;
    document.getElementById('billVAT').value = p.vat;
    document.getElementById('billMobile').value = p.mobile;
    document.getElementById('billEmail').value = p.email;
    const stateEl = document.getElementById('billState');
    for (let i = 0; i < stateEl.options.length; i++) {
      if (stateEl.options[i].text === p.province) { stateEl.selectedIndex = i; break; }
    }
    document.getElementById('r_party').textContent = party.length > 15 ? party.substr(0, 15) + '...' : party;
    document.getElementById('prevBal').value = (Math.random() * 8000).toFixed(2);
    setStatus('Party loaded: ' + party);
  }
}

function newParty() {
  const name = prompt('Enter new party name / नयाँ व्यापारीको नाम:');
  if (name) {
    const sel = document.getElementById('partyName');
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    sel.appendChild(opt);
    sel.value = name;
    setStatus('New party added: ' + name);
  }
}

// ===== SAME ADDRESS =====
function copySameAddress() {
  if (document.getElementById('sameAsBill').checked) {
    document.getElementById('shipName').value = document.getElementById('partyName').value;
    document.getElementById('shipAddr1').value = document.getElementById('billAddr1').value;
    document.getElementById('shipAddr2').value = document.getElementById('billAddr2').value;
    document.getElementById('shipCity').value = document.getElementById('billCity').value;
    document.getElementById('shipPin').value = document.getElementById('billPin').value;
    const bs = document.getElementById('billState');
    const ss = document.getElementById('shipState');
    ss.selectedIndex = bs.selectedIndex;
  }
}

// ===== BILL ACTIONS =====
function newBill() {
  if (confirm('Start a new bill? / नयाँ बिल सुरु गर्ने?')) {
    billCounter++;
    const padded = String(billCounter).padStart(4, '0');
    document.getElementById('billNo').value = 'SI-' + padded;
    document.getElementById('r_billNo').textContent = 'SI-' + padded;
    ['partyName', 'billAddr1', 'billAddr2', 'billCity', 'billPin',
     'billGST', 'billVAT', 'billMobile', 'billEmail', 'billNote', 'amtPaid', 'addDiscPct'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('itemsTbody').innerHTML = '';
    rowCounter = 0;
    addRow(); addRow(); addRow();
    setTodayDate();
    recalculate();
    setStatus('New bill started: SI-' + padded);
    showTab('items');
  }
}

function saveBill() {
  const party = document.getElementById('partyName').value;
  if (!party) { alert('Please select a party! / व्यापारी छान्नुहोस्!'); return; }
  const grand = parseFloat(document.getElementById('grandTotal').value) || 0;
  if (grand <= 0) { alert('Bill total is zero! / बिल जोड शून्य छ!'); return; }
  
  // Nepal: PAN required for transactions >= 50000
  if (grand >= 50000 && !document.getElementById('billGST').value) {
    if (!confirm('PAN number missing for transaction >= NPR 50,000. Required by IRD Nepal. Continue anyway?')) return;
  }

  const payMode = document.getElementById('payMode').value;
  const bill = {
    billNo: document.getElementById('billNo').value,
    date: document.getElementById('billDate').value,
    party: party,
    grand: grand,
    payMode: payMode,
    vat: parseFloat(document.getElementById('vatAmt').value) || 0
  };
  savedBills.unshift(bill);
  if (savedBills.length > 10) savedBills.pop();
  dayBillsCount++;
  daySalesTotal += grand;
  if (payMode.includes('Cash') || payMode.includes('नगद')) dayCashTotal += grand;
  else if (payMode === 'Credit') dayCreditTotal += grand;

  document.getElementById('dayBills').textContent = dayBillsCount;
  document.getElementById('daySales').textContent = daySalesTotal.toFixed(2);
  document.getElementById('dayCash').textContent = dayCashTotal.toFixed(2);
  document.getElementById('dayCredit').textContent = dayCreditTotal.toFixed(2);

  loadRecentBills();
  updateStatusBar();
  setStatus('Bill saved: ' + bill.billNo + ' | Amount: रू ' + grand.toFixed(2));
  alert('Bill ' + bill.billNo + ' saved successfully!\nAmount: रू ' + grand.toFixed(2) + '\nVAT: रू ' + bill.vat.toFixed(2));
}

function loadRecentBills() {
  const div = document.getElementById('recentBills');
  if (savedBills.length === 0) { div.innerHTML = '<i>No bills saved yet / बिल छैन</i>'; return; }
  div.innerHTML = savedBills.slice(0, 5).map(b =>
    `<div style="padding:1px 0;border-bottom:1px solid #eee;">
      <span style="font-weight:bold;">${b.billNo}</span>
      <span style="float:right;color:#008000;">रू ${b.grand.toFixed(0)}</span><br>
      <span style="color:#555;">${b.party.substr(0, 18)}</span>
    </div>`
  ).join('');
}

function deleteBill() {
  if (confirm('Delete this bill? / यो बिल मेटाउने?\nThis cannot be undone.')) {
    setStatus('Bill deleted');
    newBill();
  }
}

function printBill() {
  const party = document.getElementById('partyName').value || 'N/A';
  const grand = document.getElementById('grandTotal').value || '0.00';
  const billNo = document.getElementById('billNo').value;
  const date = document.getElementById('billDate').value;
  const panNo = document.getElementById('billGST').value;
  const vatAmt = document.getElementById('vatAmt').value;
  const taxable = document.getElementById('taxableAmt').value;
  setStatus('Printing: ' + billNo);

  const win = window.open('', '_blank', 'width=800,height=700');
  win.document.write(`
    <html><head><title>VAT Invoice ${billNo}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;padding:20px;color:#000;}
      h2{text-align:center;color:#333;}
      .header{display:flex;justify-content:space-between;margin-bottom:10px;border:1px solid #ccc;padding:8px;}
      table{width:100%;border-collapse:collapse;margin:10px 0;}
      th{background:#444;color:white;padding:5px;text-align:center;}
      td{border:1px solid #ccc;padding:4px 6px;}
      .total-area{float:right;width:300px;}
      .total-row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee;}
      .grand{font-size:14px;font-weight:bold;background:#f0f0f0;padding:4px;}
      .vat-note{font-size:10px;color:#666;margin-top:5px;border-top:1px solid #ccc;padding-top:5px;}
      @media print{button{display:none;}}
    </style></head><body>
    <div style="text-align:center;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:10px;">
      <h2>Universal Mobile &amp; Services Center</h2>
      <div style="font-size:13px;font-weight:bold;">TAX INVOICE / कर बिल</div>
      <div style="font-size:11px;">Nepal VAT Registered | IRD Compliant</div>
    </div>
    <div class="header">
      <div>
        <strong>Bill To / बिल गर्ने:</strong><br>
        ${party}<br>
        ${document.getElementById('billAddr1').value}<br>
        ${document.getElementById('billCity').value}
        <br>PAN: ${panNo || 'N/A'}
      </div>
      <div style="text-align:right;">
        <strong>Invoice No:</strong> ${billNo}<br>
        <strong>Date (AD):</strong> ${date}<br>
        <strong>Date (BS):</strong> ${document.getElementById('billDateBS').value}<br>
        <strong>Fiscal Year:</strong> ${document.getElementById('fiscalYear').value}<br>
        <strong>IRD Bill No:</strong> ${document.getElementById('irdBillNo')?.value || 'N/A'}
      </div>
    </div>
    <table>
      <thead>
        <tr><th>#</th><th>Item Description</th><th>HS Code</th><th>Qty</th><th>Rate (Rs)</th><th>Disc%</th><th>Tax Type</th><th>Amount (Rs)</th></tr>
      </thead>
      <tbody>
        ${Array.from(document.getElementById('itemsTbody').rows).map((row, i) => {
          const rowId = row.id.replace('row_', '');
          const itemSel = row.querySelector('select');
          const itemName = itemSel ? itemSel.options[itemSel.selectedIndex]?.text || '' : '';
          const hsn = document.getElementById('hsn_' + rowId)?.value || '';
          const qty = document.getElementById('qty_' + rowId)?.value || '';
          const rate = document.getElementById('rate_' + rowId)?.value || '';
          const disc = document.getElementById('disc_' + rowId)?.value || '';
          const taxtype = document.getElementById('taxtype_' + rowId)?.options[document.getElementById('taxtype_' + rowId)?.selectedIndex]?.text || '';
          const amt = document.getElementById('amt_' + rowId)?.value || '';
          return `<tr><td>${i+1}</td><td>${itemName}</td><td>${hsn}</td><td>${qty}</td><td>${rate}</td><td>${disc}%</td><td>${taxtype}</td><td style="text-align:right;">रू ${amt}</td></tr>`;
        }).join('')}
      </tbody>
    </table>
    <div class="total-area">
      <div class="total-row"><span>Sub Total:</span><span>रू ${document.getElementById('subTotal').value}</span></div>
      <div class="total-row"><span>Discount:</span><span>रू ${document.getElementById('totalDiscount').value}</span></div>
      <div class="total-row"><span><strong>Taxable Amount:</strong></span><span>रू ${taxable}</span></div>
      <div class="total-row"><span>VAT @ 13%:</span><span>रू ${vatAmt}</span></div>
      <div class="total-row"><span>Excise Duty:</span><span>रू ${document.getElementById('exciseDuty').value}</span></div>
      <div class="total-row"><span>Customs Duty:</span><span>रू ${document.getElementById('customsDuty').value}</span></div>
      <div class="grand">GRAND TOTAL (रू): ${grand}</div>
    </div>
    <div style="clear:both;"></div>
    <div class="vat-note">
      <strong>VAT Registration Note:</strong> VAT @ 13% as per Nepal Inland Revenue Department (IRD) regulations.<br>
      PAN No. of Buyer: ${panNo || 'Not Provided'} | Required for transactions ≥ NPR 50,000<br>
      <em>${document.getElementById('footerMsg')?.value || 'व्यापार गर्नु भएकोमा धन्यवाद!'}</em>
    </div>
    <div style="margin-top:20px;display:flex;justify-content:space-between;font-size:10px;">
      <div>Customer Signature / ग्राहकको दस्तखत:<br><br>___________________</div>
      <div style="text-align:right;">Authorized Signature / अधिकृत दस्तखत:<br><br>___________________<br>Universal Mobile &amp; Services Center</div>
    </div>
    <div style="text-align:center;margin-top:10px;font-size:9px;color:#666;">Developed by Kamlesh Yadav &amp; Uganda Groups | Universal Mobile Billing Software v2.0</div>
    <br>
    <button onclick="window.print()">🖨 Print</button>
    <button onclick="window.close()">✖ Close</button>
    </body></html>
  `);
  win.document.close();
}

function previewBill() { printBill(); }
function pdfBill() { setStatus('Generating PDF...'); alert('PDF export - Would generate Nepal VAT compliant PDF invoice.'); }
function emailBill() {
  const email = document.getElementById('billEmail').value;
  if (email) { setStatus('Email sent to: ' + email); alert('Invoice email sent to: ' + email); }
  else alert('No email address found / ईमेल ठेगाना छैन');
}
function whatsappBill() {
  const mobile = document.getElementById('billMobile').value;
  if (mobile) {
    const grand = document.getElementById('grandTotal').value;
    const billNo = document.getElementById('billNo').value;
    const msg = encodeURIComponent('नमस्ते! Universal Mobile & Services Center बाट Invoice ' + billNo + ' को रकम रू ' + grand + ' छ। धन्यवाद!');
    window.open('https://wa.me/977' + mobile.replace(/^0/, '') + '?text=' + msg, '_blank');
  } else alert('No mobile number / मोबाइल नम्बर छैन');
}
function cancelBill() {
  if (confirm('Cancel current bill? / हालको बिल रद्द गर्ने?')) { newBill(); setStatus('Bill cancelled'); }
}
function searchBill() {
  const q = prompt('Enter Bill No or Party Name / बिल नम्बर वा व्यापारी नाम:');
  if (q) {
    const found = savedBills.find(b => b.billNo.includes(q) || b.party.toLowerCase().includes(q.toLowerCase()));
    if (found) alert('Found / फेला पर्यो:\n' + found.billNo + '\nParty: ' + found.party + '\nAmount: रू ' + found.grand.toFixed(2));
    else alert('No bill found / बिल फेला परेन: ' + q);
  }
}
function firstRecord() { setStatus('First record'); }
function prevRecord() { setStatus('Previous record'); }
function nextRecord() { setStatus('Next record'); }
function lastRecord() { setStatus('Last record'); }
function updateInvType() { setStatus('Invoice type: ' + document.getElementById('invType').value); }

function genVATInvoice() {
  const vatNo = 'VAT-NEPAL-' + Date.now().toString(36).toUpperCase();
  if (document.getElementById('vatInvoiceNo')) document.getElementById('vatInvoiceNo').value = vatNo;
  setStatus('VAT Invoice generated: ' + vatNo);
  alert('Nepal VAT Invoice Reference Generated:\n' + vatNo + '\nSubmit to IRD within 25th of next month.');
}

function showTDSNote() {
  if (document.getElementById('tdsApplicable').checked) {
    alert('TDS Applicable!\n• Service: 1.5%\n• Rent: 10%\n• Dividend: 5%\n• Professional: 15%\nSelect rate in Payment tab.');
  }
}

function exitApp() { if (confirm('Exit Universal Mobile Billing Software?')) window.close(); }

function updatePayFields() {
  const mode = document.getElementById('payMode').value;
  const ch = document.getElementById('chequeFields');
  if (ch) ch.style.display = mode === 'Cheque' ? 'flex' : 'none';
}

function updateStatusBar() {
  document.getElementById('sb_records').textContent = 'Records: ' + savedBills.length;
}
function updateRightPanel() {
  document.getElementById('r_billNo').textContent = document.getElementById('billNo').value;
}

function setStatus(msg) {
  document.getElementById('statusMsg').textContent = msg;
  document.getElementById('sb_records').textContent = 'Records: ' + savedBills.length;
  setTimeout(() => {
    document.getElementById('statusMsg').textContent = 'Ready | Universal Mobile Billing Software';
  }, 4000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
  if (e.key === 'F2') { e.preventDefault(); newBill(); }
  if (e.key === 'F5') { e.preventDefault(); printBill(); }
  if (e.key === 'F10') { e.preventDefault(); saveBill(); }
  if (e.key === 'F9') { e.preventDefault(); addRow(); }
});
