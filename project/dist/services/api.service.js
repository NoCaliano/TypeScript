export class ApiService {
    // Ініціалізація API-сервісу
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }
    // Завантаження JSON з API
    async get(path) {
        const response = await fetch(`${this.baseUrl}${path}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
}
