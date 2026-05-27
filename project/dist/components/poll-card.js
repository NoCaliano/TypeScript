export function renderPollCard(poll) {
    const date = new Date(poll.createdAt).toLocaleDateString('uk-UA');
    return `
    <div class="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col border border-gray-100 min-h-[200px]">
      <h3 class="text-lg font-semibold text-gray-800 mb-1">${escapeHtml(poll.title)}</h3>
      <p class="text-sm text-gray-500 flex-1 line-clamp-3">${escapeHtml(poll.description)}</p>
      <div class="flex flex-col gap-2 mt-3">
        <span class="text-xs text-gray-400">📅 ${date}</span>
        <div class="flex gap-2">
          <a href="#/poll/${poll.id}" class="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-2 py-2 rounded-lg transition">Голосувати</a>
          <a href="#/results/${poll.id}" class="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-2 py-2 rounded-lg transition">Результати</a>
        </div>
      </div>
    </div>
  `;
}
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
