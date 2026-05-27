import { ApiService } from './api.service.js';
import { UserService } from './user.service.js';
const VOTES_KEY = 'poll_app_votes';
const POLLS_KEY = 'poll_app_polls';
const OPTIONS_KEY = 'poll_app_options';
export class PollService {
    constructor() {
        this.api = new ApiService('./data');
        this.userService = new UserService();
    }
    // ─── Polls ────────────────────────────────────────────────────────────────
    async getPolls() {
        const stored = localStorage.getItem(POLLS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        const polls = await this.api.get('/polls.json');
        localStorage.setItem(POLLS_KEY, JSON.stringify(polls));
        return polls;
    }
    async getPollById(id) {
        const polls = await this.getPolls();
        return polls.find((p) => p.id === id);
    }
    async createPoll(title, description, optionTexts) {
        const polls = await this.getPolls();
        const options = await this.getOptions();
        const newId = polls.length > 0 ? Math.max(...polls.map((p) => p.id)) + 1 : 1;
        const newPoll = {
            id: newId,
            title,
            description,
            createdAt: new Date().toISOString(),
        };
        const maxOptionId = options.length > 0 ? Math.max(...options.map((o) => o.id)) : 0;
        const newOptions = optionTexts.map((text, idx) => ({
            id: maxOptionId + idx + 1,
            pollId: newId,
            text,
        }));
        localStorage.setItem(POLLS_KEY, JSON.stringify([...polls, newPoll]));
        localStorage.setItem(OPTIONS_KEY, JSON.stringify([...options, ...newOptions]));
        return newPoll;
    }
    // ─── Options ──────────────────────────────────────────────────────────────
    async getOptions() {
        const stored = localStorage.getItem(OPTIONS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        const options = await this.api.get('/options.json');
        localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
        return options;
    }
    async getOptionsByPollId(pollId) {
        const options = await this.getOptions();
        return options.filter((o) => o.pollId === pollId);
    }
    // ─── Votes ────────────────────────────────────────────────────────────────
    getVotes() {
        const stored = localStorage.getItem(VOTES_KEY);
        return stored ? JSON.parse(stored) : [];
    }
    getVotesByPollId(pollId) {
        return this.getVotes().filter((v) => v.pollId === pollId);
    }
    castVote(pollId, optionId) {
        const votes = this.getVotes();
        const newVote = {
            id: votes.length > 0 ? Math.max(...votes.map((v) => v.id)) + 1 : 1,
            pollId,
            optionId,
            votedAt: new Date().toISOString(),
        };
        localStorage.setItem(VOTES_KEY, JSON.stringify([...votes, newVote]));
        return newVote;
    }
    hasVoted(pollId) {
        const userId = this.userService.getUserId();
        const key = `voted_${pollId}_${userId}`;
        return localStorage.getItem(key) === 'true';
    }
    markVoted(pollId) {
        const userId = this.userService.getUserId();
        const key = `voted_${pollId}_${userId}`;
        localStorage.setItem(key, 'true');
    }
}
