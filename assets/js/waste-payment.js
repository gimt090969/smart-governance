/**
 * waste-payment.js — Payment Processing Module
 * Receipt Generation, Walk-in Payment, Print
 */

// ============================================
// RECEIPT PRINTING
// ============================================
function printReceiptA4(payment) {
    const logo = 'https://drive.google.com/thumbnail?id=1cPWRFVoN48eV6lJVS9E7nd2Mi7y5IQj8&sz=w200';
    const w = window.open('', '_blank', 'width=800,height=600');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
    body{font-family:'Prompt',sans-serif;padding:40px;color:#333}
    .header{text-align:center;margin-bottom:20px;border-bottom:2px solid #1a56db;padding-bottom:15px}
    .header img{height:60px;margin-bottom:8px}
    h2{margin:5px 0;color:#1a56db} .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0}
    .info-item{padding:8px 12px;background:#f8fafc;border-radius:8px}
    .info-label{font-size:12px;color:#6b7280;font-weight:500} .info-value{font-size:14px;font-weight:600}
    .total{text-align:right;font-size:24px;font-weight:700;color:#057a55;margin:20px 0;padding:15px;background:#f0fdf4;border-radius:10px}
    .footer{text-align:center;margin-top:30px;font-size:12px;color:#9ca3af;border-top:1px dashed #d1d5db;padding-top:15px}
    .qr{text-align:center;margin:15px 0} @media print{body{padding:20px}}</style></head><body>
    <div class="header"><img src="${logo}" alt="Logo"><h2>ใบเสร็จรับเงินค่าธรรมเนียมขยะมูลฝอย</h2>
    <p style="margin:0;font-size:13px;color:#6b7280">เทศบาลตำบล Smart Connect</p></div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">เลขที่ใบเสร็จ</div><div class="info-value">${payment.receipt_no}</div></div>
    <div class="info-item"><div class="info-label">วันที่</div><div class="info-value">${payment.date}</div></div>
    <div class="info-item"><div class="info-label">ชื่อผู้ชำระ</div><div class="info-value">${payment.customer_name}</div></div>
    <div class="info-item"><div class="info-label">บ้านเลขที่</div><div class="info-value">${payment.house_no}</div></div>
    <div class="info-item"><div class="info-label">เดือนที่ชำระ</div><div class="info-value">${Array.isArray(payment.months_paid)?payment.months_paid.join(', '):payment.months_paid}</div></div>
    <div class="info-item"><div class="info-label">ช่องทางชำระ</div><div class="info-value">${payment.method}</div></div>
    </div>
    <div class="total">ยอดชำระ: ฿${formatMoneyDecimal(payment.amount)}</div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">เจ้าหน้าที่</div><div class="info-value">${payment.staff||'-'}</div></div>
    <div class="info-item"><div class="info-label">เวลา</div><div class="info-value">${payment.time||''}</div></div>
    </div>
    <div class="footer"><p>เอกสารนี้ออกโดยระบบ Smart Connect</p></div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
}

function printReceiptSlip(payment) {
    const w = window.open('', '_blank', 'width=350,height=500');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600&display=swap');
    body{font-family:'Prompt',sans-serif;padding:15px;font-size:12px;width:280px;margin:0 auto}
    .center{text-align:center} h3{margin:5px 0;font-size:14px} hr{border:none;border-top:1px dashed #ccc;margin:8px 0}
    .row{display:flex;justify-content:space-between;margin:3px 0} .total{font-size:18px;font-weight:700;color:#057a55;text-align:center;margin:10px 0}
    </style></head><body>
    <div class="center"><h3>ใบเสร็จค่าขยะมูลฝอย</h3><p style="margin:2px 0;font-size:11px">เทศบาลตำบล Smart Connect</p></div><hr>
    <div class="row"><span>เลขที่:</span><span>${payment.receipt_no}</span></div>
    <div class="row"><span>วันที่:</span><span>${payment.date}</span></div><hr>
    <div class="row"><span>ชื่อ:</span><span>${payment.customer_name}</span></div>
    <div class="row"><span>บ้านเลขที่:</span><span>${payment.house_no}</span></div>
    <div class="row"><span>เดือน:</span><span>${Array.isArray(payment.months_paid)?payment.months_paid.join(','):payment.months_paid}</span></div>
    <div class="row"><span>ช่องทาง:</span><span>${payment.method}</span></div><hr>
    <div class="total">฿${formatMoneyDecimal(payment.amount)}</div><hr>
    <div class="row"><span>เจ้าหน้าที่:</span><span>${payment.staff||'-'}</span></div>
    <div class="center" style="margin-top:10px;font-size:10px;color:#999">Smart Connect System</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
}

// ============================================
// WALK-IN PAYMENT PROCESSING (Async + Supabase)
// ============================================
async function processWalkInPayment(customerId, selectedLabels, selectedKeys, selectedYear, method, staffName) {
    const customers = getWasteCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return null;

    const amount = selectedLabels.length * customer.fee;
    const now = new Date();
    const receiptNo = generateReceiptNumber();
    
    const payment = {
        id: 'PAY' + Date.now().toString().slice(-6),
        receipt_no: receiptNo,
        customer_id: customerId,
        customer_name: customer.name,
        house_no: customer.house_no + ' ม.' + customer.moo,
        amount: amount,
        months_paid: selectedLabels, // e.g. ["ต.ค. 68"]
        fiscal_year: selectedYear,
        method: method,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'}),
        status: 'completed',
        staff: staffName,
        source: 'walk-in'
    };

    // Save payment to Supabase + localStorage
    await saveWastePaymentDB(payment);

    // Update monthly status in Supabase + localStorage
    for (const key of selectedKeys) {
        await saveMonthlyStatusDB(customerId, selectedYear, key, 'paid', payment.id);
    }

    // Auto-save receipt to Google Drive
    if (typeof autoSaveReceiptToDrive === 'function') {
        autoSaveReceiptToDrive(payment).catch(function(e) {
            console.warn('Auto save receipt failed:', e);
        });
    }

    return payment;
}

// ============================================
// CITIZEN PORTAL PAYMENT VERIFICATION (Async + Supabase)
// ============================================
async function approveCitizenPayment(paymentId) {
    const payments = getWastePayments();
    const p = payments.find(x => x.id === paymentId);
    if (!p) return null;
    p.status = 'completed';
    p.receipt_no = p.receipt_no || generateReceiptNumber();

    // Save updated payment to Supabase
    await saveWastePaymentDB(p);

    // Update monthly status
    const months = Array.isArray(p.months_paid) ? p.months_paid : [p.months_paid];
    const fiscalYear = p.fiscal_year || getCurrentFiscalYear();
    for (const ml of months) {
        const idx = WASTE_MONTHS.indexOf(ml);
        if (idx >= 0) {
            await saveMonthlyStatusDB(p.customer_id, fiscalYear, WASTE_MONTH_KEYS[idx], 'paid', p.id);
        }
    }
    return p;
}

async function rejectCitizenPayment(paymentId, reason) {
    const payments = getWastePayments();
    const p = payments.find(x => x.id === paymentId);
    if (!p) return null;
    p.status = 'rejected';
    p.reject_reason = reason || 'ไม่ผ่านการตรวจสอบ';

    // Save updated payment to Supabase
    await saveWastePaymentDB(p);
    return p;
}

// ============================================
// ONLINE TRANSACTION APPROVAL (Async + Supabase)
// ============================================
async function processOnlineApproval(transaction) {
    const now = new Date();
    const receiptNo = generateReceiptNumber();
    
    // 1. Create main payment record
    const payment = {
        id: 'PAY' + Date.now().toString().slice(-6),
        receipt_no: receiptNo,
        customer_id: transaction.citizen_id,
        customer_name: transaction.payer_name,
        house_no: transaction.house_no,
        amount: transaction.amount,
        // Convert keys to labels for display
        months_paid: transaction.paid_months.map(k => {
            const idx = WASTE_MONTH_KEYS.indexOf(k);
            return idx >= 0 ? WASTE_MONTHS[idx] : k;
        }),
        fiscal_year: transaction.fiscal_year,
        method: transaction.payment_method,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'}),
        status: 'completed',
        staff: 'System Approval', // or pass current logged in admin
        source: 'citizen-portal'
    };

    // Save main payment
    await saveWastePaymentDB(payment);

    // 2. Update monthly status
    for (const key of transaction.paid_months) {
        await saveMonthlyStatusDB(transaction.citizen_id, transaction.fiscal_year, key, 'paid', payment.id);
    }

    // 3. Update transaction status
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        await supabaseClient
            .from('garbage_payment_transactions')
            .update({ status: 'approved' })
            .eq('id', transaction.id);
    } else {
        const local = JSON.parse(localStorage.getItem('garbage_payment_transactions') || '[]');
        const idx = local.findIndex(x => x.id === transaction.id);
        if (idx >= 0) {
            local[idx].status = 'approved';
            localStorage.setItem('garbage_payment_transactions', JSON.stringify(local));
        }
    }

    return true;
}

async function processOnlineRejection(transactionId, reason) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        await supabaseClient
            .from('garbage_payment_transactions')
            .update({ 
                status: 'rejected',
                reject_reason: reason 
            })
            .eq('id', transactionId);
    } else {
        const local = JSON.parse(localStorage.getItem('garbage_payment_transactions') || '[]');
        const idx = local.findIndex(x => x.id === transactionId);
        if (idx >= 0) {
            local[idx].status = 'rejected';
            local[idx].reject_reason = reason;
            localStorage.setItem('garbage_payment_transactions', JSON.stringify(local));
        }
    }
    return true;
}
