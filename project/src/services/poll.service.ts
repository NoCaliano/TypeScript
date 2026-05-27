import type { Poll } from '../models/poll.js';
import type { Option } from '../models/option.js';
import type { Vote } from '../models/vote.js';
import { ApiService } from './api.service.js';
import { UserService } from './user.service.js';

const VOTES_KEY = 'poll_app_votes';
const POLLS_KEY = 'poll_app_polls';
const OPTIONS_KEY = 'poll_app_options';

export class PollService {
  private api: ApiService;
  private userService: UserService;

  constructor() {
    this.api = new ApiService('./data');
    this.userService = new UserService();
  }

  // ─── Polls ────────────────────────────────────────────────────────────────

  async getPolls(): Promise<Poll[]> {
    const stored = localStorage.getItem(POLLS_KEY);
    if (stored) {
      return JSON.parse(stored) as Poll[];
    }
    const polls = await this.api.get<Poll[]>('/polls.json');
    localStorage.setItem(POLLS_KEY, JSON.stringify(polls));
    return polls;
  }

  async getPollById(id: number): Promise<Poll | undefined> {
    const polls = await this.getPolls();
    return polls.find((p: Poll) => p.id === id);
  }

  async createPoll(title: string, description: string, optionTexts: string[]): Promise<Poll> {
    const polls = await this.getPolls();
    const options = await this.getOptions();

    const newId: number = polls.length > 0 ? Math.max(...polls.map((p: Poll) => p.id)) + 1 : 1;
    const newPoll: Poll = {
      id: newId,
      title,
      description,
      createdAt: new Date().toISOString(),
    };

    const maxOptionId: number =
      options.length > 0 ? Math.max(...options.map((o: Option) => o.id)) : 0;

    const newOptions: Option[] = optionTexts.map((text: string, idx: number) => ({
      id: maxOptionId + idx + 1,
      pollId: newId,
      text,
    }));

    localStorage.setItem(POLLS_KEY, JSON.stringify([...polls, newPoll]));
    localStorage.setItem(OPTIONS_KEY, JSON.stringify([...options, ...newOptions]));

    return newPoll;
  }

  // ─── Options ──────────────────────────────────────────────────────────────

  async getOptions(): Promise<Option[]> {
    const stored = localStorage.getItem(OPTIONS_KEY);
    if (stored) {
      return JSON.parse(stored) as Option[];
    }
    const options = await this.api.get<Option[]>('/options.json');
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
    return options;
  }

  async getOptionsByPollId(pollId: number): Promise<Option[]> {
    const options = await this.getOptions();
    return options.filter((o: Option) => o.pollId === pollId);
  }

  // ─── Votes ────────────────────────────────────────────────────────────────

  getVotes(): Vote[] {
    const stored = localStorage.getItem(VOTES_KEY);
    return stored ? (JSON.parse(stored) as Vote[]) : [];
  }

  getVotesByPollId(pollId: number): Vote[] {
    return this.getVotes().filter((v: Vote) => v.pollId === pollId);
  }

  castVote(pollId: number, optionId: number): Vote {
    const votes: Vote[] = this.getVotes();
    const newVote: Vote = {
      id: votes.length > 0 ? Math.max(...votes.map((v: Vote) => v.id)) + 1 : 1,
      pollId,
      optionId,
      votedAt: new Date().toISOString(),
    };
    localStorage.setItem(VOTES_KEY, JSON.stringify([...votes, newVote]));
    return newVote;
  }

  hasVoted(pollId: number): boolean {
    const userId: string = this.userService.getUserId();
    const key = `voted_${pollId}_${userId}`;
    return localStorage.getItem(key) === 'true';
  }

  markVoted(pollId: number): void {
    const userId: string = this.userService.getUserId();
    const key = `voted_${pollId}_${userId}`;
    localStorage.setItem(key, 'true');
  }
}