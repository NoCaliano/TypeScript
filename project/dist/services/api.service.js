export class ApiService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }
    async get(path) {
        const response = await fetch(`${this.baseUrl}${path}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
}
