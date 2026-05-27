export class ApiService {
  private baseUrl: string;

  // Ініціалізація API-сервісу
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  // Завантаження JSON з API
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }
}
