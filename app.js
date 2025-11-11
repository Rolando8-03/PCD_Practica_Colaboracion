// app.js - renderiza la lista de cursos y maneja la navegación (lista y detalle en index.html)
// Datos de los 8 cursos (integrados en app.js)
const COURSES = [
  { id: 1, title: 'Introducción a la Programación', description: 'Fundamentos de programación con ejemplos prácticos.', url: 'https://example.com/curso/1' },
  { id: 2, title: 'Estructuras de Datos', description: 'Listas, pilas, colas, árboles y grafos.', url: 'https://example.com/curso/2' },
  { id: 3, title: 'Algoritmos y Complejidad', description: 'Diseño y análisis de algoritmos.', url: 'https://example.com/curso/3' },
  { id: 4, title: 'Desarrollo Web', description: 'HTML, CSS y JavaScript para crear aplicaciones web.', url: 'https://example.com/curso/4' },
  { id: 5, title: 'Bases de Datos', description: 'Modelado y consultas SQL.', url: 'https://example.com/curso/5' },
  { id: 6, title: 'Sistemas Operativos', description: 'Conceptos de procesos, memoria y archivos.', url: 'https://example.com/curso/6' },
  { id: 7, title: 'Redes de Computadoras', description: 'Protocolos, topologías y seguridad básica.', url: 'https://example.com/curso/7' },
  { id: 8, title: 'Inteligencia Artificial', description: 'Introducción a IA y aprendizaje automático.', url: 'https://example.com/curso/8' }
];

(function () {
  const listEl = document.getElementById('courses-list');
  const detailSection = document.getElementById('course-detail');
  const detailContent = document.getElementById('course-detail-content');
  const searchInput = document.getElementById('search-input');
  const themeToggle = document.getElementById('theme-toggle');

  function createCard(course) {
    const card = document.createElement('article');
    card.className = 'course-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    // soporte teclado: Enter/Space abre los detalles
    card.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        location.href = `index.html?id=${course.id}`;
      }
    });

    const title = document.createElement('h2');
    title.textContent = course.title;
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'course-desc';
    desc.textContent = course.description;
    card.appendChild(desc);

    const actions = document.createElement('div');
    actions.className = 'course-actions';

    const detailsBtn = document.createElement('a');
    detailsBtn.className = 'btn';
    detailsBtn.textContent = 'Ver detalles';
    detailsBtn.href = `index.html?id=${course.id}`;
    actions.appendChild(detailsBtn);

    const openBtn = document.createElement('a');
    openBtn.className = 'btn btn-outline';
    openBtn.textContent = 'Abrir curso';
    openBtn.href = course.url;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener noreferrer';
    actions.appendChild(openBtn);

    card.appendChild(actions);
    // animación de entrada
    card.classList.add('fade-in');
    return card;
  }

  function render() {
  const filterText = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';

    if (!Array.isArray(COURSES)) {
      listEl.textContent = 'No hay cursos disponibles.';
      return;
    }

    // Filtrar por título (si hay texto en el input)
    const filtered = filterText ? COURSES.filter(c => c.title.toLowerCase().includes(filterText)) : COURSES.slice();

    listEl.innerHTML = '';
    if (filtered.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No se encontraron cursos que coincidan con tu búsqueda.';
      listEl.appendChild(empty);
    } else {
      filtered.forEach(c => listEl.appendChild(createCard(c)));
    }

    // Actualizar contador de resultados (accesible)
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
      resultsCount.textContent = `${filtered.length} curso${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'}`;
    }

    // Renderizar lista de enlaces rápidos (también filtrada)
    const linksContainer = document.getElementById('links-list');
    if (linksContainer) {
      linksContainer.innerHTML = '';
      (filtered).forEach(c => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `index.html?id=${c.id}`;
        a.textContent = c.title;
        li.appendChild(a);
        linksContainer.appendChild(li);
      });
    }
  }

  // Mostrar detalle cuando hay ?id=N
  function showDetail(id) {
    const course = COURSES.find(c => c.id === id);
    if (!detailContent) return;
    if (!course) {
      detailContent.innerHTML = '<p>Curso no encontrado.</p>';
    } else {
      detailContent.innerHTML = `\n        <h1>${course.title}</h1>\n        <p class="course-desc">${course.description}</p>\n        <p><strong>Enlace:</strong> <a href="${course.url}" target="_blank" rel="noopener noreferrer">Abrir curso externo</a></p>\n      `;
    }
    // Mostrar sección de detalle y ocultar lista
    if (detailSection) detailSection.classList.remove('hidden');
    const heading = document.querySelector('.container > h1'); if (heading) heading.classList.add('hidden');
    const subtitle = document.querySelector('.subtitle'); if (subtitle) subtitle.classList.add('hidden');
    if (listEl) listEl.classList.add('hidden');
    const toolbar = document.querySelector('.toolbar'); if (toolbar) toolbar.classList.add('hidden');
    const linksSec = document.getElementById('courses-links'); if (linksSec) linksSec.classList.add('hidden');
  }

  function hideDetail() {
    if (detailSection) detailSection.classList.add('hidden');
    const heading = document.querySelector('.container > h1'); if (heading) heading.classList.remove('hidden');
    const subtitle = document.querySelector('.subtitle'); if (subtitle) subtitle.classList.remove('hidden');
    if (listEl) listEl.classList.remove('hidden');
    const toolbar = document.querySelector('.toolbar'); if (toolbar) toolbar.classList.remove('hidden');
    const linksSec = document.getElementById('courses-links'); if (linksSec) linksSec.classList.remove('hidden');
  }

  // Extraer id de query string
  function getQueryParam(name) {
    const params = new URLSearchParams(location.search);
    return params.get(name);
  }

  function init() {
    // Helper debounce
    function debounce(fn, wait) {
      let t = null;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }

    // Inicializar tema desde localStorage
    function setTheme(theme) {
      if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (themeToggle) { themeToggle.textContent = 'Modo oscuro'; themeToggle.setAttribute('aria-pressed', 'true'); }
      } else {
        document.body.classList.remove('light-theme');
        if (themeToggle) { themeToggle.textContent = 'Modo claro'; themeToggle.setAttribute('aria-pressed', 'false'); }
      }
      try { localStorage.setItem('theme', theme); } catch (e) { /* noop */ }
    }

    const savedTheme = (function(){ try { return localStorage.getItem('theme'); } catch(e){ return null } })();
    setTheme(savedTheme === 'light' ? 'light' : 'dark');


    // Evento toggle de tema
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.contains('light-theme');
        setTheme(isLight ? 'dark' : 'light');
      });
    }

    // Filtrado en tiempo real con debounce
    if (searchInput) {
      const debounced = debounce(() => render(), 180);
      searchInput.addEventListener('input', debounced);
    }

    // Renderizar inicialmente con posible valor del input
    render();

    const paramId = parseInt(getQueryParam('id'), 10);
    if (paramId) {
      showDetail(paramId);
    } else {
      hideDetail();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
