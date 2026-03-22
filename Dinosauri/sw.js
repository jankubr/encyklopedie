const CACHE_NAME = 'dino-v1';

const AUDIO_FILES = [
  'home-welcome.mp3',
  'topic-0.mp3', 'topic-1.mp3', 'topic-2.mp3', 'topic-3.mp3',
  'topic-4.mp3', 'topic-5.mp3', 'topic-6.mp3',
  'lesson-0-p0.mp3', 'lesson-0-p1.mp3', 'lesson-0-p2.mp3', 'lesson-0-fun.mp3',
  'lesson-1-p0.mp3', 'lesson-1-p1.mp3', 'lesson-1-p2.mp3', 'lesson-1-fun.mp3',
  'lesson-2-p0.mp3', 'lesson-2-p1.mp3', 'lesson-2-p2.mp3', 'lesson-2-fun.mp3',
  'lesson-3-p0.mp3', 'lesson-3-p1.mp3', 'lesson-3-p2.mp3', 'lesson-3-fun.mp3',
  'lesson-4-p0.mp3', 'lesson-4-p1.mp3', 'lesson-4-p2.mp3', 'lesson-4-fun.mp3',
  'lesson-5-p0.mp3', 'lesson-5-p1.mp3', 'lesson-5-p2.mp3', 'lesson-5-fun.mp3',
  'lesson-6-p0.mp3', 'lesson-6-p1.mp3', 'lesson-6-p2.mp3', 'lesson-6-fun.mp3',
  'quiz-q0.mp3', 'quiz-q1.mp3', 'quiz-q2.mp3', 'quiz-q3.mp3', 'quiz-q4.mp3',
  'quiz-q5.mp3', 'quiz-q6.mp3', 'quiz-q7.mp3', 'quiz-q8.mp3', 'quiz-q9.mp3',
  'exercise-0.mp3', 'exercise-1.mp3', 'exercise-2.mp3',
  'exercise-3.mp3', 'exercise-4.mp3', 'exercise-5.mp3'
];

const LANGS = ['', 'pt/', 'es/'];

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  ...LANGS.flatMap(lang => AUDIO_FILES.map(f => `./audio/${lang}${f}`))
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
