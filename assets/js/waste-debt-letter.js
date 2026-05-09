// ============================================
// พิมพ์หนังสือทวงหนี้ (2 หน้า) — เทศบาลเมืองบ้านเป็ด
// ============================================
var DEBT_LETTER_CONFIG = {
    orgName: 'เทศบาลเมืองบ้านเป็ด',
    orgAddr: '555 ม.2 ถ.เลี่ยงเมือง ต.บ้านเป็ด อ.เมือง จ.ขอนแก่น',
    orgTel: 'โทร. 043-423869-70 ต่อ 482',
    signerName: 'นางสาวปิยวรรณ จิตตะมัย',
    signerTitle: 'นายกเทศมนตรีเมืองบ้านเป็ด',
    tambon: 'ตำบลบ้านเป็ด',
    amphoe: 'อำเภอเมือง',
    province: 'จังหวัดขอนแก่น',
    postCode: '40000',
    postOfficeName: 'ไปรษณีย์ขอนแก่น 40000',
    garudaUrl: (function(){ var b = window.location.href; return b.substring(0, b.lastIndexOf('/')+1) + 'assets/img/garuda.png'; })(),
    bylawName: 'เทศบัญญัติเทศบาลเมืองบ้านเป็ด'
};

function buildDebtLetterCSS() {
    return [
        "@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');",
        "* { margin:0; padding:0; box-sizing:border-box; }",
        "body { font-family:'Sarabun','TH Sarabun New',sans-serif; font-size:16px; color:#1a1a1a; line-height:1.8; }",
        ".page { width:210mm; min-height:297mm; padding:25mm 25mm 20mm 30mm; position:relative; page-break-after:always; }",
        ".header-row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }",
        ".doc-no { font-size:15px; }",
        ".org-info { text-align:right; font-size:15px; line-height:1.6; }",
        ".garuda { text-align:center; margin:15px 0 8px; }",
        ".garuda img { height:80px; }",
        ".date-line { text-align:right; margin-bottom:18px; font-size:15px; }",
        ".subject { margin-bottom:4px; font-size:15px; }",
        ".subject b { font-weight:600; }",
        ".to-line { margin-bottom:18px; font-size:15px; }",
        ".body-text { text-indent:60px; text-align:justify; font-size:15px; margin-bottom:12px; }",
        ".closing { text-align:center; margin-top:30px; }",
        ".closing .regards { margin-bottom:50px; font-size:15px; }",
        ".closing .sign-title { font-size:14px; color:#333; }",
        ".footer-section { position:absolute; bottom:20mm; left:30mm; right:25mm; border-top:1px solid #ccc; padding-top:10px; }",
        ".footer-section .dept { font-size:13px; font-weight:600; }",
        ".footer-section .dept-tel { font-size:13px; color:#555; }",
        ".page2 { width:210mm; min-height:297mm; padding:30mm 25mm 20mm 30mm; position:relative; page-break-after:always; }",
        ".envelope-header { display:flex; align-items:flex-start; gap:15px; margin-bottom:50px; }",
        ".envelope-header img { height:55px; margin-top:5px; }",
        ".envelope-org { font-size:14px; line-height:1.6; }",
        ".envelope-org .name { font-weight:600; font-size:15px; }",
        ".stamp-box { position:absolute; top:30mm; right:25mm; width:55mm; border:2px solid #333; padding:10px 12px; text-align:center; font-size:13px; line-height:1.5; }",
        ".stamp-box .stamp-title { font-weight:600; font-size:14px; }",
        ".stamp-box .stamp-no { font-size:13px; margin-top:2px; }",
        ".stamp-box .stamp-post { font-size:12px; color:#555; margin-top:2px; }",
        ".send-to { margin-top:60px; margin-left:50px; font-size:15px; line-height:1.9; }",
        ".send-to .label { font-weight:600; margin-bottom:10px; }",
        ".send-to .addr { margin-left:30px; }",
        "@media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .page,.page2 { margin:0; padding:25mm 25mm 20mm 30mm; } }"
    ].join('\n');
}

function buildDebtLetterPages(d, year) {
    var cfg = DEBT_LETTER_CONFIG;
    var now = new Date();
    var thaiMonthNames = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    var thaiDate = now.getDate() + ' ' + thaiMonthNames[now.getMonth()] + ' ' + (now.getFullYear() + 543);
    var docYear = String(now.getFullYear() + 543);
    var docNo = 'ทม.บป.' + String(Math.floor(Math.random()*9000)+1000) + '/' + docYear.substring(2);
    var unpaidList = d.unpaid_months.join(', ');
    var feeText = formatMoney(d.fee);
    var totalText = formatMoney(d.total_debt);
    var monthCount = d.unpaid_count;
    var stampNo = String(Math.floor(Math.random()*900)+100) + '/' + docYear.substring(2) + String(parseInt(docYear.substring(2))+1);

    // Page 1
    var page1 = '<div class="page">' +
        '<div class="garuda"><img src="' + cfg.garudaUrl + '" alt="ครุฑ"></div>' +
        '<div class="header-row">' +
            '<div class="doc-no">ที่ ' + docNo + '</div>' +
            '<div class="org-info">' + cfg.orgName + '<br>' + cfg.orgAddr + '</div>' +
        '</div>' +
        '<div class="date-line">วันที่ ' + thaiDate + '</div>' +
        '<div class="subject"><b>เรื่อง</b>&nbsp;&nbsp;แจ้งเตือนให้ชำระค่าธรรมเนียมขยะมูลฝอยประจำปีงบประมาณ ' + year + ' ครั้งที่ ๑</div>' +
        '<div class="to-line"><b>เรียน</b>&nbsp;&nbsp;' + d.name + ' บ้านเลขที่ ' + d.house_no + ' หมู่ที่ ' + d.moo + '</div>' +
        '<div class="body-text">' +
            'ตามที่ ' + cfg.orgName + ' ได้ออก' + cfg.bylawName + ' ' +
            'เรื่องการจัดการสิ่งปฏิกูลและขยะมูลฝอย พ.ศ.๒๕๖๔ โดยประกาศ ณ วันที่ ๒๕ พฤษภาคม ๒๕๖๕ ' +
            'เพื่อให้เป็นไปตามพระราชบัญญัติการสาธารณสุข พ.ศ.๒๕๓๕ ให้อำนาจองค์กรปกครองส่วนท้องถิ่นกำหนด' +
            'ค่าธรรมเนียมให้เป็นไปตามความเหมาะสมกับแหล่งกำเนิดขยะมูลฝอย และไม่เกินกว่าที่กฎหมายกำหนดไว้ นั้น' +
        '</div>' +
        '<div class="body-text">' +
            cfg.orgName + ' จึงขอแจ้งมายังท่านให้ดำเนินการชำระค่าธรรมเนียมการให้' +
            'บริการเก็บขนและกำจัดสิ่งปฏิกูลหรือมูลฝอยเฉพาะเดือนที่ค้างชำระ ได้แก่ <b>' + unpaidList + '</b> ' +
            'รวมจำนวน <b>' + monthCount + ' เดือน</b> อัตราค่าธรรมเนียมเดือนละ <b>' + feeText + ' บาท</b> ' +
            'รวมเป็นเงินทั้งสิ้น <b>' + totalText + ' บาท</b> ชำระได้ที่' +
            'งานจัดเก็บรายได้ กองคลัง ' + cfg.orgName + ' หรือตรวจสอบยอดและชำระผ่านช่องทาง QR CODE ด้านล่างนี้' +
        '</div>' +
        '<div class="body-text">' +
            'จึงเรียนมาเพื่อโปรดทราบและขอความร่วมมือจากท่าน ไปชำระค่าธรรมเนียมดังกล่าวตามกำหนดเวลา' +
        '</div>' +
        '<div class="closing">' +
            '<div class="regards">ขอแสดงความนับถือ</div>' +
            '<div class="sign-line">' +
                '<div style="margin-bottom:5px;">(' + cfg.signerName + ')</div>' +
                '<div class="sign-title">' + cfg.signerTitle + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="footer-section">' +
            '<div class="dept">งานจัดเก็บรายได้ กองคลัง</div>' +
            '<div class="dept-tel">' + cfg.orgTel + '</div>' +
        '</div>' +
    '</div>';

    // Page 2
    var page2 = '<div class="page2">' +
        '<div class="stamp-box">' +
            '<div class="stamp-title">ชำระค่าฝากส่งเป็นรายเดือน</div>' +
            '<div class="stamp-no">ใบอนุญาตเลขที่<br>' + stampNo + '</div>' +
            '<div class="stamp-post">' + cfg.postOfficeName + '</div>' +
        '</div>' +
        '<div class="envelope-header">' +
            '<img src="' + cfg.garudaUrl + '" alt="ครุฑ">' +
            '<div class="envelope-org">' +
                '<div class="name">' + cfg.orgName + '</div>' +
                '<div>' + cfg.orgAddr + '</div>' +
                '<div>' + cfg.orgTel + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="send-to">' +
            '<div class="label">กรุณาส่ง</div>' +
            '<div class="addr">' +
                'เรียน ' + d.name + '<br>' +
                'ที่อยู่ ' + d.house_no + ' หมู่ที่ ' + d.moo + '<br>' +
                cfg.tambon + ' ' + cfg.amphoe + '<br>' +
                cfg.province + ' รหัสไปรษณีย์ ' + cfg.postCode +
            '</div>' +
        '</div>' +
    '</div>';

    return page1 + page2;
}

// พิมพ์ทวงหนี้รายบุคคล
function printDebtLetter(customerId) {
    var year = (typeof debtorSelectedYear !== 'undefined' && debtorSelectedYear) ? debtorSelectedYear : getCurrentFiscalYear();
    var debtors = calculateDebtors(year);
    var d = debtors.find(function(x){ return x.id === customerId; });
    if (!d) { showToast('ไม่พบข้อมูลลูกหนี้','error'); return; }

    var css = buildDebtLetterCSS();
    var pages = buildDebtLetterPages(d, year);
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' + css + '</style></head><body>' + pages + '</body></html>';

    var w = window.open('', '_blank', 'width=900,height=1200');
    w.document.write(html);
    w.document.close();
    setTimeout(function(){ w.print(); }, 600);
}

// พิมพ์ทวงหนี้ทั้งหมด
function printAllDebtLetters() {
    var year = (typeof debtorSelectedYear !== 'undefined' && debtorSelectedYear) ? debtorSelectedYear : getCurrentFiscalYear();
    var debtors = calculateDebtors(year);

    if (debtors.length === 0) {
        showToast('ไม่มีลูกหนี้ค้างชำระในปีนี้','warning');
        return;
    }

    Swal.fire({
        title: 'พิมพ์หนังสือทวงหนี้ทั้งหมด?',
        html: '<b>' + debtors.length + ' ราย</b> (' + (debtors.length * 2) + ' หน้า)<br><span style="font-size:13px;color:#6b7280;">ปีงบประมาณ ' + year + '</span>',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'พิมพ์ทั้งหมด',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#1a56db'
    }).then(function(r) {
        if (r.isConfirmed) {
            var css = buildDebtLetterCSS();
            var allPages = '';
            debtors.forEach(function(d) {
                allPages += buildDebtLetterPages(d, year);
            });
            var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' + css + '</style></head><body>' + allPages + '</body></html>';

            var w = window.open('', '_blank', 'width=900,height=1200');
            w.document.write(html);
            w.document.close();
            setTimeout(function(){ w.print(); }, 800);
        }
    });
}
