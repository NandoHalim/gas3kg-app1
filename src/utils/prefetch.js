// src/utils/prefetch.js

/**
 * Prefetch sebuah dynamic import() chunk.
 * Otomatis diabaikan kalau browser tidak support atau pernah diprefetch.
 */
const done = new Set();

export function prefetch(importer) {
  try {
    // gunakan URL chunk dari meta vite saat tersedia
    const p = importer();
    // kalau promise module biasa, ini tetap akan cache di HTTP
    p.then((mod) => mod).catch(() => {});
    // tambahan: link rel=prefetch agar browser mulai unduh
    const key = String(importer);
    if (done.has(key)) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    // biarkan browser yang resolve; Vite akan isi via import() di atas
    // jadi di sini cukup tandai agar tidak dobel
    done.add(key);
  } catch {
    /* no-op */
  }
}
