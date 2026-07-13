const DEFAULT = [
  { name: 'おしゃれどろぼう', duration: 15 },
  { name: 'モリー', duration: 45 },
  { name: 'トムサック', duration: 60 },
  { name: 'アルカ', duration: 45 },
  { name: 'オレンジさん', duration: 45 },
  { name: 'ムッシュ', duration: 45 },
  { name: 'ピクシー', duration: null },
];

const LS_KEY = 'eejanaika_tt_v1';

/* helpers */
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

/* state */
let data = { baseTime: '17:00', items: [...DEFAULT] };

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) data = JSON.parse(raw);
  } catch {}
}
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

/* render */
const listEl = document.getElementById('list');
const endEl = document.getElementById('endTime');
const baseInput = document.getElementById('baseTime');

function render() {
  listEl.innerHTML = '';
  let cursor = data.baseTime;

  data.items.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'row' + (item.duration == null ? ' empty' : '');
    li.dataset.idx = idx;

    /* start time */
    const timeEl = document.createElement('div');
    timeEl.className = 'time';
    timeEl.textContent = cursor;

    /* handle */
    const handle = document.createElement('div');
    handle.className = 'handle';
    handle.innerHTML = '<span></span><span></span><span></span>';
    handle.setAttribute('aria-label', 'drag');

    /* name input */
    const nameEl = document.createElement('input');
    nameEl.className = 'name';
    nameEl.type = 'text';
    nameEl.value = item.name;
    nameEl.spellcheck = false;
    nameEl.addEventListener('change', () => {
      data.items[idx].name = nameEl.value || '無名';
      save();
    });

    /* duration input */
    const durWrap = document.createElement('div');
    durWrap.className = 'dur-wrap';
    const durEl = document.createElement('input');
    durEl.className = 'dur';
    durEl.type = item.duration == null ? 'text' : 'number';
    durEl.value = item.duration == null ? '—' : item.duration;
    durEl.readOnly = item.duration == null;
    durEl.addEventListener('change', () => {
      const v = durEl.value.trim();
      if (v === '' || v === '—') {
        data.items[idx].duration = null;
      } else {
        const n = parseInt(v, 10);
        data.items[idx].duration = isNaN(n) ? 0 : Math.max(0, n);
      }
      save();
      render();
    });
    const unit = document.createElement('span');
    unit.className = 'unit';
    unit.textContent = '分';
    durWrap.append(durEl, unit);

    /* delete */
    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = '×';
    del.addEventListener('click', () => {
      data.items.splice(idx, 1);
      save();
      render();
    });

    li.append(timeEl, handle, nameEl, durWrap, del);
    listEl.appendChild(li);

    if (item.duration != null) {
      cursor = addMin(cursor, item.duration);
    }
  });

  endEl.textContent = cursor;
}

/* sortable */
let sortable;
function initSortable() {
  if (sortable) sortable.destroy();
  sortable = new Sortable(listEl, {
    handle: '.handle',
    animation: 150,
    delay: 120,
    delayOnTouchOnly: true,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    onEnd: (evt) => {
      if (evt.oldIndex === evt.newIndex) return;
      const [moved] = data.items.splice(evt.oldIndex, 1);
      data.items.splice(evt.newIndex, 0, moved);
      save();
      render();
    },
  });
}

/* base time */
baseInput.value = data.baseTime;
baseInput.addEventListener('change', () => {
  data.baseTime = baseInput.value;
  save();
  render();
});

/* add */
document.getElementById('addBtn').addEventListener('click', () => {
  data.items.push({ name: '新規アーティスト', duration: 45 });
  save();
  render();
  setTimeout(() => {
    const inputs = listEl.querySelectorAll('.name');
    if (inputs.length) {
      inputs[inputs.length - 1].focus();
      inputs[inputs.length - 1].select();
    }
  }, 50);
});

/* init */
load();
baseInput.value = data.baseTime;
render();
initSortable();
