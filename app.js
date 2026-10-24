'use strict';

const bookButtons = [...document.querySelectorAll('[data-volume]')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const byId = (id) => document.getElementById(id);
let selectedVolume = new URLSearchParams(location.search).get('volume') === '2' ? 2 : 1;
let selectedFilter = 'all';
let catalog = null;
let catalogFailed = false;

function selectedVolumeCounts() {
  const stories = catalog ? catalog.volumes.find(v => v.number === selectedVolume).stories : [];
  const total = 30;
  const ready = stories.filter((story) => story.status === 'preview').length;
  return { total, ready, preparing: total - ready };
}

function announceResults() {
  const counts = selectedVolumeCounts();
  const message = selectedVolume === 2
    ? `第二冊全冊 ${counts.total} 篇，目前開放 ${counts.ready} 篇圖文有聲試閱${counts.preparing ? `，其餘 ${counts.preparing} 篇準備中` : ''}。`
    : selectedFilter === 'ready'
      ? `第一冊目前有 ${counts.ready} 篇可以試閱。`
      : counts.preparing === 0 ? `第一冊 ${counts.total} 篇均可試閱。` : `第一冊規劃 ${counts.total} 篇，目前 ${counts.ready} 篇可以試閱，${counts.preparing} 篇準備中。`;
  byId('result-status').textContent = message;
}

function renderSelection() {
  const first = selectedVolume === 1;
  const counts = selectedVolumeCounts();
  bookButtons.forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.volume) === selectedVolume)));
  filterButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === selectedFilter)));
  byId('collection-title').textContent = first ? '第一冊的故事' : '第二冊的故事';
  byId('collection-description').textContent = first
    ? `第 001–030 夜，目前開放 ${counts.ready} 篇試閱。`
    : `台灣奇妙旅行：全冊 ${counts.total} 篇，目前開放 ${counts.ready} 篇有聲試閱。`;
  byId('volume-one').hidden = false;
  byId('filters').hidden = false;
  byId('coming').hidden = selectedFilter === 'ready' || counts.preparing === 0;
  byId('catalogue').hidden = !catalog || selectedFilter === 'ready';
  byId('shelf-status').textContent = `${first ? '第一冊' : '第二冊'}開放 ${counts.ready} 篇有聲試閱`;
  bookButtons[0].querySelector('.range').textContent = '第 001–030 夜 · 目前 30 篇可試閱';
  bookButtons[1].querySelector('.range').textContent = `全冊 ${counts.total} 篇 · 目前 ${catalog ? catalog.volumes.find(v => v.number === 2).stories.filter(s => s.status === 'preview').length : 0} 篇可試閱`;
  byId('catalogue').querySelector('summary').textContent = first ? '翻看第一冊 30 個夜晚的目錄' : '翻看第二冊目前開放的故事';
  byId('story-directory').setAttribute('aria-label', first ? '第一冊完整目錄' : '第二冊試閱目錄');
  byId('catalogue').querySelector('.catalogue-description').textContent = counts.preparing === 0 ? `本冊 ${counts.ready} 篇均可試閱，插畫與聲音仍待家長整體確認。` : `全冊 ${counts.total} 篇，目前 ${counts.ready} 篇有聲試閱，其餘 ${counts.preparing} 篇準備中。`;
  byId('catalog-error').hidden = !catalogFailed || !first;
}

function chooseVolume(number) {
  selectedVolume = number;
  if (catalog) renderCatalog(catalog);
  renderSelection();
  byId('collection-title').focus({ preventScroll: true });
  byId('collection').scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  });
  announceResults();
}

bookButtons.forEach((button) => button.addEventListener('click', () => chooseVolume(Number(button.dataset.volume))));
filterButtons.forEach((button) => button.addEventListener('click', () => {
  selectedFilter = button.dataset.filter;
  renderSelection();
  announceResults();
}));

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function renderCatalog(data) {
  const volume = data.volumes.find((volume) => volume.number === selectedVolume);
  const stories = volume.stories;
  const ready = stories.filter((story) => story.status === 'preview');
  const directory = document.createDocumentFragment();
  const cards = document.createDocumentFragment();
  for (const story of stories) {
    const row = makeElement('li');
    row.append(makeElement('span', 'night-label', selectedVolume === 1 ? `第 ${String(story.day).padStart(3, '0')} 夜` : (story.place || `第 ${String(story.day).padStart(3, '0')} 篇`)));
    if (story.status === 'preview') {
      const link = makeElement('a', '', story.title);
      link.href = story.href;
      row.append(link, makeElement('span', 'slot-status', '可試閱'));
    } else {
      row.append(makeElement('span', 'slot-title preparing', '準備中'));
    }
    directory.append(row);
  }
  for (const story of ready) {
    const article = makeElement('article', 'story');
    const image = makeElement('img');
    image.src = story.image;
    image.alt = story.imageAlt;
    image.width = 1280;
    image.height = 720;
    image.loading = 'lazy';
    const content = makeElement('div');
    const link = makeElement('a', 'read', '打開故事，讀給你聽');
    link.href = story.href;
    content.append(
      makeElement('span', 'night', selectedVolume === 1 ? `第 ${String(story.day).padStart(3, '0')} 夜 · 約 ${story.minutes} 分鐘` : `${story.place} · ${Math.floor(Math.round(story.durationSeconds) / 60)} 分 ${Math.round(story.durationSeconds) % 60} 秒`),
      makeElement('h3', '', story.title),
      makeElement('p', '', story.summary),
      link,
      makeElement('div', 'tiny', story.statusText)
    );
    article.append(image, content);
    cards.append(article);
  }
  byId('story-directory').replaceChildren(directory);
  byId('ready-stories').replaceChildren(cards);
}

fetch('catalog.json?v=20261024-volume02-body-only', { credentials: 'same-origin' })
  .then((response) => {
    if (!response.ok) throw new Error('catalog unavailable');
    return response.json();
  })
  .then((data) => {
    if (data.schemaVersion !== 1 || !Array.isArray(data.volumes)) throw new Error('catalog format');
    renderCatalog(data);
    catalog = data;
    renderSelection();
  })
  .catch(() => {
    catalogFailed = true;
    byId('catalog-error').hidden = selectedVolume !== 1;
  });
