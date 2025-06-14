// Enhanced Tower Defense Game with Resume and New Game functionality

// Get DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const placeTowerButton = document.getElementById('placeTowerButton');
const startGameButton = document.getElementById('startGameButton');
const resumeGameButton = document.getElementById('resumeGameButton');
const newGameButton = document.getElementById('newGameButton');

// Game elements
let towers = [];
let enemies = [];
let projectiles = [];

// Game state
let score = 0;
let lives = 10;
let currency = 100;
let waveNumber = 0;
let isGameOver = false;
let waveInProgress = false;
let enemiesSpawnedThisWave = 0;
const WAVE_END_DELAY = 3000;
let isPaused = false;

let lastTime = 0;
function gameLoop(currentTime) {
    if (isPaused) return;

    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isGameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "48px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
        ctx.font = "24px Arial";
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
        return;
    }

    handleEnemySpawning(deltaTime);

    towers.forEach(t => {
        t.update(deltaTime, enemies, projectiles);
        t.draw(ctx);
    });

    enemies.forEach(e => {
        e.update(deltaTime);
        if (!e.isDefeated) e.draw(ctx);
    });

    projectiles.forEach(p => {
        p.update(deltaTime);
        if (!p.isMarkedForRemoval) p.draw(ctx);
    });

    enemies = enemies.filter(e => !e.isDefeated);
    projectiles = projectiles.filter(p => !p.isMarkedForRemoval);

    if (waveInProgress && enemiesSpawnedThisWave === waveNumber * 5 && enemies.length === 0) {
        waveInProgress = false;
        ctx.font = "30px Arial";
        ctx.fillStyle = "green";
        ctx.textAlign = "center";
        ctx.fillText(`Wave ${waveNumber} Complete!`, canvas.width / 2, canvas.height / 2 - 60);
        setTimeout(() => {
            if (!isGameOver) startNewWave();
        }, WAVE_END_DELAY);
    }

    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', (event) => {
    if (isGameOver || isPaused) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const towerCost = 50;
    if (currency >= towerCost) {
        towers.push(new Tower(x, y, towerCost, 10, 100, 1));
        currency -= towerCost;
        document.getElementById('currencyDisplay').textContent = `Currency: ${currency}`;
    } else {
        console.log("Not enough currency to place tower.");
    }
});

startGameButton.addEventListener('click', () => {
    if (!waveInProgress && waveNumber === 0 && !isGameOver) {
        startNewWave();
        startGameButton.disabled = true;
        startGameButton.style.backgroundColor = '#ccc';
        resumeGameButton.disabled = false;
        newGameButton.disabled = false;
    }
});

resumeGameButton.addEventListener('click', () => {
    if (!isGameOver) {
        isPaused = false;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
});

newGameButton.addEventListener('click', () => {
    resetGame();
});

function resetGame() {
    towers = [];
    enemies = [];
    projectiles = [];
    score = 0;
    lives = 10;
    currency = 100;
    waveNumber = 0;
    isGameOver = false;
    waveInProgress = false;
    enemiesSpawnedThisWave = 0;
    isPaused = false;
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    document.getElementById('currencyDisplay').textContent = `Currency: ${currency}`;
    startGameButton.disabled = false;
    startGameButton.style.backgroundColor = '';
    requestAnimationFrame(gameLoop);
}

// Maintain other game logic and class definitions as-is...

// Start the loop
requestAnimationFrame(gameLoop);
