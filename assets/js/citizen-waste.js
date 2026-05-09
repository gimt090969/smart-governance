/**
 * citizen-waste.js — Citizen Garbage Fee Payment Logic
 * Fully integrated with waste.js + Supabase
 */

// ============================================
// STATE
// ============================================
let currentStep = 'search'; // search | details | payment
let selectedCustomer = null;
let selectedMonthKeys = [];
let slipBase64 = null;

const CW_MONTH_NAMES = ['ตุลาคม','พฤศจิกายน','ธันวาคม','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน'];
const CW_MONTH_KEYS  = ['oct','nov','dec','jan','feb','mar','apr','may','jun','jul','aug','sep'];

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Init data layer from waste.js
    if (typeof initWasteData === 'function') initWasteData();
    if (typeof fetchWasteCustomers === 'function') await fetchWasteCustomers();
    if (typeof fetchMonthlyStatus === 'function') await fetchMonthlyStatus();

    // Build fiscal year dropdown
    buildFiscalYearOptions();

    // Auto-search from LINE session
    const session = typeof LineAuth !== 'undefined' ? LineAuth.getSession() : null;
    if (session && (session.houseNo || session.fullName)) {
        const q = session.houseNo || session.fullName;
        document.getElementById('searchInput').value = q;
        searchCustomer();
    }
});

function buildFiscalYearOptions() {
    const sel = document.getElementById('fiscalYearSelect');
    if (!sel) return;
    const now = new Date();
    const currentFY = now.getMonth() >= 9 ? now.getFullYear() + 544 : now.getFullYear() + 543;
    sel.innerHTML = '';
    for (let y = currentFY; y >= currentFY - 2; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        if (y === currentFY) opt.selected = true;
        sel.appendChild(opt);
    }
}

function onFiscalYearChange() {
    selectedMonthKeys = [];
    loadMonthlyStatus();
}

// ============================================
// STEP NAVIGATION
// ============================================
function updateStepUI() {
    const steps = ['search','details','payment'];
    const idx = steps.indexOf(currentStep);
    for (let i = 1; i <= 3; i++) {
        const circle = document.getElementById('step' + i);
        const lbl = document.getElementById('lbl' + i);
        circle.classList.remove('active','done');
        lbl.classList.remove('active');
        if (i - 1 < idx) { circle.classList.add('done'); circle.innerHTML = '<i class="fa-solid fa-check" style="font-size:0.7rem"></i>'; }
        else if (i - 1 === idx) { circle.classList.add('active'); circle.textContent = i; lbl.classList.add('active'); }
        else { circle.textContent = i; }
    }
    for (let i = 1; i <= 2; i++) {
        const line = document.getElementById('line' + i);
        line.classList.toggle('done', i <= idx);
    }
}

function showSection(name) {
    ['sectionSearch','sectionDetails','sectionPayment'].forEach(id => {
        const el = document.getElementById(id);
        el.style.display = 'none';
    });
    const target = document.getElementById('section' + name.charAt(0).toUpperCase() + name.slice(1));
    if (target) { target.style.display = 'block'; target.classList.add('fade-in'); }
}

function goBack() {
    if (currentStep === 'payment') {
        currentStep = 'details';
        showSection('details');
        updateStepUI();
        updateActionButton();
    } else if (currentStep === 'details') {
        currentStep = 'search';
        selectedCustomer = null;
        selectedMonthKeys = [];
        showSection('search');
        document.getElementById('stickyAction').style.display = 'none';
        updateStepUI();
    } else {
        window.location.href = 'citizen-portal.html';
    }
}

// ============================================
// STEP 1: SEARCH
// ============================================
async function searchCustomer() {
    const q = document.getElementById('searchInput').value.trim();
    const resultsDiv = document.getElementById('searchResults');

    if (!q) {
        cwToast('กรุณากรอกข้อมูลเพื่อค้นหา', 'warning');
        return;
    }

    // Show skeleton
    resultsDiv.innerHTML = Array(3).fill('<div class="skeleton mb-2" style="height:62px;"></div>').join('');

    // Small delay for UX
    await new Promise(r => setTimeout(r, 300));

    const allCustomers = typeof getWasteCustomers === 'function' ? getWasteCustomers() : [];
    const matches = allCustomers.filter(c =>
        c.status === 'active' && (
            (c.name && c.name.includes(q)) ||
            (c.house_no && c.house_no.includes(q)) ||
            (c.id_card && c.id_card.includes(q))
        )
    );

    if (matches.length === 0) {
        resultsDiv.innerHTML = `
            <div class="text-center py-4">
                <i class="fa-solid fa-face-sad-tear fa-2x text-muted mb-2" style="opacity:0.3;"></i>
                <p class="small text-muted mb-0">ไม่พบข้อมูลที่ตรงกับ "<strong>${q}</strong>"</p>
            </div>`;
        return;
    }

    resultsDiv.innerHTML = matches.slice(0, 10).map((c, i) => {
        // Compute outstanding months for this customer
        const ms = typeof getMonthlyStatus === 'function' ? getMonthlyStatus() : {};
        const now = new Date();
        const fy = String(now.getMonth() >= 9 ? now.getFullYear() + 544 : now.getFullYear() + 543);
        const cstatus = (ms[c.id] || {})[fy] || {};
        let unpaidCount = 0;
        CW_MONTH_KEYS.forEach(k => { if (cstatus[k] !== 'paid') unpaidCount++; });

        return `
        <div class="sr-card mb-2" onclick="selectCustomer('${c.id}')" style="animation:fadeInUp 0.3s ${i * 0.06}s both;">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="fw-bold">${c.name}</div>
                    <div class="text-muted small">บ้านเลขที่ ${c.house_no} ม.${c.moo} · ${c.type}</div>
                </div>
                <div class="text-end">
                    <div class="fw-bold text-success">฿${cwFmt(c.fee)}</div>
                    ${unpaidCount > 0 ? `<span class="badge bg-danger rounded-pill" style="font-size:0.6rem;">ค้าง ${unpaidCount}</span>` : '<span class="badge bg-success rounded-pill" style="font-size:0.6rem;">ชำระครบ</span>'}
                </div>
            </div>
        </div>`;
    }).join('');
}

// ============================================
// STEP 2: DETAILS
// ============================================
async function selectCustomer(id) {
    selectedCustomer = (typeof getWasteCustomers === 'function' ? getWasteCustomers() : []).find(c => c.id === id);
    if (!selectedCustomer) return;

    selectedMonthKeys = [];
    currentStep = 'details';
    showSection('details');
    updateStepUI();

    document.getElementById('dispName').textContent = selectedCustomer.name;
    document.getElementById('dispAddress').textContent = `บ้านเลขที่ ${selectedCustomer.house_no} ม.${selectedCustomer.moo}`;
    document.getElementById('dispType').textContent = selectedCustomer.type;
    document.getElementById('dispFeePerMonth').textContent = `฿${cwFmt(selectedCustomer.fee)}`;

    document.getElementById('stickyAction').style.display = 'block';
    updateActionButton();
    await loadMonthlyStatus();
}

async function loadMonthlyStatus() {
    const year = document.getElementById('fiscalYearSelect').value;
    const listDiv = document.getElementById('monthlyStatusList');
    const debtBadge = document.getElementById('dispDebtBadge');

    // Skeleton
    listDiv.innerHTML = Array(4).fill('<div class="skeleton mb-2" style="height:58px;"></div>').join('');

    await new Promise(r => setTimeout(r, 200));

    const allStatus = typeof getMonthlyStatus === 'function' ? getMonthlyStatus() : {};
    const customerStatus = (allStatus[selectedCustomer.id] || {})[year] || {};

    // Check pending online transactions
    let pendingMonths = [];
    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const { data } = await supabaseClient
                .from('garbage_payment_transactions')
                .select('paid_months')
                .eq('citizen_id', selectedCustomer.id)
                .eq('fiscal_year', year)
                .eq('status', 'pending');
            if (data) data.forEach(r => { pendingMonths = pendingMonths.concat(r.paid_months); });
        }
    } catch (e) { console.warn('Pending check failed', e); }

    let html = '';
    let totalDebt = 0;
    let unpaidCount = 0;
    let firstUnpaidIdx = -1;

    CW_MONTH_KEYS.forEach((key, i) => {
        let status = customerStatus[key] || 'unpaid';
        if (pendingMonths.includes(key)) status = 'pending';

        const isPaid = status === 'paid';
        const isPending = status === 'pending';
        const isUnpaid = status === 'unpaid';

        if (isUnpaid && firstUnpaidIdx === -1) firstUnpaidIdx = i;

        // A month is selectable if: unpaid AND (it IS the first unpaid OR all months before it up to firstUnpaid are selected)
        const isLocked = isUnpaid && firstUnpaidIdx !== -1 && i > firstUnpaidIdx && !allPreviousSelected(i, firstUnpaidIdx, customerStatus, pendingMonths);
        const isSelectable = isUnpaid && !isLocked;
        const isSelected = selectedMonthKeys.includes(key);

        if (isUnpaid) { totalDebt += selectedCustomer.fee; unpaidCount++; }

        let rowClass = '';
        let iconClass = '';
        let label = '';

        if (isPaid) { rowClass = 'paid'; iconClass = 'fa-circle-check'; label = 'ชำระแล้ว'; }
        else if (isPending) { rowClass = 'pending'; iconClass = 'fa-clock'; label = 'รอตรวจสอบ'; }
        else if (isSelected) { rowClass = 'selected selectable'; iconClass = 'fa-check'; label = 'เลือกแล้ว'; }
        else if (isLocked) { rowClass = 'locked'; iconClass = 'fa-lock'; label = 'รอชำระเดือนก่อนหน้า'; }
        else { rowClass = 'unpaid selectable'; iconClass = 'fa-circle-xmark'; label = 'ค้างชำระ'; }

        const clickHandler = isSelectable || isSelected ? `onclick="toggleMonth('${key}')"` : '';

        html += `
        <div class="mt-row ${rowClass}" ${clickHandler} style="animation:fadeInUp 0.25s ${i * 0.04}s both;">
            <div class="mt-icon"><i class="fa-solid ${iconClass}"></i></div>
            <div class="flex-grow-1">
                <div class="fw-semibold">${CW_MONTH_NAMES[i]}</div>
                <div class="small ${isUnpaid && !isLocked ? 'text-danger' : 'text-muted'}">${label}</div>
            </div>
            <div class="text-end">
                <div class="fw-bold ${isUnpaid ? '' : 'text-muted'}" style="font-size:0.95rem;">฿${cwFmt(selectedCustomer.fee)}</div>
                ${isSelectable && !isSelected ? '<div class="text-success small fw-bold">แตะเพื่อเลือก</div>' : ''}
            </div>
        </div>`;
    });

    listDiv.innerHTML = html;

    if (unpaidCount > 0) {
        debtBadge.style.display = '';
        debtBadge.textContent = `ค้าง ${unpaidCount} เดือน`;
    } else {
        debtBadge.style.display = 'none';
    }

    updateActionButton();
}

function allPreviousSelected(targetIdx, firstUnpaidIdx, customerStatus, pendingMonths) {
    for (let j = firstUnpaidIdx; j < targetIdx; j++) {
        const k = CW_MONTH_KEYS[j];
        const s = customerStatus[k] || 'unpaid';
        if (pendingMonths.includes(k)) continue; // pending counts as handled
        if (s === 'paid') continue;
        if (!selectedMonthKeys.includes(k)) return false;
    }
    return true;
}

function toggleMonth(key) {
    const idx = selectedMonthKeys.indexOf(key);
    if (idx === -1) {
        selectedMonthKeys.push(key);
    } else {
        // Deselect this and all months AFTER it to keep sequence valid
        const monthIdx = CW_MONTH_KEYS.indexOf(key);
        selectedMonthKeys = selectedMonthKeys.filter(k => CW_MONTH_KEYS.indexOf(k) < monthIdx);
    }
    selectedMonthKeys.sort((a, b) => CW_MONTH_KEYS.indexOf(a) - CW_MONTH_KEYS.indexOf(b));
    loadMonthlyStatus(); // re-render
}

// ============================================
// ACTION BUTTON
// ============================================
function updateActionButton() {
    const btn = document.getElementById('btnAction');
    if (!btn) return;

    if (currentStep === 'details') {
        if (selectedMonthKeys.length > 0) {
            btn.disabled = false;
            const total = selectedMonthKeys.length * selectedCustomer.fee;
            btn.innerHTML = `ชำระเงิน ฿${cwFmt(total)} (${selectedMonthKeys.length} เดือน) <i class="fa-solid fa-arrow-right ms-1"></i>`;
        } else {
            btn.disabled = true;
            btn.innerHTML = 'กรุณาเลือกเดือนที่ต้องการชำระ';
        }
    } else if (currentStep === 'payment') {
        if (slipBase64) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i>ยืนยันส่งข้อมูลการชำระ';
        } else {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-image me-2"></i>กรุณาแนบหลักฐานการโอนเงิน';
        }
    }
}

function handleAction() {
    if (currentStep === 'details') {
        goToPayment();
    } else if (currentStep === 'payment') {
        submitTransaction();
    }
}

// ============================================
// STEP 3: PAYMENT
// ============================================
function goToPayment() {
    currentStep = 'payment';
    showSection('payment');
    updateStepUI();

    // Render summary
    const itemsDiv = document.getElementById('payItemsList');
    itemsDiv.innerHTML = selectedMonthKeys.map(k => {
        const name = CW_MONTH_NAMES[CW_MONTH_KEYS.indexOf(k)];
        return `<div class="summary-item"><span>${name}</span><span>฿${cwFmt(selectedCustomer.fee)}</span></div>`;
    }).join('');

    document.getElementById('payCountBadge').textContent = `${selectedMonthKeys.length} เดือน`;
    const total = selectedMonthKeys.length * selectedCustomer.fee;
    document.getElementById('payTotalAmount').textContent = `฿${cwFmt(total)}`;

    // QR
    const qr = document.getElementById('qrImage');
    qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=PromptPay_Amount_${total}`;

    slipBase64 = null;
    document.getElementById('slipPreview').style.display = 'none';
    document.getElementById('uploadZone').style.display = '';

    updateActionButton();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function togglePayMethod() {
    const val = document.querySelector('input[name="payMethod"]:checked').value;
    document.getElementById('qrArea').style.display = val === 'QR PromptPay' ? '' : 'none';
    document.getElementById('bankArea').style.display = val === 'Bank Transfer' ? '' : 'none';
}

function copyAccount() {
    navigator.clipboard.writeText('1234567890').then(() => cwToast('คัดลอกเลขบัญชีแล้ว', 'success'));
}

// ============================================
// SLIP UPLOAD
// ============================================
function previewSlip(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    // Validate type
    if (!['image/jpeg','image/png'].includes(file.type)) {
        cwToast('รองรับเฉพาะไฟล์ JPG หรือ PNG เท่านั้น', 'danger');
        input.value = '';
        return;
    }
    // Validate size
    if (file.size > 5 * 1024 * 1024) {
        cwToast('ขนาดไฟล์ต้องไม่เกิน 5 MB', 'danger');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = e => {
        slipBase64 = e.target.result;
        document.getElementById('slipPreview').src = slipBase64;
        document.getElementById('slipPreview').style.display = 'block';
        document.getElementById('uploadZone').style.display = 'none';
        updateActionButton();
        cwToast('อัปโหลดสลิปสำเร็จ', 'success');
    };
    reader.readAsDataURL(file);
}

// ============================================
// SUBMIT
// ============================================
async function submitTransaction() {
    if (!selectedCustomer || selectedMonthKeys.length === 0) {
        cwToast('กรุณาเลือกเดือนที่ต้องการชำระ', 'warning');
        return;
    }
    if (!slipBase64) {
        cwToast('กรุณาแนบหลักฐานการโอนเงิน', 'warning');
        return;
    }

    const btn = document.getElementById('btnAction');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังส่งข้อมูล...';

    const year = document.getElementById('fiscalYearSelect').value;
    const method = document.querySelector('input[name="payMethod"]:checked').value;
    const amount = selectedMonthKeys.length * selectedCustomer.fee;

    // --- Upload Slip to Google Drive ---
    let finalSlipImage = slipBase64;
    // TODO: นำ URL ที่ได้จากการ Deploy Google Apps Script มาใส่ในตัวแปรนี้
    // ดูวิธีการในไฟล์ database/upload_waste_slip.js
    const GAS_SLIP_URL = 'https://script.google.com/macros/s/AKfycbx_BewWHVyR4Ambc6BK1FVFsoWe6Vb5h-pOo9Ek6fsSY9ZGNeMdOWofS2CdB-s7zGfqeg/exec'; 

    if (GAS_SLIP_URL && GAS_SLIP_URL !== '') {
        try {
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังอัปโหลดสลิป...';
            const response = await fetch(GAS_SLIP_URL, {
                method: 'POST',
                body: JSON.stringify({
                    base64: slipBase64,
                    filename: `slip_${selectedCustomer.id}_${Date.now()}.jpg`
                })
            });
            const result = await response.json();
            if (result.success) {
                finalSlipImage = result.imageUrl;
            } else {
                console.warn('Google Drive Upload Failed:', result.error);
            }
        } catch (e) {
            console.error('Upload Error:', e);
        }
    }

    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังบันทึกข้อมูล...';

    const session = typeof LineAuth !== 'undefined' ? LineAuth.getSession() : null;

    const payload = {
        fiscal_year: year,
        citizen_id: selectedCustomer.id,
        house_no: selectedCustomer.house_no,
        payer_name: selectedCustomer.name,
        paid_months: selectedMonthKeys,
        amount: amount,
        payment_method: method,
        slip_image: finalSlipImage,
        payment_datetime: new Date().toISOString(),
        status: 'pending'
    };

    try {
        let insertedId = 'TX' + Date.now();
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const fullPayload = { ...payload, line_user_id: session ? session.userId : null };
            let { data, error } = await supabaseClient.from('garbage_payment_transactions').insert([fullPayload]).select();
            
            if (error && error.message.includes('line_user_id')) {
                // Fallback: column doesn't exist in Supabase yet, insert without it
                const { data: d2, error: fallbackError } = await supabaseClient.from('garbage_payment_transactions').insert([payload]).select();
                if (fallbackError) throw fallbackError;
                if (d2 && d2.length > 0) insertedId = d2[0].id;
            } else if (error) {
                throw error;
            } else if (data && data.length > 0) {
                insertedId = data[0].id;
            }
        } else {
            const arr = JSON.parse(localStorage.getItem('garbage_payment_transactions') || '[]');
            insertedId = 'TX' + Date.now();
            arr.push({ ...payload, line_user_id: session ? session.userId : null, id: insertedId });
            localStorage.setItem('garbage_payment_transactions', JSON.stringify(arr));
        }

        const myTx = JSON.parse(localStorage.getItem('my_waste_tx_ids') || '[]');
        if (!myTx.includes(insertedId)) {
            myTx.push(insertedId);
            localStorage.setItem('my_waste_tx_ids', JSON.stringify(myTx));
        }

        new bootstrap.Modal(document.getElementById('successModal')).show();
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'citizen-portal.html';
        }, 3000);

    } catch (err) {
        console.error('Submit failed', err);
        cwToast('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถส่งข้อมูลได้'), 'danger');
        btn.disabled = false;
        updateActionButton();
    }
}

// ============================================
// TOAST
// ============================================
function cwToast(msg, type) {
    type = type || 'info';
    const colors = { success:'#059669', danger:'#dc2626', warning:'#d97706', info:'#0284c7' };
    const icons  = { success:'fa-circle-check', danger:'fa-circle-xmark', warning:'fa-triangle-exclamation', info:'fa-circle-info' };
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:1060;
        background:#fff;border-left:4px solid ${colors[type]};border-radius:12px;padding:12px 18px;
        box-shadow:0 6px 24px rgba(0,0,0,.12);display:flex;align-items:center;gap:10px;
        font-size:0.88rem;width:92%;max-width:380px;animation:slideUp 0.3s ease;`;
    el.innerHTML = `<i class="fa-solid ${icons[type]}" style="color:${colors[type]};font-size:1.1rem;flex-shrink:0;"></i><span>${msg}</span>`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.animation = 'slideDown 0.3s ease forwards'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ============================================
// FORMAT HELPER
// ============================================
function cwFmt(n) {
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n);
}
