const CACHE_NAME = 'ninja-v2';

const AUDIO_FILES = [
  'exercise-0-plamenak.mp3', 'exercise-1-tichy-presun.mp3', 'exercise-2-ninja-kotouly.mp3',
  'exercise-3-ninja-pamet.mp3', 'exercise-4-socha.mp3', 'exercise-5-hod-na-cil.mp3',
  'exercise-6-kocici-krok.mp3',
  'topic-0.mp3', 'topic-1.mp3', 'topic-2.mp3', 'topic-3.mp3',
  'topic-4.mp3', 'topic-5.mp3', 'topic-6.mp3',
  'read-more.mp3',
  'quiz-q0.mp3', 'quiz-q1.mp3', 'quiz-q2.mp3', 'quiz-q3.mp3', 'quiz-q4.mp3',
  'quiz-q5.mp3', 'quiz-q6.mp3', 'quiz-q7.mp3', 'quiz-q8.mp3', 'quiz-q9.mp3'
];

const CS_ONLY_AUDIO_FILES = [
  'quiz-q10.mp3', 'quiz-q11.mp3', 'quiz-q12.mp3', 'quiz-q13.mp3', 'quiz-q14.mp3',
  'quiz-q15.mp3', 'quiz-q16.mp3', 'quiz-q17.mp3', 'quiz-q18.mp3', 'quiz-q19.mp3',
  'quiz-q20.mp3', 'quiz-q21.mp3', 'quiz-q22.mp3', 'quiz-q23.mp3', 'quiz-q24.mp3',
  'quiz-q25.mp3', 'quiz-q26.mp3', 'quiz-q27.mp3', 'quiz-q28.mp3', 'quiz-q29.mp3'
];

const LANGS = ['', 'pt/', 'es/'];

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  ...LANGS.flatMap(lang => AUDIO_FILES.map(f => `./audio/${lang}${f}`)),
  ...CS_ONLY_AUDIO_FILES.map(f => `./audio/${f}`)
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
