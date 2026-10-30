# CLAUDE.md

## Tech Stack

- Plain HTML, CSS, and JavaScript only.
- No frameworks or libraries (no React, Vue, Tailwind, etc.).
- No build step: files are opened or served exactly as written.

## Project Structure

- `index.html` – the whole course on one page; each `<section class="lesson">` is one lesson.
- `css/style.css` – all styles, including light/dark theme colours.
- `js/main.js` – shows one lesson at a time, builds the lesson list, theme toggle.
- `README.md`, `CLAUDE.md` – project notes.

Slide decks are source material only: never commit them to the repo.

## Key Requirements

1. Every page must be responsive and work on desktop, tablet, and phone.
2. Users can toggle between a light and a dark theme. The default is the light theme.

## Feature Plan

### Site structure

- One page, split into lessons: welcome, learning objectives, then one lesson per slide (rendering, materials, scene settings, three hands-on activities, animation, challenge, publishing, wrap-up).
- Students move between lessons with Previous / Next buttons or the lesson list (a sidebar on desktop, a "Lessons" menu on tablet and phone).
- Each lesson has its own web address (e.g. `#hdri`), so the browser's Back button and shared links work.

### Phases

- **Phase 1 – Course from the slides (done):** turn the Rendering and Animation deck into lessons, with plain styling.
- **Phase 2 – Design:** give the site a proper visual design.
- **Later phases:** to be decided.

## Rules for Claude

- Explain technical terms in plain language.
- Ask before making big changes.
- Ask rather than guess when something is unclear.
