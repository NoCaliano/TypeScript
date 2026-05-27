import { renderNavbar } from './components/navbar.js';
import { renderPollCard } from './components/poll-card.js';
import {
  renderOptionInput,
  renderPollForm,
  renderQuestionInput,
} from './components/poll-form.js';
import { renderVoteForm } from './components/vote-form.js';
import type { Option } from './models/option.js';
import type { Poll } from './models/poll.js';
import type { Question } from './models/question.js';
import type { Vote } from './models/vote.js';
import { PollService } from './services/poll.service.js';
import { parsePollCsv } from './utils/poll-csv.js';

const MAX_QUESTIONS = 50;
const MAX_OPTIONS = 8;
const service = new PollService();

interface QuestionDraft {
  text: string;
  options: string[];
}

export function initRouter(): void {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

async function handleRoute(): Promise<void> {
  const hash = window.location.hash || '#/';
  const app = document.getElementById('app')!;
  const pollMatch = hash.match(/^#\/poll\/(\d+)$/);
  const resultsMatch = hash.match(/^#\/results\/(\d+)$/);

  if (hash === '#/' || hash === '#') {
    await renderHome(app);
    return;
  }

  if (hash === '#/create') {
    renderCreate(app);
    return;
  }

  if (pollMatch) {
    await renderPoll(app, parseInt(pollMatch[1], 10));
    return;
  }

  if (resultsMatch) {
    await renderResults(app, parseInt(resultsMatch[1], 10));
    return;
  }

  renderNotFound(app);
}

async function renderHome(app: HTMLElement): Promise<void> {
  app.innerHTML =
    renderNavbar('home') +
    `
      <main class="page-shell">
        <section class="home-hero">
          <div>
            <p class="eyebrow">Poll Studio</p>
            <h1 class="hero-title">Опитування, які виглядають як частина продукту, а не як випадкова форма.</h1>
            <p class="hero-copy">
              Створюй багатопитальні сценарії, імпортуй структуру з CSV і показуй результати в охайному, читабельному вигляді для команди.
            </p>
            <div class="hero-actions">
              <a href="#/create" class="primary-cta">Створити опитування</a>
              <a href="#/create" class="secondary-cta">Імпортувати з CSV</a>
            </div>
          </div>
          <div class="hero-stat-grid">
            <div class="hero-stat">
              <span class="hero-stat__label">Сценарії</span>
              <span class="hero-stat__value" id="hero-polls-count">...</span>
              <span class="hero-stat__note">Готові багатопитальні опитування для старту без порожнього екрану.</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat__label">Формат</span>
              <span class="hero-stat__value">1-50</span>
              <span class="hero-stat__note">Питань у межах одного опитування без зміни поточного потоку створення.</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat__label">Імпорт</span>
              <span class="hero-stat__value">CSV</span>
              <span class="hero-stat__note">Один файл, кілька рядків, і ти вже всередині готової форми редагування.</span>
            </div>
          </div>
        </section>

        <section>
          <div class="section-header">
            <div>
              <h2 class="section-title">Доступні опитування</h2>
              <p class="section-copy">Поточні сценарії для голосування і перегляду результатів. Кожна картка веде прямо в потрібний режим.</p>
            </div>
            <a href="#/create" class="chip-link">+ Нове опитування</a>
          </div>
          <div id="polls-list" class="poll-grid">
            <div class="col-span-full text-center text-gray-400 py-12">Завантаження...</div>
          </div>
        </section>
      </main>
    `;

  try {
    const polls = await service.getPolls();
    const questions = await service.getQuestions();
    const list = document.getElementById('polls-list')!;
    const heroPollCount = document.getElementById('hero-polls-count');
    const questionCountByPoll = questions.reduce((map: Map<number, number>, question: Question) => {
      map.set(question.pollId, (map.get(question.pollId) ?? 0) + 1);
      return map;
    }, new Map<number, number>());

    if (heroPollCount) {
      heroPollCount.textContent = String(polls.length).padStart(2, '0');
    }

    if (polls.length === 0) {
      list.innerHTML =
        '<div class="col-span-full empty-state surface-panel">Опитувань ще немає. <a href="#/create" class="chip-link mt-4">Створіть перше</a></div>';
      return;
    }

    list.innerHTML = polls
      .map((poll: Poll) => renderPollCard(poll, questionCountByPoll.get(poll.id) ?? 0))
      .join('');
  } catch {
    document.getElementById('polls-list')!.innerHTML =
      '<div class="col-span-full error-state surface-panel text-red-400">Помилка завантаження даних.</div>';
  }
}

function renderCreate(app: HTMLElement): void {
  app.innerHTML =
    renderNavbar('create') +
    `
      <main class="page-shell page-shell--narrow">
        ${renderPollForm()}
      </main>
    `;

  attachCreateHandlers();
}

async function renderPoll(app: HTMLElement, pollId: number): Promise<void> {
  app.innerHTML =
    renderNavbar() +
    `
      <main class="page-shell page-shell--narrow detail-shell" id="poll-content">
        <div class="text-center text-gray-400 py-12">Завантаження...</div>
      </main>
    `;

  const content = document.getElementById('poll-content')!;
  const poll = await service.getPollById(pollId);

  if (!poll) {
    content.innerHTML = '<p class="text-red-500">Опитування не знайдено.</p>';
    return;
  }

  if (service.hasVoted(pollId)) {
    window.location.hash = `#/results/${pollId}`;
    return;
  }

  const questions = await service.getQuestionsByPollId(pollId);
  const options = await service.getOptionsByPollId(pollId);
  const optionsByQuestion = groupOptionsByQuestion(options);

  content.innerHTML = `
    <a href="#/" class="back-link">← Назад до списку</a>
    <section class="detail-header surface-panel">
      <div class="detail-badges">
        <span class="pill">Голосування</span>
        <span class="detail-badge">${questions.length} питань</span>
      </div>
      <h1 class="detail-title mt-4">${escapeHtml(poll.title)}</h1>
      <p class="detail-copy">${escapeHtml(poll.description)}</p>
    </section>
    <section class="surface-panel p-8 md:p-10">
      <div id="vote-area" class="detail-stack">
        ${renderVoteForm(questions, optionsByQuestion)}
      </div>
    </section>
  `;

  document.getElementById('submit-vote-btn')?.addEventListener('click', () => {
    const errorEl = document.getElementById('vote-error')!;
    const answers = questions.map((question: Question) => {
      const selected = document.querySelector<HTMLInputElement>(
        `input[name="vote-${question.id}"]:checked`
      );

      return selected
        ? {
            questionId: question.id,
            optionId: parseInt(selected.value, 10),
          }
        : null;
    });

    if (answers.some((answer) => answer === null)) {
      showError(errorEl, 'Будь ласка, дайте відповідь на кожне питання.');
      return;
    }

    errorEl.classList.add('hidden');
    service.castVotes(
      pollId,
      answers.filter(Boolean) as Array<{ questionId: number; optionId: number }>
    );
    service.markVoted(pollId);
    window.location.hash = `#/results/${pollId}`;
  });
}

async function renderResults(app: HTMLElement, pollId: number): Promise<void> {
  app.innerHTML =
    renderNavbar() +
    `
      <main class="page-shell page-shell--narrow detail-shell" id="results-content">
        <div class="text-center text-gray-400 py-12">Завантаження...</div>
      </main>
    `;

  const content = document.getElementById('results-content')!;
  const poll = await service.getPollById(pollId);

  if (!poll) {
    content.innerHTML = '<p class="text-red-500">Опитування не знайдено.</p>';
    return;
  }

  const questions = await service.getQuestionsByPollId(pollId);
  const options = await service.getOptionsByPollId(pollId);
  const votes = service.getVotesByPollId(pollId);
  const optionsByQuestion = groupOptionsByQuestion(options);
  const participants =
    questions.length > 0
      ? votes.filter((vote: Vote) => vote.questionId === questions[0].id).length
      : 0;

  const resultSections = questions
    .map((question: Question, index: number) => {
      const questionVotes = votes.filter((vote: Vote) => vote.questionId === question.id);
      const totalVotes = questionVotes.length;

      const bars = (optionsByQuestion.get(question.id) ?? [])
        .map((option: Option) => {
          const count = questionVotes.filter((vote: Vote) => vote.optionId === option.id).length;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

          return `
            <div class="result-row">
              <div class="result-row__head">
                <span>${escapeHtml(option.text)}</span>
                <span class="whitespace-nowrap">${count} голос${voteSuffix(count)} · ${percentage}%</span>
              </div>
              <div class="result-row__track">
                <div class="result-row__fill transition-all duration-700" style="width: ${percentage}%"></div>
              </div>
            </div>
          `;
        })
        .join('');

      return `
        <section class="result-card flex flex-col gap-4">
          <div>
            <p class="question-label text-xs font-semibold uppercase tracking-[0.2em]">Питання ${index + 1}</p>
            <h2 class="result-card__title">${escapeHtml(question.text)}</h2>
            <p class="result-card__meta">Відповідей: <strong>${totalVotes}</strong></p>
          </div>
          <div class="flex flex-col gap-4">
            ${bars}
          </div>
        </section>
      `;
    })
    .join('');

  const voted = service.hasVoted(pollId);

  content.innerHTML = `
    <a href="#/" class="back-link">← Назад до списку</a>
    <section class="detail-header surface-panel">
      <div class="detail-badges">
        <span class="pill">Результати</span>
        <span class="detail-badge">${questions.length} питань</span>
        <span class="detail-badge">${participants} учасників</span>
      </div>
      <h1 class="detail-title mt-4">${escapeHtml(poll.title)}</h1>
      <p class="detail-copy">${escapeHtml(poll.description)}</p>
    </section>
    <section class="surface-panel p-8 md:p-10">
      <div class="flex flex-col gap-5">
        ${resultSections}
      </div>
      ${
        !voted
          ? `<a href="#/poll/${pollId}" class="chip-link mt-6">Проголосувати</a>`
          : ''
      }
    </section>
  `;
}

function renderNotFound(app: HTMLElement): void {
  app.innerHTML =
    renderNavbar() +
    `
      <main class="page-shell page-shell--narrow">
        <section class="surface-panel not-found">
          <p class="not-found__icon">⌘</p>
          <h1 class="not-found__title">Сторінку не знайдено</h1>
          <p class="not-found__copy">Схоже, ми звернули не туди. Повернись на головну і продовжуй роботу з опитуваннями без зайвих кроків.</p>
          <a href="#/" class="primary-cta mx-auto mt-6">На головну</a>
        </section>
      </main>
    `;
}

function attachCreateHandlers(): void {
  const titleInput = document.getElementById('poll-title') as HTMLInputElement;
  const descriptionInput = document.getElementById('poll-description') as HTMLTextAreaElement;
  const questionsContainer = document.getElementById('questions-container') as HTMLElement;
  const addQuestionBtn = document.getElementById('add-question-btn') as HTMLButtonElement;
  const csvInput = document.getElementById('csv-upload') as HTMLInputElement;
  const errorEl = document.getElementById('form-error') as HTMLElement;

  const getQuestionBlocks = (): HTMLElement[] =>
    Array.from(questionsContainer.querySelectorAll<HTMLElement>('.question-block'));

  const getOptionRows = (questionBlock: HTMLElement): HTMLElement[] =>
    Array.from(questionBlock.querySelectorAll<HTMLElement>('.option-row'));

  const createQuestionBlock = (index: number, question?: QuestionDraft): HTMLElement => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderQuestionInput(index, question?.text ?? '', question?.options ?? ['', '']);
    return wrapper.firstElementChild as HTMLElement;
  };

  const createOptionRow = (
    questionIndex: number,
    optionIndex: number,
    value: string = ''
  ): HTMLElement => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderOptionInput(questionIndex, optionIndex, value);
    return wrapper.firstElementChild as HTMLElement;
  };

  function syncQuestionUi(): void {
    const questionBlocks = getQuestionBlocks();

    questionBlocks.forEach((questionBlock: HTMLElement, questionIndex: number) => {
      questionBlock.dataset.questionIndex = String(questionIndex + 1);

      const label = questionBlock.querySelector<HTMLElement>('.question-label');
      if (label) {
        label.textContent = `Питання ${questionIndex + 1}`;
      }

      const removeQuestionBtn = questionBlock.querySelector<HTMLButtonElement>('.remove-question-btn');
      if (removeQuestionBtn) {
        const hidden = questionBlocks.length === 1;
        removeQuestionBtn.disabled = hidden;
        removeQuestionBtn.classList.toggle('invisible', hidden);
      }

      const optionRows = getOptionRows(questionBlock);
      const lockOptionRemoval = optionRows.length <= 2;

      optionRows.forEach((row: HTMLElement, optionIndex: number) => {
        row.dataset.questionIndex = String(questionIndex + 1);
        row.dataset.optionIndex = String(optionIndex + 1);

        const number = row.querySelector<HTMLElement>('.option-number');
        if (number) {
          number.textContent = `${optionIndex + 1}.`;
        }

        const input = row.querySelector<HTMLInputElement>('.option-input');
        if (input) {
          input.placeholder = `Варіант ${optionIndex + 1}`;
        }

        const removeOptionBtn = row.querySelector<HTMLButtonElement>('.remove-option-btn');
        if (removeOptionBtn) {
          removeOptionBtn.disabled = lockOptionRemoval;
          removeOptionBtn.classList.toggle('invisible', lockOptionRemoval);
        }
      });

      const addOptionBtn = questionBlock.querySelector<HTMLButtonElement>('.add-option-btn');
      if (addOptionBtn) {
        const limitReached = optionRows.length >= MAX_OPTIONS;
        addOptionBtn.classList.toggle('opacity-40', limitReached);
        addOptionBtn.classList.toggle('pointer-events-none', limitReached);
      }
    });

    const limitReached = questionBlocks.length >= MAX_QUESTIONS;
    addQuestionBtn.classList.toggle('opacity-40', limitReached);
    addQuestionBtn.classList.toggle('pointer-events-none', limitReached);
  }

  function rebuildQuestions(questions: QuestionDraft[]): void {
    questionsContainer.innerHTML = '';
    questions.forEach((question: QuestionDraft, index: number) => {
      questionsContainer.appendChild(createQuestionBlock(index + 1, question));
    });
    syncQuestionUi();
  }

  questionsContainer.addEventListener('click', (event: Event) => {
    const target = event.target as HTMLElement;
    const questionBlock = target.closest<HTMLElement>('.question-block');

    if (!questionBlock) {
      return;
    }

    if (target.closest('.remove-question-btn')) {
      if (getQuestionBlocks().length <= 1) {
        return;
      }

      questionBlock.remove();
      syncQuestionUi();
      return;
    }

    if (target.closest('.add-option-btn')) {
      const optionRows = getOptionRows(questionBlock);
      if (optionRows.length >= MAX_OPTIONS) {
        return;
      }

      const optionContainer = questionBlock.querySelector<HTMLElement>('.question-options-container');
      optionContainer?.appendChild(
        createOptionRow(
          getQuestionBlocks().indexOf(questionBlock) + 1,
          optionRows.length + 1
        )
      );
      syncQuestionUi();
      return;
    }

    if (target.closest('.remove-option-btn')) {
      const optionRows = getOptionRows(questionBlock);
      if (optionRows.length <= 2) {
        return;
      }

      target.closest('.option-row')?.remove();
      syncQuestionUi();
    }
  });

  addQuestionBtn.addEventListener('click', () => {
    const questionCount = getQuestionBlocks().length;
    if (questionCount >= MAX_QUESTIONS) {
      return;
    }

    questionsContainer.appendChild(createQuestionBlock(questionCount + 1));
    syncQuestionUi();
  });

  csvInput.addEventListener('change', async () => {
    const file = csvInput.files?.[0];
    if (!file) {
      return;
    }

    try {
      const imported = parsePollCsv(await file.text());
      titleInput.value = imported.title;
      descriptionInput.value = imported.description;
      rebuildQuestions(imported.questions);
      errorEl.classList.add('hidden');
    } catch (error) {
      showError(
        errorEl,
        error instanceof Error ? error.message : 'Не вдалося імпортувати CSV файл.'
      );
    } finally {
      csvInput.value = '';
    }
  });

  document.getElementById('submit-poll-btn')?.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const questions = getQuestionBlocks().map((questionBlock: HTMLElement) => {
      const text =
        questionBlock.querySelector<HTMLInputElement>('.question-title-input')?.value.trim() ?? '';
      const options = getOptionRows(questionBlock)
        .map(
          (row: HTMLElement) =>
            row.querySelector<HTMLInputElement>('.option-input')?.value.trim() ?? ''
        )
        .filter((value: string) => value.length > 0);

      return { text, options };
    });

    if (!title) {
      showError(errorEl, 'Введіть назву опитування.');
      return;
    }

    if (questions.some((question: QuestionDraft) => question.text.length === 0)) {
      showError(errorEl, 'Кожне питання має містити текст.');
      return;
    }

    const invalidQuestion = questions.find(
      (question: QuestionDraft) => question.options.length < 2
    );
    if (invalidQuestion) {
      showError(errorEl, `Питання "${invalidQuestion.text}" має містити щонайменше 2 варіанти.`);
      return;
    }

    errorEl.classList.add('hidden');

    const submitBtn = document.getElementById('submit-poll-btn') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Збереження...';

    try {
      const newPoll = await service.createPoll(title, description, questions);
      window.location.hash = `#/poll/${newPoll.id}`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Створити опитування';
    }
  });

  syncQuestionUi();
}

function groupOptionsByQuestion(options: Option[]): Map<number, Option[]> {
  const map = new Map<number, Option[]>();

  for (const option of options) {
    const list = map.get(option.questionId) ?? [];
    list.push(option);
    map.set(option.questionId, list);
  }

  return map;
}

function showError(element: HTMLElement, message: string): void {
  element.textContent = message;
  element.classList.remove('hidden');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function voteSuffix(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return '';
  }

  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'и';
  }

  return 'ів';
}
