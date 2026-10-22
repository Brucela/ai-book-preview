'use strict';
let stories = [], active = 0, scene = 0, extrasShown = false;
const $ = id => document.getElementById(id);
const audio = $('storyAudio');
function showCards() {
  audio.pause();
  $('viewer').classList.add('hidden');
  $('cards').classList.remove('hidden');
  window.scrollTo({top:0, behavior:'smooth'});
}
function configureAudio(story) {
  const ready = Boolean(story.audio);
  $('narration').classList.toggle('hidden', !ready);
  $('audioNote').textContent = ready
    ? '完整朗讀包含篇名、五幕標題與正文、記憶點、知識卡和提問。聲音為公開候選，完整聽感仍待確認。'
    : '本篇尚未提供語音；可先閱讀文字與家長知識卡。';
  if (audio.dataset.story !== story.day) {
    audio.pause();
    audio.dataset.story = story.day;
    if (ready) audio.src = story.audio.src;
    else audio.removeAttribute('src');
    audio.load();
    extrasShown = false;
  }
  if (ready) $('audioDescription').textContent = 'amberchen 完整朗讀・約 2 分 43 秒。按下播放才會開始，朗讀時會自動翻幕。';
}
function render(scroll = true) {
  const story = stories[active], part = story.scenes[scene];
  $('cards').classList.add('hidden');
  $('viewer').classList.remove('hidden');
  $('location').textContent = 'Day ' + story.day + ' · ' + story.place;
  $('title').textContent = story.title;
  $('progress').textContent = '第 ' + (scene + 1) + ' 幕／共 ' + story.scenes.length + ' 幕';
  $('sceneIcon').textContent = story.icon;
  $('sceneTitle').textContent = part[0];
  $('sceneText').textContent = part[1];
  $('prev').disabled = scene === 0;
  $('next').textContent = scene === story.scenes.length - 1 ? '查看知識卡 ↓' : '下一幕 →';
  $('knowledge').classList.toggle('hidden', scene !== story.scenes.length - 1);
  $('memory').textContent = '⭐ 給小朋友的一句話：' + story.memory;
  $('facts').replaceChildren(...story.facts.map(fact => {
    const li = document.createElement('li'); li.textContent = fact; return li;
  }));
  $('question').textContent = story.question;
  $('source').href = story.source;
  $('source').textContent = story.source;
  configureAudio(story);
  if (scroll) $('viewer').scrollIntoView({behavior:'smooth', block:'start'});
}
function openStory(index) {
  audio.pause(); active = index; scene = 0; extrasShown = false;
  render();
  if (stories[active].audio) {
    audio.currentTime = 0;
    $('audioState').textContent = '尚未播放';
  }
}
function moveScene(offset) {
  const story = stories[active];
  scene = Math.max(0, Math.min(story.scenes.length - 1, scene + offset));
  if (story.audio) audio.currentTime = story.audio.sceneStarts[scene];
  extrasShown = false;
  render();
}
audio.addEventListener('timeupdate', () => {
  const story = stories[active];
  if (!story?.audio || audio.dataset.story !== story.day) return;
  let next = 0;
  story.audio.sceneStarts.forEach((start, index) => { if (audio.currentTime >= start) next = index; });
  if (next !== scene) { scene = next; render(false); }
  if (audio.currentTime >= story.audio.extrasStart) {
    $('audioState').textContent = '正在朗讀記憶點、知識卡與提問';
    if (!extrasShown && !audio.paused) {
      extrasShown = true;
      $('knowledge').scrollIntoView({behavior:'smooth', block:'start'});
    }
  } else {
    extrasShown = false;
    $('audioState').textContent = audio.paused ? '已暫停' : '正在朗讀第 ' + (scene + 1) + ' 幕';
  }
});
audio.addEventListener('ended', () => { $('audioState').textContent = '本篇朗讀完畢'; });
audio.addEventListener('error', () => {
  if (stories[active]?.audio) $('audioState').textContent = '語音暫時無法載入，請重新整理後再試。';
});
$('goBack').addEventListener('click', showCards);
$('prev').addEventListener('click', () => moveScene(-1));
$('next').addEventListener('click', () => {
  const story = stories[active];
  if (scene < story.scenes.length - 1) moveScene(1);
  else {
    if (story.audio) audio.currentTime = story.audio.extrasStart;
    $('knowledge').scrollIntoView({behavior:'smooth', block:'start'});
  }
});
fetch('stories.json?v=20261022-amberchen').then(response => {
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.json();
}).then(data => {
  stories = data.stories;
  $('cards').replaceChildren(...stories.map((story, index) => {
    const article = document.createElement('article'); article.className = 'story-card';
    const art = document.createElement('div'); art.className = 'art'; art.textContent = story.icon;
    const body = document.createElement('div'); body.className = 'card-body';
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = 'Day ' + story.day + ' ・' + story.place;
    const title = document.createElement('h2'); title.textContent = story.title;
    const summary = document.createElement('p'); summary.textContent = story.scenes[0][1].slice(0, 66) + '…';
    const status = document.createElement('p'); status.className = 'meta'; status.textContent = story.audio ? '可閱讀・完整語音約 2 分 43 秒・插畫製作中' : '文字試閱・語音與插畫製作中';
    const button = document.createElement('button'); button.textContent = story.audio ? '閱讀與聆聽故事' : '打開故事';
    button.addEventListener('click', () => openStory(index));
    body.append(meta, title, summary, status, button); article.append(art, body); return article;
  }));
  const requested = new URLSearchParams(location.search).get('story');
  const index = stories.findIndex(story => story.day === requested);
  if (index >= 0) openStory(index);
}).catch(error => { $('cards').textContent = '故事資料載入失敗，請重新整理：' + error.message; });
