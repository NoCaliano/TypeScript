import type { Option } from '../models/option.js';
import type { Poll } from '../models/poll.js';
import type { Question } from '../models/question.js';
import type { Vote } from '../models/vote.js';
import { ApiService } from './api.service.js';
import { UserService } from './user.service.js';

const VOTES_KEY = 'poll_app_votes';
const POLLS_KEY = 'poll_app_polls';
const QUESTIONS_KEY = 'poll_app_questions';
const OPTIONS_KEY = 'poll_app_options';

interface PollQuestionDraft {
  text: string;
  options: string[];
}

interface LegacyOption {
  id: number;
  pollId: number;
  questionId?: number;
  text: string;
}

interface LegacyVote {
  id: number;
  pollId: number;
  questionId?: number;
  optionId: number;
  votedAt: string;
}

export class PollService {
  private api: ApiService;
  private userService: UserService;

  // Ініціалізація сервісу опитувань
  constructor() {
    this.api = new ApiService('./data');
    this.userService = new UserService();
  }

  // Отримання списку опитувань
  async getPolls(): Promise<Poll[]> {
    const stored = localStorage.getItem(POLLS_KEY);
    if (stored) {
      return JSON.parse(stored) as Poll[];
    }

    const polls = await this.api.get<Poll[]>('/polls.json');
    localStorage.setItem(POLLS_KEY, JSON.stringify(polls));
    return polls;
  }

  // Отримання опитування за ID
  async getPollById(id: number): Promise<Poll | undefined> {
    const polls = await this.getPolls();
    return polls.find((poll: Poll) => poll.id === id);
  }

  // Отримання всіх питань
  async getQuestions(): Promise<Question[]> {
    const { questions } = await this.ensureSurveyData();
    return questions;
  }

  // Отримання питань конкретного опитування
  async getQuestionsByPollId(pollId: number): Promise<Question[]> {
    const questions = await this.getQuestions();
    return questions.filter((question: Question) => question.pollId === pollId);
  }

  // Отримання всіх варіантів відповідей
  async getOptions(): Promise<Option[]> {
    const { options } = await this.ensureSurveyData();
    return options;
  }

  // Отримання варіантів відповідей для опитування
  async getOptionsByPollId(pollId: number): Promise<Option[]> {
    const options = await this.getOptions();
    return options.filter((option: Option) => option.pollId === pollId);
  }

  // Створення нового опитування
  async createPoll(
    title: string,
    description: string,
    questionsInput: PollQuestionDraft[]
  ): Promise<Poll> {
    const polls = await this.getPolls();
    const { questions, options } = await this.ensureSurveyData();

    const newPollId = polls.length > 0 ? Math.max(...polls.map((poll: Poll) => poll.id)) + 1 : 1;
    const nextQuestionId = questions.reduce(
      (maxId: number, question: Question) => Math.max(maxId, question.id),
      0
    );
    const nextOptionId = options.reduce(
      (maxId: number, option: Option) => Math.max(maxId, option.id),
      0
    );

    const newPoll: Poll = {
      id: newPollId,
      title,
      description,
      createdAt: new Date().toISOString(),
    };

    const newQuestions: Question[] = questionsInput.map(
      (question: PollQuestionDraft, index: number) => ({
        id: nextQuestionId + index + 1,
        pollId: newPollId,
        text: question.text,
      })
    );

    const newOptions: Option[] = questionsInput.flatMap(
      (question: PollQuestionDraft, questionIndex: number) =>
        question.options.map((text: string, optionIndex: number) => ({
          id:
            nextOptionId +
            questionsInput
              .slice(0, questionIndex)
              .reduce((count: number, item: PollQuestionDraft) => count + item.options.length, 0) +
            optionIndex +
            1,
          pollId: newPollId,
          questionId: newQuestions[questionIndex].id,
          text,
        }))
    );

    localStorage.setItem(POLLS_KEY, JSON.stringify([...polls, newPoll]));
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify([...questions, ...newQuestions]));
    localStorage.setItem(OPTIONS_KEY, JSON.stringify([...options, ...newOptions]));

    return newPoll;
  }

  // Отримання всіх голосів
  getVotes(): Vote[] {
    const stored = localStorage.getItem(VOTES_KEY);
    if (!stored) {
      return [];
    }

    const votes = JSON.parse(stored) as LegacyVote[];
    const optionsStored = localStorage.getItem(OPTIONS_KEY);
    if (!optionsStored) {
      return votes as Vote[];
    }

    const options = JSON.parse(optionsStored) as LegacyOption[];
    const questionIdByOptionId = new Map<number, number>(
      options
        .filter((option: LegacyOption) => typeof option.questionId === 'number')
        .map((option: LegacyOption) => [option.id, option.questionId as number])
    );

    let changed = false;

    const normalizedVotes = votes.map((vote: LegacyVote) => {
      const questionId = vote.questionId ?? questionIdByOptionId.get(vote.optionId);
      if (!questionId) {
        return vote as Vote;
      }

      if (vote.questionId === questionId) {
        return vote as Vote;
      }

      changed = true;
      return { ...vote, questionId };
    }) as Vote[];

    if (changed) {
      localStorage.setItem(VOTES_KEY, JSON.stringify(normalizedVotes));
    }

    return normalizedVotes;
  }

  // Отримання голосів конкретного опитування
  getVotesByPollId(pollId: number): Vote[] {
    return this.getVotes().filter((vote: Vote) => vote.pollId === pollId);
  }

  // Збереження відповідей користувача
  castVotes(
    pollId: number,
    answers: Array<{ questionId: number; optionId: number }>
  ): Vote[] {
    const votes = this.getVotes();
    const nextId = votes.length > 0 ? Math.max(...votes.map((vote: Vote) => vote.id)) + 1 : 1;

    const newVotes: Vote[] = answers.map((answer, index) => ({
      id: nextId + index,
      pollId,
      questionId: answer.questionId,
      optionId: answer.optionId,
      votedAt: new Date().toISOString(),
    }));

    localStorage.setItem(VOTES_KEY, JSON.stringify([...votes, ...newVotes]));
    return newVotes;
  }

  // Перевірка факту голосування
  hasVoted(pollId: number): boolean {
    const userId = this.userService.getUserId();
    const key = `voted_${pollId}_${userId}`;
    return localStorage.getItem(key) === 'true';
  }

  // Позначення завершеного голосування
  markVoted(pollId: number): void {
    const userId = this.userService.getUserId();
    const key = `voted_${pollId}_${userId}`;
    localStorage.setItem(key, 'true');
  }

  // Нормалізація seed-даних опитувань
  private async ensureSurveyData(): Promise<{
    questions: Question[];
    options: Option[];
  }> {
    const polls = await this.getPolls();
    let questions = await this.loadQuestions();
    const legacyOptions = await this.loadOptions();
    let changed = false;

    let nextQuestionId = questions.reduce(
      (maxId: number, question: Question) => Math.max(maxId, question.id),
      0
    );

    for (const poll of polls) {
      const hasQuestion = questions.some((question: Question) => question.pollId === poll.id);
      if (!hasQuestion) {
        questions = [
          ...questions,
          {
            id: ++nextQuestionId,
            pollId: poll.id,
            text: poll.title,
          },
        ];
        changed = true;
      }
    }

    const primaryQuestionByPoll = new Map<number, number>();
    for (const question of questions.sort((a, b) => a.id - b.id)) {
      if (!primaryQuestionByPoll.has(question.pollId)) {
        primaryQuestionByPoll.set(question.pollId, question.id);
      }
    }

    const normalizedOptions = legacyOptions.map((option: LegacyOption) => {
      const questionId = option.questionId ?? primaryQuestionByPoll.get(option.pollId);
      if (!questionId || option.questionId === questionId) {
        return option as Option;
      }

      changed = true;
      return { ...option, questionId };
    }) as Option[];

    questions = [...questions].sort((a, b) => a.id - b.id);
    const options = [...normalizedOptions].sort((a, b) => a.id - b.id);

    if (changed) {
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
      localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
    }

    return { questions, options };
  }

  // Завантаження питань із кешу або файлу
  private async loadQuestions(): Promise<Question[]> {
    const stored = localStorage.getItem(QUESTIONS_KEY);
    if (stored) {
      return JSON.parse(stored) as Question[];
    }

    try {
      const questions = await this.api.get<Question[]>('/questions.json');
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
      return questions;
    } catch {
      return [];
    }
  }

  // Завантаження варіантів із кешу або файлу
  private async loadOptions(): Promise<LegacyOption[]> {
    const stored = localStorage.getItem(OPTIONS_KEY);
    if (stored) {
      return JSON.parse(stored) as LegacyOption[];
    }

    const options = await this.api.get<LegacyOption[]>('/options.json');
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
    return options;
  }
}
