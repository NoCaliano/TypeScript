import { ApiService } from './api.service.js';
import { UserService } from './user.service.js';
const VOTES_KEY = 'poll_app_votes';
const POLLS_KEY = 'poll_app_polls';
const QUESTIONS_KEY = 'poll_app_questions';
const OPTIONS_KEY = 'poll_app_options';
export class PollService {
    // Ініціалізація сервісу опитувань
    constructor() {
        this.api = new ApiService('./data');
        this.userService = new UserService();
    }
    // Отримання списку опитувань
    async getPolls() {
        const stored = localStorage.getItem(POLLS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        const polls = await this.api.get('/polls.json');
        localStorage.setItem(POLLS_KEY, JSON.stringify(polls));
        return polls;
    }
    // Отримання опитування за ID
    async getPollById(id) {
        const polls = await this.getPolls();
        return polls.find((poll) => poll.id === id);
    }
    // Отримання всіх питань
    async getQuestions() {
        const { questions } = await this.ensureSurveyData();
        return questions;
    }
    // Отримання питань конкретного опитування
    async getQuestionsByPollId(pollId) {
        const questions = await this.getQuestions();
        return questions.filter((question) => question.pollId === pollId);
    }
    // Отримання всіх варіантів відповідей
    async getOptions() {
        const { options } = await this.ensureSurveyData();
        return options;
    }
    // Отримання варіантів відповідей для опитування
    async getOptionsByPollId(pollId) {
        const options = await this.getOptions();
        return options.filter((option) => option.pollId === pollId);
    }
    // Створення нового опитування
    async createPoll(title, description, questionsInput) {
        const polls = await this.getPolls();
        const { questions, options } = await this.ensureSurveyData();
        const newPollId = polls.length > 0 ? Math.max(...polls.map((poll) => poll.id)) + 1 : 1;
        const nextQuestionId = questions.reduce((maxId, question) => Math.max(maxId, question.id), 0);
        const nextOptionId = options.reduce((maxId, option) => Math.max(maxId, option.id), 0);
        const newPoll = {
            id: newPollId,
            title,
            description,
            createdAt: new Date().toISOString(),
        };
        const newQuestions = questionsInput.map((question, index) => ({
            id: nextQuestionId + index + 1,
            pollId: newPollId,
            text: question.text,
        }));
        const newOptions = questionsInput.flatMap((question, questionIndex) => question.options.map((text, optionIndex) => ({
            id: nextOptionId +
                questionsInput
                    .slice(0, questionIndex)
                    .reduce((count, item) => count + item.options.length, 0) +
                optionIndex +
                1,
            pollId: newPollId,
            questionId: newQuestions[questionIndex].id,
            text,
        })));
        localStorage.setItem(POLLS_KEY, JSON.stringify([...polls, newPoll]));
        localStorage.setItem(QUESTIONS_KEY, JSON.stringify([...questions, ...newQuestions]));
        localStorage.setItem(OPTIONS_KEY, JSON.stringify([...options, ...newOptions]));
        return newPoll;
    }
    // Отримання всіх голосів
    getVotes() {
        const stored = localStorage.getItem(VOTES_KEY);
        if (!stored) {
            return [];
        }
        const votes = JSON.parse(stored);
        const optionsStored = localStorage.getItem(OPTIONS_KEY);
        if (!optionsStored) {
            return votes;
        }
        const options = JSON.parse(optionsStored);
        const questionIdByOptionId = new Map(options
            .filter((option) => typeof option.questionId === 'number')
            .map((option) => [option.id, option.questionId]));
        let changed = false;
        const normalizedVotes = votes.map((vote) => {
            const questionId = vote.questionId ?? questionIdByOptionId.get(vote.optionId);
            if (!questionId) {
                return vote;
            }
            if (vote.questionId === questionId) {
                return vote;
            }
            changed = true;
            return { ...vote, questionId };
        });
        if (changed) {
            localStorage.setItem(VOTES_KEY, JSON.stringify(normalizedVotes));
        }
        return normalizedVotes;
    }
    // Отримання голосів конкретного опитування
    getVotesByPollId(pollId) {
        return this.getVotes().filter((vote) => vote.pollId === pollId);
    }
    // Збереження відповідей користувача
    castVotes(pollId, answers) {
        const votes = this.getVotes();
        const nextId = votes.length > 0 ? Math.max(...votes.map((vote) => vote.id)) + 1 : 1;
        const newVotes = answers.map((answer, index) => ({
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
    hasVoted(pollId) {
        const userId = this.userService.getUserId();
        const key = `voted_${pollId}_${userId}`;
        return localStorage.getItem(key) === 'true';
    }
    // Позначення завершеного голосування
    markVoted(pollId) {
        const userId = this.userService.getUserId();
        const key = `voted_${pollId}_${userId}`;
        localStorage.setItem(key, 'true');
    }
    // Нормалізація seed-даних опитувань
    async ensureSurveyData() {
        const polls = await this.getPolls();
        let questions = await this.loadQuestions();
        const legacyOptions = await this.loadOptions();
        let changed = false;
        let nextQuestionId = questions.reduce((maxId, question) => Math.max(maxId, question.id), 0);
        for (const poll of polls) {
            const hasQuestion = questions.some((question) => question.pollId === poll.id);
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
        const primaryQuestionByPoll = new Map();
        for (const question of questions.sort((a, b) => a.id - b.id)) {
            if (!primaryQuestionByPoll.has(question.pollId)) {
                primaryQuestionByPoll.set(question.pollId, question.id);
            }
        }
        const normalizedOptions = legacyOptions.map((option) => {
            const questionId = option.questionId ?? primaryQuestionByPoll.get(option.pollId);
            if (!questionId || option.questionId === questionId) {
                return option;
            }
            changed = true;
            return { ...option, questionId };
        });
        questions = [...questions].sort((a, b) => a.id - b.id);
        const options = [...normalizedOptions].sort((a, b) => a.id - b.id);
        if (changed) {
            localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
            localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
        }
        return { questions, options };
    }
    // Завантаження питань із кешу або файлу
    async loadQuestions() {
        const stored = localStorage.getItem(QUESTIONS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        try {
            const questions = await this.api.get('/questions.json');
            localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
            return questions;
        }
        catch {
            return [];
        }
    }
    // Завантаження варіантів із кешу або файлу
    async loadOptions() {
        const stored = localStorage.getItem(OPTIONS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        const options = await this.api.get('/options.json');
        localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
        return options;
    }
}
