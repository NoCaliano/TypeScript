interface CatalogItem {
    id: number;
    name: string;
    shortname: string;
    notes: string;
}

interface GameCard {
    id: number;
    name: string;
    shortname: string;
    description: string;
    price: number;
}

interface GamesResponse {
    categoryName: string;
    items: GameCard[];
}

async function requestData<T>(path: string): Promise<T> {
    const response: Response = await fetch(path);

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    return response.json() as Promise<T>;
}

function showLoader(): void {
    const app: HTMLDivElement = document.getElementById("content") as HTMLDivElement;

    app.innerHTML = `
        <div class="loader">
            <span class="loader-dot"></span>
            <span class="loader-dot"></span>
            <span class="loader-dot"></span>
        </div>
    `;
}

function showHomePage(): void {
    const app: HTMLDivElement = document.getElementById("content") as HTMLDivElement;

    app.innerHTML = `
        <section class="hero-section">
            <div class="hero-content">
                <h1 class="hero-title">
                    Welcome to <span class="accent-text">GameZone</span>
                </h1>

                <p class="hero-description">
                    Explore popular games from different genres:
                    action, RPG, strategy and indie projects.
                </p>

                <button class="hero-button" id="open-catalog-btn">
                    Open catalog →
                </button>
            </div>

            <div class="hero-icon">
                🎮
            </div>
        </section>
    `;

    const openCatalogBtn: HTMLButtonElement =
        document.getElementById("open-catalog-btn") as HTMLButtonElement;

    openCatalogBtn.addEventListener("click", (): void => {
        renderCatalog();
    });
}

async function renderCatalog(): Promise<void> {
    showLoader();

    const app: HTMLDivElement = document.getElementById("content") as HTMLDivElement;

    try {

        const categories: CatalogItem[] =
            await requestData<CatalogItem[]>("data/categories.json");

        let markup: string = `
            <section class="catalog-wrapper">
                <h2 class="catalog-title">
                    Games catalog
                </h2>

                <div class="catalog-grid">
        `;

        for (const category of categories) {

            markup += `
                <article class="catalog-card">

                    <div class="catalog-icon">
                        ${selectIcon(category.shortname)}
                    </div>

                    <h3 class="catalog-name">
                        ${category.name}
                    </h3>

                    <p class="catalog-notes">
                        ${category.notes}
                    </p>

                    <button
                        class="catalog-btn"
                        data-category="${category.shortname}"
                    >
                        Show games
                    </button>

                </article>
            `;
        }

        markup += `
                </div>

                <div class="special-box" id="special-btn">
                    <span class="special-icon">⭐</span>

                    <div>
                        <strong>Specials</strong>
                        <p>Open random category</p>
                    </div>
                </div>

            </section>
        `;

        app.innerHTML = markup;

        const categoryButtons: NodeListOf<HTMLButtonElement> =
            document.querySelectorAll(".catalog-btn");

        categoryButtons.forEach((button: HTMLButtonElement): void => {

            button.addEventListener("click", (): void => {

                const shortname: string =
                    button.dataset.category as string;

                openCategory(shortname);
            });
        });

        const specialButton: HTMLDivElement =
            document.getElementById("special-btn") as HTMLDivElement;

        specialButton.addEventListener("click", (): void => {
            openRandomCategory();
        });

    } catch (error) {

        showError(app, error as Error);
    }
}

async function openCategory(shortname: string): Promise<void> {
    showLoader();

    const app: HTMLDivElement = document.getElementById("content") as HTMLDivElement;

    try {

        const categoryData: GamesResponse =
            await requestData<GamesResponse>(`data/${shortname}.json`);

        let markup: string = `
            <section class="games-section">

                <button class="back-button" id="back-btn">
                    ← Back to catalog
                </button>

                <h2 class="games-title">
                    ${categoryData.categoryName}
                </h2>

                <div class="games-grid">
        `;

        for (const game of categoryData.items) {

            markup += `
                <article class="game-card">

                    <img
                        src="${createImage(game.shortname)}"
                        alt="${game.name}"
                        class="game-image"
                        width="180"
                        height="180"
                    />

                    <div class="game-info">

                        <h3 class="game-name">
                            ${game.name}
                        </h3>

                        <p class="game-description">
                            ${game.description}
                        </p>

                        <div class="game-footer">

                            <span class="game-price">
                                ${formatCost(game.price)} ₴
                            </span>

                            <button class="buy-button">
                                Buy
                            </button>

                        </div>

                    </div>

                </article>
            `;
        }

        markup += `
                </div>
            </section>
        `;

        app.innerHTML = markup;

        const backButton: HTMLButtonElement =
            document.getElementById("back-btn") as HTMLButtonElement;

        backButton.addEventListener("click", (): void => {
            renderCatalog();
        });

    } catch (error) {

        showError(app, error as Error);
    }
}

async function openRandomCategory(): Promise<void> {

    try {

        const categories: CatalogItem[] =
            await requestData<CatalogItem[]>("data/categories.json");

        const randomNumber: number =
            Math.floor(Math.random() * categories.length);

        const randomCategory: CatalogItem =
            categories[randomNumber];

        openCategory(randomCategory.shortname);

    } catch (error) {

        const app: HTMLDivElement =
            document.getElementById("content") as HTMLDivElement;

        showError(app, error as Error);
    }
}

function createImage(shortname: string): string {

    const backgrounds: Record<string, string> = {

        "cyber-strike": "0f172a/38bdf8",
        "shadow-ops": "1e293b/e2e8f0",
        "street-racer-x": "7c2d12/f97316",
        "warzone-elite": "3f3f46/facc15",

        "kingdom-legends": "14532d/86efac",
        "eternal-souls": "3b0764/c084fc",
        "mystic-journey": "1d4ed8/bfdbfe",
        "dragon-realm": "7f1d1d/fca5a5",

        "empire-builder": "78350f/fcd34d",
        "battle-command": "374151/d1d5db",
        "space-colonies": "0c4a6e/67e8f9",
        "chess-master-ai": "27272a/f4f4f5",

        "pixel-adventure": "4c1d95/c4b5fd",
        "dream-forest": "166534/bbf7d0",
        "tiny-factory": "525252/e5e5e5",
        "lost-signal": "111827/93c5fd"
    };

    const color: string =
        backgrounds[shortname] ?? "334155/e2e8f0";

    return `https://placehold.co/180x180/${color}?text=${encodeURIComponent(shortname)}`;
}

function selectIcon(shortname: string): string {

    const icons: Record<string, string> = {
        action: "🔥",
        rpg: "🗡️",
        strategy: "♟️",
        indie: "🎨"
    };

    return icons[shortname] ?? "🎮";
}

function formatCost(price: number): string {
    return price.toLocaleString("uk-UA");
}

function showError(container: HTMLElement, error: Error): void {

    container.innerHTML = `
        <div class="error-message">

            <span class="error-symbol">
                ⚠️
            </span>

            <p>
                Failed to load data
            </p>

            <code>
                ${error.message}
            </code>

        </div>
    `;
}

document.addEventListener("DOMContentLoaded", (): void => {

    const homeButton: HTMLButtonElement =
        document.getElementById("home-btn") as HTMLButtonElement;

    const catalogButton: HTMLButtonElement =
        document.getElementById("catalog-btn") as HTMLButtonElement;

    homeButton.addEventListener("click", (): void => {
        showHomePage();
    });

    catalogButton.addEventListener("click", (): void => {
        renderCatalog();
    });

    showHomePage();
});