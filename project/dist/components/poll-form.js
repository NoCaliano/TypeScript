export function renderPollForm() {
    return `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Нове опитування</h1>
      <div class="bg-white rounded-2xl shadow-md p-8 flex flex-col gap-5 border border-gray-100">

        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold text-gray-700">Назва опитування <span class="text-red-500">*</span></label>
          <input id="poll-title" type="text" maxlength="120"
            class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
            placeholder="Наприклад: Улюблена мова програмування" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold text-gray-700">Опис</label>
          <textarea id="poll-description" rows="3" maxlength="300"
            class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 resize-none"
            placeholder="Необов'язково — короткий опис теми"></textarea>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-gray-700">Варіанти відповідей <span class="text-red-500">*</span> <span class="text-gray-400 font-normal">(мін. 2, макс. 8)</span></label>
          <div id="options-container" class="flex flex-col gap-2">
            ${renderOptionInput(1)}
            ${renderOptionInput(2)}
          </div>
          <button id="add-option-btn"
            class="mt-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium self-start flex items-center gap-1 transition">
            <span class="text-lg leading-none">+</span> Додати варіант
          </button>
        </div>

        <div id="form-error" class="hidden text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2"></div>

        <button id="submit-poll-btn"
          class="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition text-base">
          Створити опитування
        </button>
      </div>
    </div>
  `;
}
export function renderOptionInput(index) {
    return `
    <div class="flex gap-2 items-center option-row" data-index="${index}">
      <span class="text-sm text-gray-400 w-5 text-right">${index}.</span>
      <input type="text" maxlength="100"
        class="option-input flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-800"
        placeholder="Варіант ${index}" />
      ${index > 2 ? `<button class="remove-option-btn text-gray-400 hover:text-red-500 transition text-lg leading-none" title="Видалити">×</button>` : '<span class="w-5"></span>'}
    </div>
  `;
}
