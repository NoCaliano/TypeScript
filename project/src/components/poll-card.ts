import type { Poll } from '../models/poll.js';

export function renderPollCard(poll: Poll, questionCount: number = 0): string {
  const date: string = new Date(poll.createdAt).toLocaleDateString('uk-UA');

  return `
    <article class="poll-card reveal-card">
      <div class="poll-card__meta">
        <span class="pill">Опитування</span>
        <span class="poll-card__date">${date}</span>
        ${questionCount > 0 ? `<span class="poll-card__count">${questionCount} питань</span>` : ''}
      </div>
      <h3 class="poll-card__title">${escapeHtml(poll.title)}</h3>
      <p class="poll-card__description">${escapeHtml(poll.description)}</p>
      <div class="poll-card__actions">
        <a href="#/poll/${poll.id}" class="poll-card__action poll-card__action--primary">Голосувати</a>
        <a href="#/results/${poll.id}" class="poll-card__action poll-card__action--secondary">Результати</a>
      </div>
    </article>
  `;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
