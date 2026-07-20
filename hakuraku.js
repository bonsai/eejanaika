
  'use strict';
  let hk = null;

  async function loadAll() {
    hk = await fetch('data/hakuraku.json').then(r => r.json());
  }

  function render() {
    document.getElementById('hkTitle').textContent = hk.title || '白楽散歩';
    document.getElementById('hkSub').textContent = hk.distance || '';
    document.getElementById('hkFooter').textContent = (hk.title || '白楽散歩') + ' 2026';

    document.getElementById('hkRoute').textContent = hk.route || '';
    const meta = [];
    if (hk.distance) meta.push('<div class="sanpo-row"><span class="sanpo-label">距離</span><span class="sanpo-val">' + hk.distance + '</span></div>');
    if (hk.difficulty) meta.push('<div class="sanpo-row"><span class="sanpo-label">難易度</span><span class="sanpo-val">' + hk.difficulty + '</span></div>');
    document.getElementById('hkMeta').innerHTML = meta.join('');

    const v = hk.venue || {};
    document.getElementById('hkVenue').innerHTML =
      (v.name ? '<div class="detail-row"><span class="detail-label">会場</span><span class="detail-value">' + v.name + '</span></div>' : '')
      + (v.address ? '<div class="detail-row"><span class="detail-label">住所</span><span class="detail-value">' + v.address + '</span></div>' : '')
      + (v.walkTime ? '<div class="detail-row"><span class="detail-label">徒歩</span><span class="detail-value">' + v.walkTime + '</span></div>' : '')
      + (v.accessFromShibuya ? '<div class="detail-row"><span class="detail-label">渋谷から</span><span class="detail-value" style="color:var(--g-trance);font-weight:600">' + v.accessFromShibuya + '</span></div>' : '')
      + (v.map ? '<a href="' + v.map + '" class="area-map-link" target="_blank" style="margin-top:3%"><div class="area-map-icon">🗺</div><div class="area-map-label">Google Maps で見る</div><div class="area-map-arrow">→</div></a>' : '');

    const a = hk.area || {};
    document.getElementById('hkAreaName').textContent = a.name || '';
    document.getElementById('hkAreaDesc').innerHTML = (a.desc || '').replace(/\n/g, '<br>');
    document.getElementById('hkAreaSpots').innerHTML = (a.spots || []).map(s =>
      '<div class="spot">' + s.icon + ' ' + s.name + '</div>'
    ).join('');

    document.getElementById('hkSpots').innerHTML = (hk.spots || []).map(s => {
      const links = [];
      if (s.ig) links.push('<a href="' + s.ig + '" class="tl-link" target="_blank">Instagram →</a>');
      if (s.map) links.push('<a href="' + s.map + '" class="tl-link" target="_blank">MAP →</a>');
      return '<div class="rec-card-static">'
        + '<div class="rec-icon">' + (s.icon || '📍') + '</div>'
        + '<div class="rec-body">'
        + '<div class="rec-name">' + s.name + '</div>'
        + (s.genre ? '<div class="rec-genre">' + s.genre + '</div>' : '')
        + (s.desc ? '<div class="rec-text">' + s.desc + '</div>' : '')
        + (links.length ? '<div class="rec-links">' + links.join('') + '</div>' : '')
        + '</div>'
        + '</div>';
    }).join('');
  }

  (async () => {
    await loadAll();
    render();
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hide');
  })();
  