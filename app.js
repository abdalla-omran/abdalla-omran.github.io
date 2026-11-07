// التنقل بين التابات
document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("section").forEach(s => s.hidden = true);
    document.getElementById(btn.dataset.tab).hidden = false;
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  };
});

// المسبحة
let count = Number(localStorage.getItem("count")) || 0;
const countEl = document.getElementById("count");
countEl.textContent = count;

document.getElementById("tap").onclick = () => {
  count++;
  countEl.textContent = count;
  localStorage.setItem("count", count);
  if (navigator.vibrate) navigator.vibrate(30);
};

document.getElementById("reset").onclick = () => {
  count = 0;
  countEl.textContent = 0;
  localStorage.setItem("count", 0);
};

// المصحف
const surahSelect = document.getElementById("surahSelect");
const ayahsEl = document.getElementById("ayahs");

async function loadSurahList() {
  try {
    const res = await fetch("https://api.alquran.cloud/v1/surah");
    const json = await res.json();
    json.data.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.number;
      opt.textContent = s.number + ". " + s.name;
      surahSelect.appendChild(opt);
    });
    loadSurah(1);
  } catch (e) {
    ayahsEl.textContent = "حصلت مشكلة في التحميل. اتأكد إن النت شغال.";
  }
}

async function loadSurah(n) {
  ayahsEl.textContent = "جاري التحميل...";
  try {
    const res = await fetch("https://api.alquran.cloud/v1/surah/" + n + "/quran-uthmani");
    const json = await res.json();
    ayahsEl.textContent = "";
    json.data.ayahs.forEach(a => {
      const span = document.createElement("span");
      span.textContent = a.text + " ﴿" + a.numberInSurah + "﴾ ";
      ayahsEl.appendChild(span);
    });
  } catch (e) {
    ayahsEl.textContent = "حصلت مشكلة في التحميل. اتأكد إن النت شغال.";
  }
}

surahSelect.onchange = () => loadSurah(surahSelect.value);
loadSurahList();

// القرّاء
let allReciters = [];
let surahNames = {};
const searchEl = document.getElementById("search");
const reciterSelect = document.getElementById("reciterSelect");
const moshafSelect = document.getElementById("moshafSelect");
const reciterSurah = document.getElementById("reciterSurah");
const player = document.getElementById("player");
const statusEl = document.getElementById("status");

function addOption(select, value, text) {
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = text;
  select.appendChild(opt);
}

function currentReciter() {
  return allReciters.find(r => r.id == reciterSelect.value);
}

function fillSurahs() {
  reciterSurah.innerHTML = "";
  const r = currentReciter();
  if (!r) return;
  const m = r.moshaf[moshafSelect.value];
  m.surah_list.split(",").forEach(n => {
    addOption(reciterSurah, n, n + ". " + (surahNames[n] || ""));
  });
}

function fillMoshaf() {
  moshafSelect.innerHTML = "";
  const r = currentReciter();
  if (!r) return;
  r.moshaf.forEach((m, i) => addOption(moshafSelect, i, m.name));
  fillSurahs();
}

function fillReciters(list) {
  reciterSelect.innerHTML = "";
  list.forEach(r => addOption(reciterSelect, r.id, r.name));
  statusEl.textContent = "عدد القرّاء: " + list.length;
  fillMoshaf();
}

async function loadReciters() {
  try {
    const [r, s] = await Promise.all([
      fetch("https://mp3quran.net/api/v3/reciters?language=ar").then(x => x.json()),
      fetch("https://mp3quran.net/api/v3/suwar?language=ar").then(x => x.json())
    ]);
    allReciters = r.reciters.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    s.suwar.forEach(x => { surahNames[x.id] = x.name; });
    fillReciters(allReciters);
  } catch (e) {
    statusEl.textContent = "حصلت مشكلة في تحميل القرّاء. اتأكد إن النت شغال.";
  }
}

searchEl.oninput = () => {
  const q = searchEl.value.trim();
  fillReciters(allReciters.filter(r => r.name.includes(q)));
};

reciterSelect.onchange = fillMoshaf;
moshafSelect.onchange = fillSurahs;

document.getElementById("playBtn").onclick = () => {
  const r = currentReciter();
  if (!r) return;
  const m = r.moshaf[moshafSelect.value];
  const n = String(reciterSurah.value).padStart(3, "0");
  player.src = m.server + n + ".mp3";
  player.play().catch(() => {
    statusEl.textContent = "الصوت ما اشتغلش. جرّب شيخ أو سورة تانية.";
  });
};

loadReciters();
