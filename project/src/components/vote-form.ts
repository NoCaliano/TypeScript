import type { Option } from '../models/option.js';

export function renderVoteForm(options: Option[]): string {
  const items: string = options
    .map(
      (opt: Option) => `
      <label class="flex items-center gap-3 cursor-pointer group">
        <input type="radio" name="vote" value="${opt.id}"
          class="w-4 h-4 accent-indigo-600 cursor-pointer" />
        <span class="text-gray-700 group-hover:text-indigo-700 transition text-sm">${escapeHtml(opt.text)}</span>
      </label>
    `
    )
    .join('');

  return `
    <div class="flex flex-col gap-3 bg-gray-50 rounded-xl p-5 border border-gray-200">
      ${items}
    </div>
    <div id="vote-error" class="hidden text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mt-2"></div>
    <button id="submit-vote-btn"
      class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">
      Проголосувати
    </button>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}