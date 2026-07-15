const LS_KEY = 'eejanaika_tt_v3';
let editMode = false;

function hmToMin(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}
function minToHm(min) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
function addMin(hm, add) {
  return minToHm(hmToMin(hm) + add);
}
function genreClass(genre) {
  const map = {
    'トランス': 'g-trance', 'プログレ': 'g-prog', 'アニメーション': 'g-anime',
    'パンク': 'g-punk', 'ヒップホップ': 'g-hiphop', '昭和歌謡': 'g-showa', 'おしゃれ': 'g-oshare'
  };
  return map[genre] || 'g-other';
}

let data = { baseTime: '17:00', items: [] };

async function loadFromJson() {
  const res = await fetch('timetable.json');
  data = await res.json();
}
function load() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) data = JSON.parse(raw);
}
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

const listEl = document.getElementById('list');
const endEl = document.getElementById('endTime');
const baseInput = document.getElementById('baseTime');
const modeBtn = document.getElementById('modeBtn');
const addBtn = document.getElementById('addBtn');

function updateMode() {
  document.body.classList.toggle('view-mode', !editMode);
  document.body.classList.toggle('edit-mode', editMode);
  modeBtn.textContent = editMode ? '閲覧' : '編集';
  addBtn.style.display = editMode ? 'block' : 'none';
}

modeBtn.addEventListener('click', () => {
  editMode = !editMode;
  updateMode();
  render();
});

function render() {
  listEl.innerHTML = '';
  let cursor = data.baseTime;

  data.items.forEach((item, idx) => {
    const side = idx % 2 === 0 ? 'left' : 'right';
    const startTime = cursor;
    const endTime = item.duration != null ? addMin(startTime, item.duration) : '—';

    const li = document.createElement('li');
    li.className = 'tl-item ' + side + ' ' + (genreClass(item.genre) || '');

    const dot = document.createElement('div');
    dot.className = 'tl-dot ' + (genreClass(item.genre) || '');

    const conn = document.createElement('div');
    conn.className = 'tl-conn';

    const card = document.createElement('div');
    card.className = 'tl-card';

    const timeTop = document.createElement('div');
    timeTop.className = 'tl-time';
    timeTop.textContent = startTime + ' – ' + endTime;

    const nameEl = document.createElement('input');
    nameEl.className = 'tl-name';
    nameEl.type = 'text';
    nameEl.value = item.name;
    nameEl.spellcheck = false;
    nameEl.readOnly = !editMode;
    if (editMode) {
      nameEl.addEventListener('change', () => {
        data.items[idx].name = nameEl.value || '無名';
        save();
      });
    }

    const durWrap = document.createElement('div');
    durWrap.className = 'tl-dur';
    if (editMode) {
      const durInput = document.createElement('input');
      durInput.type = 'number';
      durInput.value = item.duration == null ? '' : item.duration;
      durInput.min = 0;
      durInput.addEventListener('change', () => {
        const v = durInput.value.trim();
        data.items[idx].duration = v === '' ? null : Math.max(0, parseInt(v, 10) || 0);
        save(); render();
      });
      const unit = document.createElement('span');
      unit.textContent = '分';
      durWrap.append(durInput, unit);
    } else {
      const durText = document.createElement('span');
      durText.textContent = (item.duration != null ? item.duration : '—') + '分';
      durWrap.appendChild(durText);
    }

    const del = document.createElement('button');
    del.className = 'tl-del';
    del.textContent = '×';
    del.addEventListener('click', () => {
      data.items.splice(idx, 1);
      save(); render();
    });

    card.append(timeTop, nameEl, durWrap, del);
    li.append(dot, conn, card);
    listEl.appendChild(li);

    if (item.duration != null) cursor = addMin(cursor, item.duration);
  });

  endEl.textContent = cursor;
}

let sortable;
function initSortable() {
  if (sortable) sortable.destroy();
  sortable = new Sortable(listEl, {
    handle: '.tl-card',
    animation: 120,
    delay: 100,
    delayOnTouchOnly: true,
    ghostClass: 'tl-ghost',
    dragClass: 'tl-drag',
    onEnd: (evt) => {
      if (evt.oldIndex === evt.newIndex) return;
      const [moved] = data.items.splice(evt.oldIndex, 1);
      data.items.splice(evt.newIndex, 0, moved);
      save(); render();
    },
  });
}

document.getElementById('addBtn').addEventListener('click', () => {
  data.items.push({ name: '新規', duration: 45, genre: '' });
  save(); render();
  setTimeout(() => {
    const inputs = listEl.querySelectorAll('.tl-name');
    const last = inputs[inputs.length - 1];
    if (last) { last.focus(); last.select(); }
  }, 50);
});

(async () => {
  await loadFromJson();
  load();
  updateMode();
  render();
  initSortable();
})();
