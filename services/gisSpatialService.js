/**
 * services/gisSpatialService.js
 * GIS Spatial Layer Service — Managing geometries in Supabase PostgreSQL master database
 * Smart Governance Municipality Platform
 */

const GISSpatialService = {
    // === CONFIG & FALLBACKS ===
    targetTable: 'digital_infrastructure_roads',
    
    /**
     * ดึงข้อมูลพิกัดและถนนหลวงท้องถิ่นทั้งหมดจาก Master GIS Database
     * @returns {Promise<Array>} รายการถนนพร้อมพิกัด
     */
    async loadRoads() {
        console.log("GISSpatialService: Loading roads from PostgreSQL master GIS...");
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from(this.targetTable)
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                if (data) {
                    // แปลงค่าฟิลด์เพื่อให้เข้ากันได้แบบ 100% กับฟังก์ชันฝั่ง UI/UX เดิมที่เรียกใช้ฟิลด์เดิม
                    return data.map(r => this._mapDatabaseToUI(r));
                }
            } catch (err) {
                console.error("GISSpatialService: Fetch failed, falling back to mock storage:", err);
            }
        }
        
        // Fallback ไปข้อมูลจำลองหากไม่มีการเชื่อมต่อจริง
        return (typeof DigitalInfraService !== 'undefined' ? DigitalInfraService.mockRoads : []).map(r => this._mapDatabaseToUI(r));
    },

    /**
     * ขึ้นทะเบียนและบันทึกรายละเอียดพิกัดทางภูมิศาสตร์ถนน
     * @param {Object} payload ข้อมูลรายละเอียดถนนจากหน้า UI
     * @returns {Promise<Object>} ผลลัพธ์การบันทึก
     */
    async saveGeometry(payload) {
        console.log("GISSpatialService: Saving master GIS data road payload:", payload);
        
        // แปลงฟอร์แมตข้อมูลจาก UI เป็นของตารางโครงสร้างใหม่ในฐานข้อมูลหลัก
        const dbPayload = this._mapUIToDatabase(payload);
        
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const isNew = !payload.id;
                let resultData;
                
                if (isNew) {
                    delete dbPayload.id; // ให้ Supabase สร้าง UUID อัตโนมัติ
                    const { data, error } = await supabaseClient
                        .from(this.targetTable)
                        .insert([dbPayload])
                        .select();
                    
                    if (error) throw error;
                    resultData = data[0];
                } else {
                    const { data, error } = await supabaseClient
                        .from(this.targetTable)
                        .update(dbPayload)
                        .eq('id', payload.id)
                        .select();
                    
                    if (error) throw error;
                    resultData = data[0];
                }
                
                // นอกจากบันทึกตารางใหม่แล้ว ให้บันทึกตารางเดิม (infra_roads) ควบคู่เพื่อไม่ให้โปรแกรมจุดอื่นที่มีการเชื่อมต่อไปยังตารางเก่าขัดข้อง
                try {
                    const oldPayload = { ...payload };
                    if (isNew && resultData) oldPayload.id = resultData.id;
                    await supabaseClient.from('infra_roads').upsert([oldPayload]);
                } catch (oldErr) {
                    console.warn("GISSpatialService: Backwards-compatibility upsert to 'infra_roads' bypassed:", oldErr);
                }

                return this._mapDatabaseToUI(resultData);
            } catch (err) {
                console.error("GISSpatialService: Save to PostgreSQL failed, using memory sync:", err);
                throw err;
            }
        }
        
        // Mock Fallback
        if (!payload.id) {
            payload.id = 'mock_' + Date.now();
            if (typeof DigitalInfraService !== 'undefined') DigitalInfraService.mockRoads.push(payload);
        } else {
            if (typeof DigitalInfraService !== 'undefined') {
                const idx = DigitalInfraService.mockRoads.findIndex(r => r.id === payload.id);
                if (idx !== -1) DigitalInfraService.mockRoads[idx] = payload;
            }
        }
        return payload;
    },

    /**
     * ทำการแก้ไขข้อมูลเฉพาะพิกัดเรขาคณิต (Geometry Data Only)
     * @param {string} id ID ของแนวเส้นทางถนน
     * @param {Object} geojson ข้อมูลรูปทรง GeoJSON ชุดใหม่
     */
    async updateGeometry(id, geojson) {
        console.log(`GISSpatialService: Updating geometry only for road ID: ${id}`);
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const { data, error } = await supabaseClient
                .from(this.targetTable)
                .update({
                    geometry_geojson: geojson,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            
            // ปรับปรุงตารางเดิม (infra_roads) ควบคู่เพื่อความสม่ำเสมอ
            try {
                await supabaseClient.from('infra_roads').update({ geom: geojson }).eq('id', id);
            } catch(oldErr){}
            
            return data[0];
        }
        
        // Mock update
        if (typeof DigitalInfraService !== 'undefined') {
            const road = DigitalInfraService.mockRoads.find(r => r.id === id);
            if (road) road.geom = geojson;
        }
        return { id, geom: geojson };
    },

    /**
     * ลบแนวพิกัดและรายละเอียดของถนนออกสถาปัตยกรรมเชิงพื้นที่
     * @param {string} id ID ของถนน
     */
    async deleteGeometry(id) {
        console.log(`GISSpatialService: Removing GIS database records for ID: ${id}`);
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const { error } = await supabaseClient
                .from(this.targetTable)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            // ลบตารางเดิม (infra_roads) ควบคู่ด้วย
            try {
                await supabaseClient.from('infra_roads').delete().eq('id', id);
            } catch(oldErr){}
            
            return true;
        }
        
        // Mock delete
        if (typeof DigitalInfraService !== 'undefined') {
            const idx = DigitalInfraService.mockRoads.findIndex(r => r.id === id);
            if (idx !== -1) DigitalInfraService.mockRoads.splice(idx, 1);
        }
        return true;
    },

    /**
     * แปลงพิกัด Leaflet [lat, lng] Array ให้เป็นมาตรฐานสากล GeoJSON LineString
     * @param {Array} points อาเรย์พิกัดภูมิศาสตร์ Leaflet [ [lat, lng], [lat, lng], ... ]
     * @returns {Object|null} โครงสร้าง GeoJSON LineString
     */
    convertLeafletToGeoJSON(points) {
        if (!points || points.length < 2) return null;
        return {
            type: "LineString",
            coordinates: points.map(pt => [pt[1], pt[0]]) // แปลงกลับเป็น [longitude, latitude] ตามมาตรฐาน GeoJSON
        };
    },

    // === PRIVATE MAPPER HELPERS ===
    
    /**
     * Map ฟิลด์จาก UI/UX ปัจจุบัน เข้าตารางใหม่ของ PostgreSQL เพื่อความเป็นระเบียบและตรงตามสเปก
     */
    _mapUIToDatabase(ui) {
        let geom = ui.geom;
        if (typeof geom === 'string') {
            try {
                geom = JSON.parse(geom);
            } catch (e) {
                console.error("GISSpatialService: Failed to parse ui.geom string:", e);
            }
        }
        return {
            id: ui.id,
            road_code: ui.road_id || '',
            road_name: ui.road_name || '',
            road_type: ui.road_type || '',
            road_width: parseFloat(ui.width) || null,
            road_length: parseFloat(ui.length_m) || null,
            village_no: parseInt(ui.village_no) || null,
            construction_year: parseInt(ui.construction_year) || null,
            road_status: ui.status || 'good',
            start_latitude: parseFloat(ui.latitude) || null,
            start_longitude: parseFloat(ui.longitude) || null,
            created_by: ui.created_by || 'Civil Officer',
            updated_at: new Date().toISOString(),
            geometry_geojson: geom || null,
            
            // ฟิลด์สนับสนุน UI/UX เพื่อไม่ให้ระบบเดิมพัง
            road_cl: ui.road_cl || 'ทางหลวงท้องถิ่นชั้น 3',
            surface_type: ui.surface_type || 'คอนกรีตเสริมเหล็ก',
            budget_source: ui.budget_source || '',
            budget_amount: parseFloat(ui.budget_amount) || null,
            plan_year: parseInt(ui.plan_year) || null
        };
    },

    /**
     * Map ฟิลด์จากตารางใหม่ กลับไปเป็นฟิลด์ UI/UX ดั้งเดิม เพื่อให้ตัวระบบและตารางเดิมใช้งานต่อไปได้โดยไม่ต้องปรับแต่งฟิลด์แสดงผล
     */
    _mapDatabaseToUI(db) {
        if (!db) return null;
        let geom = db.geometry_geojson;
        if (typeof geom === 'string') {
            try {
                geom = JSON.parse(geom);
            } catch (e) {
                console.error("GISSpatialService: Failed to parse db.geometry_geojson string:", e);
                geom = null;
            }
        }
        return {
            id: db.id,
            road_id: db.road_code,
            road_name: db.road_name,
            road_type: db.road_type,
            width: db.road_width,
            length_m: db.road_length,
            village_no: String(db.village_no || '1'),
            construction_year: db.construction_year,
            status: db.road_status,
            latitude: db.start_latitude,
            longitude: db.start_longitude,
            geom: geom, // ใช้ GeoJSON แทน geom binary
            created_at: db.created_at,
            updated_at: db.updated_at,
            created_by: db.created_by,
            
            // ดึงฟิลด์สนับสนุนที่เพิ่มเข้ามาเพื่อหล่อเลี้ยง UI ให้ทำงานต่อไปได้
            road_cl: db.road_cl,
            surface_type: db.surface_type,
            budget_source: db.budget_source,
            budget_amount: db.budget_amount,
            plan_year: db.plan_year
        };
    }
};

// ส่งออกบริการไปยังขอบเขตของ Window
window.GISSpatialService = GISSpatialService;
