// ===== GLOBAL STATE =====
let billCounter = 1;
let savedBills = [];
let rowCounter = 0;
let currentTab = 'items';
let daySalesTotal = 0;
let dayBillsCount = 0;

// ===== INIT =====
window.onload = function() {
  setTodayDate();
  addRow();
  addRow();
  addRow();
  updateStatusBar();
  updateRightPanel();
  loadRecentBills();
};

function setTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const dd = String(today.getDate()).padStart(2,'0');
  const dateStr = yyyy+'-'+mm+'-'+dd;
  document.getElementById('billDate').value = dateStr;
  // Due date = 30 days
  const due = new Date(today);
  due.setDate(due.getDate()+30);
  const dueMM = String(due.getMonth()+1).padStart(2,'0');
  const dueDD = String(due.getDate()).padStart(2,'0');
  document.getElementById('dueDate').value = due.getFullYear()+'-'+dueMM+'-'+dueDD;
  document.getElementById('r_date').textContent = dd+'/'+mm+'/'+yyyy;
  // Status bar date
  const dateStr2 = dd+'/'+mm+'/'+yyyy+' '+today.getHours()+':'+String(today.getMinutes()).padStart(2,'0');
  document.getElementById('sb_date').textContent = 'Date: '+dateStr2;
}

function updateDueDate() {
  const d = document.getElementById('billDate').value;
  if(d) {
    const due = new Date(d);
    due.setDate(due.getDate()+30);
    const y=due.getFullYear(), m=String(due.getMonth()+1).padStart(2,'0'), dd=String(due.getDate()).padStart(2,'0');
    document.getElementById('dueDate').value = y+'-'+m+'-'+dd;
  }
}

// ===== TABS =====
function showTab(tab) {
  document.getElementById('tabItems').style.display = tab==='items'?'block':'none';
  document.getElementById('tabPayment').style.display = tab==='payment'?'block':'none';
  document.getElementById('tabOther').style.display = tab==='other'?'block':'none';
  document.getElementById('tabRemarks').style.display = tab==='remarks'?'block':'none';
  document.getElementById('tab1').className = 'tab'+(tab==='items'?' active':'');
  document.getElementById('tab2').className = 'tab'+(tab==='payment'?' active':'');
  document.getElementById('tab3').className = 'tab'+(tab==='other'?' active':'');
  document.getElementById('tab4').className = 'tab'+(tab==='remarks'?' active':'');
  currentTab = tab;
}

// ===== ITEMS TABLE =====
function addRow() {
  rowCounter++;
  const tbody = document.getElementById('itemsTbody');
  const tr = document.createElement('tr');
  tr.id = 'row_'+rowCounter;
  tr.innerHTML = `
    <td style="text-align:center;padding:1px 2px;font-size:9px;">${tbody.rows.length+1}</td>
    <td>
      <select style="width:175px;border:none;background:transparent;font-size:10px;height:16px;" onchange="fillItemDetails(this, '${rowCounter}')">
        <option value="">-- Select Item --</option>
        <option value="item1" data-hsn="1234" data-rate="1000" data-gst="18">Product A - Model X100</option>
        <option value="item2" data-hsn="5678" data-rate="2500" data-gst="12">Product B - Model Y200</option>
        <option value="item3" data-hsn="9999" data-rate="500" data-gst="5">Service C - Annual AMC</option>
        <option value="item4" data-hsn="4444" data-rate="150" data-gst="18">Component D - Spare Part</option>
        <option value="item5" data-hsn="3333" data-rate="8000" data-gst="28">Machine E - Industrial</option>
        <option value="item6" data-hsn="7777" data-rate="350" data-gst="12">Accessory F - Cable Set</option>
      </select>
    </td>
    <td><input type="text" id="hsn_${rowCounter}" style="width:48px;" placeholder="HSN"></td>
    <td><input type="number" id="qty_${rowCounter}" value="1" style="width:53px;text-align:right;" oninput="calcRow(${rowCounter})" min="0" step="0.01"></td>
    <td>
      <select id="unit_${rowCounter}" style="width:43px;border:none;background:transparent;font-size:10px;height:16px;">
        <option>Nos</option><option>Pcs</option><option>Kg</option>
        <option>Ltr</option><option>Mtr</option><option>Box</option>
        <option>Set</option><option>Pair</option>
      </select>
    </td>
    <td><input type="number" id="rate_${rowCounter}" value="0" style="width:68px;text-align:right;" oninput="calcRow(${rowCounter})" min="0" step="0.01"></td>
    <td><input type="number" id="disc_${rowCounter}" value="0" style="width:58px;text-align:right;" oninput="calcRow(${rowCounter})" min="0" max="100" step="0.01"></td>
    <td>
      <select id="gst_${rowCounter}" style="width:58px;border:none;background:transparent;font-size:10px;height:16px;" onchange="calcRow(${rowCounter})">
        <option value="0">0%</option>
        <option value="5">5%</option>
        <option value="12">12%</option>
        <option value="18" selected>18%</option>
        <option value="28">28%</option>
      </select>
    </td>
    <td><input type="number" id="amt_${rowCounter}" value="0.00" readonly style="width:78px;text-align:right;background:#fff0f5;" step="0.01"></td>
    <td style="text-align:center;"><button style="background:#ff6688;color:white;border:none;cursor:pointer;font-size:11px;width:20px;height:16px;line-height:1;" onclick="deleteRow('row_${rowCounter}')">×</button></td>
  `;
  tbody.appendChild(tr);
  renumberRows();
}

function fillItemDetails(sel, rowId) {
  const opt = sel.options[sel.selectedIndex];
  if(opt.value) {
    document.getElementById('hsn_'+rowId).value = opt.getAttribute('data-hsn') || '';
    document.getElementById('rate_'+rowId).value = opt.getAttribute('data-rate') || 0;
    const gstSel = document.getElementById('gst_'+rowId);
    const gstVal = opt.getAttribute('data-gst') || '18';
    for(let i=0;i<gstSel.options.length;i++){
      if(gstSel.options[i].value==gstVal){ gstSel.selectedIndex=i; break; }
    }
    calcRow(rowId);
  }
}

function calcRow(rowId) {
  const qty = parseFloat(document.getElementById('qty_'+rowId).value) || 0;
  const rate = parseFloat(document.getElementById('rate_'+rowId).value) || 0;
  const disc = parseFloat(document.getElementById('disc_'+rowId).value) || 0;
  const gst = parseFloat(document.getElementById('gst_'+rowId).value) || 0;
  const base = qty * rate;
  const discAmt = base * disc / 100;
  const taxable = base - discAmt;
  const gstAmt = taxable * gst / 100;
  const total = taxable + gstAmt;
  document.getElementById('amt_'+rowId).value = total.toFixed(2);
  recalculate();
}

function deleteRow(rowId) {
  const row = document.getElementById(rowId);
  if(row) row.remove();
  renumberRows();
  recalculate();
}

function deleteLastRow() {
  const tbody = document.getElementById('itemsTbody');
  if(tbody.rows.length > 1) {
    tbody.deleteRow(tbody.rows.length-1);
    recalculate();
  }
}

function renumberRows() {
  const rows = document.getElementById('itemsTbody').rows;
  for(let i=0;i<rows.length;i++){
    rows[i].cells[0].textContent = i+1;
  }
}

function clearItems() {
  if(confirm('Clear all items?')) {
    document.getElementById('itemsTbody').innerHTML = '';
    rowCounter = 0;
    addRow();
    recalculate();
  }
}

// ===== RECALCULATE TOTALS =====
function recalculate() {
  const rows = document.getElementById('itemsTbody').rows;
  let subTotal = 0, totalDisc = 0, totalGST = 0, totalQty = 0;
  let cgst = 0, sgst = 0;

  for(let i=0;i<rows.length;i++){
    const rowId = rows[i].id.replace('row_','');
    if(!rowId) continue;
    const qty = parseFloat(document.getElementById('qty_'+rowId)?.value) || 0;
    const rate = parseFloat(document.getElementById('rate_'+rowId)?.value) || 0;
    const disc = parseFloat(document.getElementById('disc_'+rowId)?.value) || 0;
    const gst = parseFloat(document.getElementById('gst_'+rowId)?.value) || 0;
    const base = qty * rate;
    const discAmt = base * disc / 100;
    const taxable = base - discAmt;
    const gstAmt = taxable * gst / 100;
    subTotal += base;
    totalDisc += discAmt;
    totalGST += gstAmt;
    totalQty += qty;
    cgst += gstAmt / 2;
    sgst += gstAmt / 2;
  }

  const addDiscPct = parseFloat(document.getElementById('addDiscPct').value) || 0;
  const taxableBase = subTotal - totalDisc;
  const addDiscAmt = taxableBase * addDiscPct / 100;
  const taxable = taxableBase - addDiscAmt;
  const gstOnTaxable = taxable * 0; // GST already calculated per row
  // Recalc GST after add disc
  let cgstFinal=0, sgstFinal=0, igstFinal=0;
  let taxableFinal=0;
  const discRatio = taxableBase > 0 ? (taxable/taxableBase) : 1;
  for(let i=0;i<rows.length;i++){
    const rowId = rows[i].id.replace('row_','');
    if(!rowId) continue;
    const qty = parseFloat(document.getElementById('qty_'+rowId)?.value) || 0;
    const rate = parseFloat(document.getElementById('rate_'+rowId)?.value) || 0;
    const disc = parseFloat(document.getElementById('disc_'+rowId)?.value) || 0;
    const gst = parseFloat(document.getElementById('gst_'+rowId)?.value) || 0;
    const base = qty * rate;
    const discAmt = base * disc / 100;
    const t = (base - discAmt) * discRatio;
    taxableFinal += t;
    const gAmt = t * gst / 100;
    cgstFinal += gAmt/2;
    sgstFinal += gAmt/2;
  }

  const grandRaw = taxableFinal + cgstFinal + sgstFinal;
  const roundOff = Math.round(grandRaw) - grandRaw;
  const grand = grandRaw + roundOff;

  document.getElementById('subTotal').value = subTotal.toFixed(2);
  document.getElementById('totalDiscount').value = (totalDisc + addDiscAmt).toFixed(2);
  document.getElementById('addDiscAmt').value = addDiscAmt.toFixed(2);
  document.getElementById('taxableAmt').value = taxableFinal.toFixed(2);
  document.getElementById('cgst').value = cgstFinal.toFixed(2);
  document.getElementById('sgst').value = sgstFinal.toFixed(2);
  document.getElementById('igst').value = igstFinal.toFixed(2);
  document.getElementById('roundOff').value = roundOff.toFixed(2);
  document.getElementById('grandTotal').value = Math.round(grand).toFixed(2);

  // Update payment tab
  const amtPaid = parseFloat(document.getElementById('amtPaid').value) || 0;
  document.getElementById('balance').value = (Math.round(grand) - amtPaid).toFixed(2);
  document.getElementById('totalOutstanding').value = Math.round(grand).toFixed(2);

  // Update right panel
  document.getElementById('r_items').textContent = rows.length;
  document.getElementById('r_qty').textContent = totalQty.toFixed(2);
  document.getElementById('r_sub').textContent = subTotal.toFixed(2);
  document.getElementById('r_tax').textContent = (cgstFinal+sgstFinal).toFixed(2);
  document.getElementById('r_grand').textContent = Math.round(grand).toFixed(2);
}

function updateBalance() {
  const grand = parseFloat(document.getElementById('grandTotal').value) || 0;
  const paid = parseFloat(document.getElementById('amtPaid').value) || 0;
  document.getElementById('balance').value = (grand - paid).toFixed(2);
}

// ===== PARTY LOAD =====
function loadParty() {
  const party = document.getElementById('partyName').value;
  const parties = {
    'ABC Traders': { addr1: '123 MG Road', addr2: 'Opp. Main Market', city: 'Bengaluru', pin: '560001', state: 'Karnataka', gst: '29AABCA1234C1Z5', mobile: '9876543210', email: 'abc@traders.com' },
    'XYZ Enterprises': { addr1: '45 Anna Salai', addr2: '', city: 'Chennai', pin: '600002', state: 'Tamil Nadu', gst: '33AADXE5678D1Z2', mobile: '9123456789', email: 'xyz@enterprises.com' },
    'Raj & Co': { addr1: '78 Nehru Nagar', addr2: 'Near Bus Stand', city: 'Hyderabad', pin: '500001', state: 'Telangana', gst: '36AAARCO9012B1Z8', mobile: '9988776655', email: 'raj@co.in' },
  };
  const p = parties[party];
  if(p) {
    document.getElementById('billAddr1').value = p.addr1;
    document.getElementById('billAddr2').value = p.addr2;
    document.getElementById('billCity').value = p.city;
    document.getElementById('billPin').value = p.pin;
    document.getElementById('billGST').value = p.gst;
    document.getElementById('billMobile').value = p.mobile;
    document.getElementById('billEmail').value = p.email;
    // Set state
    const stateEl = document.getElementById('billState');
    for(let i=0;i<stateEl.options.length;i++){
      if(stateEl.options[i].text==p.state){ stateEl.selectedIndex=i; break; }
    }
    document.getElementById('r_party').textContent = party.length>15?party.substr(0,15)+'...':party;
    document.getElementById('prevBal').value = (Math.random()*5000).toFixed(2);
    setStatus('Party loaded: '+party);
  }
}

function newParty() {
  const name = prompt('Enter new party name:');
  if(name) {
    const sel = document.getElementById('partyName');
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    sel.appendChild(opt);
    sel.value = name;
    setStatus('New party added: '+name);
  }
}

// ===== SAME ADDRESS =====
function copySameAddress() {
  if(document.getElementById('sameAsBill').checked) {
    document.getElementById('shipName').value = document.getElementById('partyName').value;
    document.getElementById('shipAddr1').value = document.getElementById('billAddr1').value;
    document.getElementById('shipAddr2').value = document.getElementById('billAddr2').value;
    document.getElementById('shipCity').value = document.getElementById('billCity').value;
    document.getElementById('shipPin').value = document.getElementById('billPin').value;
    document.getElementById('shipGST').value = document.getElementById('billGST').value;
    const bs = document.getElementById('billState');
    const ss = document.getElementById('shipState');
    ss.selectedIndex = bs.selectedIndex;
  }
}

// ===== BILL ACTIONS =====
function newBill() {
  if(confirm('Start a new bill? Unsaved changes will be lost.')) {
    billCounter++;
    const padded = String(billCounter).padStart(4,'0');
    document.getElementById('billNo').value = 'SI-'+padded;
    document.getElementById('r_billNo').textContent = 'SI-'+padded;
    document.getElementById('partyName').value = '';
    document.getElementById('billAddr1').value='';
    document.getElementById('billAddr2').value='';
    document.getElementById('billCity').value='';
    document.getElementById('billPin').value='';
    document.getElementById('billGST').value='';
    document.getElementById('billMobile').value='';
    document.getElementById('billEmail').value='';
    document.getElementById('billNote').value='';
    document.getElementById('amtPaid').value='';
    document.getElementById('addDiscPct').value='';
    document.getElementById('itemsTbody').innerHTML='';
    rowCounter=0;
    addRow(); addRow(); addRow();
    setTodayDate();
    recalculate();
    setStatus('New bill started: SI-'+padded);
    showTab('items');
  }
}

function saveBill() {
  const party = document.getElementById('partyName').value;
  if(!party) { alert('Please select a party!'); return; }
  const grand = parseFloat(document.getElementById('grandTotal').value) || 0;
  if(grand <= 0) { alert('Bill total is zero! Please add items.'); return; }
  const bill = {
    billNo: document.getElementById('billNo').value,
    date: document.getElementById('billDate').value,
    party: party,
    grand: grand,
    payMode: document.getElementById('payMode').value
  };
  savedBills.unshift(bill);
  if(savedBills.length > 10) savedBills.pop();
  dayBillsCount++;
  daySalesTotal += grand;
  document.getElementById('dayBills').textContent = dayBillsCount;
  document.getElementById('daySales').textContent = daySalesTotal.toFixed(2);
  loadRecentBills();
  setStatus('Bill saved: '+bill.billNo+' | Amount: ₹'+grand.toFixed(2));
  alert('Bill '+bill.billNo+' saved successfully!\nAmount: ₹'+grand.toFixed(2));
}

function loadRecentBills() {
  const div = document.getElementById('recentBills');
  if(savedBills.length==0){div.innerHTML='<i>No bills saved yet</i>';return;}
  div.innerHTML = savedBills.slice(0,5).map(b=>
    `<div style="padding:1px 0;border-bottom:1px solid #eee;">
      <span style="color:#800040;font-weight:bold;">${b.billNo}</span>
      <span style="float:right;color:#008000;">₹${b.grand.toFixed(0)}</span>
      <br><span style="color:#555;">${b.party.substr(0,18)}</span>
    </div>`
  ).join('');
}

function deleteBill() {
  if(confirm('Delete this bill? This cannot be undone.')) {
    setStatus('Bill deleted');
    newBill();
  }
}

function printBill() {
  const party = document.getElementById('partyName').value || 'N/A';
  const grand = document.getElementById('grandTotal').value || '0.00';
  const billNo = document.getElementById('billNo').value;
  const date = document.getElementById('billDate').value;
  setStatus('Printing: '+billNo);
  const win = window.open('','_blank','width=800,height=600');
  win.document.write(`
    <html><head><title>Invoice ${billNo}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;padding:20px;}
      h2{text-align:center;color:#800040;}
      .header{display:flex;justify-content:space-between;margin-bottom:10px;}
      table{width:100%;border-collapse:collapse;margin:10px 0;}
      th{background:#cc6688;color:white;padding:4px;text-align:center;}
      td{border:1px solid #ccc;padding:3px 6px;}
      .total{text-align:right;font-weight:bold;font-size:14px;}
      @media print{button{display:none;}}
    </style></head><body>
    <h2>Hiltec Solutions &amp; Services</h2>
    <center><h3>TAX INVOICE</h3></center>
    <div class="header">
      <div><strong>Bill To:</strong><br>${party}<br>${document.getElementById('billAddr1').value}<br>${document.getElementById('billCity').value}</div>
      <div><strong>Invoice No:</strong> ${billNo}<br><strong>Date:</strong> ${date}<br><strong>GSTIN:</strong> ${document.getElementById('billGST').value}</div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Item</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Disc%</th><th>GST%</th><th>Amount</th></tr></thead>
      <tbody id="printBody"></tbody>
    </table>
    <div class="total">
      <p>Sub Total: ₹${document.getElementById('subTotal').value}</p>
      <p>CGST: ₹${document.getElementById('cgst').value}</p>
      <p>SGST: ₹${document.getElementById('sgst').value}</p>
      <p style="font-size:16px;color:#800040;">Grand Total: ₹${grand}</p>
    </div>
    <p style="text-align:center;color:#555;">${document.getElementById('footerMsg')?.value||'Thank you for your business!'}</p>
    <br><button onclick="window.print()">Print</button>
    <button onclick="window.close()">Close</button>
    </body></html>
  `);
  win.document.close();
}

function previewBill() { printBill(); }
function pdfBill() { setStatus('Generating PDF...'); alert('PDF export feature - would generate PDF of current invoice.'); }
function emailBill() {
  const email = document.getElementById('billEmail').value;
  if(email) setStatus('Email sent to: '+email);
  else { alert('No email address found for this party.'); return; }
  alert('Invoice email sent to: '+email);
}
function whatsappBill() {
  const mobile = document.getElementById('billMobile').value;
  if(mobile) {
    const grand = document.getElementById('grandTotal').value;
    const billNo = document.getElementById('billNo').value;
    const msg = encodeURIComponent('Dear Customer, Your invoice '+billNo+' of amount ₹'+grand+' has been generated. Thank you!');
    window.open('https://wa.me/91'+mobile+'?text='+msg,'_blank');
  } else alert('No mobile number found for this party.');
}
function cancelBill() {
  if(confirm('Cancel current bill?')) { newBill(); setStatus('Bill cancelled'); }
}
function searchBill() {
  const q = prompt('Enter Bill No or Party Name to search:');
  if(q) {
    const found = savedBills.find(b=>b.billNo.includes(q)||b.party.toLowerCase().includes(q.toLowerCase()));
    if(found) alert('Found: '+found.billNo+'\nParty: '+found.party+'\nAmount: ₹'+found.grand.toFixed(2));
    else alert('No bill found for: '+q);
  }
}
function firstRecord() { setStatus('First record'); }
function prevRecord() { setStatus('Previous record'); }
function nextRecord() { setStatus('Next record'); }
function lastRecord() { setStatus('Last record'); }
function updateInvType() { setStatus('Invoice type: '+document.getElementById('invType').value); }
function genEInvoice() {
  const irn = 'IRN'+Date.now().toString(36).toUpperCase();
  document.getElementById('irnNo').value = irn;
  setStatus('E-Invoice generated: '+irn);
  alert('E-Invoice IRN generated:\n'+irn);
}
function exitApp() { if(confirm('Exit Hiltec Billing Software?')) window.close(); }
function updatePayFields() {
  const mode = document.getElementById('payMode').value;
  const ch = document.getElementById('chequeFields');
  ch.style.display = (mode=='Cheque') ? 'flex' : 'none';
}
function newParty() {
  const n = prompt('Enter new party name:');
  if(n){
    const sel=document.getElementById('partyName');
    const o=document.createElement('option');
    o.value=n;o.textContent=n;sel.appendChild(o);sel.value=n;
    setStatus('New party added: '+n);
  }
}

function updateStatusBar() {
  document.getElementById('sb_records').textContent = 'Records: '+savedBills.length;
}
function updateRightPanel() {
  document.getElementById('r_billNo').textContent = document.getElementById('billNo').value;
}

function setStatus(msg) {
  document.getElementById('statusMsg').textContent = msg;
  document.getElementById('sb_records').textContent = 'Records: '+savedBills.length;
  setTimeout(()=>{ document.getElementById('statusMsg').textContent = 'Ready | Hiltec Billing Software'; }, 4000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if(e.key === 'F2') { e.preventDefault(); newBill(); }
  if(e.key === 'F5') { e.preventDefault(); printBill(); }
  if(e.key === 'F10') { e.preventDefault(); saveBill(); }
  if(e.key === 'F9') { e.preventDefault(); addRow(); }
});

// Init payment fields
updatePayFields();
