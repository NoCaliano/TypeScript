export function renderNavbar(activePage: string = ''): string {
  return `
    <nav class="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="#/" class="text-xl font-bold tracking-tight flex items-center gap-2">
          <span class="text-2xl">🗳️</span> PollApp
        </a>
        <div class="flex gap-4 text-sm font-medium">
          <a href="#/" class="hover:text-indigo-200 transition ${activePage === 'home' ? 'text-white underline underline-offset-4' : 'text-indigo-200'}">Головна</a>
          <a href="#/create" class="hover:text-indigo-200 transition ${activePage === 'create' ? 'text-white underline underline-offset-4' : 'text-indigo-200'}">Створити опитування</a>
        </div>
      </div>
    </nav>
  `;
}