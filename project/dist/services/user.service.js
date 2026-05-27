const USER_ID_KEY = 'poll_app_user_id';
export class UserService {
    constructor() {
        this.userId = this.initUserId();
    }
    initUserId() {
        const existing = sessionStorage.getItem(USER_ID_KEY);
        if (existing)
            return existing;
        const newId = crypto.randomUUID();
        sessionStorage.setItem(USER_ID_KEY, newId);
        return newId;
    }
    getUserId() {
        return this.userId;
    }
}
