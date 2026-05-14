"use strict";
async function requestData(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }
    return response.json();
}
function showLoader() {
    const app = document.getElementById("content");
    app.innerHTML = `
        <div class="loader">
            <span class="loader-dot"></span>
            <span class="loader-dot"></span>
            <span class="loader-dot"></span>
        </div>
    `;
}
function showHomePage() {
    const app = document.getElementById("content");
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
    const openCatalogBtn = document.getElementById("open-catalog-btn");
    openCatalogBtn.addEventListener("click", () => {
        renderCatalog();
    });
}
async function renderCatalog() {
    showLoader();
    const app = document.getElementById("content");
    try {
        const categories = await requestData("data/categories.json");
        let markup = `
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
        const categoryButtons = document.querySelectorAll(".catalog-btn");
        categoryButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const shortname = button.dataset.category;
                openCategory(shortname);
            });
        });
        const specialButton = document.getElementById("special-btn");
        specialButton.addEventListener("click", () => {
            openRandomCategory();
        });
    }
    catch (error) {
        showError(app, error);
    }
}
async function openCategory(shortname) {
    showLoader();
    const app = document.getElementById("content");
    try {
        const categoryData = await requestData(`data/${shortname}.json`);
        let markup = `
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
        const backButton = document.getElementById("back-btn");
        backButton.addEventListener("click", () => {
            renderCatalog();
        });
    }
    catch (error) {
        showError(app, error);
    }
}
async function openRandomCategory() {
    try {
        const categories = await requestData("data/categories.json");
        const randomNumber = Math.floor(Math.random() * categories.length);
        const randomCategory = categories[randomNumber];
        openCategory(randomCategory.shortname);
    }
    catch (error) {
        const app = document.getElementById("content");
        showError(app, error);
    }
}
function createImage(shortname) {
    const backgrounds = {
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
    const color = backgrounds[shortname] ?? "334155/e2e8f0";
    return `https://placehold.co/180x180/${color}?text=${encodeURIComponent(shortname)}`;
}
function selectIcon(shortname) {
    const icons = {
        action: "🔥",
        rpg: "🗡️",
        strategy: "♟️",
        indie: "🎨"
    };
    return icons[shortname] ?? "🎮";
}
function formatCost(price) {
    return price.toLocaleString("uk-UA");
}
function showError(container, error) {
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
document.addEventListener("DOMContentLoaded", () => {
    const homeButton = document.getElementById("home-btn");
    const catalogButton = document.getElementById("catalog-btn");
    homeButton.addEventListener("click", () => {
        showHomePage();
    });
    catalogButton.addEventListener("click", () => {
        renderCatalog();
    });
    showHomePage();
});
//# sourceMappingURL=main.js.map