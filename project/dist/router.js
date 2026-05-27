import { PollService } from './services/poll.service.js';
import { renderNavbar } from './components/navbar.js';
import { renderPollCard } from './components/poll-card.js';
import { renderPollForm, renderOptionInput } from './components/poll-form.js';
import { renderVoteForm } from './components/vote-form.js';
const service = new PollService();
export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}
async function handleRoute() {
    const hash = window.location.hash || '#/';
    const app = document.getElementById('app');
    // parse route
    const pollMatch = hash.match(/^#\/poll\/(\d+)$/);
    const resultsMatch = hash.match(/^#\/results\/(\d+)$/);
    if (hash === '#/' || hash === '#') {
        await renderHome(app);
    }
    else if (hash === '#/create') {
        renderCreate(app);
    }
    else if (pollMatch) {
        await renderPoll(app, parseInt(pollMatch[1]));
    }
    else if (resultsMatch) {
        await renderResults(app, parseInt(resultsMatch[1]));
    }
    else {
        renderNotFound(app);
    }
}
// ─── Pages ────────────────────────────────────────────────────────────────────
async function renderHome(app) {
    app.innerHTML = renderNavbar('home') + `
    <main class="max-w-5xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Доступні опитування</h1>
        <a href="#/create" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition">+ Нове опитування</a>
      </div>
      <div id="polls-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div class="col-span-full text-center text-gray-400 py-12">Завантаження...</div>
      </div>
    </main>
  `;
    try {
        const polls = await service.getPolls();
        const list = document.getElementById('polls-list');
        if (polls.length === 0) {
            list.innerHTML = `<div class="col-span-full text-center text-gray-400 py-12">Опитувань ще немає. <a href="#/create" class="text-indigo-600 underline">Створіть перше!</a></div>`;
        }
        else {
            list.innerHTML = polls.map((p) => renderPollCard(p)).join('');
        }
    }
    catch {
        document.getElementById('polls-list').innerHTML =
            `<div class="col-span-full text-center text-red-400 py-12">Помилка завантаження даних.</div>`;
    }
}
function renderCreate(app) {
    app.innerHTML = renderNavbar('create') + `
    <main class="max-w-5xl mx-auto px-4 py-8">
      ${renderPollForm()}
    </main>
  `;
    attachCreateHandlers();
}
async function renderPoll(app, pollId) {
    app.innerHTML = renderNavbar() + `
    <main class="max-w-2xl mx-auto px-4 py-8" id="poll-content">
      <div class="text-center text-gray-400 py-12">Завантаження...</div>
    </main>
  `;
    const content = document.getElementById('poll-content');
    const poll = await service.getPollById(pollId);
    if (!poll) {
        content.innerHTML = `<p class="text-red-500">Опитування не знайдено.</p>`;
        return;
    }
    if (service.hasVoted(pollId)) {
        window.location.hash = `#/results/${pollId}`;
        return;
    }
    const options = await service.getOptionsByPollId(pollId);
    content.innerHTML = `
    <a href="#/" class="text-sm text-indigo-600 hover:underline mb-4 inline-block">← Назад</a>
    <div class="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">${escapeHtml(poll.title)}</h1>
      <p class="text-gray-500 text-sm mb-6">${escapeHtml(poll.description)}</p>
      <div id="vote-area">
        ${renderVoteForm(options)}
      </div>
    </div>
  `;
    const submitBtn = document.getElementById('submit-vote-btn');
    submitBtn?.addEventListener('click', () => {
        const selected = document.querySelector('input[name="vote"]:checked');
        const errorEl = document.getElementById('vote-error');
        if (!selected) {
            errorEl.textContent = 'Будь ласка, оберіть один варіант відповіді.';
            errorEl.classList.remove('hidden');
            return;
        }
        errorEl.classList.add('hidden');
        service.castVote(pollId, parseInt(selected.value));
        service.markVoted(pollId);
        window.location.hash = `#/results/${pollId}`;
    });
}
async function renderResults(app, pollId) {
    app.innerHTML = renderNavbar() + `
    <main class="max-w-2xl mx-auto px-4 py-8" id="results-content">
      <div class="text-center text-gray-400 py-12">Завантаження...</div>
    </main>
  `;
    const content = document.getElementById('results-content');
    const poll = await service.getPollById(pollId);
    if (!poll) {
        content.innerHTML = `<p class="text-red-500">Опитування не знайдено.</p>`;
        return;
    }
    const options = await service.getOptionsByPollId(pollId);
    const votes = service.getVotesByPollId(pollId);
    const totalVotes = votes.length;
    const bars = options
        .map((opt) => {
        const count = votes.filter((v) => v.optionId === opt.id).length;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return `
        <div class="flex flex-col gap-1">
          <div class="flex justify-between text-sm">
            <span class="text-gray-700">${escapeHtml(opt.text)}</span>
            <span class="text-gray-500 font-semibold">${count} голос${voteSuffix(count)} · ${pct}%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div class="h-4 rounded-full transition-all duration-700"
              style="width: ${pct}%; background: linear-gradient(90deg,#6366f1,#818cf8)"></div>
          </div>
        </div>
      `;
    })
        .join('');
    const voted = service.hasVoted(pollId);
    content.innerHTML = `
    <a href="#/" class="text-sm text-indigo-600 hover:underline mb-4 inline-block">← Назад</a>
    <div class="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
      <h1 class="text-2xl font-bold text-gray-800 mb-1">${escapeHtml(poll.title)}</h1>
      <p class="text-gray-500 text-sm mb-6">${escapeHtml(poll.description)}</p>
      <p class="text-xs text-gray-400 mb-5">Всього голосів: <strong>${totalVotes}</strong></p>
      <div class="flex flex-col gap-5">
        ${bars}
      </div>
      ${!voted ? `<a href="#/poll/${pollId}" class="mt-6 inline-block text-sm text-indigo-600 hover:underline">Проголосувати</a>` : ''}
    </div>
  `;
}
function renderNotFound(app) {
    app.innerHTML = renderNavbar() + `
    <main class="max-w-5xl mx-auto px-4 py-16 text-center">
      <p class="text-5xl mb-4">🔍</p>
      <h1 class="text-2xl font-bold text-gray-700 mb-2">Сторінку не знайдено</h1>
      <a href="#/" class="text-indigo-600 hover:underline">На головну</a>
    </main>
  `;
}
// ─── Create handlers ──────────────────────────────────────────────────────────
function attachCreateHandlers() {
    const addBtn = document.getElementById('add-option-btn');
    function getCurrentCount() {
        return document.querySelectorAll('.option-row').length;
    }
    function updateAddBtn() {
        if (getCurrentCount() >= 8) {
            addBtn.classList.add('opacity-40', 'pointer-events-none');
        }
        else {
            addBtn.classList.remove('opacity-40', 'pointer-events-none');
        }
    }
    function renumberOptions() {
        document.querySelectorAll('.option-row').forEach((row, idx) => {
            row.querySelector('span').textContent = `${idx + 1}.`;
            row.querySelector('.option-input').placeholder = `Варіант ${idx + 1}`;
        });
    }
    addBtn.addEventListener('click', () => {
        if (getCurrentCount() >= 8)
            return;
        const count = getCurrentCount() + 1;
        const container = document.getElementById('options-container');
        const div = document.createElement('div');
        div.innerHTML = renderOptionInput(count);
        container.appendChild(div.firstElementChild);
        attachRemoveHandlers(renumberOptions, updateAddBtn);
        updateAddBtn();
    });
    attachRemoveHandlers(renumberOptions, updateAddBtn);
    document.getElementById('submit-poll-btn')?.addEventListener('click', async () => {
        const title = document.getElementById('poll-title').value.trim();
        const description = document.getElementById('poll-description').value.trim();
        const optionInputs = document.querySelectorAll('.option-input');
        const optionTexts = Array.from(optionInputs)
            .map((el) => el.value.trim())
            .filter((t) => t.length > 0);
        const errorEl = document.getElementById('form-error');
        if (!title) {
            showError(errorEl, 'Введіть назву опитування.');
            return;
        }
        if (optionTexts.length < 2) {
            showError(errorEl, 'Додайте щонайменше 2 варіанти відповідей.');
            return;
        }
        errorEl.classList.add('hidden');
        const submitBtn = document.getElementById('submit-poll-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Збереження...';
        const newPoll = await service.createPoll(title, description, optionTexts);
        window.location.hash = `#/poll/${newPoll.id}`;
    });
}
function attachRemoveHandlers(onRemove, onUpdate) {
    document.querySelectorAll('.remove-option-btn').forEach((btn) => {
        btn.onclick = () => {
            btn.closest('.option-row')?.remove();
            onRemove();
            onUpdate();
        };
    });
}
function showError(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
}
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function voteSuffix(n) {
    if (n % 10 === 1 && n % 100 !== 11)
        return '';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100))
        return 'и';
    return 'ів';
}
