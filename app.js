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
    setCurrentDate(); setDefaultDateTime(); updateStats(); buildInspectionItems();
    document.getElementById('designCapacity').addEventListener('input', calculateCapacity);
    document.getElementById('actualCapacity').addEventListener('input', calculateCapacity);
});

function buildInspectionItems() {
    var c = document.getElementById('inspectionItemsContainer'); var html = '';
    inspectionItems.forEach(function(item, idx) {
        var ic = item.type === 'crane';
        var b1 = ic ? 'exist' : 'compliant', b2 = ic ? 'not-exist' : 'non-compliant';
        var t1 = ic ? '<i class="fas fa-check-double"></i> يوجد' : '<i class="fas fa-check"></i> مطابق';
        var t2 = ic ? '<i class="fas fa-ban"></i> لا يوجد' : '<i class="fas fa-times"></i> غير مطابق';
        var fn = ic ? 'toggleStatusCrane' : 'toggleStatus';
        var dv = ic ? 'يوجد' : 'مطابق';
        var cc = ic ? ' item-crane' : '';
        var bg = ic ? '<span class="item-badge-special">يوجد / لا يوجد</span>' : '';
        html += '<div class="inspection-item-full' + cc + '"><div class="item-header"><span class="item-number">' + (idx+1) + '</span><span class="item-title">' + item.label + '</span>' + bg + '</div><div class="item-body"><div class="item-controls"><div class="status-toggle"><button type="button" class="toggle-btn ' + b1 + ' active" onclick="' + fn + '(this,\'' + item.id + '\')">' + t1 + '</button><button type="button" class="toggle-btn ' + b2 + '" onclick="' + fn + '(this,\'' + item.id + '\')">' + t2 + '</button></div><textarea class="item-notes" id="' + item.id + '_notes" placeholder="التفاصيل..."></textarea></div><input type="hidden" id="' + item.id + '" value="' + dv + '"><div class="item-photo-section"><div class="item-photo-btns"><button type="button" class="item-photo-btn" onclick="pickItemPhoto(\'' + item.id + '\',false)"><i class="fas fa-images"></i> معرض</button><button type="button" class="item-photo-btn" onclick="pickItemPhoto(\'' + item.id + '\',true)"><i class="fas fa-camera"></i> كاميرا</button></div><div id="' + item.id + '_photo_preview"></div></div></div></div>';
    });
    c.innerHTML = html;
}

function pickItemPhoto(id, cam) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    if (cam) inp.setAttribute('capture', 'environment');
    inp.onchange = function(e) { var f = e.target.files[0]; if (!f) return;
        var r = new FileReader(); r.onload = function(ev) { itemPhotos[id] = ev.target.result;
            document.getElementById(id + '_photo_preview').innerHTML = '<div class="item-photo-preview"><img src="' + ev.target.result + '" alt="صورة"><button class="item-photo-remove" onclick="removeItemPhoto(\'' + id + '\')"><i class="fas fa-times"></i></button></div>';
        }; r.readAsDataURL(f); }; inp.click();
}

function removeItemPhoto(id) { delete itemPhotos[id]; document.getElementById(id + '_photo_preview').innerHTML = ''; }

function closeAbout(e) { if (e.target === e.currentTarget) document.getElementById('aboutModal').style.display = 'none'; }

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
    if (id === 'reportsList') renderReportsList();
    if (id === 'newReport') resetForm();
    window.scrollTo(0, 0);
}

function setCurrentDate() { document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ar-EG', { weekday:'long', year:'numeric', month:'long', day:'numeric' }); }

function setDefaultDateTime() {
    var n = new Date();
    document.getElementById('inspectionDate').value = n.toISOString().split('T')[0];
    document.getElementById('inspectionTime').value = n.toTimeString().slice(0, 5);
    updateTitleDate();
}

function updateTitleDate() {
    var d = document.getElementById('inspectionDate').value;
    if (d) document.getElementById('reportDateDisplay').textContent = new Date(d + 'T00:00:00').toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' });
}

function updateTitleStation() {
    var t = document.getElementById('stationType').value, n = document.getElementById('stationName').value.trim();
    var d = 'لم يتم اختيار المحطة بعد';
    if (t && n) d = t + ' - ' + n; else if (t) d = t; else if (n) d = n;
    document.getElementById('reportStationDisplay').textContent = d;
}

function toggleYearField(sid, yid, mid) {
    var s = document.getElementById(sid), y = document.getElementById(yid), m = document.getElementById(mid);
    if (s.value === 'حاصلة') { y.style.display = 'block'; if (m) m.style.display = 'none'; }
    else { y.style.display = 'none'; y.value = ''; if (m) m.style.display = 'flex'; }
}

function toggleIsoType() {
    var s = document.getElementById('isoStatus'), t = document.getElementById('isoType'), m = document.getElementById('isoTypeMsg');
    if (s.value === 'حاصلة') { t.style.display = 'block'; m.style.display = 'none'; }
    else { t.style.display = 'none'; t.value = ''; m.style.display = 'flex'; }
}

function changeCapacityUnit() { document.getElementById('actualUnit').textContent = document.getElementById('capacityUnit').value; calculateCapacity(); }

function calculateCapacity() {
    var de = parseFloat(document.getElementById('designCapacity').value), ac = parseFloat(document.getElementById('actualCapacity').value);
    var c = document.getElementById('capacityBarContainer'), f = document.getElementById('capacityFill'), t = document.getElementById('capacityText');
    if (de > 0 && ac >= 0) { var p = Math.round((ac/de)*100); c.style.display = 'block'; f.style.width = Math.min(p,100)+'%'; f.textContent = p+'%'; f.className = 'capacity-fill';
        if (p > 100) { f.classList.add('danger'); t.textContent = '⚠️ تجاوز '+( p-100)+'%'; t.style.color = '#dc2626'; }
        else if (p > 85) { f.classList.add('warning'); t.textContent = 'نسبة '+p+'%'; t.style.color = '#f59e0b'; }
        else { t.textContent = 'نسبة '+p+'%'; t.style.color = '#0d9488'; }
    } else c.style.display = 'none';
}

function toggleStatus(b, fid) { b.parentElement.querySelectorAll('.toggle-btn').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); document.getElementById(fid).value = b.classList.contains('compliant') ? 'مطابق' : 'غير مطابق'; }
function toggleStatusCrane(b, fid) { b.parentElement.querySelectorAll('.toggle-btn').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); document.getElementById(fid).value = b.classList.contains('exist') ? 'يوجد' : 'لا يوجد'; }
function setSeverity(v, b) { document.querySelectorAll('.severity-btn').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); document.getElementById('severity').value = v; }
function updateOverallColor(s) { s.style.borderColor = s.value==='مطابق'?'#0d9488':s.value==='غير مطابق'?'#dc2626':s.value==='يحتاج متابعة'?'#f59e0b':'#e2e8f0'; }

function getGPSLocation() {
    var cd = document.getElementById('gpsCoords'), li = document.getElementById('stationLocation');
    if (!navigator.geolocation) { cd.textContent = 'لا يدعم الموقع'; cd.classList.add('visible'); return; }
    cd.textContent = '⏳ جاري تحديد الموقع...'; cd.classList.add('visible');
    navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude.toFixed(6), lng = pos.coords.longitude.toFixed(6);
        cd.dataset.lat = lat; cd.dataset.lng = lng; cd.textContent = '⏳ جاري تحديد العنوان...';
        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='+lat+'&lon='+lng+'&accept-language=ar&addressdetails=1&zoom=18')
            .then(function(r){return r.json();}).then(function(data) {
                var nm='',fl='';
                if(data.address){var p=[];
                    if(data.address.road)p.push(data.address.road);if(data.address.neighbourhood)p.push(data.address.neighbourhood);
                    if(data.address.suburb)p.push(data.address.suburb);if(data.address.village)p.push(data.address.village);
                    if(data.address.town)p.push(data.address.town);if(data.address.city)p.push(data.address.city);
                    if(data.address.state)p.push(data.address.state);if(data.address.country)p.push(data.address.country);
                    var u=[];for(var i=0;i<p.length;i++)if(u.indexOf(p[i])===-1)u.push(p[i]);nm=u.join(' - ');}
                if(data.display_name)fl=data.display_name;if(!nm)nm=fl||(lat+', '+lng);
                cd.innerHTML='<div style="margin-bottom:8px;"><i class="fas fa-map-marker-alt" style="color:#dc2626;"></i> <strong>العنوان:</strong><br><span style="font-size:14px;color:#1e293b;">'+nm+'</span></div>'+(fl&&fl!==nm?'<div style="margin-bottom:8px;font-size:12px;color:#64748b;"><i class="fas fa-info-circle"></i> '+fl+'</div>':'')+'<div style="font-size:11px;opacity:0.7;margin-bottom:6px;"><i class="fas fa-crosshairs"></i> '+lat+', '+lng+'</div><a href="https://maps.google.com/?q='+lat+','+lng+'" target="_blank" style="color:#1a73e8;font-weight:bold;">📍 خرائط جوجل</a>';
                if(!li.value.trim())li.value=nm;
            }).catch(function(){cd.innerHTML='<i class="fas fa-map-pin"></i> '+lat+', '+lng+'<br><a href="https://maps.google.com/?q='+lat+','+lng+'" target="_blank" style="color:#1a73e8;">📍 خرائط جوجل</a>';if(!li.value.trim())li.value=lat+', '+lng;});
    },function(err){var m='❌ تعذر. ';if(err.code===1)m+='فعّل الصلاحية';if(err.code===2)m+='فعّل GPS';if(err.code===3)m+='حاول مرة أخرى';cd.textContent=m;},{enableHighAccuracy:true,timeout:20000,maximumAge:0});
}

function handlePhotos(inp) {
    var fs = Array.from(inp.files);
    if (currentPhotos.length+fs.length > 12) { showToast('الحد الأقصى 12 صورة',true); return; }
    fs.forEach(function(f) { var r = new FileReader(); r.onload = function(e) { currentPhotos.push({name:f.name,data:e.target.result}); renderPhotoPreview(); }; r.readAsDataURL(f); });
    inp.value = '';
}

function renderPhotoPreview() {
    document.getElementById('photoPreview').innerHTML = currentPhotos.map(function(p,i){
        return '<div class="photo-item"><img src="'+p.data+'" alt="'+(i+1)+'"><button class="photo-remove" onclick="removePhoto('+i+')"><i class="fas fa-times"></i></button></div>';
    }).join('');
}

function removePhoto(i) { currentPhotos.splice(i,1); renderPhotoPreview(); }

function collectInspectionData() {
    var d = {}; inspectionItems.forEach(function(item) {
        d[item.id] = { label:item.label, type:item.type, status:document.getElementById(item.id).value, notes:document.getElementById(item.id+'_notes').value, photo:itemPhotos[item.id]||null };
    }); return d;
}

function sendToGoogleSheets(r) {
    try { fetch(API_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({date:r.date,time:r.time,inspectorName:r.inspectorName,stationType:r.stationType,stationName:r.stationName,branch:r.branch,stationLocation:r.stationLocation,overallStatus:r.overallStatus,notes:r.notes})}); } catch(e){}
}

function autoSaveCSV(r) {
    var csv = localStorage.getItem('csvReports') || 'التاريخ,الوقت,المفتش,نوع المحطة,اسم المحطة,الفرع,الموقع,الحالة,الخطورة,الملاحظات,التوصيات\n';
    csv += '"'+r.date+'","'+r.time+'","'+r.inspectorName+'","'+r.stationType+'","'+r.stationName+'","'+r.branch+'","'+r.stationLocation+'","'+r.overallStatus+'","'+r.severity+'","'+(r.notes||'').replace(/"/g,'""')+'","'+(r.recommendations||'').replace(/"/g,'""')+'"\n';
    localStorage.setItem('csvReports',csv);
    var blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    var link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'data-123.csv'; link.click();
}

function saveReport() {
    var req = ['inspectorName','inspectionDate','inspectionTime','stationType','stationName','branch','stationLocation','safetyOfficer','stationManager','overallStatus'];
    for (var i=0;i<req.length;i++) { var el=document.getElementById(req[i]); if(!el.value.trim()){el.focus();el.style.borderColor='#dc2626';showToast('يرجى ملء جميع الحقول',true);setTimeout(function(){el.style.borderColor='';},2000);return null;} }

    var cd=document.getElementById('gpsCoords'),de=document.getElementById('designCapacity').value,ac=document.getElementById('actualCapacity').value,un=document.getElementById('capacityUnit').value;

    var report = {
        id:Date.now(), inspectorName:document.getElementById('inspectorName').value,
        date:document.getElementById('inspectionDate').value, time:document.getElementById('inspectionTime').value,
        stationType:document.getElementById('stationType').value, stationName:document.getElementById('stationName').value,
        branch:document.getElementById('branch').value, stationLocation:document.getElementById('stationLocation').value,
        gps:{lat:cd.dataset.lat||'',lng:cd.dataset.lng||''},
        designCapacity:de?parseFloat(de):null, actualCapacity:ac?parseFloat(ac):null,
        capacityUnit:un, capacityPercentage:(de&&ac)?Math.round((parseFloat(ac)/parseFloat(de))*100):null,
        safetyOfficer:document.getElementById('safetyOfficer').value, stationManager:document.getElementById('stationManager').value,
        isoStatus:document.getElementById('isoStatus').value, isoType:document.getElementById('isoType').value||null,
        isoYear:document.getElementById('isoYear').value||null, tsmStatus:document.getElementById('tsmStatus').value,
        tsmYear:document.getElementById('tsmYear').value||null, inspectionData:collectInspectionData(),
        overallStatus:document.getElementById('overallStatus').value, severity:document.getElementById('severity').value,
        notes:document.getElementById('notes').value, recommendations:document.getElementById('recommendations').value,
        photos:currentPhotos, createdAt:new Date().toISOString()
    };

    reports.unshift(report); localStorage.setItem('waterReports',JSON.stringify(reports));
    updateStats(); sendToGoogleSheets(report); autoSaveCSV(report);
    showToast('تم حفظ التقرير بنجاح ✅'); return report;
}

function saveAndExportPDF() { var r=saveReport(); if(r){showToast('⏳ جاري تجهيز PDF...');setTimeout(function(){generatePDF(r);},1000);} }

function generatePDF(report) {
    var sc=report.overallStatus==='مطابق'?'pdf-compliant':report.overallStatus==='غير مطابق'?'pdf-non-compliant':'pdf-follow-up';
    var unit=report.capacityUnit||'م³/يوم';
    var capHTML='';
    if(report.designCapacity&&report.actualCapacity){var pct=report.capacityPercentage,bc=pct>100?'#dc2626':pct>85?'#f59e0b':'#0d9488';
        capHTML='<tr><td>الطاقة التصميمية</td><td>'+report.designCapacity.toLocaleString()+' '+unit+'</td></tr><tr><td>الطاقة الفعلية</td><td>'+report.actualCapacity.toLocaleString()+' '+unit+'</td></tr><tr><td>نسبة التشغيل</td><td><div class="pdf-capacity-bar"><div class="pdf-capacity-fill" style="width:'+Math.min(pct,100)+'%;background:'+bc+';">'+pct+'%</div></div></td></tr>';}
    var isoH=report.isoStatus==='حاصلة'?'✅ حاصلة'+(report.isoType?' - '+report.isoType:'')+(report.isoYear?' - '+report.isoYear:''):'❌ غير حاصلة';
    var tsmH=report.tsmStatus==='حاصلة'?'✅ حاصلة'+(report.tsmYear?' - '+report.tsmYear:''):'❌ غير حاصلة';

    var itemsHTML='';
    if(report.inspectionData){var idx=0;for(var key in report.inspectionData){var item=report.inspectionData[key];idx++;
        var ic=item.type==='crane',bg=ic?(item.status==='يوجد'?'pdf-exist':'pdf-not-exist'):(item.status==='مطابق'?'pdf-compliant':'pdf-non-compliant');
        var icon=ic?(item.status==='يوجد'?'✅':'⛔'):(item.status==='مطابق'?'✅':'❌');
        var photoTd=item.photo?'<img src="'+item.photo+'" style="width:50px;height:50px;object-fit:cover;border-radius:4px;border:1px solid #e0e0e0;">':'-';
        itemsHTML+='<tr><td style="text-align:center;font-weight:bold;color:#1a73e8;">'+idx+'</td><td>'+item.label+'</td><td><span class="pdf-status-badge '+bg+'">'+icon+' '+item.status+'</span></td><td style="color:#666;">'+(item.notes||'-')+'</td><td style="text-align:center;">'+photoTd+'</td></tr>';
    }}

    var phHTML='';
    if(report.photos&&report.photos.length>0){var pg=report.photos.map(function(p,i){return '<div style="width:24%;margin:0.5%;position:relative;"><img src="'+p.data+'" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px;border:1px solid #e0e0e0;display:block;"><div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:bold;">'+(i+1)+'</div></div>';}).join('');
        phHTML='<div class="pdf-section"><h3>📷 صور عامة للمحطة ('+report.photos.length+' صورة)</h3><div style="display:flex;flex-wrap:wrap;gap:0;">'+pg+'</div></div>';}

    var df=new Date(report.date+'T00:00:00').toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'});

    var t='<div class="pdf-content"><div class="pdf-header"><div class="pdf-header-logos">'+
        '<img src="'+LOGO_HOLDING+'" style="width:70px;height:70px;object-fit:contain;border-radius:8px;background:#fff;padding:4px;border:2px solid rgba(255,255,255,.3);display:block;">'+
        '<div class="pdf-header-titles"><h1>الشركة القابضة لمياه الشرب والصرف الصحي</h1><h2>الإدارة العامة للسلامة والصحة المهنية والطوارئ والأزمات</h2><h3>🚰 تقرير المرور على محطات مياه الشرب والصرف الصحي</h3></div>'+
        '<img src="'+LOGO_SAFETY+'" style="width:70px;height:70px;object-fit:contain;border-radius:8px;background:#fff;padding:4px;border:2px solid rgba(255,255,255,.3);display:block;">'+
        '</div><div class="pdf-meta">📅 '+df+' | 🏭 '+report.stationType+' - '+report.stationName+'</div></div>'+
        '<div class="pdf-section"><h3>📋 المعلومات الأساسية</h3><table class="pdf-table">'+
        '<tr><td>اسم المفتش</td><td>'+report.inspectorName+'</td></tr>'+
        '<tr><td>التاريخ</td><td>'+report.date+'</td></tr>'+
        '<tr><td>الوقت</td><td>'+report.time+'</td></tr>'+
        '<tr><td>نوع المحطة</td><td>'+report.stationType+'</td></tr>'+
        '<tr><td>اسم المحطة</td><td>'+report.stationName+'</td></tr>'+
        '<tr><td>الفرع</td><td>'+report.branch+'</td></tr>'+
        '<tr><td>الموقع</td><td>'+report.stationLocation+'</td></tr>'+
        (report.gps.lat?'<tr><td>GPS</td><td>'+report.gps.lat+', '+report.gps.lng+'</td></tr>':'')+capHTML+
        '<tr><td>مسؤول السلامة</td><td>'+report.safetyOfficer+'</td></tr>'+
        '<tr><td>مدير المحطة</td><td>'+report.stationManager+'</td></tr>'+
        '<tr><td>شهادة الايزو</td><td>'+isoH+'</td></tr>'+
        '<tr><td>شهادة TSM</td><td>'+tsmH+'</td></tr></table></div>'+
        '<div style="page-break-before:always;"></div>'+
        '<div class="pdf-section"><h3>🔍 بنود الفحص</h3><table class="pdf-items-table"><thead><tr><th style="width:4%;">#</th><th style="width:28%;">البند</th><th style="width:14%;">النتيجة</th><th style="width:38%;">التفاصيل</th><th style="width:16%;">صورة</th></tr></thead><tbody>'+itemsHTML+'</tbody></table></div>'+
        '<div class="pdf-section"><h3>📊 التقييم العام</h3><table class="pdf-table"><tr><td>الحالة العامة</td><td><span class="pdf-status-badge '+sc+'">'+report.overallStatus+'</span></td></tr><tr><td>درجة الخطورة</td><td>'+report.severity+'</td></tr></table></div>'+
        (report.notes?'<div class="pdf-section"><h3>📝 الملاحظات</h3><p style="font-size:13px;line-height:1.8;">'+report.notes+'</p></div>':'')+
        (report.recommendations?'<div class="pdf-section"><h3>💡 التوصيات</h3><p style="font-size:13px;line-height:1.8;">'+report.recommendations+'</p></div>':'')+
        phHTML+
        '<div class="pdf-footer"><p>الشركة القابضة لمياه الشرب والصرف الصحي</p><p>الإدارة العامة للسلامة والصحة المهنية والطوارئ والأزمات</p><p>'+new Date().toLocaleDateString('ar-EG')+' - '+new Date().toLocaleTimeString('ar-EG')+'</p></div></div>';

    var td=document.getElementById('pdfTemplate');td.innerHTML=t;td.style.display='block';
    html2pdf().set({
        margin:[10,10,15,10],
        filename:'reports_'+report.stationName+'_'+report.date+'.pdf',
        image:{type:'jpeg',quality:0.95},
        html2canvas:{scale:2,useCORS:true,scrollY:0},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
        pagebreak:{mode:['avoid-all','css','legacy']}
    }).from(td).save().then(function(){td.style.display='none';showToast('تم تصدير PDF بنجاح 📄');showScreen('mainScreen');})
    .catch(function(){td.style.display='none';showToast('خطأ في تصدير PDF',true);});
}

function renderReportsList() {
    var c=document.getElementById('reportsContainer');
    if(reports.length===0){c.innerHTML='<div style="text-align:center;padding:60px 20px;color:var(--text-light);"><i class="fas fa-inbox" style="font-size:60px;margin-bottom:15px;opacity:0.3;display:block;"></i><p style="font-size:16px;">لا توجد تقارير بعد</p></div>';return;}
    c.innerHTML=reports.map(function(r){
        var sc=r.overallStatus==='مطابق'?'status-compliant':r.overallStatus==='غير مطابق'?'status-non-compliant':'status-follow-up';
        var bc=r.overallStatus==='مطابق'?'badge-compliant':r.overallStatus==='غير مطابق'?'badge-non-compliant':'badge-follow-up';
        var ic=(r.stationType.includes('مياه')||r.stationType.includes('تنقية')||r.stationType.includes('تحلية'))?'fa-tint':'fa-toilet';
        return '<div class="report-card '+sc+'" onclick="viewReport('+r.id+')"><div class="report-card-icon"><i class="fas '+ic+'"></i></div><div class="report-card-info"><h4>'+(r.stationName||r.stationType)+'</h4><p>'+r.stationType+' &bull; '+(r.branch||'')+'</p><p>'+r.date+' &bull; '+r.time+'</p><p><i class="fas fa-map-marker-alt"></i> '+r.stationLocation+'</p><p><i class="fas fa-user-tie"></i> '+r.inspectorName+'</p></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;"><span class="report-card-badge '+bc+'">'+r.overallStatus+'</span><button class="btn btn-small btn-danger" style="padding:5px 10px;font-size:11px;" onclick="event.stopPropagation();deleteReport('+r.id+')"><i class="fas fa-trash"></i></button></div></div>';
    }).join('');
}

function filterReports() {
    var s=document.getElementById('searchInput').value.toLowerCase(),st=document.getElementById('filterStatus').value,cards=document.querySelectorAll('.report-card');
    reports.forEach(function(r,i){var ms=(r.stationName||'').toLowerCase().includes(s)||(r.branch||'').toLowerCase().includes(s)||r.stationType.toLowerCase().includes(s)||r.stationLocation.toLowerCase().includes(s)||r.inspectorName.toLowerCase().includes(s);var mt=st==='all'||r.overallStatus===st;if(cards[i])cards[i].style.display=(ms&&mt)?'flex':'none';});
}

function viewReport(id) {
    var r=reports.find(function(x){return x.id===id;});if(!r)return;currentReportId=id;
    var unit=r.capacityUnit||'م³/يوم';
    var capH='';
    if(r.designCapacity&&r.actualCapacity){var pct=r.capacityPercentage,col=pct>100?'#dc2626':pct>85?'#f59e0b':'#0d9488';
        capH='<div class="detail-row"><span class="detail-label">الطاقة التصميمية</span><span class="detail-value">'+r.designCapacity.toLocaleString()+' '+unit+'</span></div><div class="detail-row"><span class="detail-label">الطاقة الفعلية</span><span class="detail-value">'+r.actualCapacity.toLocaleString()+' '+unit+'</span></div><div class="detail-row"><span class="detail-label">نسبة التشغيل</span><span class="detail-value" style="color:'+col+';font-weight:700;">'+pct+'%</span></div>';}
    var isoC='<div class="detail-row"><span class="detail-label">شهادة الايزو</span><span class="detail-value"><span class="cert-badge '+(r.isoStatus==='حاصلة'?'has-cert':'no-cert')+'">'+(r.isoStatus==='حاصلة'?'✅':'❌')+' '+r.isoStatus+(r.isoStatus==='حاصلة'&&r.isoType?' - '+r.isoType:'')+(r.isoStatus==='حاصلة'&&r.isoYear?' - '+r.isoYear:'')+'</span></span></div>';
    var tsmC='<div class="detail-row"><span class="detail-label">شهادة TSM</span><span class="detail-value"><span class="cert-badge '+(r.tsmStatus==='حاصلة'?'has-cert':'no-cert')+'">'+(r.tsmStatus==='حاصلة'?'✅':'❌')+' '+r.tsmStatus+(r.tsmStatus==='حاصلة'&&r.tsmYear?' - '+r.tsmYear:'')+'</span></span></div>';

    var itemsH='';
    if(r.inspectionData){var idx=0;for(var k in r.inspectionData){var it=r.inspectionData[k];idx++;
        var ic=it.type==='crane',scl=ic?(it.status==='يوجد'?'status-exist':'status-not'):(it.status==='مطابق'?'status-ok':'status-nok');
        var icon=ic?(it.status==='يوجد'?'✅':'⛔'):(it.status==='مطابق'?'✅':'❌');
        itemsH+='<div class="detail-item-row"><div class="detail-item-header"><span class="detail-item-num '+(ic?'crane-num':'')+'">'+idx+'</span><span class="detail-item-name">'+it.label+'</span><span class="detail-item-status '+scl+'">'+icon+' '+it.status+'</span></div>'+(it.notes?'<div class="detail-item-notes">'+it.notes+'</div>':'')+(it.photo?'<img class="detail-item-photo" src="'+it.photo+'" alt="صورة">':'')+'</div>';}}

    var phH='';
    if(r.photos&&r.photos.length>0){phH='<div class="detail-section"><h3><i class="fas fa-camera"></i> صور عامة للمحطة</h3><div class="detail-photos">'+r.photos.map(function(p){return '<img src="'+p.data+'" alt="صورة">';}).join('')+'</div></div>';}

    var sb=r.overallStatus==='مطابق'?'badge-compliant':r.overallStatus==='غير مطابق'?'badge-non-compliant':'badge-follow-up';

    document.getElementById('reportDetail').innerHTML=
        '<div class="detail-section"><h3><i class="fas fa-info-circle"></i> المعلومات الأساسية</h3>'+
        '<div class="detail-row"><span class="detail-label">المفتش</span><span class="detail-value">'+r.inspectorName+'</span></div>'+
        '<div class="detail-row"><span class="detail-label">التاريخ</span><span class="detail-value">'+r.date+'</span></div>'+
        '<div class="detail-row"><span class="detail-label">الوقت</span><span class="detail-value">'+r.time+'</span></div>'+
        '<div class="detail-row"><span class="detail-label">نوع المحطة</span><span class="detail-value">'+r.stationType+'</span></div>'+
        '<div class="detail-row"><span class="detail-label">اسم المحطة</span><span class="detail-value">'+r.stationName+'</span></div>'+
        '<div class="detail-row"><span class="detail-label">الفرع</span><span class="detail-value">'+(r.branch||'-')+'</span></div>'+
        '<div class="detail-row"><span class="detail-label">الموقع</span><span class="detail-value">'+r.stationLocation+'</span></div>'+
        (r.gps.lat?'<div class="detail-row"><span class="detail-label">GPS</span><span class="detail-value"><a href="https://maps.google.com/?q='+r.gps.lat+','+r.gps.lng+'" target="_blank" style="color:var(--primary);">📍 '+r.gps.lat+', '+r.gps.lng+'</a></span></div>':'')+capH+
        '<div class="detail-row"><span class="detail-label">مسؤول السلامة</span><span class="detail-value">'+r.safetyOfficer+'</span></div>'+
        '<div class="detail-row"><span class="detail-label">مدير المحطة</span><span class="detail-value">'+r.stationManager+'</span></div>'+isoC+tsmC+'</div>'+
        '<div class="detail-section"><h3><i class="fas fa-clipboard-check"></i> بنود الفحص</h3>'+itemsH+'</div>'+
        '<div class="detail-section"><h3><i class="fas fa-flag"></i> التقييم العام</h3>'+
        '<div class="detail-row"><span class="detail-label">الحالة</span><span class="report-card-badge '+sb+'">'+r.overallStatus+'</span></div>'+
        '<div class="detail-row"><span class="detail-label">الخطورة</span><span class="detail-value">'+r.severity+'</span></div></div>'+
        (r.notes?'<div class="detail-section"><h3><i class="fas fa-sticky-note"></i> الملاحظات</h3><p style="line-height:1.8;">'+r.notes+'</p></div>':'')+
        (r.recommendations?'<div class="detail-section"><h3><i class="fas fa-lightbulb"></i> التوصيات</h3><p style="line-height:1.8;">'+r.recommendations+'</p></div>':'')+phH+
        '<div style="display:flex;gap:12px;margin-top:10px;"><button class="btn btn-primary" style="flex:1;" onclick="exportCurrentPDF()"><i class="fas fa-file-pdf"></i> PDF</button><button class="btn btn-danger" style="flex:1;" onclick="deleteReport('+r.id+');showScreen(\'reportsList\');"><i class="fas fa-trash"></i> حذف</button></div>';
    showScreen('viewReport');
}

function exportCurrentPDF(){var r=reports.find(function(x){return x.id===currentReportId;});if(r)generatePDF(r);}

function deleteReport(id){if(confirm('هل أنت متأكد من حذف هذا التقرير؟')){reports=reports.filter(function(r){return r.id!==id;});localStorage.setItem('waterReports',JSON.stringify(reports));updateStats();renderReportsList();showToast('تم حذف التقرير');}}

function updateStats(){document.getElementById('totalReports').textContent=reports.length;document.getElementById('compliantCount').textContent=reports.filter(function(r){return r.overallStatus==='مطابق';}).length;document.getElementById('nonCompliantCount').textContent=reports.filter(function(r){return r.overallStatus==='غير مطابق';}).length;}

function resetForm(){
    document.getElementById('inspectionForm').reset();currentPhotos=[];itemPhotos={};
    document.getElementById('photoPreview').innerHTML='';
    document.getElementById('gpsCoords').className='gps-display';document.getElementById('gpsCoords').dataset.lat='';document.getElementById('gpsCoords').dataset.lng='';
    document.getElementById('capacityBarContainer').style.display='none';
    document.getElementById('reportStationDisplay').textContent='لم يتم اختيار المحطة بعد';
    document.getElementById('actualUnit').textContent='م³/يوم';
    document.getElementById('isoStatus').value='غير حاصلة';document.getElementById('isoType').value='';document.getElementById('isoType').style.display='none';document.getElementById('isoTypeMsg').style.display='flex';
    document.getElementById('isoYear').value='';document.getElementById('isoYear').style.display='none';document.getElementById('isoYearMsg').style.display='flex';
    document.getElementById('tsmStatus').value='غير حاصلة';document.getElementById('tsmYear').value='';document.getElementById('tsmYear').style.display='none';document.getElementById('tsmYearMsg').style.display='flex';
    buildInspectionItems();
    document.querySelectorAll('.severity-btn').forEach(function(b){b.classList.remove('active');});
    document.querySelector('.severity-btn.low').classList.add('active');
    document.getElementById('severity').value='منخفضة';
    setDefaultDateTime();
}

function showToast(msg,err){var t=document.getElementById('successToast');document.getElementById('toastMessage').textContent=msg;t.style.background=err?'#dc2626':'#0d9488';t.classList.add('show');setTimeout(function(){t.classList.remove('show');},3000);}
