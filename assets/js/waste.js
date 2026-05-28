/**
 * waste.js — Waste Fee Collection System
 * Mock Data + Core Logic + localStorage Helpers
 * GOOD GOV Municipality Platform
 */

// ============================================
// MOCK DATA — ข้อมูลตัวอย่าง 30 ครัวเรือน
// ============================================
const WASTE_DEFAULT_FEE_TYPES = [
    { id: 'FT01', type: 'บ้านพัก', fee: 40 },
    { id: 'FT02', type: 'ร้านค้า', fee: 120 },
    { id: 'FT03', type: 'อาคาร', fee: 300 },
    { id: 'FT04', type: 'โรงงาน', fee: 2500 }
];

const WASTE_DEFAULT_CUSTOMERS = [
    { id:'WC001', house_no:'12/1', moo:'1', name:'นายสมควร ขยัน', id_card:'1100700123456', phone:'081-234-5601', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8820, lng:102.0150, note:'' },
    { id:'WC002', house_no:'12/2', moo:'1', name:'นางสมหญิง รักสะอาด', id_card:'1100700123457', phone:'081-234-5602', type:'ร้านค้า', fee:120, start_date:'2023-10-01', status:'active', lat:14.8825, lng:102.0155, note:'' },
    { id:'WC003', house_no:'15/5', moo:'2', name:'บจก. เจริญพาณิชย์', id_card:'0105549000001', phone:'044-256-789', type:'โรงงาน', fee:2500, start_date:'2023-10-01', status:'active', lat:14.8830, lng:102.0160, note:'โรงงานผลิตน้ำดื่ม' },
    { id:'WC004', house_no:'33/1', moo:'3', name:'นางประนอม ใจบุญ', id_card:'1100700123458', phone:'081-234-5604', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8835, lng:102.0165, note:'' },
    { id:'WC005', house_no:'45/2', moo:'1', name:'นายชัยวัฒน์ มั่นคง', id_card:'1100700123459', phone:'081-234-5605', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8840, lng:102.0170, note:'' },
    { id:'WC006', house_no:'50/1', moo:'2', name:'นางวิไลวรรณ งามตา', id_card:'1100700123460', phone:'081-234-5606', type:'บ้านพัก', fee:40, start_date:'2024-01-01', status:'active', lat:14.8845, lng:102.0175, note:'' },
    { id:'WC007', house_no:'55/3', moo:'1', name:'นายชูชาติ มั่งมี', id_card:'1100700123461', phone:'081-234-5607', type:'ร้านค้า', fee:150, start_date:'2023-10-01', status:'active', lat:14.8850, lng:102.0180, note:'ร้านชำ' },
    { id:'WC008', house_no:'60/1', moo:'3', name:'นายสมพงษ์ ยินดี', id_card:'1100700123462', phone:'081-234-5608', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8855, lng:102.0185, note:'' },
    { id:'WC009', house_no:'62/4', moo:'2', name:'นางสุภาพร ดีใจ', id_card:'1100700123463', phone:'081-234-5609', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8860, lng:102.0190, note:'' },
    { id:'WC010', house_no:'70/2', moo:'1', name:'นายวิชัย เก่งกล้า', id_card:'1100700123464', phone:'081-234-5610', type:'อาคาร', fee:300, start_date:'2023-10-01', status:'active', lat:14.8865, lng:102.0195, note:'อาคารพาณิชย์' },
    { id:'WC011', house_no:'71/1', moo:'1', name:'นางมาลี สวยงาม', id_card:'1100700123465', phone:'081-234-5611', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8870, lng:102.0200, note:'' },
    { id:'WC012', house_no:'80/5', moo:'2', name:'นายประสิทธิ์ ทำดี', id_card:'1100700123466', phone:'081-234-5612', type:'บ้านพัก', fee:40, start_date:'2024-04-01', status:'active', lat:14.8875, lng:102.0205, note:'' },
    { id:'WC013', house_no:'85/1', moo:'3', name:'นางนภา ท้องฟ้า', id_card:'1100700123467', phone:'081-234-5613', type:'ร้านค้า', fee:100, start_date:'2023-10-01', status:'active', lat:14.8880, lng:102.0210, note:'ร้านเสริมสวย' },
    { id:'WC014', house_no:'90/2', moo:'1', name:'นายสุรชัย อดทน', id_card:'1100700123468', phone:'081-234-5614', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8885, lng:102.0215, note:'' },
    { id:'WC015', house_no:'95/3', moo:'2', name:'นางจันทร์ สว่าง', id_card:'1100700123469', phone:'081-234-5615', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8890, lng:102.0220, note:'' },
    { id:'WC016', house_no:'100/1', moo:'3', name:'นายทองดี มีทรัพย์', id_card:'1100700123470', phone:'081-234-5616', type:'ร้านค้า', fee:200, start_date:'2023-10-01', status:'active', lat:14.8895, lng:102.0225, note:'ร้านอาหาร' },
    { id:'WC017', house_no:'105/2', moo:'1', name:'นางรัตนา สดใส', id_card:'1100700123471', phone:'081-234-5617', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8900, lng:102.0230, note:'' },
    { id:'WC018', house_no:'110/4', moo:'2', name:'นายวิทยา ปราชญ์', id_card:'1100700123472', phone:'081-234-5618', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8905, lng:102.0235, note:'' },
    { id:'WC019', house_no:'115/1', moo:'3', name:'นางพิมพ์ บุษบา', id_card:'1100700123473', phone:'081-234-5619', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8910, lng:102.0240, note:'' },
    { id:'WC020', house_no:'120/3', moo:'1', name:'นายบุญมี โชคดี', id_card:'1100700123474', phone:'081-234-5620', type:'อาคาร', fee:500, start_date:'2023-10-01', status:'active', lat:14.8915, lng:102.0245, note:'หอพัก' },
    { id:'WC021', house_no:'125/2', moo:'2', name:'นางสายใจ อ่อนหวาน', id_card:'1100700123475', phone:'081-234-5621', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8920, lng:102.0250, note:'' },
    { id:'WC022', house_no:'130/1', moo:'3', name:'นายสมศักดิ์ รุ่งเรือง', id_card:'1100700123476', phone:'081-234-5622', type:'ร้านค้า', fee:80, start_date:'2023-10-01', status:'active', lat:14.8925, lng:102.0255, note:'ร้านซ่อมรถ' },
    { id:'WC023', house_no:'135/4', moo:'1', name:'นางอรุณ แจ่มใส', id_card:'1100700123477', phone:'081-234-5623', type:'บ้านพัก', fee:40, start_date:'2024-07-01', status:'active', lat:14.8930, lng:102.0260, note:'' },
    { id:'WC024', house_no:'140/2', moo:'2', name:'นายอนันต์ ยืนยง', id_card:'1100700123478', phone:'081-234-5624', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8935, lng:102.0265, note:'' },
    { id:'WC025', house_no:'145/1', moo:'3', name:'นางลำดวน หอมกลิ่น', id_card:'1100700123479', phone:'081-234-5625', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8940, lng:102.0270, note:'' },
    { id:'WC026', house_no:'150/3', moo:'1', name:'นายกิตติ ชาญชัย', id_card:'1100700123480', phone:'081-234-5626', type:'โรงงาน', fee:1500, start_date:'2023-10-01', status:'active', lat:14.8945, lng:102.0275, note:'โรงสีข้าว' },
    { id:'WC027', house_no:'155/2', moo:'2', name:'นางเพ็ญ นวล', id_card:'1100700123481', phone:'081-234-5627', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8950, lng:102.0280, note:'' },
    { id:'WC028', house_no:'160/1', moo:'3', name:'นายสำเริง ขำขัน', id_card:'1100700123482', phone:'081-234-5628', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'cancelled', lat:14.8955, lng:102.0285, note:'ย้ายออก 2025' },
    { id:'WC029', house_no:'165/4', moo:'1', name:'นางกัลยา ภักดี', id_card:'1100700123483', phone:'081-234-5629', type:'ร้านค้า', fee:100, start_date:'2023-10-01', status:'active', lat:14.8960, lng:102.0290, note:'ร้านขายยา' },
    { id:'WC030', house_no:'170/2', moo:'2', name:'นายเสรี ปลอดภัย', id_card:'1100700123484', phone:'081-234-5630', type:'บ้านพัก', fee:40, start_date:'2023-10-01', status:'active', lat:14.8965, lng:102.0295, note:'' },
];

const WASTE_MONTHS = ['ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.'];
const WASTE_MONTH_KEYS = ['oct','nov','dec','jan','feb','mar','apr','may','jun','jul','aug','sep'];

// Generate monthly status for each customer with Fiscal Year support
function generateDefaultMonthlyStatus() {
    const statuses = {};
    const years = ['2567', '2568'];
    WASTE_DEFAULT_CUSTOMERS.forEach(c => {
        if (c.status === 'cancelled') return;
        statuses[c.id] = {};
        
        years.forEach(year => {
            const s = {};
            WASTE_MONTH_KEYS.forEach((mk, i) => {
                if (year === '2567') {
                    s[mk] = 'paid'; // All paid in previous year
                } else {
                    // For 2568 (current year)
                    if (i < 6) s[mk] = 'paid';
                    else if (i === 6) s[mk] = Math.random() > 0.3 ? 'paid' : 'unpaid';
                    else s[mk] = 'unpaid';
                }
            });
            statuses[c.id][year] = s;
        });
        
        // Some customers fully paid for 2568
        if (['WC001','WC004','WC005','WC008','WC011','WC014','WC017'].includes(c.id)) {
            WASTE_MONTH_KEYS.forEach(mk => statuses[c.id]['2568'][mk] = 'paid');
        }
        // Some have pending
        if (['WC003','WC010'].includes(c.id)) { statuses[c.id]['2568']['apr'] = 'pending'; }
    });
    return statuses;
}

// Default payments mock
function generateDefaultPayments() {
    const payments = [];
    const now = new Date();
    const names = WASTE_DEFAULT_CUSTOMERS.filter(c=>c.status==='active').slice(0,15);
    names.forEach((c, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        payments.push({
            id: 'PAY' + String(i+1).padStart(4,'0'),
            receipt_no: `REC-${String(i+1).padStart(5,'0')}/${now.getMonth() >= 9 ? now.getFullYear() + 543 + 1 : now.getFullYear() + 543}`,
            customer_id: c.id, customer_name: c.name, house_no: c.house_no + ' ม.' + c.moo,
            amount: c.fee, months_paid: ['เม.ย.'], method: i%3===0?'เงินสด':i%3===1?'โอน':'QR PromptPay',
            date: d.toISOString().split('T')[0], time: `${9+i%8}:${String(i*7%60).padStart(2,'0')}`,
            status: 'completed', staff: 'นายอำนวย การเงิน', source: i<3?'citizen-portal':'walk-in'
        });
    });
    return payments;
}

const WASTE_DEFAULT_STAFF = [
    { id:'WS001', name:'นายอำนวย การเงิน', position:'หัวหน้างานจัดเก็บรายได้', username:'amnuay', role:'Admin', phone:'081-999-0001', status:'active' },
    { id:'WS002', name:'นางสาวพรทิพย์ รักษ์เงิน', position:'นักวิชาการเงินและบัญชี', username:'porntip', role:'Finance Officer', phone:'081-999-0002', status:'active' },
    { id:'WS003', name:'นายสุริยา เที่ยงธรรม', position:'เจ้าพนักงานจัดเก็บรายได้', username:'suriya', role:'Collector', phone:'081-999-0003', status:'active' },
    { id:'WS004', name:'นางสาวนันทนา ยิ้มแย้ม', position:'เจ้าพนักงานจัดเก็บรายได้', username:'nantana', role:'Collector', phone:'081-999-0004', status:'active' },
    { id:'WS005', name:'นายประเสริฐ มุ่งมั่น', position:'พนักงานจ้าง', username:'prasert', role:'Collector', phone:'081-999-0005', status:'inactive' },
];

const WASTE_DEFAULT_REGISTER_REQUESTS = [
    { id:'REG001', name:'นายใหม่ มาแรง', house_no:'180/1', moo:'1', phone:'089-111-2222', type:'บ้านพัก', date:'2026-04-20', status:'pending', note:'' },
    { id:'REG002', name:'นางสาวดาว สวรรค์', house_no:'185/3', moo:'2', phone:'089-333-4444', type:'ร้านค้า', date:'2026-04-18', status:'approved', note:'อนุมัติแล้ว' },
    { id:'REG003', name:'บจก. ทองคำ', house_no:'200/1', moo:'3', phone:'044-999-888', type:'โรงงาน', date:'2026-04-25', status:'pending', note:'' },
    { id:'REG004', name:'นายสดใส จิตดี', house_no:'190/2', moo:'1', phone:'089-555-6666', type:'บ้านพัก', date:'2026-05-01', status:'pending', note:'' },
    { id:'REG005', name:'นางพิศมัย รักเรียน', house_no:'195/4', moo:'2', phone:'089-777-8888', type:'อาคาร', date:'2026-05-03', status:'rejected', note:'ข้อมูลไม่ครบ' },
];

const WASTE_DEFAULT_CANCEL_REQUESTS = [
    { id:'CAN001', customer_id:'WC028', name:'นายสำเริง ขำขัน', house_no:'160/1 ม.3', reason:'ย้ายออก', date:'2025-09-15', status:'approved', note:'' },
    { id:'CAN002', customer_id:'WC015', name:'นางจันทร์ สว่าง', house_no:'95/3 ม.2', reason:'ไม่มีผู้อยู่อาศัย', date:'2026-04-10', status:'pending', note:'' },
    { id:'CAN003', customer_id:'WC018', name:'นายวิทยา ปราชญ์', house_no:'110/4 ม.2', reason:'รื้อถอนอาคาร', date:'2026-04-28', status:'pending', note:'' },
];

// ============================================
// localStorage CRUD Helpers
// ============================================
const STORAGE_KEYS = {
    customers: 'waste_customers',
    feeTypes: 'waste_fee_types',
    payments: 'waste_payments',
    monthlyStatus: 'waste_monthly_status',
    staff: 'waste_staff',
    registerReqs: 'waste_register_requests',
    cancelReqs: 'waste_cancel_requests',
    receiptCounter: 'waste_receipt_counter',
    customYears: 'waste_custom_years'
};

function initWasteData() {
    if (!localStorage.getItem(STORAGE_KEYS.feeTypes)) localStorage.setItem(STORAGE_KEYS.feeTypes, JSON.stringify(WASTE_DEFAULT_FEE_TYPES));
    if (!localStorage.getItem(STORAGE_KEYS.customers)) localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(WASTE_DEFAULT_CUSTOMERS));
    if (!localStorage.getItem(STORAGE_KEYS.payments)) localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(generateDefaultPayments()));
    if (!localStorage.getItem(STORAGE_KEYS.monthlyStatus)) localStorage.setItem(STORAGE_KEYS.monthlyStatus, JSON.stringify(generateDefaultMonthlyStatus()));
    if (!localStorage.getItem(STORAGE_KEYS.staff)) localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify(WASTE_DEFAULT_STAFF));
    if (!localStorage.getItem(STORAGE_KEYS.registerReqs)) localStorage.setItem(STORAGE_KEYS.registerReqs, JSON.stringify(WASTE_DEFAULT_REGISTER_REQUESTS));
    if (!localStorage.getItem(STORAGE_KEYS.cancelReqs)) localStorage.setItem(STORAGE_KEYS.cancelReqs, JSON.stringify(WASTE_DEFAULT_CANCEL_REQUESTS));
    if (!localStorage.getItem(STORAGE_KEYS.receiptCounter)) localStorage.setItem(STORAGE_KEYS.receiptCounter, '20');
}

function getWasteData(key) {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS[key])) || []; }
    catch(e) { return []; }
}

function saveWasteData(key, data) {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
}

// Global state for caching when using Supabase
let stateFeeTypes = [];
let stateCustomers = [];
let statePayments = [];
let stateMonthlyStatus = null;
let stateStaff = [];
let stateRegisterReqs = [];
let stateCancelReqs = [];

// Fallback logic for Fee Types
async function fetchWasteFeeTypes() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data, error } = await supabaseClient.from('waste_fee_types').select('*').order('fee', {ascending: true});
        if (!error && data) {
            stateFeeTypes = data;
            return data;
        } else {
            console.warn('Supabase fetch fee types error, falling back to local storage', error);
        }
    }
    stateFeeTypes = getWasteData('feeTypes');
    return stateFeeTypes;
}

function getWasteFeeTypes() {
    return stateFeeTypes.length > 0 ? stateFeeTypes : getWasteData('feeTypes');
}

async function saveWasteFeeTypesDB(dataList) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        // Upsert logic for fee types
        for (let data of dataList) {
            const { error } = await supabaseClient.from('waste_fee_types').upsert({ id: data.id, type: data.type, fee: data.fee });
            if (error) console.error('Error saving fee type to Supabase:', error);
        }
        // Also handle deletions if necessary, but for simplicity we rely on local sync in this mode or we can delete records missing.
        // Easiest is to delete all and insert, but upsert is safer. To handle deletes, we check differences.
        // For now, save to localStorage as backup.
    }
    saveWasteData('feeTypes', dataList);
    stateFeeTypes = dataList;
}

// Keeping sync save for places that don't await yet (fallback)
function saveWasteFeeTypes(d) { saveWasteFeeTypesDB(d); }

// Fallback logic for Customers
async function fetchWasteCustomers() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data, error } = await supabaseClient.from('waste_customers').select('*').order('id', {ascending: true});
        if (!error && data) {
            stateCustomers = data;
            return data;
        } else {
            console.warn('Supabase fetch customers error, falling back to local storage', error);
        }
    }
    stateCustomers = getWasteData('customers');
    return stateCustomers;
}

function getWasteCustomers() { 
    return stateCustomers.length > 0 ? stateCustomers : getWasteData('customers'); 
}

async function saveWasteCustomerDB(data) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data: exist } = await supabaseClient.from('waste_customers').select('id').eq('id', data.id);
        if (exist && exist.length > 0) {
            const { error } = await supabaseClient.from('waste_customers').update(data).eq('id', data.id);
            if (error) console.error('Error updating customer in Supabase:', error);
        } else {
            const { error } = await supabaseClient.from('waste_customers').insert([data]);
            if (error) console.error('Error inserting customer to Supabase:', error);
        }
    }
    // Backup to local storage
    const customers = getWasteData('customers');
    const idx = customers.findIndex(c => c.id === data.id);
    if (idx >= 0) customers[idx] = data; else customers.push(data);
    saveWasteData('customers', customers);
    await fetchWasteCustomers(); // Update state
}

async function deleteWasteCustomerDB(id) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { error } = await supabaseClient.from('waste_customers').delete().eq('id', id);
        if (error) console.error('Error deleting customer in Supabase:', error);
    }
    const customers = getWasteData('customers').filter(c => c.id !== id);
    saveWasteData('customers', customers);
    await fetchWasteCustomers();
}

async function deleteWasteFeeTypeDB(id) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { error } = await supabaseClient.from('waste_fee_types').delete().eq('id', id);
        if (error) console.error('Error deleting fee type in Supabase:', error);
    }
    const fees = getWasteData('feeTypes').filter(c => c.id !== id);
    saveWasteData('feeTypes', fees);
    await fetchWasteFeeTypes();
}

// Keep sync wrapper for backward compatibility where needed
function saveWasteCustomers(d) { 
    saveWasteData('customers', d); 
    stateCustomers = d;
}

// ============================================
// PAYMENTS — Supabase CRUD
// ============================================
async function fetchWastePayments() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data, error } = await supabaseClient
            .from('waste_payments')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) {
            // Convert months_paid from Postgres text[] to JS array (already handled by supabase-js)
            statePayments = data;
            saveWasteData('payments', data); // backup
            return data;
        } else {
            console.warn('Supabase fetch payments error, falling back to localStorage', error);
        }
    }
    statePayments = getWasteData('payments');
    return statePayments;
}

function getWastePayments() {
    return statePayments.length > 0 ? statePayments : getWasteData('payments');
}

async function saveWastePaymentDB(payment) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        // Ensure months_paid is an array for Postgres text[]
        const record = {
            id: payment.id,
            receipt_no: payment.receipt_no || null,
            customer_id: payment.customer_id,
            customer_name: payment.customer_name,
            house_no: payment.house_no,
            amount: payment.amount,
            months_paid: Array.isArray(payment.months_paid) ? payment.months_paid : [payment.months_paid],
            fiscal_year: payment.fiscal_year || null,
            method: payment.method,
            date: payment.date,
            time: payment.time || null,
            status: payment.status,
            staff: payment.staff || null,
            source: payment.source || 'walk-in',
            reject_reason: payment.reject_reason || null
        };
        const { error } = await supabaseClient
            .from('waste_payments')
            .upsert(record, { onConflict: 'id' });
        if (error) console.error('Error saving payment to Supabase:', error);
    }
    // Backup to localStorage
    const payments = getWasteData('payments');
    const idx = payments.findIndex(p => p.id === payment.id);
    if (idx >= 0) payments[idx] = payment; else payments.unshift(payment);
    saveWasteData('payments', payments);
    statePayments = payments;
}

function saveWastePayments(d) { saveWasteData('payments', d); statePayments = d; }

// ============================================
// MONTHLY STATUS — Supabase CRUD
// ============================================
async function fetchMonthlyStatus() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data, error } = await supabaseClient
            .from('waste_monthly_status')
            .select('*');
        if (!error && data) {
            // Convert flat rows → nested object: { WC001: { '2568': { oct:'paid', ... } } }
            const ms = {};
            data.forEach(row => {
                if (!ms[row.customer_id]) ms[row.customer_id] = {};
                if (!ms[row.customer_id][row.fiscal_year]) ms[row.customer_id][row.fiscal_year] = {};
                ms[row.customer_id][row.fiscal_year][row.month_key] = row.status;
            });
            stateMonthlyStatus = ms;
            saveMonthlyStatus(ms); // backup
            return ms;
        } else if (error) {
            console.warn('Supabase fetch monthly status error, falling back to localStorage', error);
        }
    }
    stateMonthlyStatus = getMonthlyStatusLocal();
    return stateMonthlyStatus;
}

function getMonthlyStatusLocal() {
    try { 
        const ms = JSON.parse(localStorage.getItem(STORAGE_KEYS.monthlyStatus)) || {}; 
        const firstCustomer = Object.keys(ms)[0];
        if (firstCustomer && typeof ms[firstCustomer] !== 'object') {
            console.warn("Old monthly_status data format detected. Re-initializing.");
            const defaultMs = generateDefaultMonthlyStatus();
            saveMonthlyStatus(defaultMs);
            return defaultMs;
        }
        if (firstCustomer && ms[firstCustomer] && typeof ms[firstCustomer]['oct'] === 'string') {
             console.warn("Old monthly_status format (no year). Re-initializing.");
             const defaultMs = generateDefaultMonthlyStatus();
             saveMonthlyStatus(defaultMs);
             return defaultMs;
        }
        return ms;
    } catch(e) { return {}; } 
}

function getMonthlyStatus() { 
    return stateMonthlyStatus ? stateMonthlyStatus : getMonthlyStatusLocal();
}

async function saveMonthlyStatusDB(customerId, fiscalYear, monthKey, status, paymentId) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { error } = await supabaseClient
            .from('waste_monthly_status')
            .upsert({
                customer_id: customerId,
                fiscal_year: fiscalYear,
                month_key: monthKey,
                status: status,
                payment_id: paymentId || null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'customer_id,fiscal_year,month_key' });
        if (error) console.error('Error saving monthly status to Supabase:', error);
    }
    // Also update local cache
    const ms = getMonthlyStatus();
    if (!ms[customerId]) ms[customerId] = {};
    if (!ms[customerId][fiscalYear]) ms[customerId][fiscalYear] = {};
    ms[customerId][fiscalYear][monthKey] = status;
    stateMonthlyStatus = ms;
    saveMonthlyStatus(ms);
}

function saveMonthlyStatus(d) { 
    localStorage.setItem(STORAGE_KEYS.monthlyStatus, JSON.stringify(d)); 
    stateMonthlyStatus = d;
}

// ============================================
// STAFF — Supabase CRUD
// ============================================
async function fetchWasteStaff() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data, error } = await supabaseClient
            .from('waste_staff')
            .select('*')
            .order('id', { ascending: true });
        if (!error && data) {
            stateStaff = data;
            saveWasteData('staff', data);
            return data;
        } else if (error) {
            console.warn('Supabase fetch staff error, falling back to localStorage', error);
        }
    }
    stateStaff = getWasteData('staff');
    return stateStaff;
}

function getWasteStaff() { return stateStaff.length > 0 ? stateStaff : getWasteData('staff'); }
function saveWasteStaff(d) { saveWasteData('staff', d); stateStaff = d; }

// GAS URL สำหรับอัปโหลดรูปภาพพนักงาน (ให้ User นำ Web App URL มาใส่ที่นี่)
const GAS_STAFF_IMG_URL = 'https://script.google.com/macros/s/AKfycbwlba_trt6vEhQX64vZUZ2Ay1JTKKXjccI86IRIYRcMAK1cf9j9CT_jBcnyygqeS9Hr/exec';

async function uploadWasteStaffImage(base64Data, filename) {
    if (!GAS_STAFF_IMG_URL) {
        console.warn('GAS_STAFF_IMG_URL is empty, skipping upload');
        return null;
    }
    try {
        const res = await fetch(GAS_STAFF_IMG_URL, {
            method: 'POST',
            body: JSON.stringify({ base64: base64Data, filename: filename })
        });
        const data = await res.json();
        if (data.success) {
            return data.imageUrl;
        } else {
            console.error('GAS Upload Error:', data.error);
            return null;
        }
    } catch (e) {
        console.error('Upload catch error:', e);
        return null;
    }
}

async function saveWasteStaffDB(data) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        // อัปเดตข้อมูลใน Supabase
        // ทำการลบค่าที่เป็น null หรือ undefined ออกก่อนส่ง (กันพลาด)
        Object.keys(data).forEach(key => { if (data[key] === undefined) delete data[key]; });
        
        const { error } = await supabaseClient.from('waste_staff').upsert(data);
        if (error) {
            console.error('Error saving waste_staff to Supabase', error);
            Swal.fire('เกิดข้อผิดพลาดฐานข้อมูล', error.message || JSON.stringify(error), 'error');
            return false;
        }
    }
    // Update local cache
    const idx = stateStaff.findIndex(s => s.id === data.id);
    if (idx >= 0) stateStaff[idx] = data;
    else stateStaff.push(data);
    saveWasteStaff(stateStaff);
    return true;
}

async function deleteWasteStaffDB(id) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { error } = await supabaseClient.from('waste_staff').delete().eq('id', id);
        if (error) {
            console.error('Error deleting waste_staff from Supabase', error);
            showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'danger');
            return false;
        }
    }
    stateStaff = stateStaff.filter(s => s.id !== id);
    saveWasteStaff(stateStaff);
    return true;
}

async function fetchRegisterRequestsDB() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data, error } = await supabaseClient.from('waste_register_requests').select('*').order('created_at', {ascending: false});
        if (!error && data) {
            stateRegisterReqs = data;
            return data;
        } else {
            console.warn('Supabase fetch register reqs error', error);
        }
    }
    stateRegisterReqs = getWasteData('registerReqs');
    return stateRegisterReqs;
}

function getRegisterRequests() { return stateRegisterReqs.length > 0 ? stateRegisterReqs : getWasteData('registerReqs'); }

async function saveRegisterRequestDB(data) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { error } = await supabaseClient.from('waste_register_requests').upsert(data);
        if (error) console.error('Error saving register req to Supabase:', error);
    }
    const reqs = getWasteData('registerReqs');
    const idx = reqs.findIndex(r => r.id === data.id);
    if (idx >= 0) reqs[idx] = data; else reqs.push(data);
    saveWasteData('registerReqs', reqs);
    await fetchRegisterRequestsDB();
}

function saveRegisterRequests(d) { saveWasteData('registerReqs', d); stateRegisterReqs = d; }
function getCancelRequests() { return stateCancelReqs.length > 0 ? stateCancelReqs : getWasteData('cancelReqs'); }
function saveCancelRequests(d) { saveWasteData('cancelReqs', d); stateCancelReqs = d; }

async function fetchCancelRequestsDB() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data, error } = await supabaseClient.from('waste_cancel_requests').select('*').order('created_at', {ascending: false});
        if (!error && data) {
            stateCancelReqs = data;
            return data;
        } else {
            console.warn('Supabase fetch cancel reqs error', error);
        }
    }
    stateCancelReqs = getWasteData('cancelReqs');
    return stateCancelReqs;
}

async function saveCancelRequestDB(data) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { error } = await supabaseClient.from('waste_cancel_requests').upsert(data);
        if (error) console.error('Error saving cancel req to Supabase:', error);
    }
    const reqs = getWasteData('cancelReqs');
    const idx = reqs.findIndex(r => r.id === data.id);
    if (idx >= 0) reqs[idx] = data; else reqs.push(data);
    saveWasteData('cancelReqs', reqs);
    await fetchCancelRequestsDB();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateReceiptNumber() {
    const now = new Date();
    // คำนวณปีงบประมาณ: ต.ค.-ก.ย. → ถ้าเดือน >= 10 ถือเป็นปีงบประมาณถัดไป
    const fiscalYear = String(now.getMonth() >= 9 ? now.getFullYear() + 543 + 1 : now.getFullYear() + 543);
    
    // ใช้ counter แยกตามปีงบประมาณ เพื่อให้รีเซ็ตเมื่อขึ้นปีใหม่
    const counterKey = STORAGE_KEYS.receiptCounter + '_' + fiscalYear;
    let counter = parseInt(localStorage.getItem(counterKey) || '0') + 1;
    localStorage.setItem(counterKey, String(counter));
    
    return `REC-${String(counter).padStart(5,'0')}/${fiscalYear}`;
}

function generateCustomerId() {
    const customers = getWasteCustomers();
    const maxNum = customers.reduce((max, c) => {
        const n = parseInt(c.id.replace('WC',''));
        return n > max ? n : max;
    }, 0);
    return 'WC' + String(maxNum + 1).padStart(3, '0');
}

function getCurrentFiscalYear() {
    const now = new Date();
    return String(now.getMonth() >= 9 ? now.getFullYear() + 543 + 1 : now.getFullYear() + 543);
}

function calculateDebtors(year = null) {
    const targetYear = year || getCurrentFiscalYear();
    const customers = getWasteCustomers().filter(c => c.status === 'active');
    const ms = getMonthlyStatus();
    const debtors = [];
    const fyNum = parseInt(targetYear);

    customers.forEach(c => {
        const yearData = (ms[c.id] || {})[targetYear] || {};
        const unpaidMonths = [];
        let totalDebt = 0;

        WASTE_MONTH_KEYS.forEach((mk, i) => {
            if (yearData[mk] !== 'paid') {
                const calYear = i < 3 ? String(fyNum - 1) : targetYear;
                unpaidMonths.push(`${WASTE_MONTHS[i]} ${calYear.substring(2)}`);
                totalDebt += c.fee;
            }
        });

        if (unpaidMonths.length > 0) {
            debtors.push({
                ...c,
                unpaid_months: unpaidMonths,
                unpaid_count: unpaidMonths.length,
                total_debt: totalDebt,
                last_paid: getLastPaidMonth(ms[c.id] || {})
            });
        }
    });
    return debtors.sort((a,b) => b.total_debt - a.total_debt);
}

function getLastPaidMonth(customerStatus) {
    // Find the latest year
    const years = Object.keys(customerStatus).sort().reverse();
    for (let year of years) {
        const status = customerStatus[year];
        const fyNum = parseInt(year);
        for (let i = WASTE_MONTH_KEYS.length - 1; i >= 0; i--) {
            if (status[WASTE_MONTH_KEYS[i]] === 'paid') {
                // oct(0), nov(1), dec(2) belong to previous calendar year
                const calYear = i < 3 ? String(fyNum - 1) : year;
                return `${WASTE_MONTHS[i]} ${calYear.substring(2)}`;
            }
        }
    }
    return '-';
}

function getWasteDashboardStats() {
    const customers = getWasteCustomers();
    const active = customers.filter(c => c.status === 'active');
    const ms = typeof getMonthlyStatus === 'function' ? getMonthlyStatus() : {};
    const payments = getWastePayments();
    const regReqs = getRegisterRequests();
    const canReqs = getCancelRequests();
    const now = new Date();
    
    let paidCount = 0, unpaidCount = 0;
    let revenueThisMonth = 0;
    let revenueThisYear = 0;
    
    const currentYear = now.getMonth() >= 9 ? String(now.getFullYear() + 543 + 1) : String(now.getFullYear() + 543);
    const currentMonthKey = WASTE_MONTH_KEYS[now.getMonth() >= 9 ? now.getMonth() - 9 : now.getMonth() + 3];

    active.forEach(c => {
        const customerStatus = ms[c.id];
        if (!customerStatus) {
            unpaidCount++;
            return;
        }
        
        const s = customerStatus[currentYear] || {};
        
        const fee = Number(c.fee) || 0;
        
        if (s[currentMonthKey] === 'paid') {
            paidCount++;
            revenueThisMonth += fee;
        } else {
            unpaidCount++;
        }
        
        // Calculate total revenue for this fiscal year for this customer
        Object.keys(s).forEach(mk => {
            if (s[mk] === 'paid') revenueThisYear += fee;
        });
    });

    return {
        totalHouseholds: active.length,
        paidThisMonth: paidCount,
        unpaidThisMonth: unpaidCount,
        revenueThisMonth: revenueThisMonth,
        revenueThisYear: revenueThisYear,
        newRequests: regReqs.filter(r => r.status === 'pending').length,
        cancelRequests: canReqs.filter(r => r.status === 'pending').length,
        recentPayments: payments.slice(0, 10)
    };
}

function formatMoney(n) { return new Intl.NumberFormat('th-TH').format(n); }
function formatMoneyDecimal(n) { return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n); }

function getDebtBadgeClass(count) {
    if (count <= 2) return 'bg-warning text-dark';
    if (count <= 6) return 'bg-orange text-white';
    return 'bg-danger text-white';
}

function getDebtBadgeLabel(count) {
    if (count <= 2) return 'ค้าง 1-2 เดือน';
    if (count <= 6) return 'ค้าง 3-6 เดือน';
    return 'เกิน 6 เดือน';
}

// Chart helper for monthly revenue
function getMonthlyRevenueData() {
    const ms = typeof getMonthlyStatus === 'function' ? getMonthlyStatus() : {};
    const customers = typeof getWasteCustomers === 'function' ? getWasteCustomers() : [];
    const data = new Array(12).fill(0);
    const currentYear = getCurrentFiscalYear();

    Object.keys(ms).forEach(cid => {
        const cust = customers.find(c => c.id === cid);
        const fee = cust ? (Number(cust.fee) || 0) : 0;
        const yearData = ms[cid][currentYear];
        if (yearData) {
            WASTE_MONTH_KEYS.forEach((mk, i) => {
                if (yearData[mk] === 'paid') data[i] += fee;
            });
        }
    });
    return data;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initWasteData);
