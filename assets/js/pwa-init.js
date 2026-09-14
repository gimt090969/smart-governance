/**
 * pwa-init.js
 * Handles PWA initialization, Service Worker, Install Prompts, and Offline detection.
 */

(function () {
    'use strict';

    // 1. Inject Manifest dynamically
    function injectManifest() {
        if (!document.querySelector('link[rel="manifest"]')) {
            const link = document.createElement('link');
            link.rel = 'manifest';
            link.href = 'manifest.json';
            document.head.appendChild(link);
        }
    }

    // 2. Register Service Worker
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').then((registration) => {
                    console.log('[PWA] Service Worker registered with scope:', registration.scope);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateToast(newWorker);
                            }
                        });
                    });
                }).catch((error) => {
                    console.error('[PWA] Service Worker registration failed:', error);
                });
            });
        }
    }

    // 3. Online/Offline Detection
    function initConnectivityStatus() {
        window.addEventListener('online', () => showToast('🟢 เชื่อมต่ออินเทอร์เน็ตแล้ว', 'success'));
        window.addEventListener('offline', () => showToast('⚠️ คุณกำลังอยู่ในโหมด Offline', 'warning'));
    }

    function showToast(message, type = 'info') {
        const toastId = 'pwa-toast-container';
        let container = document.getElementById(toastId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = toastId;
            container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const bgColors = {
            'success': 'rgba(16, 185, 129, 0.95)',
            'warning': 'rgba(245, 158, 11, 0.95)',
            'info': 'rgba(59, 130, 246, 0.95)'
        };

        toast.style.cssText = `
            background: ${bgColors[type] || bgColors['info']};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: inherit;
            font-size: 14px;
            transform: translateY(100%);
            opacity: 0;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 10);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(100%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function showUpdateToast(worker) {
        const container = document.createElement('div');
        container.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; background: #1e3a8a; color: white; padding: 15px 20px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 15px; font-family: inherit; width: 90%; max-width: 400px; justify-content: space-between; border: 1px solid rgba(255,255,255,0.1);';
        
        container.innerHTML = `
            <div>
                <strong style="display:block; margin-bottom: 4px;">🔄 มีเวอร์ชันใหม่</strong>
                <span style="font-size: 13px; opacity: 0.9;">มีการปรับปรุงระบบ กรุณาอัปเดตเพื่อใช้งานเวอร์ชันล่าสุด</span>
            </div>
            <button id="pwa-update-btn" style="background: white; color: #1e3a8a; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; white-space: nowrap;">อัปเดตตอนนี้</button>
        `;
        
        document.body.appendChild(container);

        document.getElementById('pwa-update-btn').addEventListener('click', () => {
            worker.postMessage({ action: 'skipWaiting' });
            window.location.reload();
        });
    }

    // 4. Install Prompt (Android/Desktop)
    let deferredPrompt;
    function initInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            deferredPrompt = e;
            // Show custom install UI
            showInstallUI();
        });
    }

    function showInstallUI() {
        if (sessionStorage.getItem('pwa-install-dismissed')) return;
        
        // Don't show if already in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        const container = document.createElement('div');
        container.id = 'pwa-install-card';
        container.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 9998; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(10px); color: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: space-between; width: 90%; max-width: 400px; border: 1px solid rgba(255,255,255,0.1); gap: 15px; animation: slideUp 0.5s ease-out forwards;';
        
        // Add keyframes
        if (!document.getElementById('pwa-styles')) {
            const style = document.createElement('style');
            style.id = 'pwa-styles';
            style.textContent = `
                @keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
            `;
            document.head.appendChild(style);
        }

        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="assets/icons/icon-72.png" alt="App Icon" style="width: 40px; height: 40px; border-radius: 8px;">
                <div>
                    <strong style="display:block; font-size: 14px;">Smart Governance</strong>
                    <span style="font-size: 12px; opacity: 0.7;">แอปพลิเคชันเทศบาลอัจฉริยะ</span>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="pwa-install-dismiss" style="background: transparent; color: rgba(255,255,255,0.6); border: none; padding: 8px; font-size: 14px; cursor: pointer;">✕</button>
                <button id="pwa-install-btn" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 14px; cursor: pointer;">📲 ติดตั้งแอป</button>
            </div>
        `;
        
        document.body.appendChild(container);

        document.getElementById('pwa-install-dismiss').addEventListener('click', () => {
            container.remove();
            sessionStorage.setItem('pwa-install-dismissed', 'true');
        });

        document.getElementById('pwa-install-btn').addEventListener('click', async () => {
            container.remove();
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`[PWA] User installation outcome: ${outcome}`);
                deferredPrompt = null;
            }
        });
    }

    // 5. iOS Safari Install Guide
    function initIOSPrompt() {
        const isIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        };
        const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

        if (isIos() && !isInStandaloneMode()) {
            if (sessionStorage.getItem('pwa-ios-dismissed')) return;

            const container = document.createElement('div');
            container.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 9998; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); color: #333; padding: 20px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); width: 90%; max-width: 350px; text-align: center; font-family: inherit; animation: slideUp 0.5s ease-out forwards;';
            
            container.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <img src="assets/icons/icon-72.png" alt="App Icon" style="width: 50px; height: 50px; border-radius: 12px; margin-bottom: 10px;">
                    <h6 style="margin: 0; font-weight: bold; font-size: 16px;">ติดตั้ง Smart Governance</h6>
                    <p style="margin: 5px 0 0; font-size: 13px; color: #666;">เพื่อการใช้งานที่รวดเร็วและเต็มจอเหมือนแอปพลิเคชัน</p>
                </div>
                <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; font-size: 13px; text-align: left; margin-bottom: 15px;">
                    1. กดปุ่ม <b style="color:#007aff;">Share</b> <span style="font-size: 16px;">📤</span> ด้านล่าง<br>
                    2. เลือก <b>Add to Home Screen</b> <span style="font-size: 16px;">➕</span><br>
                    3. กด <b>Add</b> ที่มุมขวาบน
                </div>
                <button id="pwa-ios-dismiss" style="background: #e5e7eb; color: #374151; border: none; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; cursor: pointer; width: 100%;">เข้าใจแล้ว</button>
            `;
            
            document.body.appendChild(container);

            document.getElementById('pwa-ios-dismiss').addEventListener('click', () => {
                container.remove();
                sessionStorage.setItem('pwa-ios-dismissed', 'true');
            });
        }
    }

    // Initialize all PWA logic
    function initPWA() {
        injectManifest();
        registerServiceWorker();
        initConnectivityStatus();
        initInstallPrompt();
        initIOSPrompt();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPWA);
    } else {
        initPWA();
    }

})();
