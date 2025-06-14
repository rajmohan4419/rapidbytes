// --- Updated JavaScript (game.js) ---

// Get DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const placeTowerButton = document.getElementById('placeTowerButton');
const startGameButton = document.getElementById('startGameButton');

// These buttons must exist in HTML or be created dynamically
let resumeGameButton = document.getElementById('resumeGameButton');
let newGameButton = document.getElementById('newGameButton');

if (!resumeGameButton) {
    resumeGameButton = document.createElement('button');
    resumeGameButton.id = 'resumeGameButton';
    resumeGameButton.textContent = 'Resume Game';
    document.body.appendChild(resumeGameButton);
}

if (!newGameButton) {
    newGameButton = document.createElement('button');
    newGameButton.id = 'newGameButton';
    newGameButton.textContent = 'New Game';
    document.body.appendChild(newGameButton);
}

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
    if (isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
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

    for (let i = towers.length - 1; i >= 0; i--) {
        towers[i].update(deltaTime, enemies, projectiles);
        towers[i].draw(ctx);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(deltaTime);
        if (!enemies[i].isDefeated) enemies[i].draw(ctx);
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(deltaTime);
        if (!projectiles[i].isMarkedForRemoval) projectiles[i].draw(ctx);
    }

    enemies = enemies.filter(enemy => !enemy.isDefeated);
    projectiles = projectiles.filter(p => !p.isMarkedForRemoval);

    if (waveInProgress && enemiesSpawnedThisWave === (waveNumber * 5) && enemies.length === 0) {
        waveInProgress = false;
        ctx.font = "30px Arial";
        ctx.fillStyle = "green";
        ctx.textAlign = "center";
        ctx.fillText(`Wave ${waveNumber} Complete!`, canvas.width / 2, canvas.height / 2 - 60);
        setTimeout(() => {
            if (!isGameOver) {
                startNewWave();
            }
        }, WAVE_END_DELAY);
    }

    requestAnimationFrame(gameLoop);
}

function startNewWave() {
    if (isGameOver) return;
    waveNumber++;
    waveInProgress = true;
    enemiesSpawnedThisWave = 0;
    enemySpawnTimer = 0;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('currencyDisplay').textContent = `Currency: ${currency}`;
}

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
    lastTime = performance.now();
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    document.getElementById('currencyDisplay').textContent = `Currency: ${currency}`;
    startNewWave();
    requestAnimationFrame(gameLoop);
}

let enemySpawnTimer = 0;
const ENEMY_SPAWN_INTERVAL = 0.75;
const ENEMY_BASE_HEALTH = 50;
const ENEMY_HEALTH_PER_WAVE = 10;
const ENEMY_BASE_SPEED = 75;
const ENEMY_SPEED_PER_WAVE = 5;

function handleEnemySpawning(deltaTime) {
    if (!waveInProgress || isGameOver || enemiesSpawnedThisWave >= (waveNumber * 5)) return;

    enemySpawnTimer -= deltaTime;
    if (enemySpawnTimer <= 0) {
        const startY = canvas.height / 3 + (Math.random() * canvas.height / 3 - canvas.height / 6);
        const enemyPath = [{x: -20, y: startY}, {x: canvas.width + 20, y: startY}];
        const health = ENEMY_BASE_HEALTH + (waveNumber - 1) * ENEMY_HEALTH_PER_WAVE;
        const speed = ENEMY_BASE_SPEED + (waveNumber - 1) * ENEMY_SPEED_PER_WAVE;
        enemies.push(new Enemy(enemyPath[0].x, enemyPath[0].y, health, speed, enemyPath));
        enemiesSpawnedThisWave++;
        enemySpawnTimer = ENEMY_SPAWN_INTERVAL;
    }
}

canvas.addEventListener('click', (event) => {
    if (isGameOver) return;
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
        resetGame();
        startGameButton.disabled = true;
    }
});

resumeGameButton.addEventListener('click', () => {
    isPaused = false;
});

newGameButton.addEventListener('click', () => {
    resetGame();
});

// Start loop paused
isPaused = true;
requestAnimationFrame(gameLoop);

// NOTE: Add Tower, Enemy, and Projectile classes after this section
// (or import if separated)
// Ensure startNewWave() is globally accessible
window.startNewWave = startNewWave;
