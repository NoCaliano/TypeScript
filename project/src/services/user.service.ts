const USER_ID_KEY = 'poll_app_user_id';

export class UserService {
  private userId: string;

  constructor() {
    this.userId = this.initUserId();
  }

  private initUserId(): string {
    const existing = sessionStorage.getItem(USER_ID_KEY);
    if (existing) return existing;

    const newId: string = crypto.randomUUID();
    sessionStorage.setItem(USER_ID_KEY, newId);
    return newId;
  }

  getUserId(): string {
    return this.userId;
  }
}