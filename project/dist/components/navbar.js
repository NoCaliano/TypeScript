export function renderNavbar(activePage = '') {
    return `
    <nav class="app-nav">
      <div class="app-nav__inner flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <a href="#/" class="brand-mark">
          <span class="brand-badge">✦</span>
          <span class="brand-copy">
            <span class="brand-name">PollApp</span>
            <span class="brand-subtitle">Survey Studio</span>
          </span>
        </a>
        <div class="nav-links">
          <a href="#/" class="nav-link ${activePage === 'home' ? 'is-active' : ''}">Головна</a>
          <a href="#/create" class="nav-link ${activePage === 'create' ? 'is-active' : ''}">Створити опитування</a>
        </div>
      </div>
    </nav>
  `;
}
