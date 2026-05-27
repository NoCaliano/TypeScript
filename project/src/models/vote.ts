export interface Vote {
  id: number;
  pollId: number;
  questionId: number;
  optionId: number;
  votedAt: string;
}
