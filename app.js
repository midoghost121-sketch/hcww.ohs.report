// دالة لتصحيح المسافات في النصوص العربية قبل التصدير للـ PDF (لمنع تفكك الحروف والمسافات في html2canvas)
function fixArabicSpaces(node) {
    if (!node) return;
    if (node.nodeType === 3) { // Text node
        node.nodeValue = node.nodeValue.replace(/ /g, '\u00a0');
    } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
        for (var i = 0; i < node.childNodes.length; i++) {
            fixArabicSpaces(node.childNodes[i]);
        }
    }
}
window.fixArabicSpaces = fixArabicSpaces;

var reports = JSON.parse(localStorage.getItem('waterReports')) || [];
var lastFilteredReports = [];
var currentPhotos = [];
var currentReportId = null;
var itemPhotos = {};
var isoCount = 0;  // عداد لشهادات الايزو الإضافية

var LOGO_HOLDING = typeof LOGO_HOLDING_B64 !== 'undefined' ? LOGO_HOLDING_B64 : "logo-holding.png";
var LOGO_SAFETY = typeof LOGO_SAFETY_B64 !== 'undefined' ? LOGO_SAFETY_B64 : "logo-safety.png";
var API_URL = 'https://script.google.com/macros/s/AKfycbytn_qHb1Gg6AdipV5r7C6pREyMOC3b2g9EXDsXsgSam-keJuUM3VlPfRhvKB9y373Z/exec';
var NC_URL = 'https://cloud.hcww.com.eg';
var NC_USER = 'ahmed.eldesoky@hcww.com.eg';
var NC_PASS = 'BEQ67-tzPRi-oiGrX-Spo7F-NENeA';
var NC_REPORTS_FOLDER = '/السلامة والصحة المهنية/Reports';
var NC_CSV_PATH = '/السلامة والصحة المهنية/data-123.csv';

var companyList = ['مياه القاهرة', 'صرف القاهرة', 'الجيزة', 'مياه الإسكندرية', 'صرف الإسكندرية', 'الدقهلية', 'مرسى مطروح', 'دمياط', 'الفيوم', 'سوهاج', 'مدن القناة', 'القليوبية', 'البحر الأحمر', 'قنا', 'البحيرة', 'الأقصر', 'بني سويف', 'الشرقية', 'الغربية', 'المنوفية', 'كفر الشيخ', 'أسيوط', 'المنيا', 'أسوان', 'سيناء'];

var inspectionItemsByType = {
    'محطة تنقية مياه': [
        { id: 'intake', label: 'المأخذ', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'pumpHouses', label: 'عنابر الطلمبات', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'chlorineRoom', label: 'عنبر الكلور والشبة', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'waterSurfaces', label: 'المسطحات المائية ( المروقات – المرشحات)', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'tanksAndValves', label: 'الخزانات وغرف المحابس', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'laboratory', label: 'المعمل', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'generatorRoom', label: 'عنبر المولد وخزان الوقود', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'transformersAndPanels', label: 'المحولات ولوحات التشغيل الكهربائية', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'warehouses', label: 'المخازن والورش', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'fireEquipment', label: 'معدات مكافحة الحريق', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'firstAid', label: 'صناديق الإسعافات الأولية', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'ppe', label: 'مهمات الوقاية الشخصية ومعدات السلامة والصحة المهنية', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'safeProcedures', label: 'إجراءات العمل الآمنة واللوحات الإرشادية والتحذيرية', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'recordsAndEmergencyPlans', label: 'السجلات وخطط الطوارئ', showPhotos: false, options: ['مكتمل ومحدث', 'جزئي / يحتاج استكمال', 'غير متوفر'], notesHideValues: ['مكتمل ومحدث'] },
        { id: 'staffTraining', label: 'تدريب العاملين على السلامة والصحة المهنية', showPhotos: false, options: ['تم وفق الخطة', 'تم جزئياً', 'لم يتم'], notesHideValues: ['تم وفق الخطة'] },
        { id: 'craneCerts', label: 'شهادات المعايرة والفحص', showPhotos: false, options: ['سارية ومحدثة', 'منتهية / تحتاج تحديث', 'غير متوفرة'], notesHideValues: ['سارية ومحدثة'] }
    ],
    'محطة معالجة صرف صحي': [
        { id: 'inletAndScreens', label: 'المدخل والمصافي', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'pumpHouses', label: 'عنابر الطلمبات', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'settlingBasins', label: 'أحواض الترسيب (ابتدائي – نهائي)', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'aerationMixingSandBasins', label: 'أحواض (التهوية – المزج – فصل الرمال)', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'chlorineRoom', label: 'عنبر الكلور', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'closedSpaces', label: 'الأماكن المغلقة', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'sludgeBasins', label: 'أحواض الحمأة (التجفيف – التركيز)', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'laboratory', label: 'المعمل', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'generatorRoom', label: 'عنبر المولد وخزان الوقود', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'transformersAndPanels', label: 'المحولات ولوحات التشغيل الكهربائية', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'warehouses', label: 'المخازن والورش', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'fireEquipment', label: 'معدات مكافحة الحريق', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'firstAid', label: 'صناديق الإسعافات الأولية', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'ppe', label: 'مهمات الوقاية الشخصية ومعدات السلامة والصحة المهنية', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'safeProcedures', label: 'إجراءات العمل الآمنة واللوحات الإرشادية والتحذيرية', showPhotos: false, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'recordsAndEmergencyPlans', label: 'السجلات وخطط الطوارئ', showPhotos: false, options: ['مكتمل ومحدث', 'جزئي / يحتاج استكمال', 'غير متوفر'], notesHideValues: ['مكتمل ومحدث'] },
        { id: 'staffTraining', label: 'تدريب العاملين على السلامة والصحة المهنية', showPhotos: false, options: ['تم وفق الخطة', 'تم جزئياً', 'لم يتم'], notesHideValues: ['تم وفق الخطة'] }
    ],
    'رافع صرف صحي': [
        { id: 'inletChamber', label: 'بيارة التجميع', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'pumpHouse', label: 'عنبر الطلمبات', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'controlPanels', label: 'لوحات التشغيل', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'generatorRoom', label: 'عنبر المولد وخزان الوقود', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'undergroundTank', label: 'الخزان الأرضي', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'transformers', label: 'المحولات', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'fireEquipment', label: 'أجهزة الإطفاء وصناديق الإسعافات الأولية', showPhotos: true, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'ppe', label: 'مهمات الوقاية الشخصية ومعدات السلامة والصحة المهنية', showPhotos: false, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] },
        { id: 'staffTraining', label: 'تدريب العاملين على السلامة والصحة المهنية', showPhotos: false, options: ['تم وفق خطة', 'تم جزئياً', 'لم يتم'], notesHideValues: ['تم وفق الخطة'] },
        { id: 'safeProcedures', label: 'إجراءات العمل الآمنة واللوحات الإرشادية والتحذيرية', showPhotos: false, options: ['مطابق', 'مطابق مع ملاحظات', 'غير مطابق'], notesHideValues: ['مطابق'] }
    ],
    'رافع مياه شرب': []
};

inspectionItemsByType['رافع مياه شرب'] = inspectionItemsByType['رافع صرف صحي'];

var inspectionItems = inspectionItemsByType['محطة تنقية مياه']; // default

document.addEventListener('DOMContentLoaded', function () {
    setCurrentDate(); setDefaultDateTime(); updateStats(); buildInspectionItems(); updateInspectionVisibility(); buildCompanyFilter(); buildBranchFilter();
    document.getElementById('designCapacity').addEventListener('input', calculateCapacity);
    document.getElementById('actualCapacity').addEventListener('input', calculateCapacity);
    toggleIsoType(0);
});

function buildCompanyFilter() {
    var sel = document.getElementById('filterCompany');
    if (!sel) return;
    sel.innerHTML = '<option value="all">كل الشركات</option>';
    companyList.forEach(function (c) { sel.innerHTML += '<option value="' + c + '">' + c + '</option>'; });
}

function buildBranchFilter() {
    var sel = document.getElementById('filterBranch');
    if (!sel) return;
    var branchSet = {};
    reports.forEach(function (r) {
        if (r.branch && r.branch.trim()) branchSet[r.branch.trim()] = true;
    });
    var branches = Object.keys(branchSet).sort(function (a, b) { return a.localeCompare(b, 'ar'); });
    sel.innerHTML = '<option value="all">كل الفروع</option>' + branches.map(function (b) { return '<option value="' + b + '">' + b + '</option>'; }).join('');
}

function updateCompanyDisplay() {
    var v = document.getElementById('companyName').value;
    document.getElementById('reportCompanyDisplay').textContent = v || '--';
}

function updateTitleStation() {
    var t = document.getElementById('stationType').value;
    var n = document.getElementById('stationName').value.trim();
    var b = document.getElementById('branch').value.trim();
    var parts = [];
    if (t) parts.push(t);
    if (n) parts.push(n);
    if (b) parts.push(b);
    document.getElementById('reportStationDisplay').textContent = parts.length > 0 ? parts.join(' - ') : '--';
    updateInspectionVisibility();
}

function updateInspectionVisibility() {
    var selectedType = document.getElementById('stationType').value;
    var section = document.getElementById('inspectionSection');
    var info = document.getElementById('inspectionInfo');
    var container = document.getElementById('inspectionItemsContainer');
    var overallContent = document.getElementById('overallContent');
    var overallPlaceholder = document.getElementById('overallPlaceholder');
    var notesContent = document.getElementById('notesContent');
    var notesPlaceholder = document.getElementById('notesPlaceholder');
    var photosContent = document.getElementById('photosContent');
    var photosPlaceholder = document.getElementById('photosPlaceholder');
    if (!section || !info || !container) return;
    var showCommonSections = selectedType !== '';
    if (overallContent) overallContent.style.display = showCommonSections ? 'block' : 'none';
    if (overallPlaceholder) overallPlaceholder.style.display = showCommonSections ? 'none' : 'block';
    if (notesContent) notesContent.style.display = showCommonSections ? 'block' : 'none';
    if (notesPlaceholder) notesPlaceholder.style.display = showCommonSections ? 'none' : 'block';
    if (photosContent) photosContent.style.display = showCommonSections ? 'block' : 'none';
    if (photosPlaceholder) photosPlaceholder.style.display = showCommonSections ? 'none' : 'block';
    if (selectedType === 'محطة تنقية مياه' || selectedType === 'محطة معالجة صرف صحي' || selectedType === 'رافع صرف صحي' || selectedType === 'رافع مياه شرب') {
        inspectionItems = inspectionItemsByType[selectedType] || [];
        buildInspectionItems();
        info.style.display = 'none';
        container.style.display = 'block';
    } else {
        info.style.display = 'block';
        container.style.display = 'none';
    }
}

function buildInspectionItems() {
    var c = document.getElementById('inspectionItemsContainer'); var html = '';
    inspectionItems.forEach(function (item, idx) {
        if (idx === 0) {
            html += '<div class="inspection-group-title">أولاً: بنود الفحص الميداني</div>';
        }
        if (idx === 12) {
            html += '<div class="inspection-group-title">ثانياً: بنود الإدارة والتوثيق</div>';
        }
        var notesStyle = 'display:none;';
        var photoSection = item.showPhotos ? '<div class="item-photo-section"><div class="item-photo-btns"><button type="button" class="item-photo-btn" onclick="pickItemPhoto(\'' + item.id + '\',false)"><i class="fas fa-images"></i> معرض</button><button type="button" class="item-photo-btn" onclick="pickItemPhoto(\'' + item.id + '\',true)"><i class="fas fa-camera"></i> كاميرا</button></div><div id="' + item.id + '_photo_preview"></div></div>' : '';
        var optionsHtml = '<option value="">اختر</option>' + item.options.map(function(opt) { return '<option value="' + opt + '">' + opt + '</option>'; }).join('');
        html += '<div class="inspection-item-full"><div class="item-header"><span class="item-number">' + (idx + 1) + '</span><span class="item-title">' + item.label + '</span></div><div class="item-body"><div class="item-controls"><div class="form-group" style="flex:1"><label>الحالة</label><select id="' + item.id + '" onchange="onInspectionItemStatusChange(\'' + item.id + '\')">' + optionsHtml + '</select></div><textarea class="item-notes" id="' + item.id + '_notes" placeholder="إذا كان هناك ملاحظات، اكتبها هنا..." style="' + notesStyle + '"></textarea></div>' + photoSection + '</div></div>';
    });
    c.innerHTML = html;
}

function onInspectionItemStatusChange(id) {
    var item = inspectionItems.find(function (x) { return x.id === id; });
    var value = document.getElementById(id).value;
    var notesEl = document.getElementById(id + '_notes');
    if (!notesEl || !item) return;
    if (value && item.notesHideValues && item.notesHideValues.includes(value)) {
        notesEl.style.display = 'none';
        notesEl.value = '';
    } else if (value) {
        notesEl.style.display = 'block';
    } else {
        notesEl.style.display = 'none';
        notesEl.value = '';
    }
}

function pickItemPhoto(id, cam) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    if (cam) inp.setAttribute('capture', 'environment');
    inp.onchange = function (e) {
        var f = e.target.files[0]; if (!f) return;
        var r = new FileReader();
        r.onload = function (ev) {
            resizeImage(ev.target.result, function (resized) {
                itemPhotos[id] = resized;
                document.getElementById(id + '_photo_preview').innerHTML = '<div class="item-photo-preview"><img src="' + resized + '" alt="صورة"><button class="item-photo-remove" onclick="removeItemPhoto(\'' + id + '\')"><i class="fas fa-times"></i></button></div>';
            });
        };
        r.readAsDataURL(f);
    };
    inp.click();
}

function removeItemPhoto(id) { delete itemPhotos[id]; document.getElementById(id + '_photo_preview').innerHTML = ''; }
function resizeImage(dataUrl, callback) {
    var img = new Image();
    img.onload = function () {
        var canvas = document.createElement('canvas');
        var max_size = 600;
        var w = img.width, h = img.height;
        if (w > h) { if (w > max_size) { h = Math.round(h * max_size / w); w = max_size; } }
        else { if (h > max_size) { w = Math.round(w * max_size / h); h = max_size; } }
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = dataUrl;
}
function closeAbout(e) { if (e.target === e.currentTarget) document.getElementById('aboutModal').style.display = 'none'; }
function closeSaveConfirm(e) { if (e.target === e.currentTarget) document.getElementById('saveConfirmModal').style.display = 'none'; }

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
    if (id === 'reportsList') renderReportsList();
    if (id === 'plansList' && typeof renderPlansList === 'function') renderPlansList();
    if (id === 'newReport') resetForm();
    var tpl = document.getElementById('pdfTemplate');
    if (tpl) tpl.style.display = 'none';
    window.scrollTo(0, 0);
}

function setCurrentDate() { document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
function setDefaultDateTime() { var n = new Date(); document.getElementById('inspectionDate').value = n.toISOString().split('T')[0]; document.getElementById('inspectionTime').value = n.toTimeString().slice(0, 5); updateTitleDate(); }
function updateTitleDate() { var d = document.getElementById('inspectionDate').value; if (d) document.getElementById('reportDateDisplay').textContent = new Date(d + 'T00:00:00').toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }); }

function toggleYearField(sid, yid, mid) { var s = document.getElementById(sid), y = document.getElementById(yid), m = document.getElementById(mid); if (s.value === 'حاصلة') { y.style.display = 'block'; if (m) m.style.display = 'none'; } else { y.style.display = 'none'; y.value = ''; if (m) m.style.display = 'flex'; } if (sid.includes('iso')) { updateIsoValidity(sid.replace('isoStatus', '').replace('isoYear', '').replace('isoType', '')); } else if (sid.includes('tsm')) { updateTsmValidity(sid.replace('tsmStatus', '').replace('tsmYear', '')); } }
function toggleIsoType(indexOrUndefined) {
    var indexStr = (indexOrUndefined === undefined || indexOrUndefined === 0 || indexOrUndefined === '') ? '' : indexOrUndefined.toString();
    var s = document.getElementById('isoStatus' + indexStr);
    if (!s) { var s = document.getElementById('isoStatus'); }
    var t = document.getElementById('isoType' + indexStr);
    if (!t) { var t = document.getElementById('isoType'); }
    var m = document.getElementById('isoTypeMsg' + indexStr);
    if (!m) { var m = document.getElementById('isoTypeMsg'); }
    if (s && t && m) {
        if (s.value === 'حاصلة') { t.style.display = 'block'; m.style.display = 'none'; } else { t.style.display = 'none'; t.value = ''; m.style.display = 'block'; }
    }
}

function addIsoRow() {
    isoCount++;
    var container = document.getElementById('additionalIsoContainer');
    var newRow = document.createElement('div');
    newRow.className = 'form-row-four iso-additional-row';
    newRow.setAttribute('data-iso-index', isoCount);
    newRow.innerHTML = [
        '<div class="form-group">',
        '    <div class="form-group-header">',
        '        <label for="isoStatus' + isoCount + '"><i class="fas fa-certificate"></i> \u0634\u0647\u0627\u062f\u0629 \u0627\u064a\u0632\u0648 ' + (isoCount + 1) + '</label>',
        '        <button type="button" class="btn-icon-small btn-icon-remove" onclick="removeIsoRow(' + isoCount + ')" title="\u062d\u0630\u0641 \u0627\u0644\u0634\u0647\u0627\u062f\u0629">',
        '            <i class="fas fa-minus"></i>',
        '        </button>',
        '    </div>',
        '    <select id="isoStatus' + isoCount + '" onchange="toggleYearField(\'isoStatus' + isoCount + '\',\'isoYear' + isoCount + '\',\'isoYearMsg' + isoCount + '\');toggleIsoType(' + isoCount + ')">',
        '        <option value="\u062a\u063a\u064a\u0631 \u062d\u0627\u0635\u0644\u0629">\u062a\u063a\u064a\u0631 \u062d\u0627\u0635\u0644\u0629</option>',
        '        <option value="\u062d\u0627\u0635\u0644\u0629">\u062d\u0627\u0635\u0644\u0629</option>',
        '    </select>',
        '</div>',
        '<div class="form-group">',
        '    <label for="isoType' + isoCount + '"><i class="fas fa-tag"></i> \u0646\u0648\u0639 \u0627\u0644\u0627\u064a\u0632\u0648</label>',
        '    <input type="text" id="isoType' + isoCount + '" placeholder="ISO 9001" style="display:none;">',
        '    <div class="no-cert-msg" id="isoTypeMsg' + isoCount + '"><i class="fas fa-info-circle"></i> \u063a\u064a\u0631 \u062d\u0627\u0635\u0644\u0629</div>',
        '</div>',
        '<div class="form-group">',
        '    <label for="isoYear' + isoCount + '"><i class="fas fa-calendar-check"></i> \u0622\u062e\u0631 \u062a\u062c\u062f\u064a\u062f</label>',
        '    <input type="number" id="isoYear' + isoCount + '" placeholder="2022" min="2000" max="2100" style="display:none;" oninput="updateIsoValidity(' + isoCount + ')">',
        '    <div class="no-cert-msg" id="isoYearMsg' + isoCount + '"><i class="fas fa-info-circle"></i> \u063a\u064a\u0631 \u062d\u0627\u0635\u0644\u0629</div>',
        '</div>',
        '<div class="form-group">',
        '    <label><i class="fas fa-clock"></i> \u0627\u0644\u0635\u0627\u062d\u064a\u0629</label>',
        '    <div id="isoValidity' + isoCount + '" class="validity-display no-cert">\u063a\u064a\u0631 \u062d\u0627\u0635\u0644\u0629</div>',
        '</div>'
    ].join('');
    container.appendChild(newRow);
}

function removeIsoRow(index) {
    var row = document.querySelector('.iso-additional-row[data-iso-index="' + index + '"]');
    if (row) row.remove();
    var labels = document.querySelectorAll('.form-group-header label[for^="isoStatus"]');
    labels.forEach(function(label, idx) {
        label.innerHTML = '<i class="fas fa-certificate"></i> شهادة ايزو ' + (idx + 1);
    });
}
function updateIsoValidity(index) {
    var statusEl = document.getElementById('isoStatus' + index);
    var yearEl = document.getElementById('isoYear' + index);
    var validityEl = document.getElementById('isoValidity' + index);

    if (!statusEl || !yearEl || !validityEl) return;

    var status = statusEl.value;
    var year = yearEl.value;

    if (status === 'غير حاصلة') {
        validityEl.textContent = 'غير حاصلة';
        validityEl.className = 'validity-display no-cert';
    } else if (year) {
        var currentYear = new Date().getFullYear();
        if (currentYear <= parseInt(year) + 1) {
            validityEl.textContent = 'سارية';
            validityEl.className = 'validity-display valid';
        } else {
            validityEl.textContent = 'غير سارية';
            validityEl.className = 'validity-display expired';
        }
    } else {
        validityEl.textContent = 'غير محدد';
        validityEl.className = 'validity-display';
    }
}

function updateTsmValidity(index) {
    // Handle being called with or without index parameter
    var indexStr = (index === undefined || index === '') ? '' : index;

    var statusEl = document.getElementById('tsmStatus' + indexStr);
    var yearEl = document.getElementById('tsmYear' + indexStr);
    var validityEl = document.getElementById('tsmValidity' + indexStr);

    if (!statusEl || !validityEl) return;

    var status = statusEl.value;
    var year = yearEl ? yearEl.value : '';

    if (status === 'غير حاصلة') {
        validityEl.textContent = 'غير حاصلة';
        validityEl.className = 'validity-display no-cert';
    } else if (year) {
        var currentYear = new Date().getFullYear();
        if (currentYear <= parseInt(year) + 2) {
            validityEl.textContent = 'سارية';
            validityEl.className = 'validity-display valid';
        } else {
            validityEl.textContent = 'غير سارية';
            validityEl.className = 'validity-display expired';
        }
    } else {
        validityEl.textContent = 'غير محدد';
        validityEl.className = 'validity-display';
    }
}

function addIsoCertificate() {
    var container = document.querySelector('.iso-certificates-container');
    var certificates = container.querySelectorAll('.iso-certificate');
    var index = certificates.length;
    var newCert = document.createElement('div');
    newCert.className = 'form-row-four iso-certificate';
    newCert.setAttribute('data-index', index);
    newCert.innerHTML = [
        '<div class="form-group">',
        '    <label for="isoStatus' + index + '"><i class="fas fa-certificate"></i> شهادة الايزو ' + (index + 1) + ' <button type="button" class="btn btn-small btn-danger remove-iso-btn" onclick="removeIsoCertificate(' + index + ')" title="حذف الشهادة"><i class="fas fa-minus"></i></button></label>',
        '    <select id="isoStatus' + index + '" onchange="toggleYearField(\'isoStatus' + index + '\', \'isoYear' + index + '\', \'isoYearMsg' + index + '\');toggleIsoType(' + index + ');updateIsoValidity(' + index + ')">',
        '        <option value="غير حاصلة">غير حاصلة</option>',
        '        <option value="حاصلة">حاصلة</option>',
        '    </select>',
        '</div>',
        '<div class="form-group">',
        '    <label for="isoType' + index + '"><i class="fas fa-tag"></i> نوع الايزو</label>',
        '    <input type="text" id="isoType' + index + '" placeholder="ISO 9001" style="display:none;">',
        '    <div class="no-cert-msg" id="isoTypeMsg' + index + '"><i class="fas fa-info-circle"></i> غير حاصلة</div>',
        '</div>',
        '<div class="form-group">',
        '    <label for="isoYear' + index + '"><i class="fas fa-calendar-check"></i> آخر تجديد</label>',
        '    <input type="number" id="isoYear' + index + '" placeholder="2022" min="2000" max="2100" style="display:none;" oninput="updateIsoValidity(' + index + ')">',
        '    <div class="no-cert-msg" id="isoYearMsg' + index + '"><i class="fas fa-info-circle"></i> غير حاصلة</div>',
        '</div>',
        '<div class="form-group">',
        '    <label><i class="fas fa-clock"></i> الصلاحية</label>',
        '    <div id="isoValidity' + index + '" class="validity-display">غير حاصلة</div>',
        '</div>'
    ].join('');
    container.appendChild(newCert);
}

function removeIsoCertificate(index) {
    var cert = document.querySelector('.iso-certificate[data-index="' + index + '"]');
    if (cert) cert.remove();
    // إعادة ترتيب الindices إذا لزم الأمر، لكن للبساطة، سنتركها كما هي
}
function changeCapacityUnit() { document.getElementById('actualUnit').textContent = document.getElementById('capacityUnit').value; calculateCapacity(); }

function calculateCapacity() {
    var de = parseFloat(document.getElementById('designCapacity').value), ac = parseFloat(document.getElementById('actualCapacity').value);
    var c = document.getElementById('capacityBarContainer'), f = document.getElementById('capacityFill'), t = document.getElementById('capacityText');
    if (de > 0 && ac >= 0) {
        var p = Math.round((ac / de) * 100); c.style.display = 'block'; f.style.width = Math.min(p, 100) + '%'; f.textContent = p + '%'; f.className = 'capacity-fill';
        if (p > 100) { f.classList.add('danger'); t.textContent = '⚠️ تجاوز ' + (p - 100) + '%'; t.style.color = '#dc2626'; }
        else if (p > 85) { f.classList.add('warning'); t.textContent = 'نسبة ' + p + '%'; t.style.color = '#f59e0b'; }
        else { t.textContent = 'نسبة ' + p + '%'; t.style.color = '#0d9488'; }
    } else c.style.display = 'none';
}

function toggleStatus(b, fid) { b.parentElement.querySelectorAll('.toggle-btn').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); document.getElementById(fid).value = b.classList.contains('compliant') ? 'مطابق' : 'غير مطابق'; }
function toggleStatusCrane(b, fid) { b.parentElement.querySelectorAll('.toggle-btn').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); document.getElementById(fid).value = b.classList.contains('exist') ? 'يوجد' : 'لا يوجد'; }
function setSeverity(v, b) { document.querySelectorAll('.severity-btn').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); document.getElementById('severity').value = v; }
function updateOverallColor(s) {
    var value = s.value;
    if (value === 'مطابق') {
        s.style.borderColor = '#0d9488';
    } else if (value === 'غير مطابق') {
        s.style.borderColor = '#dc2626';
    } else if (value === 'يحتاج متابعة') {
        s.style.borderColor = '#f59e0b';
    } else {
        s.style.borderColor = '#e2e8f0';
    }
}

function getGPSLocation() {
    var cd = document.getElementById('gpsCoords');
    var li = document.getElementById('stationLocation');
    if (!navigator.geolocation) {
        cd.textContent = 'لا يدعم الموقع';
        cd.classList.add('visible');
        return;
    }

    cd.textContent = '⏳ جاري تحديد الموقع...';
    cd.classList.add('visible');

    navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos.coords.latitude.toFixed(6);
        var lng = pos.coords.longitude.toFixed(6);
        cd.dataset.lat = lat;
        cd.dataset.lng = lng;
        cd.textContent = '⏳ جاري تحديد العنوان...';

        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&accept-language=ar&addressdetails=1&zoom=18')
            .then(function (r) {
                return r.json();
            })
            .then(function (data) {
                var nm = '';
                var fl = '';
                if (data.address) {
                    var parts = [];
                    if (data.address.road) parts.push(data.address.road);
                    if (data.address.neighbourhood) parts.push(data.address.neighbourhood);
                    if (data.address.suburb) parts.push(data.address.suburb);
                    if (data.address.village) parts.push(data.address.village);
                    if (data.address.town) parts.push(data.address.town);
                    if (data.address.city) parts.push(data.address.city);
                    if (data.address.state) parts.push(data.address.state);
                    if (data.address.country) parts.push(data.address.country);
                    var uniqueParts = [];
                    for (var i = 0; i < parts.length; i++) {
                        if (uniqueParts.indexOf(parts[i]) === -1) uniqueParts.push(parts[i]);
                    }
                    nm = uniqueParts.join(' - ');
                }
                if (data.display_name) fl = data.display_name;
                if (!nm) nm = fl || (lat + ', ' + lng);

                cd.innerHTML =
                    '<div style="margin-bottom:8px;"><i class="fas fa-map-marker-alt" style="color:#dc2626;"></i> <strong>العنوان:</strong><br><span style="font-size:14px;color:#1e293b;">' + nm + '</span></div>' +
                    (fl && fl !== nm ? '<div style="margin-bottom:8px;font-size:12px;color:#64748b;"><i class="fas fa-info-circle"></i> ' + fl + '</div>' : '') +
                    '<div style="font-size:11px;opacity:0.7;margin-bottom:6px;"><i class="fas fa-crosshairs"></i> ' + lat + ', ' + lng + '</div>' +
                    '<a href="https://maps.google.com/?q=' + lat + ',' + lng + '" target="_blank" style="color:#1a73e8;font-weight:bold;">📍 خرائط جوجل</a>';

                if (!li.value.trim()) li.value = nm;
            }, function () {
                cd.innerHTML = '<i class="fas fa-map-pin"></i> ' + (lat || '') + ', ' + (lng || '') + '<br><a href="https://maps.google.com/?q=' + (lat || '') + ',' + (lng || '') + '" target="_blank" style="color:#1a73e8;">📍 خرائط</a>';
                if (!li.value.trim()) li.value = (lat || '') + ', ' + (lng || '');
            });
    }, function (err) {
        var m = '❌ تعذر. ';
        if (err.code === 1) m += 'فعّل الصلاحية';
        if (err.code === 2) m += 'فعّل GPS';
        if (err.code === 3) m += 'حاول مرة أخرى';
        cd.textContent = m;
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
}

function handlePhotos(inp) {
    var files = Array.from(inp.files);
    if (currentPhotos.length + files.length > 12) {
        showToast('الحد 12 صورة', true);
        return;
    }
    files.forEach(function (f) {
        var reader = new FileReader();
        reader.onload = function (e) {
            resizeImage(e.target.result, function (resized) {
                currentPhotos.push({ name: f.name, data: resized });
                renderPhotoPreview();
            });
        };
        reader.readAsDataURL(f);
    });
    inp.value = '';
}

function renderPhotoPreview() {
    var preview = document.getElementById('photoPreview');
    if (!preview) return;
    preview.innerHTML = currentPhotos.map(function (p, idx) {
        return '<div class="photo-item"><img src="' + p.data + '" alt="' + (idx + 1) + '"><button class="photo-remove" onclick="removePhoto(' + idx + ')"><i class="fas fa-times"></i></button></div>';
    }).join('');
}

function removePhoto(i) {
    currentPhotos.splice(i, 1);
    renderPhotoPreview();
}

function collectInspectionData() {
    var data = {};
    var selectedType = document.getElementById('stationType').value;
    if (selectedType !== 'محطة تنقية مياه' && selectedType !== 'محطة معالجة صرف صحي' && selectedType !== 'رافع صرف صحي' && selectedType !== 'رافع مياه شرب') {
        return data;
    }
    inspectionItems.forEach(function (item) {
        var statusEl = document.getElementById(item.id);
        var notesEl = document.getElementById(item.id + '_notes');
        var photo = itemPhotos[item.id] || null;
        data[item.id] = {
            id: item.id,
            label: item.label,
            type: item.type,
            status: statusEl ? statusEl.value : '',
            notes: notesEl ? notesEl.value : '',
            photo: photo
        };
    });
    return data;
}

function collectIsoCertificates() {
    var certificates = [];
    // الشهادة الأولى (الأساسية)
    var status0 = document.getElementById('isoStatus0') || document.getElementById('isoStatus');
    if (status0) {
        var id0 = status0.id;
        var yearId0 = id0.replace('Status', 'Year');
        var validityId0 = id0.replace('Status', 'Validity');
        var status = status0.value;
        var type = document.getElementById(id0.replace('Status', 'Type')).value || null;
        var year = document.getElementById(yearId0).value || null;
        var validity = document.getElementById(validityId0) ? document.getElementById(validityId0).textContent : null;
        certificates.push({ status: status, type: type, year: year, validity: validity });
    }
    // الشهادات الإضافية
    var additionalRows = document.querySelectorAll('.iso-additional-row');
    additionalRows.forEach(function (row) {
        var index = row.getAttribute('data-iso-index');
        var status = document.getElementById('isoStatus' + index).value;
        var type = document.getElementById('isoType' + index).value || null;
        var year = document.getElementById('isoYear' + index).value || null;
        var validity = document.getElementById('isoValidity' + index) ? document.getElementById('isoValidity' + index).textContent : null;
        certificates.push({ status: status, type: type, year: year, validity: validity });
    });
    return certificates;
}

function addTsmCertificate() {
    var container = document.querySelector('.tsm-certificates-container');
    var certificates = container.querySelectorAll('.tsm-certificate');
    var index = certificates.length;
    var newCert = document.createElement('div');
    newCert.className = 'form-row-three tsm-certificate';
    newCert.setAttribute('data-index', index);
    newCert.innerHTML =
        '<div class="form-group"><label for="tsmStatus' + index + '"><i class="fas fa-award"></i> شهادة TSM ' + (index + 1) + ' <button type="button" class="btn btn-small btn-danger remove-tsm-btn" onclick="removeTsmCertificate(' + index + ')" title="حذف الشهادة"><i class="fas fa-minus"></i></button></label><select id="tsmStatus' + index + '" onchange="toggleYearField(\'tsmStatus' + index + '\',\'tsmYear' + index + '\',\'tsmYearMsg' + index + '\');updateTsmValidity(' + index + ')"><option value="غير حاصلة">غير حاصلة</option><option value="حاصلة">حاصلة</option></select></div>' +
        '<div class="form-group"><label for="tsmYear' + index + '"><i class="fas fa-calendar-check"></i> سنة الحصول</label><input type="number" id="tsmYear' + index + '" placeholder="2023" min="2000" max="2100" style="display:none;" onchange="updateTsmValidity(' + index + ')"><div class="no-cert-msg" id="tsmYearMsg' + index + '"><i class="fas fa-info-circle"></i> غير حاصلة</div></div>' +
        '<div class="form-group"><label><i class="fas fa-clock"></i> الصلاحية</label><div id="tsmValidity' + index + '" class="validity-display">غير حاصلة</div></div>';
    container.appendChild(newCert);
}

function removeTsmCertificate(index) {
    var cert = document.querySelector('.tsm-certificate[data-index="' + index + '"]');
    if (cert) cert.remove();
}

function updateTsmValidity(index) {
    var indexStr = (index === undefined || index === '') ? '' : String(index);
    var statusEl = document.getElementById('tsmStatus' + indexStr);
    var yearEl = document.getElementById('tsmYear' + indexStr);
    var validityEl = document.getElementById('tsmValidity' + indexStr);

    if (!statusEl || !validityEl) return;

    var status = statusEl.value;
    var year = yearEl ? yearEl.value : '';

    if (status === 'غير حاصلة') {
        validityEl.textContent = 'غير حاصلة';
        validityEl.className = 'validity-display no-cert';
    } else if (year) {
        var currentYear = new Date().getFullYear();
        if (currentYear <= parseInt(year) + 2) {
            validityEl.textContent = 'سارية';
            validityEl.className = 'validity-display valid';
        } else {
            validityEl.textContent = 'غير سارية';
            validityEl.className = 'validity-display expired';
        }
    } else {
        validityEl.textContent = 'غير محدد';
        validityEl.className = 'validity-display';
    }
}

function collectTsmCertificates() {
    var certificates = [];
    // الشهادة الأساسية
    var status = document.getElementById('tsmStatus').value;
    var year = document.getElementById('tsmYear').value || null;
    var validity = document.getElementById('tsmValidity') ? document.getElementById('tsmValidity').textContent : null;
    certificates.push({ status: status, year: year, validity: validity });
    return certificates;
}

function uploadToNextcloud(path, content, ct) {
    var url = NC_URL + '/remote.php/dav/files/' + encodeURIComponent(NC_USER) + path;
    return fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': 'Basic ' + btoa(NC_USER + ':' + NC_PASS),
            'Content-Type': ct || 'application/octet-stream'
        },
        body: content
    }).then(function (r) {
        if (r.ok || r.status === 201 || r.status === 204) return true;
        throw new Error(r.status);
    });
}

function createFolder(p) {
    var url = NC_URL + '/remote.php/dav/files/' + encodeURIComponent(NC_USER) + p;
    return fetch(url, {
        method: 'MKCOL',
        headers: {
            'Authorization': 'Basic ' + btoa(NC_USER + ':' + NC_PASS)
        }
    }).then(function () {
        return true;
    })['catch'](function () {
        return true;
    });
}

function uploadPDF(blob, name) {
    var promise = createFolder(NC_REPORTS_FOLDER)
        .then(function () {
            return uploadToNextcloud(NC_REPORTS_FOLDER + '/' + name, blob, 'application/pdf');
        })
        .then(function () {
            showToast('تم رفع PDF على Nextcloud');
        });
    promise['catch'](function () {
        showToast('تعذر رفع PDF', true);
    });
    return promise;
}

function uploadCSV() {
    var csv = localStorage.getItem('csvReports') || '';
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    return uploadToNextcloud(NC_CSV_PATH, blob, 'text/csv')['catch'](function () { });
}

function sendToGoogleSheets(r) {
    try {
        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: r.date,
                time: r.time,
                inspectorName: r.inspectorName,
                stationType: r.stationType,
                stationName: r.stationName,
                branch: r.branch,
                stationLocation: r.stationLocation,
                overallStatus: r.overallStatus,
                companyName: r.companyName,
                notes: r.notes
            })
        });
    } catch (e) { }
}

function updateCSVData(r) {
    var csv = localStorage.getItem('csvReports') || 'التاريخ,الوقت,المفتش,الشركة,نوع المحطة,اسم المحطة,الفرع,الموقع,الحالة,الخطورة,الملاحظات,التوصيات\n';
    csv += '"' + r.date + '","' + r.time + '","' + r.inspectorName + '","' + r.companyName + '","' + r.stationType + '","' + r.stationName + '","' + r.branch + '","' + r.stationLocation + '","' + r.overallStatus + '","' + r.severity + '","' + (r.notes || '').replace(/"/g, '""') + '","' + (r.recommendations || '').replace(/"/g, '""') + '"\n';
    localStorage.setItem('csvReports', csv);
}

function saveReport(isDirect) {
    var req = ['inspectorName', 'companyName', 'inspectionDate', 'inspectionTime', 'stationType', 'stationName', 'branch', 'stationLocation', 'safetyOfficer', 'stationManager', 'overallStatus'];
    for (var i = 0; i < req.length; i++) { var el = document.getElementById(req[i]); if (!el.value.trim()) { el.focus(); el.style.borderColor = '#dc2626'; showToast('يرجى ملء جميع الحقول', true); setTimeout(function () { el.style.borderColor = ''; }, 2000); return null; } }
    if (document.getElementById('stationType').value === 'محطة تنقية مياه' || document.getElementById('stationType').value === 'محطة معالجة صرف صحي' || document.getElementById('stationType').value === 'رافع صرف صحي' || document.getElementById('stationType').value === 'رافع مياه شرب') {
        for (var j = 0; j < inspectionItems.length; j++) {
            var itemEl = document.getElementById(inspectionItems[j].id);
            if (!itemEl || !itemEl.value.trim()) {
                itemEl && itemEl.focus();
                showToast('يرجى اختيار حالة لكل بند الفحص', true);
                return null;
            }
        }
    }
    var cd = document.getElementById('gpsCoords'), de = document.getElementById('designCapacity').value, ac = document.getElementById('actualCapacity').value, un = document.getElementById('capacityUnit').value;
    var report = {
        id: Date.now(), inspectorName: document.getElementById('inspectorName').value,
        companyName: document.getElementById('companyName').value,
        date: document.getElementById('inspectionDate').value, time: document.getElementById('inspectionTime').value,
        stationType: document.getElementById('stationType').value, stationName: document.getElementById('stationName').value,
        branch: document.getElementById('branch').value, stationLocation: document.getElementById('stationLocation').value,
        gps: { lat: cd.dataset.lat || '', lng: cd.dataset.lng || '' },
        designCapacity: de ? parseFloat(de) : null, actualCapacity: ac ? parseFloat(ac) : null,
        capacityUnit: un, capacityPercentage: (de && ac) ? Math.round((parseFloat(ac) / parseFloat(de)) * 100) : null,
        safetyOfficer: document.getElementById('safetyOfficer').value, stationManager: document.getElementById('stationManager').value,
        isoCertificates: collectIsoCertificates(), tsmCertificates: collectTsmCertificates(), civilProtectionReport: document.getElementById('civilDefenseStatus').value || null,
        wspStatus: document.getElementById('wspStatus').value, wspYear: document.getElementById('wspYear').value || null,
        inspectionData: collectInspectionData(),
        inspectionItems: inspectionItems, // حفظ البنود للـ PDF
        overallStatus: document.getElementById('overallStatus').value, severity: document.getElementById('severity').value,
        notes: document.getElementById('notes').value, recommendations: document.getElementById('recommendations').value,
        photos: currentPhotos, createdAt: new Date().toISOString()
    };
    reports.unshift(report); localStorage.setItem('waterReports', JSON.stringify(reports));
    updateStats(); buildBranchFilter(); sendToGoogleSheets(report); updateCSVData(report); uploadCSV();
    if (isDirect) { document.getElementById('saveConfirmModal').style.display = 'flex'; } else { showToast('تم حفظ التقرير ✅'); }
    return report;
}

function saveAndExportPDF() { var r = saveReport(false); if (r) { showToast('⏳ جاري تجهيز PDF...'); setTimeout(function () { generatePDF(r); }, 1000); } }

function generatePDF(report) {
    var sc = report.overallStatus === 'مطابق' ? 'pdf-compliant' : report.overallStatus === 'غير مطابق' ? 'pdf-non-compliant' : 'pdf-follow-up';
    var severityClass = report.severity === 'منخفضة' ? 'pdf-severity-low' : report.severity === 'متوسطة' ? 'pdf-severity-medium' : report.severity === 'عالية' ? 'pdf-severity-high' : report.severity === 'حرجة' ? 'pdf-severity-critical' : 'pdf-severity-default';
    var severityLabel = '<span class="pdf-severity-badge ' + severityClass + '">' + report.severity + '</span>';
    var unit = report.capacityUnit || 'م³/يوم';
    var capHTML = '';
    if (report.designCapacity && report.actualCapacity) {
        var pct = report.capacityPercentage, bc = pct > 100 ? '#dc2626' : pct > 85 ? '#f59e0b' : '#0d9488';
        capHTML = '<tr><td>الطاقة التصميمية</td><td>' + report.designCapacity.toLocaleString() + ' ' + unit + '</td></tr><tr><td>الطاقة الفعلية</td><td>' + report.actualCapacity.toLocaleString() + ' ' + unit + '</td></tr><tr><td>نسبة التشغيل</td><td><div class="pdf-capacity-bar"><div class="pdf-capacity-fill" style="width:' + Math.min(pct, 100) + '%;background:' + bc + ';">' + pct + '%</div></div></td></tr>';
    }
    var isoH = '';
    if (report.isoCertificates && report.isoCertificates.length > 0) {
        report.isoCertificates.forEach(function (cert, idx) {
            if (cert.status === 'حاصلة') {
                isoH += '✅ حاصلة' + (cert.type ? ' - ' + cert.type : '') + (cert.year ? ' - ' + cert.year : '') + ' (' + cert.validity + ')';
                if (idx < report.isoCertificates.length - 1) isoH += '<br>';
            } else {
                isoH += '❌ غير حاصلة';
                if (idx < report.isoCertificates.length - 1) isoH += '<br>';
            }
        });
    } else {
        isoH = '❌ غير حاصلة';
    }
    var tsmH = '';
    if (report.tsmCertificates && report.tsmCertificates.length > 0) {
        report.tsmCertificates.forEach(function (cert, idx) {
            if (cert.status === 'حاصلة') {
                tsmH += '✅ حاصلة' + (cert.year ? ' - ' + cert.year : '') + ' (' + cert.validity + ')';
                if (idx < report.tsmCertificates.length - 1) tsmH += '<br>';
            } else {
                tsmH += '❌ غير حاصلة';
                if (idx < report.tsmCertificates.length - 1) tsmH += '<br>';
            }
        });
    } else {
        tsmH = '❌ غير حاصلة';
    }
    var civilProtectionH = report.civilProtectionReport === 'حاصلة' ? '✅ حاصلة' : '❌ غير حاصلة';
    var wspH = report.wspStatus === 'حاصلة' ? '✅ حاصلة' + (report.wspYear ? ' - ' + report.wspYear : '') : '❌ غير حاصلة';

    var itemsHTML = '';
    if (report.inspectionData) {
        var idx = 0; for (var key in report.inspectionData) {
            var item = report.inspectionData[key]; idx++;
            var ic = item.type === 'crane', bg = ic ? (item.status === 'يوجد' ? 'pdf-exist' : 'pdf-not-exist') : (item.status === 'مطابق' ? 'pdf-compliant' : 'pdf-non-compliant');
            var icon = ic ? (item.status === 'يوجد' ? '✅' : '⛔') : (item.status === 'مطابق' ? '✅' : '❌');
            var photoTd = item.photo ? '<div style="position:relative; width:100%; height:100%; min-height:45px;"><img src="' + item.photo + '" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:fill; display:block; border-radius:0;"></div>' : '-';
            var tdPhotoStyle = item.photo ? 'padding:0; vertical-align:middle; height:1px;' : 'text-align:center; vertical-align:middle;';
            // تحديد إذا كانت الملاحظات مطلوبة
            var inspectionItem = report.inspectionItems.find(function (i) { return i.id === item.id; });
            var notesRequired = inspectionItem && inspectionItem.notesHideValues && !inspectionItem.notesHideValues.includes(item.status);
            var notesDisplay = notesRequired ? (item.notes || '-') : 'غير مطلوب';
            itemsHTML += '<tr><td style="text-align:center;font-weight:bold;color:#1a73e8;">' + idx + '</td><td>' + item.label + '</td><td><span class="pdf-status-badge ' + bg + '">' + icon + ' ' + item.status + '</span></td><td style="color:#666;">' + notesDisplay + '</td><td style="' + tdPhotoStyle + '">' + photoTd + '</td></tr>';
        }
    }

    var phHTML = '';
    if (report.photos && report.photos.length > 0) {
        var pg = report.photos.map(function (p, i) { return '<div style="width:24%;margin:0.5%;position:relative;display:inline-block;"><img src="' + p.data + '" style="width:100px;height:100px;border-radius:4px;border:1px solid #e0e0e0;display:block;"><div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:bold;">' + (i + 1) + '</div></div>'; }).join('');
        phHTML = '<div class="pdf-section"><h3>📷 صور عامة (' + report.photos.length + ')</h3><div style="display:flex;flex-wrap:wrap;gap:0;">' + pg + '</div></div>';
    }

    var df = new Date(report.date + 'T00:00:00').toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    // اسم الملف يشمل: الشركة + المحطة + الفرع + التاريخ
    var fileName = 'report_' + report.companyName + '_' + report.stationName + '_' + report.branch + '_' + report.date + '.pdf';
    var safeFileName = fileName.replace(/[\\/:*?"<>|]/g, '_');

    var t = '<div class="pdf-content"><div class="pdf-header"><div class="pdf-header-logos">' +
        '<img src="' + LOGO_HOLDING + '" style="width:70px;height:70px;border-radius:8px;background:#fff;padding:4px;border:2px solid rgba(255,255,255,.3);display:block;">' +
        '<div class="pdf-header-titles"><h1>الشركة القابضة لمياه الشرب والصرف الصحي</h1><h2>الإدارة العامة للسلامة والصحة المهنية والطوارئ والأزمات</h2><h3>🚰 تقرير المرور - ' + report.companyName + '</h3></div>' +
        '<img src="' + LOGO_SAFETY + '" style="width:70px;height:70px;border-radius:8px;background:#fff;padding:4px;border:2px solid rgba(255,255,255,.3);display:block;">' +
        '</div><div class="pdf-meta">📅 ' + df + ' | 🏢 ' + report.companyName + ' | 🏭 ' + report.stationType + ' ' + report.stationName + ' - ' + report.branch + '</div></div>' +
        '<div class="pdf-section"><h3>📋 المعلومات الأساسية</h3><table class="pdf-table">' +
        '<tr><td>الشركة</td><td>' + report.companyName + '</td></tr>' +
        '<tr><td>اسم المفتش</td><td>' + report.inspectorName + '</td></tr>' +
        '<tr><td>التاريخ</td><td>' + report.date + '</td></tr><tr><td>الوقت</td><td>' + report.time + '</td></tr>' +
        '<tr><td>نوع المحطة</td><td>' + report.stationType + '</td></tr><tr><td>اسم المحطة</td><td>' + report.stationName + '</td></tr>' +
        '<tr><td>الفرع</td><td>' + report.branch + '</td></tr><tr><td>الموقع</td><td>' + report.stationLocation + '</td></tr>' +
        (report.gps.lat ? '<tr><td>GPS</td><td>' + report.gps.lat + ', ' + report.gps.lng + '</td></tr>' : '') + capHTML +
        '<tr><td>مسؤول السلامة</td><td>' + report.safetyOfficer + '</td></tr><tr><td>مدير المحطة</td><td>' + report.stationManager + '</td></tr>' +
        '<tr><td>شهادة الايزو</td><td>' + isoH + '</td></tr><tr><td>شهادة TSM</td><td>' + tsmH + '</td></tr>' +
        '<tr><td>تقرير الحماية المدنية</td><td>' + civilProtectionH + '</td></tr>' +
        '<tr><td>شهادة سلامة ومأمونية المياه</td><td>' + wspH + '</td></tr>' +
        '</table></div>' +
        '<div class="html2pdf__page-break"></div>' +
        '<div class="pdf-section pdf-items-section" style="border:1px solid #e0e0e0; border-radius:8px; padding:0; margin:0;"><table class="pdf-items-table" style="width:100%; border-style:hidden;"><thead><tr><th colspan="5" style="background:none;border:none;padding:10px;text-align:right;"><h3 style="margin:0;color:#1e293b;">🔍 بنود الفحص</h3></th></tr><tr><th style="width:4%;">#</th><th style="width:28%;">البند</th><th style="width:14%;">النتيجة</th><th style="width:38%;">التفاصيل</th><th style="width:16%;">صورة</th></tr></thead><tbody>' + itemsHTML + '</tbody></table></div>' +
        '<div class="html2pdf__page-break"></div>' +
        '<div class="pdf-section" style="margin-top:20px;"><h3>📊 التقييم العام</h3><table class="pdf-table"><tr><td>الحالة</td><td><span class="pdf-status-badge ' + sc + '">' + report.overallStatus + '</span></td></tr><tr><td>الخطورة</td><td>' + severityLabel + '</td></tr></table></div>' +
        (report.notes ? '<div class="pdf-section"><h3>📝 الملاحظات</h3><p style="font-size:13px;line-height:1.8;">' + report.notes + '</p></div>' : '') +
        (report.recommendations ? '<div class="pdf-section"><h3>💡 التوصيات</h3><p style="font-size:13px;line-height:1.8;">' + report.recommendations + '</p></div>' : '') +
        phHTML + '<div class="pdf-footer"><p>الشركة القابضة لمياه الشرب والصرف الصحي</p><p>' + report.companyName + ' - ' + report.stationName + ' - ' + report.branch + '</p><p>' + new Date().toLocaleDateString('ar-EG') + ' - ' + new Date().toLocaleTimeString('ar-EG') + '</p></div></div>';

    var td = document.getElementById('pdfTemplate'); td.innerHTML = t; td.style.display = 'block';
    if (window.fixArabicSpaces) window.fixArabicSpaces(td);

    var images = Array.from(td.getElementsByTagName('img'));
    var promises = images.map(function (img) {
        return new Promise(function (resolve) {
            if (img.complete) resolve();
            else {
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 3000); // 3 seconds timeout
            }
        });
    });

    Promise.all(promises).then(function () {
        var options = { margin: [10, 10, 15, 10], filename: fileName, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, allowTaint: false, scrollY: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } };
        html2pdf().set(options).from(td).toPdf().get('pdf').then(function (pdf) {
            var pdfBlob = pdf.output('blob');
            td.style.display = 'none';
            var link = document.createElement('a');
            link.href = URL.createObjectURL(pdfBlob);
            link.download = safeFileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            uploadPDF(pdfBlob, safeFileName).then(function () { showScreen('mainScreen'); });
        })['catch'](function (err) {
            td.style.display = 'none';
            console.error('PDF generation error:', err);
            alert('تفاصيل خطأ PDF: ' + (err.message || err));
            showToast('خطأ PDF، تحقق من الصور أو اتصال المتصفح', true);
        });
    });
}

function getFilteredReports() {
    var s = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
    var d = document.getElementById('filterDate') ? document.getElementById('filterDate').value : '';
    var st = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : 'all';
    var fc = document.getElementById('filterCompany') ? document.getElementById('filterCompany').value : 'all';
    var ftype = document.getElementById('filterStationType') ? document.getElementById('filterStationType').value : 'all';
    var fb = document.getElementById('filterBranch') ? document.getElementById('filterBranch').value : 'all';
    var fl = document.getElementById('filterLocation') ? document.getElementById('filterLocation').value.toLowerCase() : '';
    var fi = document.getElementById('filterISO') ? document.getElementById('filterISO').value : 'all';
    var ft = document.getElementById('filterTSM') ? document.getElementById('filterTSM').value : 'all';

    var filtered = reports.filter(function (r) {
        var searchText = [
            r.stationName,
            r.branch,
            r.stationType,
            r.stationLocation,
            r.inspectorName,
            r.companyName,
            r.overallStatus,
            (r.isoCertificates || []).map(function (cert) { return cert.type + ' ' + cert.status; }).join(' '),
            (r.tsmCertificates || []).map(function (cert) { return cert.status; }).join(' ')
        ].join(' ').toLowerCase();

        var ms = !s || searchText.includes(s);
        var md = !d || r.date === d;
        var mt = st === 'all' || r.overallStatus === st;
        var mc = fc === 'all' || r.companyName === fc;
        var mtype = ftype === 'all' || r.stationType === ftype;
        var mb = fb === 'all' || (r.branch || '') === fb;
        var ml = !fl || (r.stationLocation || '').toLowerCase().includes(fl);
        var mi = fi === 'all' || (fi === 'hasIso' ? (r.isoCertificates || []).some(function (cert) { return cert.status === 'حاصلة'; }) : (r.isoCertificates || []).every(function (cert) { return cert.status !== 'حاصلة'; }));
        var mtm = ft === 'all' || (ft === 'hasTsm' ? (r.tsmCertificates || []).some(function (cert) { return cert.status === 'حاصلة'; }) : (r.tsmCertificates || []).every(function (cert) { return cert.status !== 'حاصلة'; }));
        return ms && md && mt && mc && mtype && mb && ml && mi && mtm;
    });

    lastFilteredReports = filtered;
    return filtered;
}

function exportFilteredReportsPDF() {
    var filtered = getFilteredReports();
    if (!filtered.length) {
        showToast('لا توجد نتائج للبحث الحالي', true);
        return;
    }

    showToast('⏳ جاري تجهيز PDF للنتائج...');

    var rows = filtered.map(function (r, idx) {
        var isoSummary = (r.isoCertificates || []).length ? (r.isoCertificates || []).map(function (cert) {
            return (cert.status || 'غير حاصلة') + (cert.type ? ' - ' + cert.type : '') + (cert.year ? ' - ' + cert.year : '');
        }).join('<br>') : 'لا يوجد';
        var tsmSummary = (r.tsmCertificates || []).length ? (r.tsmCertificates || []).map(function (cert) {
            return (cert.status || 'غير حاصلة') + (cert.year ? ' - ' + cert.year : '') + (cert.validity ? ' - ' + cert.validity : '');
        }).join('<br>') : 'لا يوجد';
        return '<tr><td style="border:1px solid #e2e8f0;padding:8px;text-align:center;">' + (idx + 1) + '</td><td style="border:1px solid #e2e8f0;padding:8px;">' + (r.companyName || '-') + '</td><td style="border:1px solid #e2e8f0;padding:8px;">' + (r.stationName || '-') + '</td><td style="border:1px solid #e2e8f0;padding:8px;">' + (r.branch || '-') + '</td><td style="border:1px solid #e2e8f0;padding:8px;">' + (r.date || '-') + '</td><td style="border:1px solid #e2e8f0;padding:8px;">' + (r.overallStatus || '-') + '</td><td style="border:1px solid #e2e8f0;padding:8px;">' + isoSummary + '</td><td style="border:1px solid #e2e8f0;padding:8px;">' + tsmSummary + '</td></tr>';
    }).join('');

    var html = '<div style="font-family:Arial, sans-serif; direction:rtl; padding:24px; color:#111827; line-height:1.6; word-spacing:2px;">' +
        '<h2 style="margin:0 0 10px; color:#1a73e8; font-size:22px;">نتائج البحث المتقدم</h2>' +
        '<p style="margin:0 0 16px; color:#64748b; font-size:13px;">عدد النتائج: ' + filtered.length + '</p>' +
        '<table style="width:100%; border-collapse:collapse; font-size:13px;">' +
        '<thead><tr style="background:#f8fafc;"><th style="border:1px solid #cbd5e1;padding:10px 8px;font-size:13px;">#</th><th style="border:1px solid #cbd5e1;padding:10px 8px;font-size:13px;">الشركة</th><th style="border:1px solid #cbd5e1;padding:10px 8px;font-size:13px;">اسم المحطة</th><th style="border:1px solid #cbd5e1;padding:10px 8px;font-size:13px;">الفرع</th><th style="border:1px solid #cbd5e1;padding:10px 8px;font-size:13px;">التاريخ</th><th style="border:1px solid #cbd5e1;padding:10px 8px;font-size:13px;">الحالة</th><th style="border:1px solid #cbd5e1;padding:10px 8px;font-size:13px;">ISO</th><th style="border:1px solid #cbd5e1;padding:10px 8px;font-size:13px;">TSM</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div style="margin-top:36px;text-align:center;font-size:9px;color:#64748b;">' +
        'تم التصدير من قبل تطبيق المرور على محطات مياه الشرب والصرف الصحي &nbsp;|&nbsp; التاريخ: ' + new Date().toLocaleDateString('ar-EG') + ' &nbsp;|&nbsp; الوقت: ' + new Date().toLocaleTimeString('ar-EG') + ' &nbsp;|&nbsp; مطور التطبيق: ' + (typeof NC_USER !== 'undefined' ? NC_USER : '---') +
        '</div>';

    var td = document.getElementById('pdfTemplate');
    td.innerHTML = html;
    td.style.display = 'block';
    if (window.fixArabicSpaces) window.fixArabicSpaces(td);

    var options = { margin: [10, 10, 15, 10], filename: 'search_results_' + new Date().toISOString().slice(0, 10) + '.pdf', image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, allowTaint: false, scrollY: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
    html2pdf().set(options).from(td).toPdf().get('pdf').then(function (pdf) {
        var pdfBlob = pdf.output('blob');
        td.style.display = 'none';
        var link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = 'search_results_' + new Date().toISOString().slice(0, 10) + '.pdf';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    })['catch'](function (err) {
        td.style.display = 'none';
        console.error('Search results PDF error:', err);
        showToast('تعذر تصدير PDF للنتائج', true);
    });
}

function renderReportsList() {
    var c = document.getElementById('reportsContainer');
    if (reports.length === 0) { c.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-light);"><i class="fas fa-inbox" style="font-size:60px;margin-bottom:15px;opacity:0.3;display:block;"></i><p>لا توجد تقارير بعد</p></div>'; return; }
    c.innerHTML = reports.map(function (r) {
        var sc = r.overallStatus === 'مطابق' ? 'status-compliant' : r.overallStatus === 'غير مطابق' ? 'status-non-compliant' : 'status-follow-up';
        var bc = r.overallStatus === 'مطابق' ? 'badge-compliant' : r.overallStatus === 'غير مطابق' ? 'badge-non-compliant' : 'badge-follow-up';
        var ic = (r.stationType || '').includes('مياه') || (r.stationType || '').includes('تنقية') || (r.stationType || '').includes('تحلية') ? 'fa-tint' : 'fa-toilet';
        return '<div class="report-card ' + sc + '" onclick="viewReport(' + r.id + ')"><div class="report-card-icon"><i class="fas ' + ic + '"></i></div><div class="report-card-info"><h4>' + (r.stationName || r.stationType) + '</h4><p><i class="fas fa-building"></i> ' + (r.companyName || '') + ' - ' + (r.branch || '') + '</p><p>' + r.date + ' &bull; ' + r.time + '</p><p><i class="fas fa-map-marker-alt"></i> ' + r.stationLocation + '</p></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;"><span class="report-card-badge ' + bc + '">' + r.overallStatus + '</span><button class="btn btn-small btn-danger" style="padding:5px 10px;font-size:11px;" onclick="event.stopPropagation();deleteReport(' + r.id + ')"><i class="fas fa-trash"></i></button></div></div>';
    }).join('');
}

function filterReports() {
    var filtered = getFilteredReports();
    var cards = document.querySelectorAll('.report-card');

    reports.forEach(function (r, i) {
        var visible = filtered.some(function (item) { return item.id === r.id; });
        if (cards[i]) {
            cards[i].style.display = visible ? 'flex' : 'none';
        }
    });
}

function toggleAdvancedSearch() {
    var panel = document.getElementById('advancedSearchPanel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
}

function viewReport(id) {
    var r = reports.find(function (x) { return x.id === id; }); if (!r) return; currentReportId = id;
    var unit = r.capacityUnit || 'م³/يوم';
    var capH = '';
    if (r.designCapacity && r.actualCapacity) {
        var pct = r.capacityPercentage, col = pct > 100 ? '#dc2626' : pct > 85 ? '#f59e0b' : '#0d9488';
        capH = '<div class="detail-row"><span class="detail-label">الطاقة التصميمية</span><span class="detail-value">' + r.designCapacity.toLocaleString() + ' ' + unit + '</span></div><div class="detail-row"><span class="detail-label">الطاقة الفعلية</span><span class="detail-value">' + r.actualCapacity.toLocaleString() + ' ' + unit + '</span></div><div class="detail-row"><span class="detail-label">نسبة التشغيل</span><span class="detail-value" style="color:' + col + ';font-weight:700;">' + pct + '%</span></div>';
    }
    var isoC = '';
    if (r.isoCertificates && r.isoCertificates.length > 0) {
        r.isoCertificates.forEach(function (cert, idx) {
            isoC += '<div class="detail-row"><span class="detail-label">شهادة الايزو ' + (idx + 1) + '</span><span class="detail-value"><span class="cert-badge ' + (cert.status === 'حاصلة' ? 'has-cert' : 'no-cert') + '">' + (cert.status === 'حاصلة' ? '✅' : '❌') + ' ' + cert.status + (cert.type ? ' - ' + cert.type : '') + (cert.year ? ' - ' + cert.year : '') + ' (' + cert.validity + ')' + '</span></span></div>';
        });
    } else {
        isoC = '<div class="detail-row"><span class="detail-label">شهادة الايزو</span><span class="detail-value"><span class="cert-badge no-cert">❌ غير حاصلة</span></span></div>';
    }
    var tsmC = '';
    if (r.tsmCertificates && r.tsmCertificates.length > 0) {
        r.tsmCertificates.forEach(function (cert, idx) {
            var lbl = r.tsmCertificates.length > 1 ? 'شهادة TSM ' + (idx + 1) : 'شهادة TSM';
            tsmC += '<div class="detail-row"><span class="detail-label">' + lbl + '</span><span class="detail-value"><span class="cert-badge ' + (cert.status === 'حاصلة' ? 'has-cert' : 'no-cert') + '">' + (cert.status === 'حاصلة' ? '✅' : '❌') + ' ' + cert.status + (cert.year ? ' - ' + cert.year : '') + ' (' + cert.validity + ')' + '</span></span></div>';
        });
    } else {
        tsmC = '<div class="detail-row"><span class="detail-label">شهادة TSM</span><span class="detail-value"><span class="cert-badge no-cert">❌ غير حاصلة</span></span></div>';
    }
    var wspC = '<div class="detail-row"><span class="detail-label">شهادة سلامة ومأمونية المياه</span><span class="detail-value"><span class="cert-badge ' + (r.wspStatus === 'حاصلة' ? 'has-cert' : 'no-cert') + '">' + (r.wspStatus === 'حاصلة' ? '✅' : '❌') + ' ' + r.wspStatus + (r.wspYear ? ' - ' + r.wspYear : '') + '</span></span></div>';

    var itemsH = '';
    if (r.inspectionData) {
        var idx = 0; for (var k in r.inspectionData) {
            var it = r.inspectionData[k]; idx++;
            var ic = it.type === 'crane', scl = ic ? (it.status === 'يوجد' ? 'status-exist' : 'status-not') : (it.status === 'مطابق' ? 'status-ok' : 'status-nok');
            var icon = ic ? (it.status === 'يوجد' ? '✅' : '⛔') : (it.status === 'مطابق' ? '✅' : '❌');
            itemsH += '<div class="detail-item-row"><div class="detail-item-header"><span class="detail-item-num ' + (ic ? 'crane-num' : '') + '">' + idx + '</span><span class="detail-item-name">' + it.label + '</span><span class="detail-item-status ' + scl + '">' + icon + ' ' + it.status + '</span></div>' + (it.notes ? '<div class="detail-item-notes">' + it.notes + '</div>' : '') + (it.photo ? '<img class="detail-item-photo" src="' + it.photo + '" alt="صورة">' : '') + '</div>';
        }
    }

    var phH = '';
    if (r.photos && r.photos.length > 0) { phH = '<div class="detail-section"><h3><i class="fas fa-camera"></i> صور عامة</h3><div class="detail-photos">' + r.photos.map(function (p) { return '<img src="' + p.data + '" alt="صورة">'; }).join('') + '</div></div>'; }
    var sb = r.overallStatus === 'مطابق' ? 'badge-compliant' : r.overallStatus === 'غير مطابق' ? 'badge-non-compliant' : 'badge-follow-up';

    document.getElementById('reportDetail').innerHTML =
        '<div class="detail-section"><h3><i class="fas fa-info-circle"></i> المعلومات الأساسية</h3>' +
        '<div class="detail-row"><span class="detail-label">الشركة</span><span class="detail-value">' + (r.companyName || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">المفتش</span><span class="detail-value">' + r.inspectorName + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">التاريخ</span><span class="detail-value">' + r.date + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">الوقت</span><span class="detail-value">' + r.time + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">نوع المحطة</span><span class="detail-value">' + r.stationType + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">اسم المحطة</span><span class="detail-value">' + r.stationName + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">الفرع</span><span class="detail-value">' + (r.branch || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">الموقع</span><span class="detail-value">' + r.stationLocation + '</span></div>' +
        (r.gps.lat ? '<div class="detail-row"><span class="detail-label">GPS</span><span class="detail-value"><a href="https://maps.google.com/?q=' + r.gps.lat + ',' + r.gps.lng + '" target="_blank" style="color:var(--primary);">📍 ' + r.gps.lat + ', ' + r.gps.lng + '</a></span></div>' : '') + capH +
        '<div class="detail-row"><span class="detail-label">مسؤول السلامة</span><span class="detail-value">' + r.safetyOfficer + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">مدير المحطة</span><span class="detail-value">' + r.stationManager + '</span></div>' +
        isoC + tsmC + wspC + '</div>' +
        '<div class="detail-section"><h3><i class="fas fa-clipboard-check"></i> بنود الفحص</h3>' + itemsH + '</div>' +
        '<div class="detail-section"><h3><i class="fas fa-flag"></i> التقييم العام</h3>' +
        '<div class="detail-row"><span class="detail-label">الحالة</span><span class="report-card-badge ' + sb + '">' + r.overallStatus + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">الخطورة</span><span class="detail-value">' + r.severity + '</span></div></div>' +
        (r.notes ? '<div class="detail-section"><h3><i class="fas fa-sticky-note"></i> الملاحظات</h3><p style="line-height:1.8;">' + r.notes + '</p></div>' : '') +
        (r.recommendations ? '<div class="detail-section"><h3><i class="fas fa-lightbulb"></i> التوصيات</h3><p style="line-height:1.8;">' + r.recommendations + '</p></div>' : '') + phH +
        '<div style="display:flex;gap:12px;margin-top:10px;"><button class="btn btn-primary" style="flex:1;" onclick="exportCurrentPDF()"><i class="fas fa-file-pdf"></i> PDF</button><button class="btn btn-danger" style="flex:1;" onclick="deleteReport(' + r.id + ');showScreen(\'reportsList\');"><i class="fas fa-trash"></i> حذف</button></div>';
    showScreen('viewReport');
}

function exportCurrentPDF() { var r = reports.find(function (x) { return x.id === currentReportId; }); if (r) generatePDF(r); }
function deleteReport(id) { if (confirm('حذف التقرير؟')) { reports = reports.filter(function (r) { return r.id !== id; }); localStorage.setItem('waterReports', JSON.stringify(reports)); updateStats(); buildBranchFilter(); renderReportsList(); showToast('تم الحذف'); } }
function updateStats() { document.getElementById('totalReports').textContent = reports.length; document.getElementById('compliantCount').textContent = reports.filter(function (r) { return r.overallStatus === 'مطابق'; }).length; document.getElementById('nonCompliantCount').textContent = reports.filter(function (r) { return r.overallStatus === 'غير مطابق'; }).length; }

function resetForm() {
    document.getElementById('inspectionForm').reset(); currentPhotos = []; itemPhotos = {}; isoCount = 0;
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('gpsCoords').className = 'gps-display'; document.getElementById('gpsCoords').dataset.lat = ''; document.getElementById('gpsCoords').dataset.lng = '';
    document.getElementById('capacityBarContainer').style.display = 'none';
    document.getElementById('reportStationDisplay').textContent = '--';
    document.getElementById('reportCompanyDisplay').textContent = '--';
    document.getElementById('actualUnit').textContent = 'م³/يوم';
    var isoStatusEl = document.getElementById('isoStatus0') || document.getElementById('isoStatus');
    if (isoStatusEl) {
        isoStatusEl.value = 'غير حاصلة';
        var typeEl = document.getElementById(isoStatusEl.id.replace('Status', 'Type'));
        var typeMsg = document.getElementById(isoStatusEl.id.replace('Status', 'TypeMsg'));
        if (typeEl) { typeEl.value = ''; typeEl.style.display = 'none'; }
        if (typeMsg) typeMsg.style.display = 'flex';
        var yearEl = document.getElementById(isoStatusEl.id.replace('Status', 'Year'));
        var yearMsg = document.getElementById(isoStatusEl.id.replace('Status', 'YearMsg'));
        if (yearEl) { yearEl.value = ''; yearEl.style.display = 'none'; }
        if (yearMsg) yearMsg.style.display = 'flex';
        var validityEl = document.getElementById(isoStatusEl.id.replace('Status', 'Validity'));
        if (validityEl) { validityEl.textContent = 'غير حاصلة'; validityEl.className = 'validity-display no-cert'; }
    }
    // مسح الصفوف الإضافية
    var container = document.getElementById('additionalIsoContainer');
    if (container) container.innerHTML = '';

    document.getElementById('tsmStatus').value = 'غير حاصلة'; document.getElementById('tsmYear').value = ''; document.getElementById('tsmYear').style.display = 'none'; document.getElementById('tsmYearMsg').style.display = 'flex';
    var tsmValidityDiv = document.getElementById('tsmValidity');
    if (tsmValidityDiv) {
        tsmValidityDiv.textContent = 'غير حاصلة';
        tsmValidityDiv.className = 'validity-display no-cert';
    }
    document.getElementById('wspStatus').value = 'غير حاصلة'; document.getElementById('wspYear').value = ''; document.getElementById('wspYear').style.display = 'none'; document.getElementById('wspYearMsg').style.display = 'flex';
    document.getElementById('civilDefenseStatus').value = 'غير حاصلة';
    buildInspectionItems();
    document.querySelectorAll('.severity-btn').forEach(function (b) { b.classList.remove('active'); });
    document.querySelector('.severity-btn.low').classList.add('active');
    document.getElementById('severity').value = 'منخفضة';
    setDefaultDateTime();
    updateInspectionVisibility();
}

function showToast(msg, err) { var t = document.getElementById('successToast'); document.getElementById('toastMessage').textContent = msg; t.style.background = err ? '#dc2626' : '#0d9488'; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 3000); }