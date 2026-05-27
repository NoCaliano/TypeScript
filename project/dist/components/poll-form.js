const MAX_QUESTIONS = 50;
const MAX_OPTIONS = 8;
export function renderPollForm() {
    return `
    <div class="creator-shell">
      <section class="creator-header surface-panel">
        <p class="eyebrow">Poll Designer</p>
        <h1 class="creator-title">Створюй опитування як маленький продукт</h1>
        <p class="creator-copy">Одна форма, багато питань, швидкий імпорт з CSV і чистий робочий потік без зайвої плутанини.</p>
        <div class="creator-meta">
          <span class="detail-badge">До ${MAX_QUESTIONS} питань</span>
          <span class="detail-badge">CSV імпорт</span>
          <span class="detail-badge">Багатопитальне голосування</span>
        </div>
      </section>

      <div class="surface-panel creator-panel flex flex-col gap-6">
        <div class="import-card flex flex-col gap-3">
          <div>
            <h2 class="text-xl font-bold text-gray-800">Імпорт з CSV</h2>
            <p class="field-help mt-2">
              Формат рядка: <code>title,description,question,option1,option2,...</code>
            </p>
          </div>
          <input
            id="csv-upload"
            type="file"
            accept=".csv,text/csv"
            class="block w-full text-sm"
          />
          <p class="field-help">
            Кожен рядок створює окреме питання. Назву й опис можна повторювати в кожному рядку або вказати лише в першому.
          </p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="field-label">Назва опитування <span class="text-red-500">*</span></label>
          <input
            id="poll-title"
            type="text"
            maxlength="120"
            class="input-field px-4 py-3"
            placeholder="Наприклад: Улюблені інструменти команди"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="field-label">Опис</label>
          <textarea
            id="poll-description"
            rows="3"
            maxlength="300"
            class="input-field px-4 py-3 resize-none"
            placeholder="Необов'язково — короткий опис теми"
          ></textarea>
        </div>

        <div class="flex flex-col gap-3">
          <div class="field-header flex items-center justify-between gap-3">
            <label class="field-label mb-0">
              Питання <span class="text-red-500">*</span>
              <span class="text-gray-500 font-normal">(від 1 до ${MAX_QUESTIONS})</span>
            </label>
            <button
              id="add-question-btn"
              type="button"
              class="text-sm"
            >
              + Додати питання
            </button>
          </div>
          <div id="questions-container" class="flex flex-col gap-4">
            ${renderQuestionInput(1)}
          </div>
        </div>

        <div id="form-error" class="hidden text-sm px-4 py-3"></div>

        <button id="submit-poll-btn" class="w-full text-base">
          Створити опитування
        </button>
      </div>
    </div>
  `;
}
export function renderQuestionInput(index, questionText = '', optionTexts = ['', '']) {
    const safeOptions = optionTexts.length >= 2 ? optionTexts.slice(0, MAX_OPTIONS) : ['', ''];
    return `
    <section class="question-block flex flex-col gap-4" data-question-index="${index}">
      <div class="question-block__header flex items-center justify-between gap-3">
        <div>
          <p class="question-label text-xs font-semibold uppercase tracking-[0.2em]">Питання ${index}</p>
        </div>
        <button
          type="button"
          class="remove-question-btn text-sm"
        >
          Видалити
        </button>
      </div>

      <div class="flex flex-col gap-1">
        <label class="field-label mb-0 text-sm">Текст питання</label>
        <input
          type="text"
          maxlength="180"
          value="${escapeAttribute(questionText)}"
          class="question-title-input px-4 py-3"
          placeholder="Наприклад: Який формат ретро вам зручніший?"
        />
      </div>

      <div class="flex flex-col gap-2">
        <div class="question-options__header flex items-center justify-between gap-3">
          <label class="field-label mb-0 text-sm">
            Варіанти відповіді <span class="text-red-500">*</span>
            <span class="text-gray-500 font-normal">(мін. 2, макс. ${MAX_OPTIONS})</span>
          </label>
          <button
            type="button"
            class="add-option-btn text-sm"
          >
            + Додати варіант
          </button>
        </div>
        <div class="question-options-container flex flex-col gap-2">
          ${safeOptions.map((text, optionIndex) => renderOptionInput(index, optionIndex + 1, text)).join('')}
        </div>
      </div>
    </section>
  `;
}
export function renderOptionInput(questionIndex, optionIndex, value = '') {
    return `
    <div class="option-row gap-2" data-question-index="${questionIndex}" data-option-index="${optionIndex}">
      <span class="option-number text-sm text-right">${optionIndex}.</span>
      <input
        type="text"
        maxlength="100"
        value="${escapeAttribute(value)}"
        class="option-input flex-1 px-4 py-3"
        placeholder="Варіант ${optionIndex}"
      />
      <button
        type="button"
        class="remove-option-btn text-lg leading-none text-center"
        title="Видалити варіант"
      >
        ×
      </button>
    </div>
  `;
}
function escapeAttribute(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
