var reports = JSON.parse(localStorage.getItem('waterReports')) || [];
var currentPhotos = [];
var currentReportId = null;
var itemPhotos = {};

var LOGO_HOLDING = "logo-holding.png";
var LOGO_SAFETY = "logo-safety.png";
var API_URL = 'https://script.google.com/macros/s/AKfycbytn_qHb1Gg6AdipV5r7C6pREyMOC3b2g9EXDsXsgSam-keJuUM3VlPfRhvKB9y373Z/exec';

var inspectionItems = [
    { id: 'waterSurfaces', label: 'المسطحات المائية', type: 'normal' },
    { id: 'pumpHouses', label: 'عنابر الطلمبات', type: 'normal' },
    { id: 'chlorineRoom', label: 'عنبر الكلور', type: 'normal' },
    { id: 'generatorRoom', label: 'عنبر المولد وخزان الديزل', type: 'normal' },
    { id: 'transformers', label: 'المحولات', type: 'normal' },
    { id: 'laboratory', label: 'المعمل', type: 'normal' },
    { id: 'warehouses', label: 'المخازن', type: 'normal' },
    { id: 'chemicalRoom', label: 'عنبر الكيماويات', type: 'normal' },
    { id: 'confinedSpaces', label: 'الأماكن المغلقة', type: 'normal' },
    { id: 'safeProcedures', label: 'إجراءات العمل الآمنة واللوحات الإرشادية', type: 'normal' },
    { id: 'fireEquipment', label: 'معدات مكافحة الحريق وصناديق الإسعافات الأولية', type: 'normal' },
    { id: 'records', label: 'السجلات', type: 'normal' },
    { id: 'emergencyPlans', label: 'خطط الطوارئ', type: 'normal' },
    { id: 'staffTraining', label: 'تدريب العاملين', type: 'normal' },
    { id: 'ppe', label: 'مهمات الوقاية الشخصية', type: 'normal' },
    { id: 'safetyEquipment', label: 'معدات السلامة والصحة المهنية', type: 'normal' },
    { id: 'craneCerts', label: 'شهادات معايرة الأوناش', type: 'crane' }
];

document.addEventListener('DOMContentLoaded', function() {
    setCurrentDate();
    setDefaultDateTime();
    updateStats();
    buildInspectionItems();
    document.getElementById('designCapacity').addEventListener('input', calculateCapacity);
    document.getElementById('actualCapacity').addEventListener('input', calculateCapacity);
});

function buildInspectionItems() {
    var container = document.getElementById('inspectionItemsContainer');
    var html = '';
    inspectionItems.forEach(function(item, idx) {
        var isCrane = item.type === 'crane';
        var btnClass1 = isCrane ? 'exist' : 'compliant';
        var btnClass2 = isCrane ? 'not-exist' : 'non-compliant';
        var btnText1 = isCrane ? '<i class="fas fa-check-double"></i> يوجد' : '<i class="fas fa-check"></i> مطابق';
        var btnText2 = isCrane ? '<i class="fas fa-ban"></i> لا يوجد' : '<i class="fas fa-times"></i> غير مطابق';
        var toggleFn = isCrane ? 'toggleStatusCrane' : 'toggleStatus';
        var defaultVal = isCrane ? 'يوجد' : 'مطابق';
        var craneClass = isCrane ? ' item-crane' : '';
        var badge = isCrane ? '<span class="item-badge-special">يوجد / لا يوجد</span>' : '';

        html += '<div class="inspection-item-full' + craneClass + '">' +
            '<div class="item-header"><span class="item-number">' + (idx + 1) + '</span>' +
            '<span class="item-title">' + item.label + '</span>' + badge + '</div>' +
            '<div class="item-body">' +
            '<div class="item-controls">' +
            '<div class="status-toggle">' +
            '<button type="button" class="toggle-btn ' + btnClass1 + ' active" onclick="' + toggleFn + '(this,\'' + item.id + '\')">' + btnText1 + '</button>' +
            '<button type="button" class="toggle-btn ' + btnClass2 + '" onclick="' + toggleFn + '(this,\'' + item.id + '\')">' + btnText2 + '</button>' +
            '</div>' +
            '<textarea class="item-notes" id="' + item.id + '_notes" placeholder="التفاصيل..."></textarea>' +
            '</div>' +
            '<input type="hidden" id="' + item.id + '" value="' + defaultVal + '">' +
            '<div class="item-photo-section">' +
            '<div class="item-photo-btns">' +
            '<button type="button" class="item-photo-btn" onclick="pickItemPhoto(\'' + item.id + '\',false)"><i class="fas fa-images"></i> معرض</button>' +
            '<button type="button" class="item-photo-btn" onclick="pickItemPhoto(\'' + item.id + '\',true)"><i class="fas fa-camera"></i> كاميرا</button>' +
            '</div>' +
            '<div id="' + item.id + '_photo_preview"></div>' +
            '</div></div></div>';
    });
    container.innerHTML = html;
}

function pickItemPhoto(itemId, useCamera) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (useCamera) input.setAttribute('capture', 'environment');
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            itemPhotos[itemId] = ev.target.result;
            document.getElementById(itemId + '_photo_preview').innerHTML =
                '<div class="item-photo-preview"><img src="' + ev.target.result + '" alt="صورة">' +
                '<button class="item-photo-remove" onclick="removeItemPhoto(\'' + itemId + '\')"><i class="fas fa-times"></i></button></div>';
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function removeItemPhoto(itemId) {
    delete itemPhotos[itemId];
    document.getElementById(itemId + '_photo_preview').innerHTML = '';
}

function closeAbout(event) {
    if (event.target === event.currentTarget) document.getElementById('aboutModal').style.display = 'none';
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById(screenId).classList.add('active');
    if (screenId === 'reportsList') renderReportsList();
    if (screenId === 'newReport') resetForm();
    window.scrollTo(0, 0);
}

function setCurrentDate() {
    document.getElementById('currentDate').textContent =
        new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function setDefaultDateTime() {
    var now = new Date();
    document.getElementById('inspectionDate').value = now.toISOString().split('T')[0];
    document.getElementById('inspectionTime').value = now.toTimeString().slice(0, 5);
    updateTitleDate();
}

function updateTitleDate() {
    var date = document.getElementById('inspectionDate').value;
    if (date) document.getElementById('reportDateDisplay').textContent =
        new Date(date + 'T00:00:00').toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

function updateTitleStation() {
    var type = document.getElementById('stationType').value;
    var name = document.getElementById('stationName').value.trim();
    var d = 'لم يتم اختيار المحطة بعد';
    if (type && name) d = type + ' - ' + name;
    else if (type) d = type;
    else if (name) d = name;
    document.getElementById('reportStationDisplay').textContent = d;
}

function toggleYearField(selectId, yearId, msgId) {
    var s = document.getElementById(selectId), y = document.getElementById(yearId), m = document.getElementById(msgId);
    if (s.value === 'حاصلة') { y.style.display = 'block'; if (m) m.style.display = 'none'; }
    else { y.style.display = 'none'; y.value = ''; if (m) m.style.display = 'flex'; }
}

function toggleIsoType() {
    var s = document.getElementById('isoStatus'), t = document.getElementById('isoType'), m = document.getElementById('isoTypeMsg');
    if (s.value === 'حاصلة') { t.style.display = 'block'; m.style.display = 'none'; }
    else { t.style.display = 'none'; t.value = ''; m.style.display = 'flex'; }
}

function changeCapacityUnit() {
    document.getElementById('actualUnit').textContent = document.getElementById('capacityUnit').value;
    calculateCapacity();
}

function calculateCapacity() {
    var design = parseFloat(document.getElementById('designCapacity').value);
    var actual = parseFloat(document.getElementById('actualCapacity').value);
    var c = document.getElementById('capacityBarContainer');
    var f = document.getElementById('capacityFill');
    var t = document.getElementById('capacityText');
    if (design > 0 && actual >= 0) {
        var pct = Math.round((actual / design) * 100);
        c.style.display = 'block';
        f.style.width = Math.min(pct, 100) + '%';
        f.textContent = pct + '%';
        f.className = 'capacity-fill';
        if (pct > 100) { f.classList.add('danger'); t.textContent = '⚠️ تجاوز الطاقة بنسبة ' + (pct - 100) + '%'; t.style.color = '#dc2626'; }
        else if (pct > 85) { f.classList.add('warning'); t.textContent = 'نسبة التشغيل ' + pct + '%'; t.style.color = '#f59e0b'; }
        else { t.textContent = 'نسبة التشغيل ' + pct + '%'; t.style.color = '#0d9488'; }
    } else c.style.display = 'none';
}

function toggleStatus(btn, fieldId) {
    btn.parentElement.querySelectorAll('.toggle-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById(fieldId).value = btn.classList.contains('compliant') ? 'مطابق' : 'غير مطابق';
}

function toggleStatusCrane(btn, fieldId) {
    btn.parentElement.querySelectorAll('.toggle-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById(fieldId).value = btn.classList.contains('exist') ? 'يوجد' : 'لا يوجد';
}

function setSeverity(value, btn) {
    document.querySelectorAll('.severity-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('severity').value = value;
}

function updateOverallColor(s) {
    s.style.borderColor = s.value === 'مطابق' ? '#0d9488' : s.value === 'غير مطابق' ? '#dc2626' : s.value === 'يحتاج متابعة' ? '#f59e0b' : '#e2e8f0';
}

function getGPSLocation() {
    var cd = document.getElementById('gpsCoords'), li = document.getElementById('stationLocation');
    if (!navigator.geolocation) { cd.textContent = 'المتصفح لا يدعم تحديد الموقع'; cd.classList.add('visible'); return; }
    cd.textContent = '⏳ جاري تحديد الموقع...'; cd.classList.add('visible');
    navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude.toFixed(6), lng = pos.coords.longitude.toFixed(6);
        cd.dataset.lat = lat; cd.dataset.lng = lng; cd.textContent = '⏳ جاري تحديد العنوان...';
        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&accept-language=ar&addressdetails=1&zoom=18')
            .then(function(r) { return r.json(); }).then(function(data) {
                var name = '', full = '';
                if (data.address) {
                    var p = [];
                    if (data.address.road) p.push(data.address.road);
                    if (data.address.neighbourhood) p.push(data.address.neighbourhood);
                    if (data.address.suburb) p.push(data.address.suburb);
                    if (data.address.village) p.push(data.address.village);
                    if (data.address.town) p.push(data.address.town);
                    if (data.address.city) p.push(data.address.city);
                    if (data.address.state) p.push(data.address.state);
                    if (data.address.country) p.push(data.address.country);
                    var u = []; for (var i = 0; i < p.length; i++) if (u.indexOf(p[i]) === -1) u.push(p[i]);
                    name = u.join(' - ');
                }
                if (data.display_name) full = data.display_name;
                if (!name) name = full || (lat + ', ' + lng);
                cd.innerHTML = '<div style="margin-bottom:8px;"><i class="fas fa-map-marker-alt" style="color:#dc2626;"></i> <strong>العنوان:</strong><br><span style="font-size:14px;color:#1e293b;">' + name + '</span></div>' +
                    (full && full !== name ? '<div style="margin-bottom:8px;font-size:12px;color:#64748b;"><i class="fas fa-info-circle"></i> ' + full + '</div>' : '') +
                    '<div style="font-size:11px;opacity:0.7;margin-bottom:6px;"><i class="fas fa-crosshairs"></i> ' + lat + ', ' + lng + '</div>' +
                    '<a href="https://maps.google.com/?q=' + lat + ',' + lng + '" target="_blank" style="color:#1a73e8;font-weight:bold;">📍 خرائط جوجل</a>';
                if (!li.value.trim()) li.value = name;
            }).catch(function() {
                cd.innerHTML = '<i class="fas fa-map-pin"></i> ' + lat + ', ' + lng + '<br><a href="https://maps.google.com/?q=' + lat + ',' + lng + '" target="_blank" style="color:#1a73e8;">📍 خرائط جوجل</a>';
                if (!li.value.trim()) li.value = lat + ', ' + lng;
            });
    }, function(err) {
        var msg = '❌ تعذر تحديد الموقع. ';
        if (err.code === 1) msg += 'فعّل صلاحية الموقع';
        if (err.code === 2) msg += 'فعّل GPS';
        if (err.code === 3) msg += 'حاول مرة أخرى';
        cd.textContent = msg;
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
}

function handlePhotos(input) {
    var files = Array.from(input.files);
    if (currentPhotos.length + files.length > 12) { showToast('الحد الأقصى 12 صورة', true); return; }
    files.forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) { currentPhotos.push({ name: file.name, data: e.target.result }); renderPhotoPreview(); };
        reader.readAsDataURL(file);
    });
    input.value = '';
}

function renderPhotoPreview() {
    document.getElementById('photoPreview').innerHTML = currentPhotos.map(function(p, i) {
        return '<div class="photo-item"><img src="' + p.data + '" alt="صورة ' + (i + 1) + '"><button class="photo-remove" onclick="removePhoto(' + i + ')"><i class="fas fa-times"></i></button></div>';
    }).join('');
}

function removePhoto(index) { currentPhotos.splice(index, 1); renderPhotoPreview(); }

function collectInspectionData() {
    var data = {};
    inspectionItems.forEach(function(item) {
        data[item.id] = { label: item.label, type: item.type, status: document.getElementById(item.id).value, notes: document.getElementById(item.id + '_notes').value, photo: itemPhotos[item.id] || null };
    });
    return data;
}

function sendToGoogleSheets(report) {
    try {
        fetch(API_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: report.date, time: report.time, inspectorName: report.inspectorName, stationType: report.stationType, stationName: report.stationName, branch: report.branch, stationLocation: report.stationLocation, overallStatus: report.overallStatus, notes: report.notes })
        });
    } catch (e) { }
}

function autoSaveCSV(report) {
    var csvData = localStorage.getItem('csvReports') || 'التاريخ,الوقت,المفتش,نوع المحطة,اسم المحطة,الفرع,الموقع,الحالة,درجة الخطورة,الملاحظات,التوصيات\n';
    var row = '"' + report.date + '","' + report.time + '","' + report.inspectorName + '","' + report.stationType + '","' + report.stationName + '","' + report.branch + '","' + report.stationLocation + '","' + report.overallStatus + '","' + report.severity + '","' + (report.notes || '').replace(/"/g, '""') + '","' + (report.recommendations || '').replace(/"/g, '""') + '"\n';
    csvData += row;
    localStorage.setItem('csvReports', csvData);

    var BOM = '\uFEFF';
    var blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data-123.csv';
    link.click();
}

function saveReport() {
    var required = ['inspectorName', 'inspectionDate', 'inspectionTime', 'stationType', 'stationName', 'branch', 'stationLocation', 'safetyOfficer', 'stationManager', 'overallStatus'];
    for (var i = 0; i < required.length; i++) {
        var el = document.getElementById(required[i]);
        if (!el.value.trim()) { el.focus(); el.style.borderColor = '#dc2626'; showToast('يرجى ملء جميع الحقول المطلوبة', true); setTimeout(function() { el.style.borderColor = ''; }, 2000); return null; }
    }
    var cd = document.getElementById('gpsCoords');
    var design = document.getElementById('designCapacity').value;
    var actual = document.getElementById('actualCapacity').value;
    var unit = document.getElementById('capacityUnit').value;

    var report = {
        id: Date.now(), inspectorName: document.getElementById('inspectorName').value,
        date: document.getElementById('inspectionDate').value, time: document.getElementById('inspectionTime').value,
        stationType: document.getElementById('stationType').value, stationName: document.getElementById('stationName').value,
        branch: document.getElementById('branch').value, stationLocation: document.getElementById('stationLocation').value,
        gps: { lat: cd.dataset.lat || '', lng: cd.dataset.lng || '' },
        designCapacity: design ? parseFloat(design) : null, actualCapacity: actual ? parseFloat(actual) : null,
        capacityUnit: unit, capacityPercentage: (design && actual) ? Math.round((parseFloat(actual) / parseFloat(design)) * 100) : null,
        safetyOfficer: document.getElementById('safetyOfficer').value, stationManager: document.getElementById('stationManager').value,
        isoStatus: document.getElementById('isoStatus').value, isoType: document.getElementById('isoType').value || null,
        isoYear: document.getElementById('isoYear').value || null, tsmStatus: document.getElementById('tsmStatus').value,
        tsmYear: document.getElementById('tsmYear').value || null, inspectionData: collectInspectionData(),
        overallStatus: document.getElementById('overallStatus').value, severity: document.getElementById('severity').value,
        notes: document.getElementById('notes').value, recommendations: document.getElementById('recommendations').value,
        photos: currentPhotos, createdAt: new Date().toISOString()
    };

    reports.unshift(report);
    localStorage.setItem('waterReports', JSON.stringify(reports));
    updateStats();
    sendToGoogleSheets(report);
    autoSaveCSV(report);
    showToast('تم حفظ التقرير بنجاح ✅');
    return report;
}

function saveAndExportPDF() {
    var report = saveReport();
    if (report) { showToast('⏳ جاري تجهيز PDF...'); setTimeout(function() { generatePDF(report); }, 1000); }
}

function generatePDF(report) {
    var sc = report.overallStatus === 'مطابق' ? 'pdf-compliant' : report.overallStatus === 'غير مطابق' ? 'pdf-non-compliant' : 'pdf-follow-up';
    var unit = report.capacityUnit || 'م³/يوم';
    var capHTML = '';
    if (report.designCapacity && report.actualCapacity) {
        var pct = report.capacityPercentage, bc = pct > 100 ? '#dc2626' : pct > 85 ? '#f59e0b' : '#0d9488';
        capHTML = '<tr><td>الطاقة التصميمية</td><td>' + report.designCapacity.toLocaleString() + ' ' + unit + '</td></tr>' +
            '<tr><td>الطاقة الفعلية</td><td>' + report.actualCapacity.toLocaleString() + ' ' + unit + '</td></tr>' +
            '<tr><td>نسبة التشغيل</td><td><div class="pdf-capacity-bar"><div class="pdf-capacity-fill" style="width:' + Math.min(pct, 100) + '%;background:' + bc + ';">' + pct + '%</div></div></td></tr>';
    }
    var isoH = report.isoStatus === 'حاصلة' ? '✅ حاصلة' + (report.isoType ? ' - ' + report.isoType : '') + (report.isoYear ? ' - ' + report.isoYear : '') : '❌ غير حاصلة';
    var tsmH = report.tsmStatus === 'حاصلة' ? '✅ حاصلة' + (report.tsmYear ? ' - ' + report.tsmYear : '') : '❌ غير حاصلة';

    var itemsHTML = '';
    if (report.inspectionData) {
        var idx = 0;
        for (var key in report.inspectionData) {
            var item = report.inspectionData[key]; idx++;
            var ic = item.type === 'crane';
            var bg = ic ? (item.status === 'يوجد' ? 'pdf-exist' : 'pdf-not-exist') : (item.status === 'مطابق' ? 'pdf-compliant' : 'pdf-non-compliant');
            var icon = ic ? (item.status === 'يوجد' ? '✅' : '⛔') : (item.status === 'مطابق' ? '✅' : '❌');
            var photoTd = item.photo ? '<img src="' + item.photo + '" style="width:50px;height:50px;object-fit:cover;border-radius:4px;border:1px solid #e0e0e0;">' : '-';
            itemsHTML += '<tr><td style="text-align:center;font-weight:bold;color:#1a73e8;">' + idx + '</td><td>' + item.label + '</td><td><span class="pdf-status-badge ' + bg + '">' + icon + ' ' + item.status + '</span></td><td style="color:#666;">' + (item.notes || '-') + '</td><td style="text-align:center;">' + photoTd + '</td></tr>';
        }
    }

    var phHTML = '';
    if (report.photos && report.photos.length > 0) {
        var pg = report.photos.map(function(p, i) {
            return '<div style="width:24%;margin:0.5%;position:relative;"><img src="' + p.data + '" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px;border:1px solid #e0e0e0;display:block;"><div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:bold;">' + (i + 1) + '</div></div>';
        }).join('');
        phHTML = '<div class="pdf-section"><h3>📷 صور عامة للمحطة (' + report.photos.length + ' صورة)</h3><div style="display:flex;flex-wrap:wrap;gap:0;">' + pg + '</div></div>';
    }

    var df = new Date(report.date + 'T00:00:00').toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    var t = '<div class="pdf-content"><div class="pdf-header"><div class="pdf-header-logos">' +
        '<img src="' + LOGO_HOLDING + '" style="width:70px;height:70px;object-fit:contain;border-radius:8px;background:#fff;padding:4px;border:2px solid rgba(255,255,255,.3);display:block;">' +
        '<div class="pdf-header-titles"><h1>الشركة القابضة لمياه الشرب والصرف الصحي</h1><h2>الإدارة العامة للسلامة والصحة المهنية والطوارئ والأزمات</h2><h3>🚰 تقرير المرور على محطات مياه الشرب والصرف الصحي</h3></div>' +
        '<img src="' + LOGO_SAFETY + '" style="width:70px;height:70px;object-fit:contain;border-radius:8px;background:#fff;padding:4px;border:2px solid rgba(255,255,255,.3);display:block;">' +
        '</div><div class="pdf-meta">📅 ' + df + ' | 🏭 ' + report.stationType + ' - ' + report.stationName + '</div></div>' +
        '<div class="pdf-section"><h3>📋 المعلومات الأساسية</h3><table class="pdf-table">' +
        '<tr><td>اسم المفتش</td><td>' + report.inspectorName + '</td></tr>' +
        '<tr><td>التاريخ</td><td>' + report.date + '</td></tr>' +
        '<tr><td>الوقت</td><td>' + report.time + '</td></tr>' +
        '<tr><td>نوع المحطة</td><td>' + report.stationType + '</td></tr>' +
        '<tr><td>اسم المحطة</td><td>' + report.stationName + '</td></tr>' +
        '<tr><td>الفرع</td><td>' + report.branch + '</td></tr>' +
        '<tr><td>الموقع</td><td>' + report.stationLocation + '</td></tr>' +
        (report.gps.lat ? '<tr><td>GPS</td><td>' + report.gps.lat + ', ' + report.gps.lng + '</td></tr>' : '') +
        capHTML +
        '<tr><td>مسؤول السلامة</td><td>' + report.safetyOfficer + '</td></tr>' +
        '<tr><td>مدير المحطة</td><td>' + report.stationManager + '</td></tr>' +
        '<tr><td>شهادة الايزو</td><td>' + isoH + '</td></tr>' +
        '<tr><td>شهادة TSM</td><td>' + tsmH + '</td></tr></table></div>' +
        '<div style="page-break-before:always;"></div>' +
        '<div class="pdf-section"><h3>🔍 بنود الفحص</h3><table class="pdf-items-table"><thead><tr><th style="width:4%;">#</th><th style="width:28%;">البند</th><th style="width:14%;">النتيجة</th><th style="width:38%;">التفاصيل</th><th style="width:16%;">صورة</th></tr></thead><tbody>' + itemsHTML + '</tbody></table></div>' +
        '<div class="pdf-section"><h3>📊 التقييم العام</h3><table class="pdf-table"><tr><td>الحالة العامة</td><td><span class="pdf-status-badge ' + sc + '">' + report.overallStatus + '</span></td></tr><tr><td>درجة الخطورة</td><td>' + report.severity + '</td></tr></table></div>' +
        (report.notes ? '<div class="pdf-section"><h3>📝 الملاحظات</h3><p style="font-size:13px;line-height:1.8;">' + report.notes + '</p></div>' : '') +
        (report.recommendations ? '<div class="pdf-section"><h3>💡 التوصيات</h3><p style="font-size:13px;line-height:1.8;">' + report.recommendations + '</p></div>' : '') +
        phHTML +
        '<div class="pdf-footer"><p>الشركة القابضة لمياه الشرب والصرف الصحي</p><p>الإدارة العامة للسلامة والصحة المهنية والطوارئ والأزمات</p><p>' + new Date().toLocaleDateString('ar-EG') + ' - ' + new Date().toLocaleTimeString('ar-EG') + '</p></div></div>';

    var td = document.getElementById('pdfTemplate');
    td.innerHTML = t; td.style.display = 'block';
    html2pdf().set({
        margin: 10,
        filename: 'reports_' + report.stationName + '_' + report.date + '.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(td).save().then(function() {
        td.style.display = 'none';
        showToast('تم تصدير PDF بنجاح 📄');
        showScreen('mainScreen');
    }).catch(function() {
        td.style.display = 'none';
        showToast('خطأ في تصدير PDF', true);
    });
}

function renderReportsList() {
    var c = document.getElementById('reportsContainer');
    if (reports.length === 0) {
        c.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-light);"><i class="fas fa-inbox" style="font-size:60px;margin-bottom:15px;opacity:0.3;display:block;"></i><p style="font-size:16px;">لا توجد تقارير بعد</p></div>';
        return;
    }
    c.innerHTML = reports.map(function(r) {
        var sc = r.overallStatus === 'مطابق' ? 'status-compliant' : r.overallStatus === 'غير مطابق' ? 'status-non-compliant' : 'status-follow-up';
        var bc = r.overallStatus === 'مطابق' ? 'badge-compliant' : r.overallStatus === 'غير مطابق' ? 'badge-non-compliant' : 'badge-follow-up';
        var ic = (r.stationType.includes('مياه') || r.stationType.includes('تنقية') || r.stationType.includes('تحلية')) ? 'fa-tint' : 'fa-toilet';
        return '<div class="report-card ' + sc + '" onclick="viewReport(' + r.id + ')"><div class="report-card-icon"><i class="fas ' + ic + '"></i></div><div class="report-card-info"><h4>' + (r.stationName || r.stationType) + '</h4><p>' + r.stationType + ' &bull; ' + (r.branch || '') + '</p><p>' + r.date + ' &bull; ' + r.time + '</p><p><i class="fas fa-map-marker-alt"></i> ' + r.stationLocation + '</p><p><i class="fas fa-user-tie"></i> ' + r.inspectorName + '</p></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;"><span class="report-card-badge ' + bc + '">' + r.overallStatus + '</span><button class="btn btn-small btn-danger" style="padding:5px 10px;font-size:11px;" onclick="event.stopPropagation();deleteReport(' + r.id + ')"><i class="fas fa-trash"></i></button></div></div>';
    }).join('');
}

function filterReports() {
    var s = document.getElementById('searchInput').value.toLowerCase(), st = document.getElementById('filterStatus').value, cards = document.querySelectorAll('.report-card');
    reports.forEach(function(r, i) {
        var ms = (r.stationName || '').toLowerCase().includes(s) || (r.branch || '').toLowerCase().includes(s) || r.stationType.toLowerCase().includes(s) || r.stationLocation.toLowerCase().includes(s) || r.inspectorName.toLowerCase().includes(s);
        var mt = st === 'all' || r.overallStatus === st;
        if (cards[i]) cards[i].style.display = (ms && mt) ? 'flex' : 'none';
    });
}

function viewReport(id) {
    var r = reports.find(function(x) { return x.id === id; });
    if (!r) return;
    currentReportId = id;
    var unit = r.capacityUnit || 'م³/يوم';
    var capH = '';
    if (r.designCapacity && r.actualCapacity) {
        var pct = r.capacityPercentage, col = pct > 100 ? '#dc2626' : pct > 85 ? '#f59e0b' : '#0d9488';
        capH = '<div class="detail-row"><span class="detail-label">الطاقة التصميمية</span><span class="detail-value">' + r.designCapacity.toLocaleString() + ' ' + unit + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">الطاقة الفعلية</span><span class="detail-value">' + r.actualCapacity.toLocaleString() + ' ' + unit + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">نسبة التشغيل</span><span class="detail-value" style="color:' + col + ';font-weight:700;">' + pct + '%</span></div>';
    }
    var isoC = '<div class="detail-row"><span class="detail-label">شهادة الايزو</span><span class="detail-value"><span class="cert-badge ' + (r.isoStatus === 'حاصلة' ? 'has-cert' : 'no-cert') + '">' + (r.isoStatus === 'حاصلة' ? '✅' : '❌') + ' ' + r.isoStatus + (r.isoStatus === 'حاصلة' && r.isoType ? ' - ' + r.isoType : '') + (r.isoStatus === 'حاصلة' && r.isoYear ? ' - ' + r.isoYear : '') + '</span></span></div>';
    var tsmC = '<div class="detail-row"><span class="detail-label">شهادة TSM</span><span class="detail-value"><span class="cert-badge ' + (r.tsmStatus === 'حاصلة' ? 'has-cert' : 'no-cert') + '">' + (r.tsmStatus === 'حاصلة' ? '✅' : '❌') + ' ' + r.tsmStatus + (r.tsmStatus === 'حاصلة' && r.tsmYear ? ' - ' + r.tsmYear : '') + '</span></span></div>';

    var itemsH = '';
    if (r.inspectionData) {
        var idx = 0;
        for (var k in r.inspectionData) {
            var it = r.inspectionData[k]; idx++;
            var ic = it.type === 'crane';
            var scl = ic ? (it.status === 'يوجد' ? 'status-exist' : 'status-not') : (it.status === 'مطابق' ? 'status-ok' : 'status-nok');
            var icon = ic ? (it.status === 'يوجد' ? '✅' : '⛔') : (it.status === 'مطابق' ? '✅' : '❌');
            itemsH += '<div class="detail-item-row"><div class="detail-item-header"><span class="detail-item-num ' + (ic ? 'crane-num' : '') + '">' + idx + '</span><span class="detail-item-name">' + it.label + '</span><span class="detail-item-status ' + scl + '">' + icon + ' ' + it.status + '</span></div>' +
                (it.notes ? '<div class="detail-item-notes">' + it.notes + '</div>' : '') +
                (it.photo ? '<img class="detail-item-photo" src="' + it.photo + '" alt="صورة">' : '') + '</div>';
        }
    }

    var phH = '';
    if (r.photos && r.photos.length > 0) {
        phH = '<div class="detail-section"><h3><i class="fas fa-camera"></i> صور عامة للمحطة</h3><div class="detail-photos">' +
            r.photos.map(function(p) { return '<img src="' + p.data + '" alt="صورة">'; }).join('') + '</div></div>';
    }

    var sb = r.overallStatus === 'مطابق' ? 'badge-compliant' : r.overallStatus === 'غير مطابق' ? 'badge-non-compliant' : 'badge-follow-up';

    document.getElementById('reportDetail').innerHTML =
        '<div class="detail-section"><h3><i class="fas fa-info-circle"></i> المعلومات الأساسية</h3>' +
        '<div class="detail-row"><span class="detail-label">المفتش</span><span class="detail-value">' + r.inspectorName + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">التاريخ</span><span class="detail-value">' + r.date + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">الوقت</span><span class="detail-value">' + r.time + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">نوع المحطة</span><span class="detail-value">' + r.stationType + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">اسم المحطة</span><span class="detail-value">' + r.stationName + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">الفرع</span><span class="detail-value">' + (r.branch || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">الموقع</span><span class="detail-value">' + r.stationLocation + '</span></div>' +
        (r.gps.lat ? '<div class="detail-row"><span class="detail-label">GPS</span><span class="detail-value"><a href="https://maps.google.com/?q=' + r.gps.lat + ',' + r.gps.lng + '" target="_blank" style="color:var(--primary);">📍 ' + r.gps.lat + ', ' + r.gps.lng + '</a></span></div>' : '') +
        capH +
        '<div class="detail-row"><span class="detail-label">مسؤول السلامة</span><span class="detail-value">' + r.safetyOfficer + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">مدير المحطة</span><span class="detail-value">' + r.stationManager + '</span></div>' +
        isoC + tsmC + '</div>' +
        '<div class="detail-section"><h3><i class="fas fa-clipboard-check"></i> بنود الفحص</h3>' + itemsH + '</div>' +
        '<div class="detail-section"><h3><i class="fas fa-flag"></i> التقييم العام</h3>' +
        '<div class="detail-row"><span class="detail-label">الحالة</span><span class="report-card-badge ' + sb + '">' + r.overallStatus + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">الخطورة</span><span class="detail-value">' + r.severity + '</span></div></div>' +
        (r.notes ? '<div class="detail-section"><h3><i class="fas fa-sticky-note"></i> الملاحظات</h3><p style="line-height:1.8;">' + r.notes + '</p></div>' : '') +
        (r.recommendations ? '<div class="detail-section"><h3><i class="fas fa-lightbulb"></i> التوصيات</h3><p style="line-height:1.8;">' + r.recommendations + '</p></div>' : '') +
        phH +
        '<div style="display:flex;gap:12px;margin-top:10px;"><button class="btn btn-primary" style="flex:1;" onclick="exportCurrentPDF()"><i class="fas fa-file-pdf"></i> PDF</button><button class="btn btn-danger" style="flex:1;" onclick="deleteReport(' + r.id + ');showScreen(\'reportsList\');"><i class="fas fa-trash"></i> حذف</button></div>';
    showScreen('viewReport');
}

function exportCurrentPDF() {
    var r = reports.find(function(x) { return x.id === currentReportId; });
    if (r) generatePDF(r);
}

function deleteReport(id) {
    if (confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
        reports = reports.filter(function(r) { return r.id !== id; });
        localStorage.setItem('waterReports', JSON.stringify(reports));
        updateStats(); renderReportsList(); showToast('تم حذف التقرير');
    }
}

function updateStats() {
    document.getElementById('totalReports').textContent = reports.length;
    document.getElementById('compliantCount').textContent = reports.filter(function(r) { return r.overallStatus === 'مطابق'; }).length;
    document.getElementById('nonCompliantCount').textContent = reports.filter(function(r) { return r.overallStatus === 'غير مطابق'; }).length;
}

function resetForm() {
    document.getElementById('inspectionForm').reset();
    currentPhotos = []; itemPhotos = {};
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('gpsCoords').className = 'gps-display';
    document.getElementById('gpsCoords').dataset.lat = '';
    document.getElementById('gpsCoords').dataset.lng = '';
    document.getElementById('capacityBarContainer').style.display = 'none';
    document.getElementById('reportStationDisplay').textContent = 'لم يتم اختيار المحطة بعد';
    document.getElementById('actualUnit').textContent = 'م³/يوم';
    document.getElementById('isoStatus').value = 'غير حاصلة';
    document.getElementById('isoType').value = ''; document.getElementById('isoType').style.display = 'none';
    document.getElementById('isoTypeMsg').style.display = 'flex';
    document.getElementById('isoYear').value = ''; document.getElementById('isoYear').style.display = 'none';
    document.getElementById('isoYearMsg').style.display = 'flex';
    document.getElementById('tsmStatus').value = 'غير حاصلة';
    document.getElementById('tsmYear').value = ''; document.getElementById('tsmYear').style.display = 'none';
    document.getElementById('tsmYearMsg').style.display = 'flex';
    buildInspectionItems();
    document.querySelectorAll('.severity-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelector('.severity-btn.low').classList.add('active');
    document.getElementById('severity').value = 'منخفضة';
    setDefaultDateTime();
}

function showToast(message, isError) {
    var toast = document.getElementById('successToast');
    document.getElementById('toastMessage').textContent = message;
    toast.style.background = isError ? '#dc2626' : '#0d9488';
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 3000);
}
