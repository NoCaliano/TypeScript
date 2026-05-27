import { initRouter } from './router.js';
const SEED_VERSION_KEY = 'poll_app_seed_version';
const CURRENT_SEED_VERSION = '2026-05-28-multi-question-seeds';
document.addEventListener('DOMContentLoaded', () => {
    syncSeedVersion();
    initRouter();
});
function syncSeedVersion() {
    const storedVersion = localStorage.getItem(SEED_VERSION_KEY);
    if (storedVersion === CURRENT_SEED_VERSION) {
        return;
    }
    localStorage.removeItem('poll_app_polls');
    localStorage.removeItem('poll_app_questions');
    localStorage.removeItem('poll_app_options');
    localStorage.removeItem('poll_app_votes');
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);
        if (key?.startsWith('voted_')) {
            localStorage.removeItem(key);
        }
    }
    localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
}
