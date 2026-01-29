/* =========
   EmailJS 설정 (본인 값)
   ========= */
const EMAILJS_PUBLIC_KEY = "7PDwssyVJ7c9E5h2X";
const EMAILJS_SERVICE_ID = "service_7vmlazi";
const EMAILJS_TEMPLATE_ID = "template_a4ozbtf";

/* =========
   Profile 저장 키
   ========= */
const PROFILE_KEY = "hdx_cs_profile_v3";

/* =========
   로컬 국기 이미지 경로
   flags/de.png 같은 형태
   ========= */
function flagPath(code2) {
  return `./flags/${code2}.png`;
}

/* =========
   국가 목록 (유럽 + 인근 / 터키~튀니지 / 러시아 제외)
   code: ISO 2자리 (Kosovo는 xk)
   ========= */
const COUNTRY_PHONE = [
  { name:"Germany", dial:"+49", code:"de" },
  { name:"Austria", dial:"+43", code:"at" },
  { name:"Switzerland", dial:"+41", code:"ch" },
  { name:"France", dial:"+33", code:"fr" },
  { name:"Italy", dial:"+39", code:"it" },
  { name:"Spain", dial:"+34", code:"es" },
  { name:"Portugal", dial:"+351", code:"pt" },
  { name:"Netherlands", dial:"+31", code:"nl" },
  { name:"Belgium", dial:"+32", code:"be" },
  { name:"Luxembourg", dial:"+352", code:"lu" },

  { name:"United Kingdom", dial:"+44", code:"gb" },
  { name:"Ireland", dial:"+353", code:"ie" },
  { name:"Denmark", dial:"+45", code:"dk" },
  { name:"Sweden", dial:"+46", code:"se" },
  { name:"Norway", dial:"+47", code:"no" },
  { name:"Finland", dial:"+358", code:"fi" },
  { name:"Iceland", dial:"+354", code:"is" },

  { name:"Poland", dial:"+48", code:"pl" },
  { name:"Czech Republic", dial:"+420", code:"cz" },
  { name:"Slovakia", dial:"+421", code:"sk" },
  { name:"Hungary", dial:"+36", code:"hu" },
  { name:"Romania", dial:"+40", code:"ro" },
  { name:"Bulgaria", dial:"+359", code:"bg" },
  { name:"Greece", dial:"+30", code:"gr" },
  { name:"Croatia", dial:"+385", code:"hr" },
  { name:"Slovenia", dial:"+386", code:"si" },
  { name:"Serbia", dial:"+381", code:"rs" },
  { name:"Bosnia and Herzegovina", dial:"+387", code:"ba" },
  { name:"Montenegro", dial:"+382", code:"me" },
  { name:"North Macedonia", dial:"+389", code:"mk" },
  { name:"Albania", dial:"+355", code:"al" },
  { name:"Kosovo", dial:"+383", code:"xk" },

  { name:"Lithuania", dial:"+370", code:"lt" },
  { name:"Latvia", dial:"+371", code:"lv" },
  { name:"Estonia", dial:"+372", code:"ee" },
  { name:"Moldova", dial:"+373", code:"md" },
  { name:"Ukraine", dial:"+380", code:"ua" },

  { name:"Türkiye", dial:"+90", code:"tr" },
  { name:"Israel", dial:"+972", code:"il" },
  { name:"Georgia", dial:"+995", code:"ge" },
  { name:"Tunisia", dial:"+216", code:"tn" },
];

function $(id){ return document.getElementById(id); }

/* =========
   Profile country select 채우기
   ========= */
function fillProfileCountries(){
  const sel = $("profileCountryInput");
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);

  COUNTRY_PHONE.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.name;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
}

/* =========
   Profile load/save
   ========= */
function loadProfile(){
  try{
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && p.company && p.agent && p.country) return p;
    return null;
  }catch{
    return null;
  }
}
function saveProfile(p){
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

/* =========
   DataURL helper
   ========= */
function readFileAsDataURL(file){
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* =========
   ✅ 이미지 압축 (캔버스)
   - 기본: maxW 1600px, JPEG, targetKB 350, startQuality 0.82
   ========= */
async function compressImageToDataURL(file, opts = {}){
  const {
    maxWidth = 1600,
    targetKB = 350,
    startQuality = 0.82,
    minQuality = 0.5,
    mime = "image/jpeg",
  } = opts;

  if (!file) return "";

  // 이미 작은 파일은 그대로(대략 350KB 이하)
  if (file.size && file.size <= targetKB * 1024) {
    return await readFileAsDataURL(file);
  }

  const dataUrl = await readFileAsDataURL(file);

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const scale = Math.min(1, maxWidth / (img.width || maxWidth));
  const w = Math.round((img.width || maxWidth) * scale);
  const h = Math.round((img.height || maxWidth) * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { alpha:false });

  // 배경 흰색(투명 방지)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  let q = startQuality;
  let out = canvas.toDataURL(mime, q);

  // targetKB 될 때까지 quality 낮추기 (최대 7회 정도)
  for (let i=0; i<7; i++){
    const approxBytes = Math.round((out.length * 3) / 4); // base64 대략 byte
    if (approxBytes <= targetKB * 1024) break;
    q = Math.max(minQuality, q - 0.07);
    out = canvas.toDataURL(mime, q);
    if (q <= minQuality) break;
  }

  return out;
}

/* =========
   ✅ Phone custom dropdown (LOCAL flags)
   ========= */
function setupPhoneDropdown(){
  const dd = $("phoneDD");
  const btn = $("phoneDDBtn");
  const list = $("phoneDDList");
  const itemsWrap = $("phoneItems");
  const search = $("phoneSearch");

  const hidden = $("phone_country"); // required 실제 값
  const ddText = $("phoneDDText");
  const flagImg = $("phoneFlag");

  if (!dd || !btn || !list || !itemsWrap || !search || !hidden || !ddText || !flagImg) return;

  // default visuals
  flagImg.src = "";
  flagImg.style.visibility = "hidden";

  function open(){
    dd.classList.add("open");
    search.value = "";
    renderItems("");
    setTimeout(() => search.focus(), 0);
  }
  function close(){
    dd.classList.remove("open");
  }

  function setSelected(countryName){
    const c = COUNTRY_PHONE.find(x => x.name === countryName);
    if (!c) return;

    hidden.value = c.name;
    hidden.setCustomValidity("");

    ddText.textContent = `${c.dial} ${c.name}`;
    flagImg.src = flagPath(c.code);
    flagImg.alt = c.name;
    flagImg.style.visibility = "visible";
    close();
  }

  function renderItems(q){
    const query = (q || "").trim().toLowerCase();
    itemsWrap.innerHTML = "";

    const filtered = COUNTRY_PHONE.filter(c => {
      if (!query) return true;
      const qn = query.replace(/\s+/g,"");
      return (
        c.name.toLowerCase().includes(query) ||
        c.dial.includes(qn) ||
        c.code.includes(qn)
      );
    });

    filtered.forEach(c => {
      const div = document.createElement("div");
      div.className = "ddItem";
      div.innerHTML = `
        <img class="flagImg" alt="${c.name}" src="${flagPath(c.code)}" />
        <span>${c.name}</span>
        <small>${c.dial}</small>
      `;
      div.addEventListener("click", () => setSelected(c.name));
      itemsWrap.appendChild(div);
    });

    if (filtered.length === 0){
      const div = document.createElement("div");
      div.className = "ddItem";
      div.style.cursor = "default";
      div.textContent = "No results";
      itemsWrap.appendChild(div);
    }
  }

  btn.addEventListener("click", () => {
    if (dd.classList.contains("open")) close();
    else open();
  });

  search.addEventListener("input", (e) => renderItems(e.target.value));

  // outside click close
  document.addEventListener("click", (e) => {
    if (!dd.contains(e.target)) close();
  });

  // required validation for hidden input
  hidden.addEventListener("invalid", () => {
    hidden.setCustomValidity("Please select phone country code.");
  });

  // default: profile country if exists, else Germany
  const p = loadProfile();
  if (p?.country) setSelected(p.country);
  else setSelected("Germany");
}

/* helper: set phone dropdown by country name (used by profile) */
function setPhoneCountry(countryName){
  const hidden = $("phone_country");
  const ddText = $("phoneDDText");
  const flagImg = $("phoneFlag");
  if (!hidden || !ddText || !flagImg) return;

  const c = COUNTRY_PHONE.find(x => x.name === countryName);
  if (!c) return;

  hidden.value = c.name;
  hidden.setCustomValidity("");

  ddText.textContent = `${c.dial} ${c.name}`;
  flagImg.src = flagPath(c.code);
  flagImg.alt = c.name;
  flagImg.style.visibility = "visible";
}

/* =========
   Profile UI
   ========= */
function setupProfileUI(){
  const profileText = $("profileText");
  const editor = $("profileEditor");
  const editBtn = $("editProfileBtn");
  const saveBtn = $("saveProfileBtn");
  const cancelBtn = $("cancelProfileBtn");
  const companyInput = $("companyInput");
  const agentInput = $("agentInput");
  const countryInput = $("profileCountryInput");
  const msg = $("profileMsg");

  const companyHidden = document.querySelector('input[name="company"]');
  const agentHidden = document.querySelector('input[name="agent"]');
  const countryHidden = document.querySelector('input[name="country"]');

  const applyProfileToUI = (p) => {
    profileText.textContent = `${p.company} / ${p.agent}\n${p.country}`;
    if (companyHidden) companyHidden.value = p.company;
    if (agentHidden) agentHidden.value = p.agent;
    if (countryHidden) countryHidden.value = p.country;

    // phone dropdown 기본값도 프로필 국가로 맞춤 (원치 않으면 이 줄 삭제)
    setPhoneCountry(p.country);
  };

  const p = loadProfile();
  if (p) {
    applyProfileToUI(p);
  } else {
    profileText.textContent = "Not set";
    if (companyHidden) companyHidden.value = "";
    if (agentHidden) agentHidden.value = "";
    if (countryHidden) countryHidden.value = "";
  }

  editBtn?.addEventListener("click", () => {
    msg.textContent = "";
    const current = loadProfile();
    companyInput.value = current?.company || (companyHidden?.value || "");
    agentInput.value = current?.agent || (agentHidden?.value || "");
    countryInput.value = current?.country || (countryHidden?.value || "");
    editor.style.display = "block";
  });

  cancelBtn?.addEventListener("click", () => {
    msg.textContent = "";
    editor.style.display = "none";
  });

  saveBtn?.addEventListener("click", () => {
    msg.textContent = "";
    const company = companyInput.value.trim();
    const agent = agentInput.value.trim();
    const country = (countryInput.value || "").trim();

    if (!company || !agent || !country) {
      msg.textContent = "Company, Agent and Country are required.";
      return;
    }

    const newP = { company, agent, country };
    saveProfile(newP);
    applyProfileToUI(newP);
    editor.style.display = "none";
  });
}

/* =========
   SN/TV 모드 UI 토글
   ========= */
function setupSnTvModeUI(){
  const snText = $("device_sn");
  const snPhotoWrap = $("snPhotoWrap");
  const snPhoto = $("sn_photo");
  const snHint = $("snPhotoHint");

  const tvTextWrap = $("tvTextWrap");
  const tvId = $("teamviewer_id");
  const tvPw = $("teamviewer_pw");
  const tvPhotoWrap = $("tvPhotoWrap");
  const tvPhoto = $("tv_photo");
  const tvHint = $("tvPhotoHint");

  const getRadioValue = (name) =>
    document.querySelector(`input[name="${name}"]:checked`)?.value;

  function applyModes(){
    const snMode = getRadioValue("sn_mode") || "text";
    const tvMode = getRadioValue("tv_mode") || "text";

    if (snMode === "text") {
      snText.required = true;
      if (snPhoto) snPhoto.required = false;
      if (snPhotoWrap) snPhotoWrap.style.display = "none";
    } else {
      snText.required = false;
      if (snPhoto) snPhoto.required = true;
      if (snPhotoWrap) snPhotoWrap.style.display = "block";
    }

    if (tvMode === "text") {
      tvId.required = true;
      tvPw.required = true;
      if (tvPhoto) tvPhoto.required = false;
      if (tvTextWrap) tvTextWrap.style.display = "block";
      if (tvPhotoWrap) tvPhotoWrap.style.display = "none";
    } else {
      tvId.required = false;
      tvPw.required = false;
      if (tvPhoto) tvPhoto.required = true;
      if (tvTextWrap) tvTextWrap.style.display = "none";
      if (tvPhotoWrap) tvPhotoWrap.style.display = "block";
    }
  }

  document.querySelectorAll('input[name="sn_mode"]').forEach(r => r.addEventListener("change", applyModes));
  document.querySelectorAll('input[name="tv_mode"]').forEach(r => r.addEventListener("change", applyModes));

  snPhoto?.addEventListener("change", () => {
    snHint.textContent = snPhoto.files?.[0] ? `Selected: ${snPhoto.files[0].name}` : "";
  });
  tvPhoto?.addEventListener("change", () => {
    tvHint.textContent = tvPhoto.files?.[0] ? `Selected: ${tvPhoto.files[0].name}` : "";
  });

  applyModes();
}

function resetSnTvUI(){
  const snTextRadio = document.querySelector('input[name="sn_mode"][value="text"]');
  const tvTextRadio = document.querySelector('input[name="tv_mode"][value="text"]');
  if (snTextRadio) snTextRadio.checked = true;
  if (tvTextRadio) tvTextRadio.checked = true;

  if ($("snPhotoHint")) $("snPhotoHint").textContent = "";
  if ($("tvPhotoHint")) $("tvPhotoHint").textContent = "";

  setupSnTvModeUI();
}

/* =========
   Phone compose
   ========= */
function phoneDial(countryName){
  const c = COUNTRY_PHONE.find(x => x.name === countryName);
  if (!c) return "";
  return c.dial;
}

/* =========
   EmailJS 전송
   ========= */
function setupEmailJS(){
  if (!window.emailjs) {
    console.error("EmailJS not loaded.");
    return;
  }

  emailjs.init(EMAILJS_PUBLIC_KEY);

  const form = $("csForm");
  const status = $("status");
  const btn = $("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.classList.remove("error");
    status.textContent = "";

    // profile required
    const company = (document.querySelector('input[name="company"]')?.value || "").trim();
    const agent = (document.querySelector('input[name="agent"]')?.value || "").trim();
    const country = (document.querySelector('input[name="country"]')?.value || "").trim();

    if (!company || !agent || !country) {
      status.classList.add("error");
      status.textContent = "Please set Profile (Company / Agent / Country) first.";
      const editor = $("profileEditor");
      if (editor) editor.style.display = "block";
      return;
    }

    // phone country required (hidden)
    const phoneCountry = ($("phone_country")?.value || "").trim();
    if (!phoneCountry) {
      status.classList.add("error");
      status.textContent = "Please select phone country code.";
      return;
    }

    if (!form.checkValidity()) {
      status.classList.add("error");
      status.textContent = "Please fill all required fields.";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Sending...";

    const snMode = document.querySelector('input[name="sn_mode"]:checked')?.value || "text";
    const tvMode = document.querySelector('input[name="tv_mode"]:checked')?.value || "text";

    const snPhotoFile = $("sn_photo")?.files?.[0] || null;
    const tvPhotoFile = $("tv_photo")?.files?.[0] || null;

    // ✅ 압축 후 DataURL
    const deviceSnPhotoDataUrl =
      snMode === "photo" ? await compressImageToDataURL(snPhotoFile) : "";
    const teamviewerPhotoDataUrl =
      tvMode === "photo" ? await compressImageToDataURL(tvPhotoFile) : "";

    // phone full
    const prefix = phoneDial(phoneCountry);
    const number = ($("clinic_phone")?.value || "").trim();
    const clinicPhoneFull = `${prefix} ${number}`.trim();

    const templateParams = {
      company,
      agent,
      country,

      clinic_name: $("clinic_name").value,
      clinic_address: $("clinic_address").value,
      clinic_phone: clinicPhoneFull,

      dentist_name: $("dentist_name").value,
      device_name: $("device_name").value,

      device_sn: $("device_sn").value || "",
      teamviewer_id: $("teamviewer_id")?.value || "",
      teamviewer_pw: $("teamviewer_pw")?.value || "",

      sn_mode: snMode,
      tv_mode: tvMode,

      // ✅ EmailJS 템플릿 변수로 전송 (Base64 DataURL)
      device_sn_photo_dataurl: deviceSnPhotoDataUrl,
      teamviewer_photo_dataurl: teamviewerPhotoDataUrl,
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

      status.textContent = "OK. Sent via EmailJS.";

      // reset (profile hidden 유지)
      form.reset();
      $("device_name").value = "";

      const p = loadProfile();
      if (p) {
        document.querySelector('input[name="company"]').value = p.company;
        document.querySelector('input[name="agent"]').value = p.agent;
        document.querySelector('input[name="country"]').value = p.country;

        setPhoneCountry(p.country);
      } else {
        // clear phone dropdown
        const hidden = $("phone_country");
        const ddText = $("phoneDDText");
        const flagImg = $("phoneFlag");
        if (hidden) hidden.value = "";
        if (ddText) ddText.textContent = "Select country code";
        if (flagImg) { flagImg.src = ""; flagImg.style.visibility = "hidden"; }
      }

      resetSnTvUI();

    } catch (err) {
      console.error("EmailJS error:", err);
      const reason =
        err?.text ||
        err?.message ||
        (typeof err === "string" ? err : JSON.stringify(err));

      status.classList.add("error");
      status.textContent = `Failed to send: ${reason}`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit";
    }
  });
}

/* =========
   Service Worker 등록
   ========= */
function registerSW(){
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(console.error);
}

/* init */
fillProfileCountries();
setupProfileUI();
setupPhoneDropdown();
setupSnTvModeUI();
setupEmailJS();
registerSW();
