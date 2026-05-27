// Рендер форми голосування
export function renderVoteForm(questions, optionsByQuestion) {
    const items = questions
        .map((question, index) => {
        const options = optionsByQuestion.get(question.id) ?? [];
        return `
        <section class="vote-question flex flex-col gap-4">
          <div>
            <p class="question-label text-xs font-semibold uppercase tracking-[0.2em]">Питання ${index + 1}</p>
            <h2 class="vote-question__title">${escapeHtml(question.text)}</h2>
          </div>
          <div class="flex flex-col gap-3">
            ${options
            .map((opt) => `
                  <label class="vote-option cursor-pointer">
                    <input type="radio" name="vote-${question.id}" value="${opt.id}" class="cursor-pointer" />
                    <span class="vote-option__text text-sm">${escapeHtml(opt.text)}</span>
                  </label>
                `)
            .join('')}
          </div>
        </section>
      `;
    })
        .join('');
    return `
    <div class="flex flex-col gap-4">
      ${items}
    </div>
    <div id="vote-error" class="hidden text-sm px-4 py-3 mt-3"></div>
    <button id="submit-vote-btn" class="mt-4 w-full">
      Проголосувати
    </button>
  `;
}
// Екранування HTML у формі голосування
function escapeHtml(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
