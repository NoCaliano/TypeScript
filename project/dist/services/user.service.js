const USER_ID_KEY = 'poll_app_user_id';
export class UserService {
    // Ініціалізація сервісу користувача
    constructor() {
        this.userId = this.initUserId();
    }
    // Створення або читання ID користувача
    initUserId() {
        const existing = sessionStorage.getItem(USER_ID_KEY);
        if (existing)
            return existing;
        const newId = crypto.randomUUID();
        sessionStorage.setItem(USER_ID_KEY, newId);
        return newId;
    }
    // Отримання ID користувача
    getUserId() {
        return this.userId;
    }
}
