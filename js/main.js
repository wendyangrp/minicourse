// Shows one lesson at a time, builds the lesson list, and handles the theme toggle.

document.documentElement.classList.add('js');

// ---- Theme (light by default) ----

const themeButton = document.getElementById('theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  themeButton.textContent = isDark ? 'Light theme' : 'Dark theme';
  themeButton.setAttribute('aria-pressed', String(isDark));
}

function savedTheme() {
  try {
    return localStorage.getItem('theme');
  } catch (e) {
    return null;
  }
}

applyTheme(savedTheme() === 'dark' ? 'dark' : 'light');

themeButton.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem('theme', next);
  } catch (e) {
    // Storage can be blocked (e.g. private browsing); the toggle still works for this visit.
  }
});

// ---- Lessons ----

const lessons = Array.from(document.querySelectorAll('.lesson'));
const list = document.getElementById('lesson-list');
const nav = document.getElementById('lesson-nav');
const menuButton = document.getElementById('menu-toggle');
const prevButton = document.getElementById('prev-btn');
const nextButton = document.getElementById('next-btn');
const progress = document.getElementById('progress');
let current = 0;

// Build the lesson list from each lesson's heading.
const links = lessons.map((lesson) => {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = '#' + lesson.id;
  a.textContent = lesson.querySelector('h1, h2').textContent;
  li.appendChild(a);
  list.appendChild(li);
  return a;
});

function show(index, moveFocus) {
  current = Math.max(0, Math.min(index, lessons.length - 1));

  lessons.forEach((lesson, i) => {
    lesson.hidden = i !== current;
  });
  links.forEach((link, i) => {
    if (i === current) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  prevButton.disabled = current === 0;
  nextButton.disabled = current === lessons.length - 1;
  progress.textContent = `${current + 1} of ${lessons.length}`;

  closeMenu();
  window.scrollTo(0, 0);
  if (moveFocus) {
    // Move keyboard and screen-reader focus to the new lesson's heading.
    const heading = lessons[current].querySelector('h1, h2');
    heading.setAttribute('tabindex', '-1');
    heading.focus();
  }
}

// The address bar keeps the current lesson (e.g. #hdri), so links and the Back button work.
function indexFromHash() {
  const id = location.hash.slice(1);
  const index = lessons.findIndex((lesson) => lesson.id === id);
  return index === -1 ? 0 : index;
}

function goTo(index) {
  location.hash = lessons[Math.max(0, Math.min(index, lessons.length - 1))].id;
}

window.addEventListener('hashchange', () => show(indexFromHash(), true));
prevButton.addEventListener('click', () => goTo(current - 1));
nextButton.addEventListener('click', () => goTo(current + 1));

// ---- Lesson menu on small screens ----

function closeMenu() {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

show(indexFromHash(), false);

// Opening a lesson link (e.g. index.html#hdri) makes the browser jump down to that lesson
// once the page has loaded, hiding the header. Return to the top instead.
history.scrollRestoration = 'manual';
window.addEventListener('load', () => window.scrollTo(0, 0));
