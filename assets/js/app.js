/**
 * app.js - Shared Application Logic
 * Smart Governance Municipality Platform
 */

// =============================================
// SIDEBAR COMPONENT BUILDER
// Renders the sidebar from one shared config
// =============================================
const NAV_ITEMS = [
    { href: 'dashboard.html', icon: 'fa-solid fa-chart-pie', label: 'แดชบอร์ด', key: 'dashboard', depts: ['ALL'] },
    { href: 'secretary.html', icon: 'fa-solid fa-building-user', label: 'สำนักปลัด', key: 'secretary', depts: ['สำนักปลัด'] },
    { href: 'secretary-docs.html', icon: 'fa-solid fa-file-signature', label: 'งานสารบรรณ', key: 'secretary-docs', depts: ['สำนักปลัด'], parent: 'secretary' },
    { href: 'secretary-meetings.html', icon: 'fa-solid fa-calendar-check', label: 'งานประชุม', key: 'secretary-meetings', depts: ['สำนักปลัด'], parent: 'secretary' },
    { href: 'secretary-hr.html', icon: 'fa-solid fa-users-gear', label: 'งานบุคลากร', key: 'secretary-hr', depts: ['สำนักปลัด'], parent: 'secretary' },
    { href: 'secretary-complaints.html', icon: 'fa-solid fa-headset', label: 'งานร้องเรียน', key: 'secretary-complaints', depts: ['สำนักปลัด'], parent: 'secretary' },
    { href: 'finance.html', icon: 'fa-solid fa-file-invoice-dollar', label: 'กองคลัง', key: 'finance', depts: ['กองคลัง'] },
    { href: 'publicworks.html', icon: 'fa-solid fa-hard-hat', label: 'กองช่าง', key: 'publicworks', depts: ['กองช่าง'] },
    { href: 'publicworks-electric.html', icon: 'fa-solid fa-bolt', label: 'ซ่อมบำรุงไฟฟ้า', key: 'publicworks-electric', depts: ['กองช่าง'], parent: 'publicworks' },
    { href: 'publicworks-electric-registry.html', icon: 'fa-solid fa-clipboard-list', label: 'ทะเบียนเสาไฟ', key: 'publicworks-electric-registry', depts: ['กองช่าง'], parent: 'publicworks-electric' },
    { href: 'publicworks-electric-map.html', icon: 'fa-solid fa-map-location-dot', label: 'แผนที่เสาไฟ', key: 'publicworks-electric-map', depts: ['กองช่าง'], parent: 'publicworks-electric' },
    { href: 'publicworks-electric-stock.html', icon: 'fa-solid fa-boxes-stacked', label: 'คลังอุปกรณ์', key: 'publicworks-electric-stock', depts: ['กองช่าง'], parent: 'publicworks-electric' },
    { href: 'publicworks-electric-staff.html', icon: 'fa-solid fa-users', label: 'เจ้าหน้าที่ไฟฟ้า', key: 'publicworks-electric-staff', depts: ['กองช่าง'], parent: 'publicworks-electric' },
    { href: 'health.html', icon: 'fa-solid fa-leaf', label: 'กองสาธารณสุขฯ', key: 'health', depts: ['กองสาธารณสุขฯ'] },
    { href: 'education.html', icon: 'fa-solid fa-graduation-cap', label: 'กองการศึกษา', key: 'education', depts: ['กองการศึกษา'] },
    { href: 'welfare.html', icon: 'fa-solid fa-hands-holding-child', label: 'กองสวัสดิการฯ', key: 'welfare', depts: ['กองสวัสดิการฯ'] },
    { href: 'planning.html', icon: 'fa-solid fa-chart-line', label: 'กองยุทธศาสตร์ฯ', key: 'planning', depts: ['กองยุทธศาสตร์ฯ'] },
];

function buildSidebar(activeKey) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Get current page filename to auto-detect active
    if (!activeKey) {
        const page = window.location.pathname.split('/').pop().replace('.html', '');
        activeKey = page;
    }

    // กรองเมนูตามกองและบทบาท
    const user = getSessionUser();
    if (!user) {
        console.warn("Sidebar: No user session found");
        return;
    }

    console.log("Building sidebar for user:", user);

    const userRole = (user.role || '').toLowerCase();
    const userDept = user.dept || '';

    const filteredNav = NAV_ITEMS.filter(item => {
        if (userRole === 'super admin') return true;
        if (item.depts && item.depts.includes('ALL')) return true;
        return item.depts && item.depts.includes(userDept);
    });

    sidebar.innerHTML = `
        <div class="sidebar-header d-flex flex-column align-items-center text-center">
            <img src="https://drive.google.com/thumbnail?id=1cPWRFVoN48eV6lJVS9E7nd2Mi7y5IQj8&sz=w200"
                 alt="Smart Connect" style="max-height:60px; border-radius: 12px; margin-bottom: 0.75rem;">
            <h6 class="fw-bold mb-1">Smart Connect</h6>
            <small id="sidebar-role-label" class="opacity-75">กำลังโหลด...</small>
        </div>

        <ul class="list-unstyled components" id="nav-list">
            <li class="sidebar-section-label">เมนูหลัก</li>
            ${filteredNav.map(item => {
                // If it's a 3rd level item (parent is a sub-menu like publicworks-electric)
                if (item.parent && item.parent.includes('-')) {
                    // Only show if the active page is in the same family
                    if (!activeKey.startsWith(item.parent)) return '';
                    return `
                        <li class="${item.key === activeKey ? 'active' : ''} ms-4 border-start border-white border-opacity-10 ps-2" style="border-left-width: 2px !important;">
                            <a href="${item.href}" class="py-1 text-xs opacity-75 hover:opacity-100" style="padding-left: 1rem !important; font-size: 0.75rem;">
                                <i class="${item.icon} fa-xs" style="width: 20px; text-align: center;"></i>
                                <span>${item.label}</span>
                            </a>
                        </li>
                    `;
                }
                
                // Normal 1st and 2nd level items
                return `
                <li class="${item.key === activeKey ? 'active' : ''} ${item.parent ? 'ms-3 border-start border-white border-opacity-10 ps-2' : ''}">
                    <a href="${item.href}" class="${item.parent ? 'py-1 text-xs opacity-75 hover:opacity-100' : ''}" style="${item.parent ? 'padding-left: 1rem !important;' : ''}">
                        <i class="${item.icon} ${item.parent ? 'fa-xs' : ''}" style="width: 20px; text-align: center;"></i>
                        <span>${item.label}</span>
                    </a>
                </li>
                `;
            }).join('')}
            
            ${userRole === 'super admin' ? `
            <li class="sidebar-section-label mt-2">ระบบ</li>
            <li>
                <a href="settings.html" class="${activeKey === 'settings' ? 'active' : ''}">
                    <i class="fa-solid fa-gear"></i>
                    <span>ตั้งค่าระบบ</span>
                </a>
            </li>` : ''}
        </ul>

        <div class="p-3" style="border-top: 1px solid rgba(255,255,255,0.08);">
            <a href="javascript:void(0)" onclick="logout()" class="d-flex align-items-center gap-2 py-2 px-2 rounded text-sm"
               style="color: #f87171; transition: background 0.15s;"
               onmouseover="this.style.background='rgba(248,113,113,0.1)'"
               onmouseout="this.style.background='transparent'">
                <i class="fa-solid fa-right-from-bracket" style="width:20px; text-align:center;"></i>
                ออกจากระบบ
            </a>
        </div>
    `;

    // Set role label from session (using already declared 'user')
    const roleEl = document.getElementById('sidebar-role-label');
    if (roleEl) roleEl.textContent = user.role || 'ผู้ดูแลระบบ';
}

// =============================================
// TOP NAVBAR BUILDER
// =============================================
function buildNavbar(pageTitle) {
    const navbar = document.getElementById('top-navbar');
    if (!navbar) return;
    const user = getSessionUser();
    if (!user) return;

    navbar.innerHTML = `
        <button type="button" id="sidebarCollapse" class="btn btn-sm btn-primary d-flex align-items-center gap-1">
            <i class="fa-solid fa-bars"></i>
        </button>
        <h5 class="page-title mb-0 ms-2 d-none d-md-block">${pageTitle || 'ระบบบริหารจัดการเทศบาลอัจฉริยะ'}</h5>

        <div class="ms-auto d-flex align-items-center gap-3">
            <!-- Global Search -->
            <div class="d-none d-md-flex input-group input-group-sm" style="width: 220px;">
                <span class="input-group-text bg-light border-end-0"><i class="fa-solid fa-search text-muted"></i></span>
                <input type="text" class="form-control border-start-0 bg-light" placeholder="ค้นหาทั่วระบบ...">
            </div>

            <!-- Notifications -->
            <div class="dropdown">
                <button class="btn btn-sm btn-light position-relative" data-bs-toggle="dropdown">
                    <i class="fa-solid fa-bell"></i>
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size:0.6rem;">3</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow" style="min-width:280px; border:none; border-radius:12px;">
                    <li class="px-3 pt-2 pb-1"><h6 class="fw-bold mb-0 text-sm">การแจ้งเตือน</h6></li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li><a class="dropdown-item py-2 text-sm" href="#"><i class="fa-regular fa-lightbulb text-warning me-2"></i>แจ้งซ่อมไฟถนนใหม่ (2 รายการ)</a></li>
                    <li><a class="dropdown-item py-2 text-sm" href="#"><i class="fa-solid fa-coins text-success me-2"></i>รับชำระภาษีสำเร็จ (5 ราย)</a></li>
                    <li><a class="dropdown-item py-2 text-sm" href="#"><i class="fa-solid fa-triangle-exclamation text-danger me-2"></i>ใบอนุญาตกิจการใกล้หมดอายุ (1)</a></li>
                </ul>
            </div>

            <!-- User Menu -->
            <div class="dropdown">
                <button class="btn btn-sm btn-light d-flex align-items-center gap-2 px-2 dropdown-toggle" data-bs-toggle="dropdown">
                    <img src="${getDriveThumbnail(user.avatar) || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=1a56db&color=fff&size=64'}"
                         class="rounded-circle shadow-sm object-fit-cover" width="28" height="28" alt="User"
                         onerror="this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${user.name}')">
                    <span class="d-none d-md-inline text-sm fw-semibold">${user.name}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow" style="border:none; border-radius:12px; min-width:180px;">
                    <li class="px-3 pt-2 pb-1">
                        <span class="d-block fw-semibold text-sm">${user.name}</span>
                        <span class="text-xs text-muted">${user.role}</span>
                    </li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li><a class="dropdown-item text-sm py-2" href="#"><i class="fa-solid fa-user me-2 text-muted"></i>โปรไฟล์ของฉัน</a></li>
                    <li><a class="dropdown-item text-sm py-2" href="settings.html"><i class="fa-solid fa-gear me-2 text-muted"></i>ตั้งค่า</a></li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li><a class="dropdown-item text-sm py-2 text-danger" href="javascript:void(0)" onclick="logout()"><i class="fa-solid fa-right-from-bracket me-2"></i>ออกจากระบบ</a></li>
                </ul>
            </div>
        </div>
    `;
}

// =============================================
// SESSION / AUTH
// =============================================
function getSessionUser() {
    try {
        const stored = localStorage.getItem('sgov_user') || sessionStorage.getItem('sgov_user');
        if (stored) {
            const user = JSON.parse(stored);
            return user;
        }
    } catch (e) {
        console.error("Session Error:", e);
    }
    return null;
}

function setSessionUser(user, remember = true) {
    const data = JSON.stringify(user);
    if (remember) localStorage.setItem('sgov_user', data);
    else sessionStorage.setItem('sgov_user', data);
}

function logout() {
    localStorage.removeItem('sgov_user');
    sessionStorage.removeItem('sgov_user');
    window.location.href = 'index.html';
}

function getDriveThumbnail(url) {
    if (!url || typeof url !== 'string') return url;
    const match = url.match(/[-\w]{25,}/); 
    if (match && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
        return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w100`;
    }
    return url;
}

// =============================================
// SIDEBAR TOGGLE
// =============================================
function initSidebarToggle() {
    const btn = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar) return;

    // Create overlay for mobile
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    btn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
}

// =============================================
// ANIMATE ELEMENTS ON SCROLL
// =============================================
function initFadeIn() {
    document.querySelectorAll('.fade-in-up').forEach((el, i) => {
        el.style.animationDelay = `${i * 0.06}s`;
    });
}

// =============================================
// FORMAT HELPERS
// =============================================
function formatThaiDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function showToast(message, type = 'success') {
    const colors = { success: '#057a55', danger: '#c81e1e', warning: '#c27803', info: '#0694a2' };
    const icons = { success: 'fa-circle-check', danger: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
        background: #fff; border-left: 4px solid ${colors[type]};
        border-radius: 10px; padding: 0.85rem 1.25rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        display: flex; align-items: center; gap: 0.75rem;
        font-family: 'Prompt', sans-serif; font-size: 0.875rem;
        animation: fadeInUp 0.3s ease;
        min-width: 260px; max-width: 360px;
    `;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type]}" style="color:${colors[type]}; font-size: 1.1rem;"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// =============================================
// QR CODE GENERATOR (PromptPay)
// =============================================
function generatePromptPayQR(amount, refId) {
    // In production: call actual PromptPay QR generation API or library
    // This is a placeholder that opens a QR code service
    const ppId = '0994000165938'; // Replace with municipality's PromptPay ID
    return `https://promptpay.io/${ppId}/${amount}`;
}

// =============================================
// MAIN INIT
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const user = getSessionUser();
    
    // ตรวจสอบสิทธิ์การเข้าถึงหน้า (Page-level Security)
    const currentPage = window.location.pathname.split('/').pop();
    const isLoginPage = currentPage === 'index.html' || currentPage === '' || currentPage === 'index';

    if (!user && !isLoginPage) {
        window.location.href = 'index.html';
        return;
    }

    if (user && !isLoginPage) {
        const currentNavItem = NAV_ITEMS.find(item => item.href === currentPage);
        const userRole = (user.role || '').toLowerCase();
        const userDept = user.dept || '';

        // ถ้าเป็นหน้าที่มีการจำกัดกอง (และไม่ใช่ Super Admin)
        if (currentNavItem && userRole !== 'super admin') {
            if (!currentNavItem.depts.includes('ALL') && !currentNavItem.depts.includes(userDept)) {
                alert('ขออภัย คุณไม่มีสิทธิ์เข้าใช้งานในส่วนงานนี้');
                window.location.href = 'dashboard.html';
                return;
            }
        }

        // จำกัดการเข้าถึงหน้า Settings เฉพาะ Super Admin เท่านั้น
        if (currentPage === 'settings.html' && userRole !== 'super admin') {
            alert('เฉพาะผู้ดูแลระบบสูงสุด (Super Admin) เท่านั้นที่สามารถเข้าถึงการตั้งค่าได้');
            window.location.href = 'dashboard.html';
            return;
        }
    }

    // Auto-build sidebar if present
    if (document.getElementById('sidebar')) {
        buildSidebar();
    }

    // Auto-build navbar if present
    const navbar = document.getElementById('top-navbar');
    if (navbar) {
        const title = navbar.dataset.title || document.title.split(' - ')[0];
        buildNavbar(title);
    }

    initSidebarToggle();
    initFadeIn();
});
