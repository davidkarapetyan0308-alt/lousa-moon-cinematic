# LOUSA MOON — The Lunar Codex

A cinematic scroll-driven website built around the supplied LOUSA MOON master animation.

## Run locally

No build step is required.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Main files

- `index.html` — page structure and copy
- `styles.css` — complete responsive art direction
- `app.js` — scroll/video synchronization, chapter timing, navigation and reduced-motion logic
- `assets/lousa-master-scroll.mp4` — web-optimized, audio-free master video
- `assets/01.webp` … `07.webp` — optimized key images / reduced-motion fallback

## Chapter timing

The site uses piecewise scroll-to-video mapping instead of a single linear mapping. This allows the physical product chapter to hold the video around the amphora transition while the product folio is shown as a separate illustrated insert.

Edit the `chapters` array near the top of `app.js` to fine-tune timing:

```js
{ id: "cycle", s0: 0.145, s1: 0.315, t0: 4.20, t1: 9.65 }
```

- `s0` / `s1`: normalized scroll range (0–1)
- `t0` / `t1`: video seconds

## Store and support links

Official URLs were not provided, so no URLs are invented. Add them in `app.js`:

```js
const APP_LINKS = {
  appStore: "",
  googlePlay: "",
  support: ""
};
```

Until configured, “Start with LOUSA” opens a neutral availability dialog instead of pointing to a fake destination.

## Design notes

- Video is scrubbed by scroll in both directions.
- `requestAnimationFrame` interpolation smooths seeking.
- Text is real HTML, never baked into video.
- Product chapter uses the approved LOUSA product illustration because it is not fully present in the combined master video.
- Final courtyard crossfades from the final doorway of the master video to the approved final illustration.
- `prefers-reduced-motion` replaces the scroll film with a static seven-frame editorial sequence.
- Mobile object-position changes by chapter to keep important visual areas on screen.
