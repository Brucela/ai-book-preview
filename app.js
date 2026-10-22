'use strict';

const bookButtons = [...document.querySelectorAll('[data-volume]')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const byId = (id) => document.getElementById(id);
let selectedVolume = 1;
let selectedFilter = 'all';
let catalog = null;
let catalogFailed = false;

function firstVolumeCounts() {
  const stories = catalog ? catalog.volumes[0].stories : [];
  const total = stories.length || 30;
  const ready = stories.length ? stories.filter((story) => story.status === 'preview').length : 1;
  return { total, ready, preparing: total - ready };
}

function announceResults() {
  const counts = firstVolumeCounts();
  const message = selectedVolume === 2
    ? '第二冊已開放三篇文字試作，其中一篇提供 amberchen 完整朗讀，插畫製作中。'
    : selectedFilter === 'ready'
      ? `第一冊目前有 ${counts.ready} 篇可以試閱。`
      : counts.preparing === 0 ? `第一冊 ${counts.total} 篇均可試閱。` : `第一冊規劃 ${counts.total} 篇，目前 ${counts.ready} 篇可以試閱，${counts.preparing} 篇準備中。`;
  byId('result-status').textContent = message;
}

function renderSelection() {
  const first = selectedVolume === 1;
  const counts = firstVolumeCounts();
  bookButtons.forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.volume) === selectedVolume)));
  filterButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === selectedFilter)));
  byId('collection-title').textContent = first ? '第一冊的故事' : '第二冊的故事';
  byId('collection-description').textContent = first
    ? `第 001–030 夜，目前開放 ${counts.ready} 篇試閱。`
    : '台灣奇妙旅行：三篇文字試作，一篇完整語音。';
  byId('volume-one').hidden = !first;
  byId('volume-two').hidden = first;
  byId('filters').hidden = !first;
  byId('coming').hidden = selectedFilter === 'ready' || counts.preparing === 0;
  byId('catalogue').hidden = !catalog || selectedFilter === 'ready';
  byId('shelf-status').textContent = first ? `第一冊開放 ${counts.ready} 篇有聲試閱` : '第二冊開放 3 篇文字試作、1 篇有聲';
  bookButtons[0].querySelector('.range').textContent = `第 001–030 夜 · 目前 ${counts.ready} 篇可試閱`;
  byId('catalogue').querySelector('.catalogue-description').textContent = counts.preparing === 0 ? `本冊 ${counts.ready} 篇均可試閱，插畫與聲音仍待家長整體確認。` : `目前 ${counts.ready} 篇可試閱。其他故事準備好後，會陸續開放。`;
  byId('catalog-error').hidden = !catalogFailed || !first;
}

function chooseVolume(number) {
  selectedVolume = number;
  renderSelection();
  byId('collection-title').focus({ preventScroll: true });
  byId('collection').scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  });
  announceResults();
}

bookButtons.forEach((button) => button.addEventListener('click', () => chooseVolume(Number(button.dataset.volume))));
byId('back-first').addEventListener('click', () => chooseVolume(1));
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
  const firstVolume = data.volumes.find((volume) => volume.number === 1);
  const stories = firstVolume.stories;
  const ready = stories.filter((story) => story.status === 'preview');
  const directory = document.createDocumentFragment();
  const cards = document.createDocumentFragment();
  for (const story of stories) {
    const row = makeElement('li');
    row.append(makeElement('span', 'night-label', `第 ${String(story.day).padStart(3, '0')} 夜`));
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
      makeElement('span', 'night', `第 ${String(story.day).padStart(3, '0')} 夜 · 約 ${story.minutes} 分鐘`),
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

fetch('catalog.json?v=20261022-amberchen', { credentials: 'same-origin' })
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
