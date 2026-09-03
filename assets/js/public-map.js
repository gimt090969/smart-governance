// public-map.js - Logic for Public GIS Portal (National Agency Edition)

let map;
let layers = {};

let activeLayers = {
    roads: false,
    plannedRoads: false,
    water: false,
    waterways: false,
    drainage: false,
    lighting: false,
    publicLand: false,
    waterMeter: false,
    boundarySubdistrict: true,
    boundaryVillage: false,
    boundaryMarker: false
};

let userMarker = null;
let userCircle = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof DigitalInfraService !== 'undefined' && typeof DigitalInfraService.loadRoadSurfaceTypesFromDB === 'function') {
        await DigitalInfraService.loadRoadSurfaceTypesFromDB();
    }
    try {
        layers = {
            roads: L.featureGroup(),
            plannedRoads: L.featureGroup(),
            water: L.featureGroup(),
            waterways: L.featureGroup(),
            drainage: L.featureGroup(),
            lighting: (typeof L.markerClusterGroup === 'function') ? L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 50,
                disableClusteringAtZoom: 18,
                spiderfyOnMaxZoom: false,
                iconCreateFunction: function(cluster) {
                    const count = cluster.getChildCount();
                    return L.divIcon({
                        html: `<div style="background-color: rgba(234, 179, 8, 0.95); color: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 3px solid rgba(255,255,255,0.8); font-weight: bold; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"><i class="fa-solid fa-lightbulb" style="position:absolute; opacity:0.2; font-size: 24px;"></i><span style="position:relative; z-index:1;">${count}</span></div>`,
                        className: 'custom-cluster-icon',
                        iconSize: [40, 40]
                    });
                }
            }) : L.featureGroup(),
            publicLand: L.featureGroup(),
            waterMeter: (typeof L.markerClusterGroup === 'function') ? L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 50,
                disableClusteringAtZoom: 18,
                spiderfyOnMaxZoom: false,
                iconCreateFunction: function(cluster) {
                    const count = cluster.getChildCount();
                    return L.divIcon({
                        html: `<div style="background-color: rgba(59, 130, 246, 0.95); color: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 3px solid rgba(255,255,255,0.8); font-weight: bold; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"><i class="fa-solid fa-faucet-drip" style="position:absolute; opacity:0.2; font-size: 24px;"></i><span style="position:relative; z-index:1;">${count}</span></div>`,
                        className: 'custom-cluster-icon',
                        iconSize: [40, 40]
                    });
                }
            }) : L.featureGroup(),
            boundarySubdistrict: L.featureGroup(),
            boundaryVillage: L.featureGroup(),
            boundaryMarker: L.featureGroup()
        };
    } catch (e) {
        console.error("Failed to initialize map layers:", e);
    }
    
    try {
        initMap();
    } catch (e) {
        console.error("Failed to init map:", e);
    }

    loadPublicData().finally(() => {
        // Hide splash screen after data is loaded and fitBounds is called, or if it fails
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            if (splash) {
                splash.style.opacity = '0';
                setTimeout(() => splash.style.display = 'none', 500);
            }
        }, 800);
    });
    // Toggle Layer Grid
    document.getElementById('toggleLayerGridBtn').addEventListener('click', function() {
        const sheet = document.querySelector('.bottom-sheet');
        sheet.classList.toggle('collapsed');
        const icon = this.querySelector('i');
        const textSpan = document.getElementById('toggleLayerGridText');
        if (sheet.classList.contains('collapsed')) {
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            if (textSpan) textSpan.innerText = 'ขยายแถบแสดงข้อมูล';
        } else {
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            if (textSpan) textSpan.innerText = 'ย่อแถบแสดงข้อมูล';
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

            const popupHtml = buildInfraPopupHTML(r.road_type === 'ถนนในแผนพัฒนา' ? 'ถนนในแผนพัฒนา' : 'ถนนสายทาง', r.road_id, `
                <b>ชื่อถนน:</b> ${r.road_name || '-'}<br>
                <b>ประเภทผิวจราจร:</b> ${r.surface_type || '-'}<br>
                <b>กว้างเฉลี่ย:</b> ${r.width} ม. · <b>ยาว:</b> ${(r.length_m || 0).toLocaleString()} ม.<br>
                <b>งบประมาณ/แหล่งที่มา:</b> ${r.budget_source || '-'}
                <div id="mini-map-${r.id}" style="height: 140px; width: 100%; margin-top: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: #0f172a; overflow: hidden; position: relative;"></div>
            `);
            polyline.bindPopup(popupHtml, { className: 'public-popup', minWidth: 260 });
            
            // Render mini map when popup opens
            polyline.on('popupopen', function() {
                setTimeout(() => {
                    const mapId = 'mini-map-' + r.id;
                    const container = document.getElementById(mapId);
                    if (container && !container._leaflet_id) {
                        const miniMap = L.map(container, {
                            zoomControl: false,
                            attributionControl: false,
                            dragging: false,
                            touchZoom: false,
                            scrollWheelZoom: false,
                            doubleClickZoom: false,
                            boxZoom: false
                        });
                        
                        L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=th&x={x}&y={y}&z={z}', {
                            maxZoom: 20
                        }).addTo(miniMap);
                        
                        const miniLine = L.polyline(polyline.getLatLngs(), { color: '#8b5cf6', weight: 4 }).addTo(miniMap);
                        
                        const latlngs = polyline.getLatLngs();
                        if (latlngs && latlngs.length > 0) {
                            // Leaflet can return array of latlngs or array of arrays for multi-polylines
                            const pts = (Array.isArray(latlngs[0]) && latlngs[0].lat === undefined) ? latlngs[0] : latlngs;
                            if (pts.length >= 2) {
                                L.circleMarker(pts[0], { radius: 4, color: '#ef4444', fillColor: 'white', fillOpacity: 1, weight: 2 }).addTo(miniMap); // Red Start
                                L.circleMarker(pts[pts.length - 1], { radius: 4, color: '#10b981', fillColor: 'white', fillOpacity: 1, weight: 2 }).addTo(miniMap); // Green End
                            }
                        }
                        
                        miniMap.fitBounds(miniLine.getBounds(), { padding: [15, 15], maxZoom: 18 });
                    }
                }, 100);
            });
            
            // Add permanent tooltip for road details
            if (r.road_name) {
                const tooltipHtml = `
                    <div style="text-align: center; line-height: 1.2; cursor: pointer;">
                        <div style="font-weight: 600; font-size: 0.75rem; color: #0f172a;">${r.road_name}</div>
                        <div style="font-size: 0.65rem; color: #475569; margin-top: 2px;">
                            ${r.surface_type || 'ไม่ระบุ'} • ${(r.length_m || 0).toLocaleString()} ม.
                        </div>
                    </div>
                `;
                polyline.bindTooltip(tooltipHtml, {
                    permanent: true,
                    direction: 'center',
                    className: 'road-label-tooltip',
                    interactive: true
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
                    const lightingIcon = L.divIcon({
                        className: 'custom-lighting-marker',
                        html: `<div style="color: #fde047; font-size: 16px; text-shadow: 0 0 5px rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-lightbulb"></i></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });
                    const circle = L.marker([p.lat, p.lng], { icon: lightingIcon });
                    circle.pole_code = p.pole_code;
                    circle.light_type = p.light_type;
                    const repairUrl = `citizen-services.html?autoOpen=electric&poleCode=${encodeURIComponent(p.pole_code || '')}`;
                    circle.bindPopup(buildInfraPopupHTML('เสาไฟฟ้าส่องสว่าง', p.pole_code, `<b>ประเภทโคม:</b> ${p.light_type || '-'}<br><b>สถานะ:</b> ${p.status === 'broken' ? 'ชำรุด' : 'ปกติ'}<div class="mt-3"><a href="${repairUrl}" target="_blank" class="btn btn-sm btn-warning w-100 fw-bold shadow-sm" style="font-size: 0.8rem; border-radius: 6px; color: #1e293b;"><i class="fa-solid fa-wrench me-1"></i> แจ้งซ่อมไฟฟ้า</a></div>`), { className: 'public-popup' });
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

        // 6.5 Water Meters
        const waterMeters = await DigitalInfraService.getWaterMeters();
        let waterMeterCount = 0;
        waterMeters.forEach(wm => {
            if (wm.latitude && wm.longitude) {
                waterMeterCount++;
                const meterIcon = L.divIcon({
                    className: 'custom-watermeter-marker',
                    html: `<div style="background-color: #3b82f6; color: white; width: 26px; height: 26px; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 13px;"><i class="fa-solid fa-faucet-drip"></i></div>`,
                    iconSize: [26, 26],
                    iconAnchor: [13, 13]
                });
                const marker = L.marker([wm.latitude, wm.longitude], { icon: meterIcon });
                let imgTag = wm.image_url ? `<div style="text-align:center;margin-top:5px;"><img src="${wm.image_url}" onclick="viewPublicImage('${wm.image_url}')" style="width:100%;max-height:100px;object-fit:cover;border-radius:5px;cursor:pointer;" title="คลิกเพื่อขยายภาพ"></div>` : '';
                marker.bindPopup(buildInfraPopupHTML('มาตรน้ำประปา', wm.meter_code, `
                    <b>บ้านเลขที่:</b> ${wm.house_number || '-'} หมู่ ${wm.village_no || '-'}<br>
                    <b>เจ้าของ:</b> ${wm.owner_name || '-'}<br>
                    <b>ผู้ดูแล:</b> ${wm.caretaker_name || '-'}
                    ${imgTag}
                `), { className: 'public-popup' });
                layers.waterMeter.addLayer(marker);
            }
        });
        const statWmEl = document.getElementById('stat-watermeter');
        if (statWmEl) statWmEl.textContent = waterMeterCount.toLocaleString();

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

function viewPublicImage(url) {
    const imgEl = document.getElementById('publicPreviewImageSrc');
    if (imgEl) {
        imgEl.src = url;
        const modalEl = document.getElementById('publicImagePreviewModal');
        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    }
}
