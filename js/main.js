// Shows one lesson at a time, builds the lesson list, and handles the theme toggle.

document.documentElement.classList.add('js');

// ---- Theme (light by default) ----

const themeButton = document.getElementById('theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  themeButton.querySelector('.theme-icon').textContent = isDark ? '☀' : '☾';
  themeButton.querySelector('.theme-label').textContent = isDark ? 'Light theme' : 'Dark theme';
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
const prevTitle = document.getElementById('prev-title');
const nextTitle = document.getElementById('next-title');
let current = 0;

function titleOf(lesson) {
  return lesson.querySelector('h1, h2').textContent;
}

// Build the lesson list, grouped by each lesson's data-group (e.g. "Materials"),
// and add a small "Materials · Lesson 6 of 30" label above each lesson's heading.
let groupList = null;
const links = lessons.map((lesson, i) => {
  const group = lesson.dataset.group;

  if (!groupList || groupList.dataset.group !== group) {
    const wrapper = document.createElement('div');
    wrapper.className = 'nav-group';
    const title = document.createElement('p');
    title.className = 'nav-group-title';
    title.textContent = group;
    groupList = document.createElement('ol');
    groupList.dataset.group = group;
    wrapper.append(title, groupList);
    list.appendChild(wrapper);
  }

  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = '#' + lesson.id;
  const number = document.createElement('span');
  number.className = 'nav-number';
  number.textContent = i + 1;
  const name = document.createElement('span');
  name.textContent = titleOf(lesson);
  a.append(number, name);
  li.appendChild(a);
  groupList.appendChild(li);

  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = `${group} · Lesson ${i + 1} of ${lessons.length}`;
  lesson.prepend(eyebrow);

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
  prevTitle.textContent = current > 0 ? titleOf(lessons[current - 1]) : '';
  nextTitle.textContent = current < lessons.length - 1 ? titleOf(lessons[current + 1]) : '';

  // Keep the current lesson visible in a long lesson list (scrolls the list only, not the page).
  const link = links[current];
  if (link.offsetTop < nav.scrollTop || link.offsetTop + link.offsetHeight > nav.scrollTop + nav.clientHeight) {
    nav.scrollTop = link.offsetTop - nav.clientHeight / 3;
  }

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

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    closeMenu();
    menuButton.focus();
  }
});

show(indexFromHash(), false);

// Opening a lesson link (e.g. index.html#hdri) makes the browser jump down to that lesson
// once the page has loaded, hiding the header. Return to the top instead.
history.scrollRestoration = 'manual';
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
  requestAnimationFrame(() => window.scrollTo(0, 0));
});
