/*
  app.js - comportamiento y contrato (documentación inline)

  Resumen general:
  - Este archivo implementa la lógica para renderizar un catálogo de cursos y
    mostrar el detalle de un curso dentro de la misma página `index.html`.
  - Datos: un array `COURSES` (id, title, description, url) está embebido aquí.
  - UI hooks: busca elementos por ID en `index.html` (ver lista más abajo).

  Contrato (entradas / salidas / efectos):
  - Entradas:
    * `COURSES` (array de objetos de curso) definido al inicio del fichero.
    * Opcional: query string `?id=N` para abrir la vista detalle directamente.
    * Interacciones del usuario: escritura en `#search-input`, clics en enlaces y botones.
  - Salidas/efectos:
    * Manipula el DOM para mostrar/ocultar secciones (`#courses-list`, `#course-detail`, etc.).
    * Actualiza la UI (lista, links rápidos, contador de resultados).
    * Al abrir enlaces externos usa `target="_blank" rel="noopener noreferrer"` por seguridad.
    * Guarda/lee preferencia de tema en localStorage.

  Estructura de elementos esperados en `index.html` (IDs y clases usadas):
  - `#courses-list`    => contenedor donde se inyectan las tarjetas de curso
  - `#links-list`      => lista de enlaces rápidos (también renderizada desde los datos)
  - `#course-detail`   => sección de detalle (se muestra/oculta según query param)
  - `#course-detail-content` => contenedor donde se inserta el HTML del detalle
  - `#search-input`    => campo de búsqueda (filtrado por título)
  - `#theme-toggle`    => botón que alterna tema claro/oscuro (almacena en localStorage)
  - `.toolbar`         => barra que incluye búsqueda, toggle y contador

  Casos borde y decisiones de diseño:
  - Si `COURSES` no es un array, se muestra un mensaje "No hay cursos disponibles.".
  - La búsqueda filtra por título (case-insensitive) y aplica un debounce para mejorar UX.
  - Si `?id=N` apunta a un curso inexistente se muestra "Curso no encontrado." en el detalle.
  - Los enlaces internos a detalle usan `index.html?id=N` para mantener una única página.
  - La función `createCard` añade soporte de accesibilidad/teclado (Enter/Space) al contenedor.
  - El código evita recargas innecesarias: la navegación a `index.html?id=N` recarga la página,
    pero se podrían añadir manipulación de history API para una SPA completa (sugerencia).

  Nota sobre mejoras posibles (no implementadas aquí):
  - Cargar `COURSES` desde un `courses.json` mediante fetch para desacoplar datos/JS.
  - Uso del History API para cambiar la URL sin recargar cuando se abre/oculta detalle.
  - Tests unitarios para las funciones de renderizado y filtrado.
  - Añadir más atributos ARIA en las tarjetas y enlaces para accesibilidad avanzada.
*/

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

  /**
   * createCard(course)
   * - Propósito: construir y devolver el nodo DOM que representa una tarjeta de curso.
   * - Parámetros: course { id, title, description, url }
   * - Efectos: añade manejadores de teclado para accesibilidad y botones de acción.
   * - Retorna: HTMLElement (<article>) listo para insertarse en la lista.
   */
  function createCard(course) {
    // createCard: crea y devuelve la tarjeta DOM para un curso
    // - course: {id, title, description, url}
    // accesibilidad: hacemos la tarjeta enfocables y añadimos role=button
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

  // Contenedor de acciones: botón ver detalles y abrir curso (externo)
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

  /**
   * render()
   * - Propósito: renderizar la vista principal con las tarjetas de cursos y la
   *   lista de enlaces rápidos, aplicando el filtro indicado en el input.
   * - Entrada: lee el valor de `#search-input` (si existe).
   * - Efecto: actualiza `#courses-list`, `#links-list` y `#results-count`.
   */
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

  /**
   * showDetail(id)
   * - Propósito: mostrar la vista detalle para el curso con el id indicado.
   * - Parámetros: id (Number). Si no existe, muestra un mensaje de "no encontrado".
   * - Efectos: inyecta el HTML del detalle en `#course-detail-content` y oculta
   *   las secciones de lista/toolbar/enlaces.
   */
  // Mostrar detalle cuando hay ?id=N
  function showDetail(id) {
    // Buscar el curso por id y mostrar su detalle en el contenedor
    const course = COURSES.find(c => c.id === id);
    if (!detailContent) return; // si no existe el contenedor, no hacer nada
    if (!course) {
      detailContent.innerHTML = '<p>Curso no encontrado.</p>';
    } else {
      // Creamos un bloque de HTML simple con la información del curso.
      // No interpolamos HTML desde fuentes no confiables (aquí los datos son locales).
      detailContent.innerHTML = `\n        <h1>${course.title}</h1>\n        <p class="course-desc">${course.description}</p>\n        <p><strong>Enlace:</strong> <a href="${course.url}" target="_blank" rel="noopener noreferrer">Abrir curso externo</a></p>\n      `;
    }
    // Mostrar sección de detalle y ocultar el resto de UI relacionada con la lista
    if (detailSection) detailSection.classList.remove('hidden');
    const heading = document.querySelector('.container > h1'); if (heading) heading.classList.add('hidden');
    const subtitle = document.querySelector('.subtitle'); if (subtitle) subtitle.classList.add('hidden');
    if (listEl) listEl.classList.add('hidden');
    const toolbar = document.querySelector('.toolbar'); if (toolbar) toolbar.classList.add('hidden');
    const linksSec = document.getElementById('courses-links'); if (linksSec) linksSec.classList.add('hidden');
  }

  /**
   * hideDetail()
   * - Propósito: restaurar la vista principal (ocultar detalle, mostrar lista y toolbar).
   * - Efectos: quita/añade la clase .hidden en las secciones relevantes.
   */
  function hideDetail() {
    // Oculta la sección de detalle y restaura la vista principal
    if (detailSection) detailSection.classList.add('hidden');
    const heading = document.querySelector('.container > h1'); if (heading) heading.classList.remove('hidden');
    const subtitle = document.querySelector('.subtitle'); if (subtitle) subtitle.classList.remove('hidden');
    if (listEl) listEl.classList.remove('hidden');
    const toolbar = document.querySelector('.toolbar'); if (toolbar) toolbar.classList.remove('hidden');
    const linksSec = document.getElementById('courses-links'); if (linksSec) linksSec.classList.remove('hidden');
  }

  /**
   * getQueryParam(name)
   * - Propósito: leer un parámetro de la query string de la URL.
   * - Parámetros: name (String) - nombre del parámetro.
   * - Retorna: valor (String) o null si no existe.
   */
  // Extraer id de query string
  function getQueryParam(name) {
    // Devuelve el valor del parámetro de la URL (ej. ?id=3)
    const params = new URLSearchParams(location.search);
    return params.get(name);
  }

  /**
   * init()
   * - Propósito: inicializar listeners, tema, y renderizar la vista inicial.
   * - Efectos: configura debounce para búsqueda, ajusta tema desde localStorage,
   *   y muestra la vista detalle si `?id=` está presente.
   */
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
