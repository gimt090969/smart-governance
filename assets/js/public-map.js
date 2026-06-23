// public-map.js - Logic for Public GIS Portal (National Agency Edition)

let map;
let layers = {
    roads: L.featureGroup(),
    plannedRoads: L.featureGroup(),
    water: L.featureGroup(),
    waterways: L.featureGroup(),
    drainage: L.featureGroup(),
    lighting: L.featureGroup(),
    publicLand: L.featureGroup(),
    boundarySubdistrict: L.featureGroup(),
    boundaryVillage: L.featureGroup(),
    boundaryMarker: L.featureGroup()
};

let activeLayers = {
    roads: false,
    plannedRoads: false,
    water: false,
    waterways: false,
    drainage: false,
    lighting: false,
    publicLand: false,
    boundarySubdistrict: true,
    boundaryVillage: false,
    boundaryMarker: false
};

let userMarker = null;
let userCircle = null;

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadPublicData().then(() => {
        // Hide splash screen after data is loaded and fitBounds is called
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 500);
        }, 800);
    });
    // Toggle Layer Grid
    document.getElementById('toggleLayerGridBtn').addEventListener('click', function() {
        const sheet = document.querySelector('.bottom-sheet');
        sheet.classList.toggle('collapsed');
        const icon = this.querySelector('i');
        if (sheet.classList.contains('collapsed')) {
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        } else {
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
    });


    // Search Bar Toggle
    document.getElementById('searchToggleBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        const searchOverlay = document.getElementById('searchOverlay');
        const searchInput = document.getElementById('searchInput');
        searchOverlay.classList.toggle('collapsed');
        if (!searchOverlay.classList.contains('collapsed')) {
            setTimeout(() => searchInput.focus(), 300);
        }
    });

    // Close Search Bar on click outside
    document.addEventListener('click', function(e) {
        const searchOverlay = document.getElementById('searchOverlay');
        if (searchOverlay && !searchOverlay.contains(e.target) && !searchOverlay.classList.contains('collapsed')) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value.trim() === '') {
                searchOverlay.classList.add('collapsed');
            }
        }
    });

    // Setup bottom sheet buttons
    document.querySelectorAll('.layer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnEl = e.currentTarget;
            const layerKey = btnEl.getAttribute('data-layer');
            
            if (activeLayers[layerKey]) {
                btnEl.classList.remove('active');
                map.removeLayer(layers[layerKey]);
                activeLayers[layerKey] = false;
            } else {
                btnEl.classList.add('active');
                map.addLayer(layers[layerKey]);
                activeLayers[layerKey] = true;
            }
        });
    });
});

function initMap() {
    map = L.map('publicMap', {
        zoomControl: false,
        preferCanvas: true,
        wheelDebounceTime: 150
    }).setView([14.882, 100.414], 13.5); // Default to Central Thailand

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Google Hybrid Map (Satellite + Labels) as requested
    L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=th&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 20
    }).addTo(map);

    // Zoom listener for road labels and village labels visibility
    map.on('zoomend', function() {
        const mapDiv = document.getElementById('publicMap');
        const zoom = map.getZoom();
        
        if (zoom >= 16) {
            mapDiv.classList.add('show-road-labels');
        } else {
            mapDiv.classList.remove('show-road-labels');
        }
        
        if (zoom < 14) {
            mapDiv.classList.add('hide-village-labels');
        } else {
            mapDiv.classList.remove('hide-village-labels');
        }

        if (zoom < 14) {
            mapDiv.classList.add('hide-village-labels');
        } else {
            mapDiv.classList.remove('hide-village-labels');
        }
    });

    // Handle dynamic tooltips to prevent lag
    map.on('zoomend moveend', function() {
        const zoom = map.getZoom();
        if (zoom >= 19 && layers.lighting) {
            const bounds = map.getBounds();
            layers.lighting.eachLayer(circle => {
                if (bounds.contains(circle.getLatLng())) {
                    if (!circle.getTooltip()) {
                        circle.bindTooltip(`<b>${circle.pole_code}</b><br><span style="font-size:0.65rem;color:#94a3b8;">${circle.light_type || '-'}</span>`, {
                            permanent: true, direction: 'right', offset: [5, 0], className: 'pole-label-tooltip'
                        });
                    }
                } else {
                    if (circle.getTooltip()) circle.unbindTooltip();
                }
            });
        } else if (layers.lighting) {
            layers.lighting.eachLayer(circle => {
                if (circle.getTooltip()) circle.unbindTooltip();
            });
        }
    });

    // Initial check
    const initialZoom = map.getZoom();
    if (initialZoom >= 16) {
        document.getElementById('publicMap').classList.add('show-road-labels');
    }
    if (initialZoom < 14) {
        document.getElementById('publicMap').classList.add('hide-village-labels');
    }
    if (initialZoom < 14) {
        document.getElementById('publicMap').classList.add('hide-village-labels');
    }

    // Add active layers to map initially
    Object.keys(activeLayers).forEach(key => {
        if (activeLayers[key]) {
            map.addLayer(layers[key]);
        }
    });
}

function buildInfraPopupHTML(title, subtitle, content) {
    return `
        <div class="public-popup-title" style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px; margin-bottom: 8px;">
            <div style="font-weight: 700; font-size: 1rem;">${title}</div>
            <div style="font-size: 0.8rem; color: #93c5fd;">${subtitle || ''}</div>
        </div>
        <div style="font-size: 0.85rem; line-height: 1.5; color: rgba(255,255,255,0.9);">
            ${content}
        </div>
    `;
}

// Helper for formatting Thai Area
function formatSqmToThaiArea(sqm) {
    if (!sqm) return '0 ไร่ 0 งาน 0 ตร.วา';
    const totalSqWa = sqm / 4;
    const rai = Math.floor(totalSqWa / 400);
    const ngan = Math.floor((totalSqWa % 400) / 100);
    const sqwa = (totalSqWa % 100).toFixed(1);
    return `${rai} ไร่ ${ngan} งาน ${sqwa} ตร.วา`;
}

async function loadPublicData() {
    try {
        if (typeof DigitalInfraService === 'undefined') {
            console.error("DigitalInfraService is not loaded.");
            return;
        }

        // 1. Roads & Planned Roads (LineStrings)
        const roads = await DigitalInfraService.getRoads();
        roads.forEach(r => {
            let polyline;
            const style = DigitalInfraService.getRoadStyle(r);
            if (r.geom && r.geom.coordinates && r.geom.coordinates.length > 0) {
                const pts = r.geom.coordinates.map(coord => [coord[1], coord[0]]);
                polyline = L.polyline(pts, style);
            } else if (r.latitude && r.longitude) {
                // mock polyline for missing geometry
                polyline = L.polyline([
                    [r.latitude, r.longitude - 0.005], [r.latitude, r.longitude + 0.005]
                ], style);
            } else { return; }

            polyline.bindPopup(buildInfraPopupHTML(r.road_type === 'ถนนในแผนพัฒนา' ? 'ถนนในแผนพัฒนา' : 'ถนนสายทาง', r.road_id, `
                <b>ชื่อถนน:</b> ${r.road_name || '-'}<br>
                <b>ประเภทผิวจราจร:</b> ${r.surface_type || '-'}<br>
                <b>กว้างเฉลี่ย:</b> ${r.width} ม. · <b>ยาว:</b> ${(r.length_m || 0).toLocaleString()} ม.<br>
                <b>งบประมาณ/แหล่งที่มา:</b> ${r.budget_source || '-'}
            `), { className: 'public-popup' });
            
            // Add permanent tooltip for road details
            if (r.road_name) {
                const tooltipHtml = `
                    <div style="text-align: center; line-height: 1.2;">
                        <div style="font-weight: 600; font-size: 0.75rem; color: #0f172a;">${r.road_name}</div>
                        <div style="font-size: 0.65rem; color: #475569; margin-top: 2px;">
                            ${r.surface_type || 'ไม่ระบุ'} • ${(r.length_m || 0).toLocaleString()} ม.
                        </div>
                    </div>
                `;
                polyline.bindTooltip(tooltipHtml, {
                    permanent: true,
                    direction: 'center',
                    className: 'road-label-tooltip'
                });
            }
            
            if (r.road_type === 'ถนนในแผนพัฒนา') {
                layers.plannedRoads.addLayer(polyline);
            } else {
                layers.roads.addLayer(polyline);
            }
        });

        // 2. Water
        const water = await DigitalInfraService.getWater();
        water.forEach(w => {
            let polygon;
            if (w.geom && w.geom.coordinates) {
                const pts = w.geom.coordinates[0].map(c => [c[1], c[0]]);
                polygon = L.polygon(pts, DigitalInfraService.LAYER_STYLES.water);
            } else if (w.latitude && w.longitude) {
                polygon = L.circle([w.latitude, w.longitude], { radius: Math.sqrt(w.surface_area_sqm || 1000), ...DigitalInfraService.LAYER_STYLES.water });
            } else { return; }

            polygon.bindPopup(buildInfraPopupHTML('แหล่งน้ำ/สระ', w.water_code, `
                <b>ชื่อ:</b> ${w.water_name || '-'}<br>
                <b>พื้นที่ผิวน้ำ:</b> ${(w.surface_area_sqm || 0).toLocaleString()} ตร.ม.<br>
                <b>ความจุน้ำ:</b> ${(w.capacity_cum || 0).toLocaleString()} ลบ.ม.
            `), { className: 'public-popup' });
            layers.water.addLayer(polygon);
        });

        // 3. Waterways
        const waterways = await DigitalInfraService.getWaterways();
        waterways.forEach(ww => {
            let polyline;
            if (ww.geom && ww.geom.coordinates) {
                const pts = ww.geom.coordinates.map(c => [c[1], c[0]]);
                polyline = L.polyline(pts, DigitalInfraService.LAYER_STYLES.waterways);
            } else if (ww.latitude && ww.longitude) {
                polyline = L.polyline([[ww.latitude, ww.longitude - 0.01], [ww.latitude, ww.longitude + 0.01]], DigitalInfraService.LAYER_STYLES.waterways);
            } else { return; }

            polyline.bindPopup(buildInfraPopupHTML('ลำคลอง/ลำห้วย', ww.waterway_code, `
                <b>ชื่อ:</b> ${ww.waterway_name || '-'}<br>
                <b>ความยาว:</b> ${(ww.length_m || 0).toLocaleString()} เมตร
            `), { className: 'public-popup' });
            layers.waterways.addLayer(polyline);
        });

        // 4. Drainage
        const drainage = await DigitalInfraService.getDrainage();
        drainage.forEach(d => {
            if (d.latitude && d.longitude) {
                const circle = L.circleMarker([d.latitude, d.longitude], DigitalInfraService.LAYER_STYLES.drainage);
                circle.bindPopup(buildInfraPopupHTML('ท่อ/ฝาระบายน้ำ', d.asset_id, `
                    <b>ประเภท:</b> ${d.drainage_type}<br>
                    <b>วัสดุ:</b> ${d.material}
                `), { className: 'public-popup' });
                layers.drainage.addLayer(circle);
            }
        });

        // 5. Lighting
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const { data: poles, error } = await supabaseClient.from('electric_poles').select('*');
            if (!error && poles) {
                poles.forEach(p => {
                    if (!p.lat || !p.lng || (p.lat === 0 && p.lng === 0)) return;
                    const circle = L.circleMarker([p.lat, p.lng], DigitalInfraService.LAYER_STYLES.lighting);
                    circle.pole_code = p.pole_code;
                    circle.light_type = p.light_type;
                    circle.bindPopup(buildInfraPopupHTML('เสาไฟฟ้าส่องสว่าง', p.pole_code, `<b>ประเภทโคม:</b> ${p.light_type || '-'}<br><b>สถานะ:</b> ${p.status === 'broken' ? 'ชำรุด' : 'ปกติ'}`), { className: 'public-popup' });
                    layers.lighting.addLayer(circle);
                });
            }
        }

        // 6. Public Land
        const publicLand = await DigitalInfraService.getPublicLand();
        publicLand.forEach(pl => {
            if (pl.latitude && pl.longitude) {
                const polygon = L.polygon([
                    [pl.latitude - 0.003, pl.longitude - 0.003],
                    [pl.latitude - 0.003, pl.longitude + 0.003],
                    [pl.latitude + 0.003, pl.longitude + 0.003],
                    [pl.latitude + 0.003, pl.longitude - 0.003]
                ], DigitalInfraService.LAYER_STYLES.publicLand);
                
                polygon.bindPopup(buildInfraPopupHTML('ที่ดินสาธารณประโยชน์', pl.land_name, `
                    <b>รหัสทะเบียน:</b> ${pl.land_code || '-'}<br>
                    <b>การใช้ประโยชน์:</b> ${pl.current_use || '-'}
                `), { className: 'public-popup' });
                layers.publicLand.addLayer(polygon);
            }
        });

        // 7, 8, 9 Boundaries and Markers
        const dbBoundaries = await (typeof BoundarySpatialService !== 'undefined' ? BoundarySpatialService.loadBoundaries() : Promise.resolve([]));
        dbBoundaries.forEach(b => {
            if (b.geom && b.geom.coordinates) {
                const isSubdistrict = b.boundary_type === 'แนวเขตตำบล';
                const style = isSubdistrict ? 
                    { color: '#facc15', fillColor: '#fef08a', fillOpacity: 0.15, weight: 5, dashArray: '12, 10' } :
                    { color: '#ef4444', fillColor: '#fee2e2', fillOpacity: 0.10, weight: 3.5, dashArray: '6, 6' };
                
                const geojsonLayer = L.geoJSON(b.geom, { style: style });
                geojsonLayer.bindPopup(buildInfraPopupHTML(b.boundary_type, b.boundary_name, `
                    <b>ขนาดเนื้อที่:</b> ${formatSqmToThaiArea(b.area_sqm)}
                `), { className: 'public-popup' });
                
                // Add permanent tooltip for boundary name
                const labelText = isSubdistrict ? b.boundary_name : (b.boundary_name + (b.village_no ? ` (หมู่ ${b.village_no})` : ''));
                geojsonLayer.bindTooltip(labelText, {
                    permanent: true,
                    direction: 'center',
                    className: isSubdistrict ? 'boundary-label-subdistrict' : 'boundary-label-village'
                });
                
                if (isSubdistrict) layers.boundarySubdistrict.addLayer(geojsonLayer);
                else layers.boundaryVillage.addLayer(geojsonLayer);
            }
        });

        const dbMarkers = await DigitalInfraService.getBoundaryMarkers();
        dbMarkers.forEach(bm => {
            if (bm.latitude && bm.longitude) {
                const markerColor = bm.marker_type.includes('ตำบล') ? '#facc15' : '#ef4444';
                const customDivIcon = L.divIcon({
                    className: 'custom-survey-marker',
                    html: `
                        <div style="width: 14px; height: 14px; background: ${markerColor}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>
                    `,
                    iconSize: [14, 14], iconAnchor: [7, 7]
                });
                const marker = L.marker([bm.latitude, bm.longitude], { icon: customDivIcon });
                marker.bindPopup(buildInfraPopupHTML('หมุดหลักเขต', bm.marker_code, `<b>รายละเอียด:</b> ${bm.description}`), { className: 'public-popup' });
                layers.boundaryMarker.addLayer(marker);
            }
        });



        // Fit map bounds to show everything if there is data
        const allBounds = L.latLngBounds();
        Object.values(layers).forEach(group => {
            if (group.getLayers().length > 0) {
                allBounds.extend(group.getBounds());
            }
        });
        
        if (allBounds.isValid()) {
            map.fitBounds(allBounds, { padding: [20, 20] });
        }

    } catch (err) {
        console.error("Error loading public data:", err);
    }
}

function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            if (userMarker) {
                map.removeLayer(userMarker);
                map.removeLayer(userCircle);
            }

            userMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    html: '<div style="width: 15px; height: 15px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
                    className: '',
                    iconSize: [15, 15]
                })
            }).addTo(map);

            userCircle = L.circle([lat, lng], { radius: accuracy, color: '#3b82f6', opacity: 0.2, fillOpacity: 0.1 }).addTo(map);

            map.setView([lat, lng], 16);
        }, (error) => {
            alert('ไม่สามารถระบุตำแหน่งได้ กรุณาเปิดใช้งาน Location Services');
        });
    } else {
        alert('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
    }
}
