
  'use strict';
  const TT_KEY = 'eejanaika_tt_v3';
  let ev = null;
  let ttData = { baseTime: '17:00', items: [] };
  let mode = 'lp';

  const gcCache = {};
  function gc(g) {
    if (!gcCache[g] && ev && ev.genres) {
      const found = ev.genres.find(x => typeof x === 'object' ? x.name === g : x === g);
      gcCache[g] = (typeof found === 'object' ? found.color : 'g-other') || 'g-other';
    }
    return gcCache[g] || 'g-other';
  }

  function hmToMin(hm) { const [h,m]=hm.split(':').map(Number); return h*60+m; }
  function minToHm(min) { const h=Math.floor(min/60)%24, m=min%60; return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'); }
  function addMin(hm,add) { return minToHm(hmToMin(hm)+add); }

  async function loadAll() {
    const [er, tr] = await Promise.all([
      fetch('data/event.json').then(r=>r.json()),
      fetch('data/20260802.json').then(r=>r.json()).catch(()=>({}))
    ]);
    ev = er;
    ttData = { baseTime: tr.baseTime || '17:00', items: tr.schedule || [] };
    const raw = localStorage.getItem(TT_KEY);
    if (raw) ttData = JSON.parse(raw);
  }

  function render() {
    document.title = ev.title;
    document.getElementById('headerTitle').textContent = ev.title;
    const tt = document.getElementById('lpTopTitle');
    if (tt) tt.textContent = ev.title;
    document.getElementById('headerDate').textContent = ev.date + ' ' + ev.timeStart + ' – ' + ev.timeEnd;
    document.getElementById('footerTitle').textContent = ev.title + ' 2026';
    document.getElementById('lpFlyer').src = ev.flyer;
    document.getElementById('lpFlyer').alt = ev.title;
    const f2 = document.getElementById('lpFlyer2');
    if (f2) { f2.src = ev.flyerAlt || ev.flyer; f2.alt = ev.title + ' 2枚目'; }

    const cc = document.getElementById('lpCopy');
    if (ev.copy && ev.copy.length) {
      cc.style.display = '';
      let inEm = false;
      document.getElementById('lpCopyContent').innerHTML = ev.copy.map(line =>
        !line ? (inEm = !inEm, '<div class="copy-divider"></div>')
              : '<div class="copy-line' + (inEm ? ' copy-em' : '') + '">' + line + '</div>'
      ).join('');
    }

    const genres = (ev.genres || []).map(g => {
      const name = typeof g === 'object' ? g.name : g;
      return '<span class="genre-badge ' + gc(name) + '">' + name + '</span>';
    }).join('');
    document.getElementById('lpDetails').innerHTML =
      '<div class="detail-row"><span class="detail-label">日時</span><span class="detail-value">' + ev.date + ' ' + ev.timeStart + ' – ' + ev.timeEnd + '</span></div>'
      + '<div class="detail-row"><span class="detail-label">料金</span><span class="detail-value">' + ev.fee + '</span></div>'
      + '<div class="detail-row"><span class="detail-label">会場</span><span class="detail-value">' + ev.venue
      + '<br><span class="detail-sub">' + ev.address + '</span></span></div>'
      + (ev.accessFromShibuya ? '<div class="detail-row"><span class="detail-label">アクセス</span><span class="detail-value" style="color:var(--g-trance);font-weight:600">' + ev.accessFromShibuya + '</span></div>' : '')
      + '<div class="detail-row"><span class="detail-label">ジャンル</span><span class="detail-value">' + genres + '</span></div>'
      + '<div class="detail-row"><span class="detail-label">DJ</span><span class="detail-value">' + ev.members.map(m=>m.name).join(' / ') + '</span></div>'
      + (ev.note ? '<div class="detail-note">' + ev.note + '</div>' : '');
  }

  function renderTT(el, endEl) {
    el.innerHTML = '';
    let cursor = ttData.baseTime;
    ttData.items.forEach((item,i) => {
      const li = document.createElement('li');
      li.className = 'tl-item ' + (i%2===0?'left':'right');
      const st = cursor;
      const et = item.duration != null ? addMin(st, item.duration) : '—';
      li.innerHTML = '<div class="tl-dot ' + gc(item.genre) + '"></div><div class="tl-conn"></div>'
        + '<div class="tl-card ' + gc(item.genre) + '">'
        + '<div class="tl-time">' + st + ' – ' + et + '</div>'
        + '<div class="tl-name-view">' + item.name + '</div>'
        + '<div class="tl-genre ' + gc(item.genre) + '">' + item.genre + '</div>'
        + '<div class="tl-dur"><span>' + (item.duration != null ? item.duration : '—') + '分</span></div>'
        + '</div>';
      el.appendChild(li);
      if (item.duration != null) cursor = addMin(cursor, item.duration);
    });
    endEl.textContent = '終了 ' + cursor;
  }

  function renderMemberStrip() {
    const el = document.getElementById('memberStrip');
    el.innerHTML = (ev.members || []).map(m => {
      const primary = m.links && m.links[0];
      return '<a href="' + (primary ? primary.url : '#') + '" class="member-chip ' + gc(m.genre) + '" target="_blank">'
        + '<span class="chip-name">' + m.name + '</span>'
        + '<span class="chip-genre">' + m.genre + '</span></a>';
    }).join('');
  }

  function buildSnsText() {
    const L = [];
    L.push('ダンスパーティー');
    L.push('　' + ev.title);
    L.push('');
    (ev.copy || []).forEach(line => L.push(line));
    L.push('');
    L.push('');
    L.push('【DJ＆パフォーマー】');
    (ev.members || []).forEach(m => {
      L.push('💿 ' + m.name + '（' + m.genre + '）');
    });
    L.push('');
    L.push('');
    L.push('【日時】');
    L.push(ev.date + ' ' + ev.timeStart + '〜' + ev.timeEnd);
    L.push('');
    L.push('【会場】');
    L.push(ev.venue);
    L.push(ev.address.replace(/^神奈川県/, ''));
    L.push(ev.walkTime);
    if (ev.accessFromShibuya) L.push(ev.accessFromShibuya);
    L.push('');
    L.push('【入場料】');
    L.push(ev.fee);
    if (ev.note) L.push(ev.note);
    L.push('');
    L.push('【メンバーInstagram】');
    (ev.members || []).forEach(m => {
      const ig = (m.links || []).find(l => /instagram/i.test(l.url));
      if (ig) L.push(m.name + ' ' + ig.url);
    });
    return L.join('\n');
  }

  function renderSnsText() {
    const ta = document.getElementById('snsText');
    if (ta) ta.value = buildSnsText();
  }

  function renderSpaFlyer() {
    document.getElementById('spaFlyer').src = ev.flyerAlt || ev.flyer;
    document.getElementById('spaFlyer').alt = ev.title;
    document.getElementById('spaFlyerInfo').innerHTML =
      '<h2>' + ev.title + '</h2>'
      + '<div class="flyer-detail">'
      + '<strong>日時</strong> ' + ev.date + ' ' + ev.timeStart + '–' + ev.timeEnd + '<br>'
      + '<strong>料金</strong> ' + ev.fee + '<br>'
      + '<strong>会場</strong> ' + ev.venue + '<br>' + ev.address + '<br>'
      + '<strong>ジャンル</strong> ' + (ev.genres || []).map(g => typeof g === 'object' ? g.name : g).join(' / ')
      + '</div>'
      + '<div class="flyer-artists">'
      + (ev.members || []).map(m => '<span class="artist-tag">' + m.name + '</span>').join('') + '</div>';
  }

  function renderSpaNavGrid() {
    const pages = [
      {id:'flyer', icon:'🎨', label:'フライヤー', color:'g-anime'},
      {id:'timetable', icon:'⏱', label:'タイムテーブル', color:'g-trance'},
      {id:'members', icon:'👥', label:'メンバー', color:'g-prog'},
      {id:'sanpo', icon:'🚶', label:'白楽散歩', color:'g-showa'}
    ];
    document.getElementById('spaNavGrid').innerHTML = pages.map(p =>
      '<a href="#' + p.id + '" class="nav-card ' + p.color + '">'
      + '<div class="nav-icon">' + p.icon + '</div>'
      + '<div class="nav-label">' + p.label + '</div></a>'
    ).join('');
  }

  function renderSpaSanpo() {
    const s = ev.sanpo;
    const v = s.venue || {};
    document.getElementById('spaSanpo').innerHTML =
      '<div class="sanpo-info">'
      + '<div class="sanpo-route">' + s.route + '</div>'
      + '<div class="sanpo-detail">'
      + (v.name ? '<div class="sanpo-row"><span class="sanpo-label">会場</span><span class="sanpo-val">' + v.name + '</span></div>' : '')
      + (v.walkTime ? '<div class="sanpo-row"><span class="sanpo-label">徒歩</span><span class="sanpo-val">' + v.walkTime + '</span></div>' : '')
      + (v.accessFromShibuya ? '<div class="sanpo-row"><span class="sanpo-label">渋谷から</span><span class="sanpo-val">' + v.accessFromShibuya + '</span></div>' : '')
      + (s.distance ? '<div class="sanpo-row"><span class="sanpo-label">距離</span><span class="sanpo-val">' + s.distance + '</span></div>' : '')
      + (s.difficulty ? '<div class="sanpo-row"><span class="sanpo-label">難易度</span><span class="sanpo-val">' + s.difficulty + '</span></div>' : '')
      + '</div></div>'
      + (v.map ? '<a href="' + v.map + '" class="map-card g-showa" target="_blank"><div class="map-name">会場までのマップ</div><div class="map-go">Google Maps →</div></a>' : '')
      + '<div class="sanpo-note">集合やガイドはありません。イベント前後に各自で歩いてみてください。</div>';
  }

  function renderSpaMembers() {
    document.getElementById('membersGrid').innerHTML = (ev.members || []).map(m =>
      '<div class="member-card"><h2>' + m.name + '</h2>'
      + '<div class="genre">' + m.genre + '</div>'
      + m.links.map(l => '<a href="' + l.url + '" target="_blank">' + l.label + '</a>').join('')
      + (m.bio ? '<div class="bio">' + m.bio + '</div>' : '') + '</div>'
    ).join('');
  }

  const spaPages = ['top','flyer','timetable','members','sanpo'];
  function spaNav(hash) {
    const id = (hash||'top').replace('#','');
    if (!spaPages.includes(id)) return;
    document.querySelectorAll('#spa-mode .page').forEach(p => p.style.display='none');
    const t = document.getElementById('page-'+id);
    if (t) t.style.display='';
    if (id==='timetable') renderTT(document.getElementById('ttListSpa'), document.getElementById('ttEndTimeSpa'));
    if (id==='members') renderSpaMembers();
  }

  function setMode(m) {
    mode = m;
    localStorage.setItem('eejanaika_mode', m);
    document.getElementById('lp-mode').style.display = m==='lp' ? '' : 'none';
    document.getElementById('spa-mode').style.display = m==='spa' ? '' : 'none';
    document.getElementById('modeToggle').textContent = m==='lp' ? '⤡' : '⤢';
    if (m==='lp') { renderTT(document.getElementById('ttList'), document.getElementById('ttEndTime')); renderMemberStrip(); renderSnsText(); }
    if (m==='spa') { renderSpaNavGrid(); renderSpaFlyer(); renderSpaSanpo(); spaNav(location.hash); }
  }
  document.getElementById('modeToggle').addEventListener('click', () => setMode(mode==='lp'?'spa':'lp'));
  window.addEventListener('hashchange', () => { if (mode==='spa') spaNav(location.hash); });

  document.getElementById('snsCopyBtn').addEventListener('click', async () => {
    const ta = document.getElementById('snsText');
    const btn = document.getElementById('snsCopyBtn');
    try {
      await navigator.clipboard.writeText(ta.value);
    } catch (e) {
      ta.focus(); ta.select();
      try { document.execCommand('copy'); } catch (e2) {}
    }
    const orig = btn.textContent;
    btn.textContent = 'コピーしました ✓';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  });

  (async () => {
    window.addEventListener("error", e => console.log("WINERR:", e.message, e.filename, e.lineno));
    try {
      await loadAll();
      window.__step="loaded";
      render();
      window.__step="rendered";
      setMode(localStorage.getItem('eejanaika_mode') || 'lp');
      window.__step="mode-set";
      const loader = document.getElementById('loader');
      if (loader) loader.classList.add('hide');
    } catch(err) { console.log("CAUGHT:", err.message, err.stack); }
  })();
  