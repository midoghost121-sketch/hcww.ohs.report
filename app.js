var reports = JSON.parse(localStorage.getItem('waterReports')) || [];
var currentPhotos = [];
var currentReportId = null;

var LOGO_HOLDING = "logo-holding.png";
var LOGO_SAFETY = "logo-safety.png";

// رابط Google Sheets
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
    document.getElementById('designCapacity').addEventListener('input', calculateCapacity);
    document.getElementById('actualCapacity').addEventListener('input', calculateCapacity);
});

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById(screenId).classList.add('active');
    if (screenId === 'reportsList') renderReportsList();
    if (screenId === 'newReport') resetForm();
    window.scrollTo(0, 0);
}

function setCurrentDate() {
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ar-EG', options);
}

function setDefaultDateTime() {
    var now = new Date();
    document.getElementById('inspectionDate').value = now.toISOString().split('T')[0];
    document.getElementById('inspectionTime').value = now.toTimeString().slice(0, 5);
    updateTitleDate();
}

function updateTitleDate() {
    var date = document.getElementById('inspectionDate').value;
    if (date) {
        var options = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('reportDateDisplay').textContent =
            new Date(date + 'T00:00:00').toLocaleDateString('ar-EG', options);
    }
}

function updateTitleStation() {
    var type = document.getElementById('stationType').value;
    var name = document.getElementById('stationName').value.trim();
    var display = 'لم يتم اختيار المحطة بعد';
    if (type && name) display = type + ' - ' + name;
    else if (type) display = type;
    else if (name) display = name;
    document.getElementById('reportStationDisplay').textContent = display;
}

function toggleYearField(selectId, yearId, msgId) {
    var select = document.getElementById(selectId);
    var yearInput = document.getElementById(yearId);
    var msgEl = document.getElementById(msgId);
    if (select.value === 'حاصلة') {
        yearInput.style.display = 'block';
        if (msgEl) msgEl.style.display = 'none';
    } else {
        yearInput.style.display = 'none';
        yearInput.value = '';
        if (msgEl) msgEl.style.display = 'flex';
    }
}

function toggleIsoType() {
    var select = document.getElementById('isoStatus');
    var typeInput = document.getElementById('isoType');
    var typeMsg = document.getElementById('isoTypeMsg');
    if (select.value === 'حاصلة') {
        typeInput.style.display = 'block';
        typeMsg.style.display = 'none';
    } else {
        typeInput.style.display = 'none';
        typeInput.value = '';
        typeMsg.style.display = 'flex';
    }
}

function changeCapacityUnit() {
    var unit = document.getElementById('capacityUnit').value;
    document.getElementById('actualUnit').textContent = unit;
    calculateCapacity();
}

function calculateCapacity() {
    var design = parseFloat(document.getElementById('designCapacity').value);
    var actual = parseFloat(document.getElementById('actualCapacity').value);
    var container = document.getElementById('capacityBarContainer');
    var fill = document.getElementById('capacityFill');
    var text = document.getElementById('capacityText');

    if (design > 0 && actual >= 0) {
        var pct = Math.round((actual / design) * 100);
        container.style.display = 'block';
        fill.style.width = Math.min(pct, 100) + '%';
        fill.textContent = pct + '%';
        fill.className = 'capacity-fill';
        if (pct > 100) {
            fill.classList.add('danger');
            text.textContent = '⚠️ تحذير: المحطة تعمل بأكثر من طاقتها التصميمية بنسبة ' + (pct - 100) + '%';
            text.style.color = '#dc2626';
        } else if (pct > 85) {
            fill.classList.add('warning');
            text.textContent = 'المحطة تعمل بنسبة ' + pct + '% من طاقتها التصميمية';
            text.style.color = '#f59e0b';
        } else {
            text.textContent = 'المحطة تعمل بنسبة ' + pct + '% من طاقتها التصميمية';
            text.style.color = '#0d9488';
        }
    } else {
        container.style.display = 'none';
    }
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

function updateOverallColor(select) {
    select.style.borderColor =
        select.value === 'مطابق' ? '#0d9488' :
        select.value === 'غير مطابق' ? '#dc2626' :
        select.value === 'يحتاج متابعة' ? '#f59e0b' : '#e2e8f0';
}

function getGPSLocation() {
    var coordsDiv = document.getElementById('gpsCoords');
    var locationInput = document.getElementById('stationLocation');

    if (!navigator.geolocation) {
        coordsDiv.textContent = 'المتصفح لا يدعم تحديد الموقع';
        coordsDiv.classList.add('visible');
        return;
    }

    coordsDiv.textContent = '⏳ جاري تحديد الموقع...';
    coordsDiv.classList.add('visible');

    navigator.geolocation.getCurrentPosition(
        function(position) {
            var lat = position.coords.latitude.toFixed(6);
            var lng = position.coords.longitude.toFixed(6);
            coordsDiv.dataset.lat = lat;
            coordsDiv.dataset.lng = lng;
            coordsDiv.textContent = '⏳ جاري تحديد عنوان الموقع...';

            var url = 'https://nominatim.openstreetmap.org/reverse?format=json' +
                '&lat=' + lat + '&lon=' + lng + '&accept-language=ar&addressdetails=1&zoom=18';

            fetch(url)
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    var locationName = '';
                    var fullAddress = '';

                    if (data.address) {
                        var parts = [];
                        if (data.address.road) parts.push(data.address.road);
                        if (data.address.neighbourhood) parts.push(data.address.neighbourhood);
                        if (data.address.suburb) parts.push(data.address.suburb);
                        if (data.address.village) parts.push(data.address.village);
                        if (data.address.town) parts.push(data.address.town);
                        if (data.address.city) parts.push(data.address.city);
                        if (data.address.city_district) parts.push(data.address.city_district);
                        if (data.address.county) parts.push(data.address.county);
                        if (data.address.state) parts.push(data.address.state);
                        if (data.address.postcode) parts.push(data.address.postcode);
                        if (data.address.country) parts.push(data.address.country);

                        var unique = [];
                        for (var i = 0; i < parts.length; i++) {
                            if (unique.indexOf(parts[i]) === -1) unique.push(parts[i]);
                        }
                        locationName = unique.join(' - ');
                    }

                    if (data.display_name) fullAddress = data.display_name;
                    if (!locationName) locationName = fullAddress || (lat + ', ' + lng);

                    coordsDiv.innerHTML =
                        '<div style="margin-bottom:8px;">' +
                        '<i class="fas fa-map-marker-alt" style="color:#dc2626;"></i> ' +
                        '<strong>العنوان:</strong><br>' +
                        '<span style="font-size:14px;color:#1e293b;">' + locationName + '</span></div>' +
                        (fullAddress && fullAddress !== locationName ?
                            '<div style="margin-bottom:8px;font-size:12px;color:#64748b;">' +
                            '<i class="fas fa-info-circle"></i> العنوان الكامل: ' + fullAddress + '</div>' : '') +
                        '<div style="font-size:11px;opacity:0.7;margin-bottom:6px;">' +
                        '<i class="fas fa-crosshairs"></i> الإحداثيات: ' + lat + ', ' + lng + '</div>' +
                        '<a href="https://maps.google.com/?q=' + lat + ',' + lng + '" target="_blank" ' +
                        'style="color:#1a73e8;font-weight:bold;">📍 فتح في خرائط جوجل</a>';

                    if (!locationInput.value.trim()) locationInput.value = locationName;
                })
                .catch(function() {
                    coordsDiv.innerHTML =
                        '<i class="fas fa-map-pin"></i> تم تحديد الموقع: ' + lat + ', ' + lng + '<br>' +
                        '<a href="https://maps.google.com/?q=' + lat + ',' + lng + '" target="_blank" ' +
                        'style="color:#1a73e8;font-weight:bold;">📍 فتح في خرائط جوجل</a>';
                    if (!locationInput.value.trim()) locationInput.value = lat + ', ' + lng;
                });
        },
        function(error) {
            var msg = '❌ تعذر تحديد الموقع. ';
            if (error.code === 1) msg += 'اضغط السماح لتفعيل صلاحية الموقع';
            if (error.code === 2) msg += 'فعّل GPS من الإعدادات';
            if (error.code === 3) msg += 'انتهت المهلة. حاول مرة أخرى';
            coordsDiv.textContent = msg;
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
}

function handlePhotos(input) {
    var files = Array.from(input.files);
    if (currentPhotos.length + files.length > 12) {
        showToast('الحد الأقصى 12 صورة فقط', true);
        return;
    }
    files.forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            currentPhotos.push({ name: file.name, data: e.target.result });
            renderPhotoPreview();
        };
        reader.readAsDataURL(file);
    });
    input.value = '';
}

function renderPhotoPreview() {
    document.getElementById('photoPreview').innerHTML =
        currentPhotos.map(function(photo, i) {
            return '<div class="photo-item">' +
                '<img src="' + photo.data + '" alt="صورة ' + (i + 1) + '">' +
                '<button class="photo-remove" onclick="removePhoto(' + i + ')">' +
                '<i class="fas fa-times"></i></button></div>';
        }).join('');
}

function removePhoto(index) {
    currentPhotos.splice(index, 1);
    renderPhotoPreview();
}

function collectInspectionData() {
    var data = {};
    inspectionItems.forEach(function(item) {
        data[item.id] = {
            label: item.label,
            type: item.type,
            status: document.getElementById(item.id).value,
            notes: document.getElementById(item.id + '_notes').value
        };
    });
    return data;
}

// ===========================
// إرسال التقرير لـ Google Sheets
// ===========================
function sendToGoogleSheets(report) {
    try {
        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: report.date,
                time: report.time,
                inspectorName: report.inspectorName,
                stationType: report.stationType,
                stationName: report.stationName,
                branch: report.branch,
                stationLocation: report.stationLocation,
                overallStatus: report.overallStatus,
                notes: report.notes
            })
        }).then(function() {
            console.log('تم الإرسال لـ Google Sheets');
        }).catch(function() {
            console.log('فشل الإرسال - محفوظ محلياً');
        });
    } catch(err) {
        console.log('خطأ في الإرسال');
    }
}

function saveReport() {
    var required = [
        'inspectorName', 'inspectionDate', 'inspectionTime',
        'stationType', 'stationName', 'branch', 'stationLocation',
        'safetyOfficer', 'stationManager', 'overallStatus'
    ];

    for (var i = 0; i < required.length; i++) {
        var el = document.getElementById(required[i]);
        if (!el.value.trim()) {
            el.focus();
            el.style.borderColor = '#dc2626';
            showToast('يرجى ملء جميع الحقول المطلوبة', true);
            setTimeout(function() { el.style.borderColor = ''; }, 2000);
            return null;
        }
    }

    var coordsDiv = document.getElementById('gpsCoords');
    var design = document.getElementById('designCapacity').value;
    var actual = document.getElementById('actualCapacity').value;
    var unit = document.getElementById('capacityUnit').value;

    var report = {
        id: Date.now(),
        inspectorName: document.getElementById('inspectorName').value,
        date: document.getElementById('inspectionDate').value,
        time: document.getElementById('inspectionTime').value,
        stationType: document.getElementById('stationType').value,
        stationName: document.getElementById('stationName').value,
        branch: document.getElementById('branch').value,
        stationLocation: document.getElementById('stationLocation').value,
        gps: { lat: coordsDiv.dataset.lat || '', lng: coordsDiv.dataset.lng || '' },
        designCapacity: design ? parseFloat(design) : null,
        actualCapacity: actual ? parseFloat(actual) : null,
        capacityUnit: unit,
        capacityPercentage: (design && actual) ? Math.round((parseFloat(actual) / parseFloat(design)) * 100) : null,
        safetyOfficer: document.getElementById('safetyOfficer').value,
        stationManager: document.getElementById('stationManager').value,
        isoStatus: document.getElementById('isoStatus').value,
        isoType: document.getElementById('isoType').value || null,
        isoYear: document.getElementById('isoYear').value || null,
        tsmStatus: document.getElementById('tsmStatus').value,
        tsmYear: document.getElementById('tsmYear').value || null,
        inspectionData: collectInspectionData(),
        overallStatus: document.getElementById('overallStatus').value,
        severity: document.getElementById('severity').value,
        notes: document.getElementById('notes').value,
        recommendations: document.getElementById('recommendations').value,
        photos: currentPhotos,
        createdAt: new Date().toISOString()
    };

    // حفظ محلي
    reports.unshift(report);
    localStorage.setItem('waterReports', JSON.stringify(reports));
    updateStats();

    // إرسال لـ Google Sheets
    sendToGoogleSheets(report);

    showToast('تم حفظ التقرير بنجاح ✅');
    return report;
}

function saveAndExportPDF() {
    var report = saveReport();
    if (report) {
        showToast('⏳ جاري تجهيز الـ PDF...');
        setTimeout(function() { generatePDF(report); }, 1000);
    }
}

function generatePDF(report) {
    var statusClass =
        report.overallStatus === 'مطابق' ? 'pdf-compliant' :
        report.overallStatus === 'غير مطابق' ? 'pdf-non-compliant' : 'pdf-follow-up';

    var unit = report.capacityUnit || 'م³/يوم';

    var capacityHTML = '';
    if (report.designCapacity && report.actualCapacity) {
        var pct = report.capacityPercentage;
        var barColor = pct > 100 ? '#dc2626' : pct > 85 ? '#f59e0b' : '#0d9488';
        capacityHTML =
            '<tr><td>الطاقة التصميمية</td><td>' + report.designCapacity.toLocaleString() + ' ' + unit + '</td></tr>' +
            '<tr><td>الطاقة الفعلية</td><td>' + report.actualCapacity.toLocaleString() + ' ' + unit + '</td></tr>' +
            '<tr><td>نسبة التشغيل</td><td><div class="pdf-capacity-bar"><div class="pdf-capacity-fill" style="width:' + Math.min(pct, 100) + '%;background:' + barColor + ';">' + pct + '%</div></div></td></tr>';
    }

    var isoHTML = report.isoStatus === 'حاصلة'
        ? '✅ حاصلة' + (report.isoType ? ' - النوع: ' + report.isoType : '') + (report.isoYear ? ' - سنة: ' + report.isoYear : '')
        : '❌ غير حاصلة';
    var tsmHTML = report.tsmStatus === 'حاصلة'
        ? '✅ حاصلة' + (report.tsmYear ? ' - سنة: ' + report.tsmYear : '')
        : '❌ غير حاصلة';

    var itemsHTML = '';
    if (report.inspectionData) {
        var idx = 0;
        for (var key in report.inspectionData) {
            var item = report.inspectionData[key];
            idx++;
            var isCrane = item.type === 'crane';
            var badgeCls = isCrane
                ? (item.status === 'يوجد' ? 'pdf-exist' : 'pdf-not-exist')
                : (item.status === 'مطابق' ? 'pdf-compliant' : 'pdf-non-compliant');
            var icon = isCrane
                ? (item.status === 'يوجد' ? '✅' : '⛔')
                : (item.status === 'مطابق' ? '✅' : '❌');
            itemsHTML +=
                '<tr><td style="text-align:center;font-weight:bold;color:#1a73e8;">' + idx + '</td>' +
                '<td>' + item.label + '</td>' +
                '<td><span class="pdf-status-badge ' + badgeCls + '">' + icon + ' ' + item.status + '</span></td>' +
                '<td style="color:#666;">' + (item.notes || '-') + '</td></tr>';
        }
    }

    var photosHTML = '';
    if (report.photos && report.photos.length > 0) {
        var photosGrid = report.photos.map(function(p, i) {
            return '<div style="width:24%;margin:0.5%;position:relative;">' +
                '<img src="' + p.data + '" alt="صورة ' + (i + 1) + '" ' +
                'style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px;border:1px solid #e0e0e0;display:block;">' +
                '<div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:bold;">' + (i + 1) + '</div></div>';
        }).join('');
        photosHTML =
            '<div class="pdf-section"><h3>📷 صور الملاحظات (' + report.photos.length + ' صورة)</h3>' +
            '<div style="display:flex;flex-wrap:wrap;gap:0;">' + photosGrid + '</div></div>';
    }

    var dateFormatted = new Date(report.date + 'T00:00:00')
        .toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    var template =
        '<div class="pdf-content">' +
        '<div class="pdf-header"><div class="pdf-header-logos">' +
        '<img src="' + LOGO_HOLDING + '" alt="شعار" style="width:70px;height:70px;object-fit:contain;border-radius:8px;background:#fff;padding:4px;border:2px solid rgba(255,255,255,.3);display:block;">' +
        '<div class="pdf-header-titles"><h1>الشركة القابضة لمياه الشرب والصرف الصحي</h1><h2>الإدارة العامة للسلامة والصحة المهنية والطوارئ والأزمات</h2><h3>🚰 تقرير المرور على محطات مياه الشرب والصرف الصحي</h3></div>' +
        '<img src="' + LOGO_SAFETY + '" alt="شعار" style="width:70px;height:70px;object-fit:contain;border-radius:8px;background:#fff;padding:4px;border:2px solid rgba(255,255,255,.3);display:block;">' +
        '</div><div class="pdf-meta">📅 ' + dateFormatted + ' | 🏭 ' + report.stationType + ' - ' + report.stationName + '</div></div>' +

        '<div class="pdf-section"><h3>📋 المعلومات الأساسية</h3><table class="pdf-table">' +
        '<tr><td>اسم المفتش</td><td>' + report.inspectorName + '</td></tr>' +
        '<tr><td>تاريخ المرور</td><td>' + report.date + '</td></tr>' +
        '<tr><td>وقت المرور</td><td>' + report.time + '</td></tr>' +
        '<tr><td>نوع المحطة</td><td>' + report.stationType + '</td></tr>' +
        '<tr><td>اسم المحطة</td><td>' + report.stationName + '</td></tr>' +
        '<tr><td>الفرع</td><td>' + report.branch + '</td></tr>' +
        '<tr><td>الموقع</td><td>' + report.stationLocation + '</td></tr>' +
        (report.gps.lat ? '<tr><td>إحداثيات GPS</td><td>' + report.gps.lat + ', ' + report.gps.lng + '</td></tr>' : '') +
        capacityHTML +
        '<tr><td>مسؤول السلامة</td><td>' + report.safetyOfficer + '</td></tr>' +
        '<tr><td>مدير المحطة</td><td>' + report.stationManager + '</td></tr>' +
        '<tr><td>شهادة الايزو</td><td>' + isoHTML + '</td></tr>' +
        '<tr><td>شهادة TSM</td><td>' + tsmHTML + '</td></tr>' +
        '</table></div>' +

        '<div class="pdf-section"><h3>🔍 بنود الفحص</h3><table class="pdf-items-table">' +
        '<thead><tr><th style="width:5%;">#</th><th style="width:38%;">البند</th><th style="width:20%;">النتيجة</th><th style="width:37%;">التفاصيل</th></tr></thead>' +
        '<tbody>' + itemsHTML + '</tbody></table></div>' +

        '<div class="pdf-section"><h3>📊 التقييم العام</h3><table class="pdf-table">' +
        '<tr><td>الحالة العامة</td><td><span class="pdf-status-badge ' + statusClass + '">' + report.overallStatus + '</span></td></tr>' +
        '<tr><td>درجة الخطورة</td><td>' + report.severity + '</td></tr></table></div>' +

        (report.notes ? '<div class="pdf-section"><h3>📝 الملاحظات</h3><p style="font-size:13px;line-height:1.8;">' + report.notes + '</p></div>' : '') +
        (report.recommendations ? '<div class="pdf-section"><h3>💡 التوصيات</h3><p style="font-size:13px;line-height:1.8;">' + report.recommendations + '</p></div>' : '') +
        photosHTML +

        '<div class="pdf-footer"><p>الشركة القابضة لمياه الشرب والصرف الصحي</p>' +
        '<p>الإدارة العامة للسلامة والصحة المهنية والطوارئ والأزمات</p>' +
        '<p>تاريخ الإنشاء: ' + new Date().toLocaleDateString('ar-EG') + ' - ' + new Date().toLocaleTimeString('ar-EG') + '</p></div></div>';

    var tempDiv = document.getElementById('pdfTemplate');
    tempDiv.innerHTML = template;
    tempDiv.style.display = 'block';

    html2pdf().set({
        margin: 10,
        filename: 'تقرير_' + report.stationName + '_' + report.date + '.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(tempDiv).save().then(function() {
        tempDiv.style.display = 'none';
        showToast('تم تصدير PDF بنجاح 📄');
        showScreen('mainScreen');
    }).catch(function() {
        tempDiv.style.display = 'none';
        showToast('حدث خطأ في تصدير PDF', true);
    });
}

function renderReportsList() {
    var container = document.getElementById('reportsContainer');
    if (reports.length === 0) {
        container.innerHTML =
            '<div style="text-align:center;padding:60px 20px;color:var(--text-light);">' +
            '<i class="fas fa-inbox" style="font-size:60px;margin-bottom:15px;opacity:0.3;display:block;"></i>' +
            '<p style="font-size:16px;margin-bottom:8px;">لا توجد تقارير بعد</p>' +
            '<p style="font-size:13px;">اضغط على "تقرير جديد" لإضافة أول تقرير</p></div>';
        return;
    }

    container.innerHTML = reports.map(function(report) {
        var statusClass = report.overallStatus === 'مطابق' ? 'status-compliant' :
            report.overallStatus === 'غير مطابق' ? 'status-non-compliant' : 'status-follow-up';
        var badgeClass = report.overallStatus === 'مطابق' ? 'badge-compliant' :
            report.overallStatus === 'غير مطابق' ? 'badge-non-compliant' : 'badge-follow-up';
        var icon = (report.stationType.includes('مياه') ||
            report.stationType.includes('تنقية') ||
            report.stationType.includes('تحلية')) ? 'fa-tint' : 'fa-toilet';

        return '<div class="report-card ' + statusClass + '" onclick="viewReport(' + report.id + ')">' +
            '<div class="report-card-icon"><i class="fas ' + icon + '"></i></div>' +
            '<div class="report-card-info">' +
            '<h4>' + (report.stationName || report.stationType) + '</h4>' +
            '<p>' + report.stationType + ' &bull; ' + (report.branch || '') + '</p>' +
            '<p>' + report.date + ' &bull; ' + report.time + '</p>' +
            '<p><i class="fas fa-map-marker-alt"></i> ' + report.stationLocation + '</p>' +
            '<p><i class="fas fa-user-tie"></i> ' + report.inspectorName + '</p></div>' +
            '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;">' +
            '<span class="report-card-badge ' + badgeClass + '">' + report.overallStatus + '</span>' +
            '<button class="btn btn-small btn-danger" style="padding:5px 10px;font-size:11px;" ' +
            'onclick="event.stopPropagation();deleteReport(' + report.id + ')">' +
            '<i class="fas fa-trash"></i></button></div></div>';
    }).join('');
}

function filterReports() {
    var search = document.getElementById('searchInput').value.toLowerCase();
    var status = document.getElementById('filterStatus').value;
    var cards = document.querySelectorAll('.report-card');
    reports.forEach(function(report, index) {
        var matchSearch =
            (report.stationName || '').toLowerCase().includes(search) ||
            (report.branch || '').toLowerCase().includes(search) ||
            report.stationType.toLowerCase().includes(search) ||
            report.stationLocation.toLowerCase().includes(search) ||
            report.inspectorName.toLowerCase().includes(search);
        var matchStatus = status === 'all' || report.overallStatus === status;
        if (cards[index]) cards[index].style.display = (matchSearch && matchStatus) ? 'flex' : 'none';
    });
}

function viewReport(id) {
    var report = reports.find(function(r) { return r.id === id; });
    if (!report) return;
    currentReportId = id;

    var unit = report.capacityUnit || 'م³/يوم';

    var capacityHTML = '';
    if (report.designCapacity && report.actualCapacity) {
        var pct = report.capacityPercentage;
        var color = pct > 100 ? '#dc2626' : pct > 85 ? '#f59e0b' : '#0d9488';
        capacityHTML =
            '<div class="detail-row"><span class="detail-label">الطاقة التصميمية</span><span class="detail-value">' + report.designCapacity.toLocaleString() + ' ' + unit + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">الطاقة الفعلية</span><span class="detail-value">' + report.actualCapacity.toLocaleString() + ' ' + unit + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">نسبة التشغيل</span><span class="detail-value" style="color:' + color + ';font-weight:700;">' + pct + '%</span></div>';
    }

    var isoCertHTML =
        '<div class="detail-row"><span class="detail-label">شهادة الايزو</span><span class="detail-value">' +
        '<span class="cert-badge ' + (report.isoStatus === 'حاصلة' ? 'has-cert' : 'no-cert') + '">' +
        (report.isoStatus === 'حاصلة' ? '✅' : '❌') + ' ' + report.isoStatus +
        (report.isoStatus === 'حاصلة' && report.isoType ? ' - ' + report.isoType : '') +
        (report.isoStatus === 'حاصلة' && report.isoYear ? ' - ' + report.isoYear : '') +
        '</span></span></div>';

    var tsmCertHTML =
        '<div class="detail-row"><span class="detail-label">شهادة TSM</span><span class="detail-value">' +
        '<span class="cert-badge ' + (report.tsmStatus === 'حاصلة' ? 'has-cert' : 'no-cert') + '">' +
        (report.tsmStatus === 'حاصلة' ? '✅' : '❌') + ' ' + report.tsmStatus +
        (report.tsmStatus === 'حاصلة' && report.tsmYear ? ' - ' + report.tsmYear : '') +
        '</span></span></div>';

    var itemsHTML = '';
    if (report.inspectionData) {
        var idx = 0;
        for (var key in report.inspectionData) {
            var item = report.inspectionData[key];
            idx++;
            var isCrane = item.type === 'crane';
            var statusCls = isCrane
                ? (item.status === 'يوجد' ? 'status-exist' : 'status-not')
                : (item.status === 'مطابق' ? 'status-ok' : 'status-nok');
            var icon = isCrane
                ? (item.status === 'يوجد' ? '✅' : '⛔')
                : (item.status === 'مطابق' ? '✅' : '❌');
            itemsHTML +=
                '<div class="detail-item-row"><div class="detail-item-header">' +
                '<span class="detail-item-num ' + (isCrane ? 'crane-num' : '') + '">' + idx + '</span>' +
                '<span class="detail-item-name">' + item.label + '</span>' +
                '<span class="detail-item-status ' + statusCls + '">' + icon + ' ' + item.status + '</span>' +
                '</div>' + (item.notes ? '<div class="detail-item-notes">' + item.notes + '</div>' : '') + '</div>';
        }
    }

    var photosHTML = '';
    if (report.photos && report.photos.length > 0) {
        photosHTML =
            '<div class="detail-section"><h3><i class="fas fa-camera"></i> الصور</h3><div class="detail-photos">' +
            report.photos.map(function(p) { return '<img src="' + p.data + '" alt="صورة">'; }).join('') +
            '</div></div>';
    }

    var statusBadge = report.overallStatus === 'مطابق' ? 'badge-compliant' :
        report.overallStatus === 'غير مطابق' ? 'badge-non-compliant' : 'badge-follow-up';

    document.getElementById('reportDetail').innerHTML =
        '<div class="detail-section"><h3><i class="fas fa-info-circle"></i> المعلومات الأساسية</h3>' +
        '<div class="detail-row"><span class="detail-label">المفتش</span><span class="detail-value">' + report.inspectorName + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">التاريخ</span><span class="detail-value">' + report.date + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">الوقت</span><span class="detail-value">' + report.time + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">نوع المحطة</span><span class="detail-value">' + report.stationType + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">اسم المحطة</span><span class="detail-value">' + report.stationName + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">الفرع</span><span class="detail-value">' + (report.branch || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">الموقع</span><span class="detail-value">' + report.stationLocation + '</span></div>' +
        (report.gps.lat ? '<div class="detail-row"><span class="detail-label">GPS</span><span class="detail-value">' +
            '<a href="https://maps.google.com/?q=' + report.gps.lat + ',' + report.gps.lng + '" target="_blank" style="color:var(--primary);">📍 ' + report.gps.lat + ', ' + report.gps.lng + '</a>' +
            '</span></div>' : '') +
        capacityHTML +
        '<div class="detail-row"><span class="detail-label">مسؤول السلامة</span><span class="detail-value">' + report.safetyOfficer + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">مدير المحطة</span><span class="detail-value">' + report.stationManager + '</span></div>' +
        isoCertHTML + tsmCertHTML + '</div>' +

        '<div class="detail-section"><h3><i class="fas fa-clipboard-check"></i> بنود الفحص</h3>' + itemsHTML + '</div>' +

        '<div class="detail-section"><h3><i class="fas fa-flag"></i> التقييم العام</h3>' +
        '<div class="detail-row"><span class="detail-label">الحالة العامة</span><span class="report-card-badge ' + statusBadge + '">' + report.overallStatus + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">درجة الخطورة</span><span class="detail-value">' + report.severity + '</span></div></div>' +

        (report.notes ? '<div class="detail-section"><h3><i class="fas fa-sticky-note"></i> الملاحظات</h3><p style="line-height:1.8;font-size:14px;">' + report.notes + '</p></div>' : '') +
        (report.recommendations ? '<div class="detail-section"><h3><i class="fas fa-lightbulb"></i> التوصيات</h3><p style="line-height:1.8;font-size:14px;">' + report.recommendations + '</p></div>' : '') +
        photosHTML +

        '<div style="display:flex;gap:12px;margin-top:10px;">' +
        '<button class="btn btn-primary" style="flex:1;" onclick="exportCurrentPDF()"><i class="fas fa-file-pdf"></i> تصدير PDF</button>' +
        '<button class="btn btn-danger" style="flex:1;" onclick="deleteReport(' + report.id + ');showScreen(\'reportsList\');"><i class="fas fa-trash"></i> حذف</button></div>';

    showScreen('viewReport');
}

function exportCurrentPDF() {
    var report = reports.find(function(r) { return r.id === currentReportId; });
    if (report) generatePDF(report);
}

function deleteReport(id) {
    if (confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
        reports = reports.filter(function(r) { return r.id !== id; });
        localStorage.setItem('waterReports', JSON.stringify(reports));
        updateStats();
        renderReportsList();
        showToast('تم حذف التقرير');
    }
}

function updateStats() {
    document.getElementById('totalReports').textContent = reports.length;
    document.getElementById('compliantCount').textContent =
        reports.filter(function(r) { return r.overallStatus === 'مطابق'; }).length;
    document.getElementById('nonCompliantCount').textContent =
        reports.filter(function(r) { return r.overallStatus === 'غير مطابق'; }).length;
}

function resetForm() {
    document.getElementById('inspectionForm').reset();
    currentPhotos = [];
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('gpsCoords').className = 'gps-display';
    document.getElementById('gpsCoords').dataset.lat = '';
    document.getElementById('gpsCoords').dataset.lng = '';
    document.getElementById('capacityBarContainer').style.display = 'none';
    document.getElementById('reportStationDisplay').textContent = 'لم يتم اختيار المحطة بعد';
    document.getElementById('actualUnit').textContent = 'م³/يوم';

    document.getElementById('isoStatus').value = 'غير حاصلة';
    document.getElementById('isoType').value = '';
    document.getElementById('isoType').style.display = 'none';
    document.getElementById('isoTypeMsg').style.display = 'flex';
    document.getElementById('isoYear').value = '';
    document.getElementById('isoYear').style.display = 'none';
    document.getElementById('isoYearMsg').style.display = 'flex';

    document.getElementById('tsmStatus').value = 'غير حاصلة';
    document.getElementById('tsmYear').value = '';
    document.getElementById('tsmYear').style.display = 'none';
    document.getElementById('tsmYearMsg').style.display = 'flex';

    inspectionItems.forEach(function(item) {
        var el = document.getElementById(item.id);
        if (el) el.value = item.type === 'crane' ? 'يوجد' : 'مطابق';
        var notesEl = document.getElementById(item.id + '_notes');
        if (notesEl) notesEl.value = '';
        var container = el ? el.closest('.inspection-item-full') : null;
        if (container) {
            var btns = container.querySelectorAll('.toggle-btn');
            btns.forEach(function(b) { b.classList.remove('active'); });
            if (btns[0]) btns[0].classList.add('active');
        }
    });

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
