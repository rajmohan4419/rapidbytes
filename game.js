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
    // Consider appending to a specific controls div if it exists
    document.body.appendChild(resumeGameButton);
}

if (!newGameButton) {
    newGameButton = document.createElement('button');
    newGameButton.id = 'newGameButton';
    newGameButton.textContent = 'New Game';
    // Consider appending to a specific controls div if it exists
    document.body.appendChild(newGameButton);
}

// Game elements
let towers = [];
let enemies = [];
let projectiles = [];

// Game state
let score = 0;
let lives = 10; // Initial lives
let currency = 100; // Initial currency
let waveNumber = 0;
let isGameOver = false;
let waveInProgress = false;
let enemiesSpawnedThisWave = 0;
const WAVE_END_DELAY = 3000; // ms, delay before next wave

let isPaused = false;
let lastTime = 0;

// Constants for balancing - these can be tweaked
const ENEMY_BASE_HEALTH = 50;
const ENEMY_HEALTH_PER_WAVE = 10; // How much health enemies gain per wave
const ENEMY_BASE_SPEED = 75; // pixels per second
const ENEMY_SPEED_PER_WAVE = 5; // How much speed enemies gain per wave
const ENEMIES_PER_WAVE_BASE = 5; // Base number of enemies per wave
const ENEMIES_PER_WAVE_INCREMENT = 2; // How many more enemies spawn each wave

// --- Main Game Loop ---
function gameLoop(currentTime) {
    if (isPaused && !isGameOver) { // Keep rendering if game over but paused state
        requestAnimationFrame(gameLoop);
        return;
    }
    const deltaTime = (currentTime - (lastTime || currentTime)) / 1000; // Handle first frame
    lastTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isGameOver) {
        displayGameOver();
        return; // Stop further game logic if game over
    }

    handleEnemySpawning(deltaTime);

    // Update and Draw Towers
    for (let i = towers.length - 1; i >= 0; i--) {
        towers[i].update(deltaTime, enemies, projectiles);
        towers[i].draw(ctx);
    }

    // Update and Draw Enemies
    // Iterate backwards for safe removal
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(deltaTime); // Enemy updates its own state, including isDefeated
        if (!enemies[i].isDefeated) { // Only draw if not defeated
            enemies[i].draw(ctx);
        }
    }

    // Update and Draw Projectiles
    // Iterate backwards for safe removal
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(deltaTime);
        if (!projectiles[i].isMarkedForRemoval) { // Only draw if not marked for removal
            projectiles[i].draw(ctx);
        }
    }

    // Filter out defeated enemies and used projectiles
    enemies = enemies.filter(enemy => !enemy.isDefeated);
    projectiles = projectiles.filter(p => !p.isMarkedForRemoval);

    checkWaveCompletion();

    requestAnimationFrame(gameLoop);
}

function displayGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "48px monospace";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "24px monospace";
    ctx.fillStyle = "white";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    // Optionally, re-enable new game button or show other options
    startGameButton.disabled = false; // Or use newGameButton
    startGameButton.textContent = 'Play Again?';
}

function checkWaveCompletion() {
    if (waveInProgress && enemiesSpawnedThisWave >= getEnemiesThisWave() && enemies.length === 0 && !isGameOver) {
        waveInProgress = false;
        // Announce wave completion (optional visual feedback)
        console.log(`Wave ${waveNumber} Complete!`);
        // Award bonus currency for completing a wave (optional)
        currency += 50 + waveNumber * 10;
        document.getElementById('currencyDisplay').textContent = `Currency: ${currency}`;

        setTimeout(() => {
            if (!isGameOver) { // Check again in case game ended during timeout
                startNewWave();
            }
        }, WAVE_END_DELAY);
    }
}

function startNewWave() {
    if (isGameOver) return;
    waveNumber++;
    waveInProgress = true;
    enemiesSpawnedThisWave = 0;
    enemySpawnTimer = 0; // Reset spawn timer for the new wave
    console.log(`Starting Wave ${waveNumber}`);
    // Update UI for new wave (optional, if you have a wave display)
    // document.getElementById('waveDisplay').textContent = `Wave: ${waveNumber}`;
    updateGameInfoDisplays(); // Update all info displays
}

function resetGame() {
    towers = [];
    enemies = [];
    projectiles = [];
    score = 0;
    lives = 10; // Reset to initial
    currency = 100; // Reset to initial
    waveNumber = 0;
    isGameOver = false;
    waveInProgress = false;
    enemiesSpawnedThisWave = 0;
    isPaused = false; // Ensure game is not paused
    lastTime = performance.now(); // Reset time for deltaTime calculation

    updateGameInfoDisplays();

    // Re-enable start button, disable others if necessary
    startGameButton.disabled = false;
    startGameButton.textContent = 'Start Game';
    if (resumeGameButton) resumeGameButton.disabled = true;

    // It's common to start the first wave automatically or wait for user
    // For now, let's wait for "Start Game" button
    // requestAnimationFrame(gameLoop); // Start loop if not already running
}

function updateGameInfoDisplays() {
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('currencyDisplay').textContent = `Currency: ${currency}`;
    // document.getElementById('waveDisplay').textContent = `Wave: ${waveNumber}`; // If you add a wave display
}


let enemySpawnTimer = 0;
const ENEMY_SPAWN_INTERVAL = 1.0; // Time in seconds between spawns in a wave

function getEnemiesThisWave() {
    return ENEMIES_PER_WAVE_BASE + (waveNumber -1) * ENEMIES_PER_WAVE_INCREMENT;
}

function handleEnemySpawning(deltaTime) {
    if (!waveInProgress || isGameOver || enemiesSpawnedThisWave >= getEnemiesThisWave()) {
        return;
    }

    enemySpawnTimer -= deltaTime;
    if (enemySpawnTimer <= 0) {
        // Example path: enemies enter from left, move to right.
        // Path points are {x, y} coordinates.
        // For simplicity, let's make them enter from a random y on the left and exit right.
        const startY = Math.random() * (canvas.height - 40) + 20; // Random Y, keeping within canvas a bit
        const endY = Math.random() * (canvas.height - 40) + 20; // Can vary end Y for diverse paths

        // A simple path: from left edge to right edge.
        // For more complex paths, this array would have more points.
        const enemyPath = [
            { x: 0, y: startY }, // Start off-screen left
            { x: canvas.width, y: endY }  // Target off-screen right
        ];

        const health = ENEMY_BASE_HEALTH + (waveNumber - 1) * ENEMY_HEALTH_PER_WAVE;
        const speed = ENEMY_BASE_SPEED + (waveNumber - 1) * ENEMY_SPEED_PER_WAVE;

        enemies.push(new Enemy(enemyPath[0].x, enemyPath[0].y, health, speed, enemyPath));
        enemiesSpawnedThisWave++;
        enemySpawnTimer = ENEMY_SPAWN_INTERVAL; // Reset timer for next spawn
    }
}

// --- Event Listeners ---
canvas.addEventListener('click', (event) => {
    if (isGameOver || isPaused) return; // Don't place towers if game over or paused

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Example: Basic tower stats - these could be dynamic or selected by player
    const towerCost = 50;
    const attackDamage = 15;
    const range = 100; // pixels
    const fireRate = 1.5; // shots per second

    if (currency >= towerCost) {
        towers.push(new Tower(x, y, towerCost, attackDamage, range, fireRate));
        currency -= towerCost;
        updateGameInfoDisplays();
    } else {
        console.log("Not enough currency to place tower.");
        // Optionally, provide visual feedback to the user (e.g., shake currency display)
    }
});

startGameButton.addEventListener('click', () => {
    if (isGameOver) { // If game was over, this button acts as "Play Again"
        resetGame(); // Reset all game state
        // The first wave will be started by resetGame or needs a call here
        startNewWave();
        lastTime = performance.now(); // Important to reset time
        requestAnimationFrame(gameLoop); // Ensure loop is running
        startGameButton.textContent = 'Start Game'; // Change text back if needed
        startGameButton.disabled = true; // Disable after starting
        if(resumeGameButton) resumeGameButton.disabled = false;

    } else if (waveNumber === 0 && !waveInProgress) { // Initial start
        resetGame(); // Good practice to reset before first start too
        startNewWave();
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
        startGameButton.disabled = true;
        if(resumeGameButton) resumeGameButton.disabled = false;
    }
    isPaused = false; // Ensure game is not paused when starting/restarting
});


if (resumeGameButton) {
    resumeGameButton.addEventListener('click', () => {
        if (isGameOver) return;
        isPaused = !isPaused; // Toggle pause state
        if (!isPaused) {
            lastTime = performance.now(); // Reset lastTime to avoid large deltaTime jump
            requestAnimationFrame(gameLoop); // Resume game loop
            resumeGameButton.textContent = 'Pause Game';
        } else {
            resumeGameButton.textContent = 'Resume Game';
            // Optionally draw a pause screen
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = "30px monospace";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Paused", canvas.width/2, canvas.height/2);
        }
    });
}

if (newGameButton) {
    newGameButton.addEventListener('click', () => {
        isPaused = true; // Pause the current game
        // Optional: Add a confirmation dialog here (e.g., "Are you sure?")
        resetGame();
        // UI updates for new game
        startGameButton.disabled = false;
        startGameButton.textContent = 'Start Game';
        if(resumeGameButton) {
            resumeGameButton.disabled = true;
            resumeGameButton.textContent = 'Pause Game';
        }
        // Clear canvas or show a "Press Start Game" message
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "24px monospace";
        ctx.fillStyle = "#0f0";
        ctx.textAlign = "center";
        ctx.fillText("Press 'Start Game' to begin!", canvas.width/2, canvas.height/2);

    });
}

// Initial UI setup
document.addEventListener('DOMContentLoaded', () => {
    resetGame(); // Set initial values for displays
    if(resumeGameButton) resumeGameButton.disabled = true; // Disabled until game starts
    // Initial message on canvas
    ctx.font = "24px monospace";
    ctx.fillStyle = "#0f0"; // Theme color
    ctx.textAlign = "center";
    ctx.fillText("Welcome to ByteBlock!", canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText("Press 'Start Game' to begin.", canvas.width / 2, canvas.height / 2 + 10);
});

// --- Class Definitions ---

class Enemy {
    constructor(x, y, health, speed, path) {
        this.x = x;
        this.y = y;
        this.health = health;
        this.initialHealth = health; // Store initial health for health bar
        this.speed = speed;
        this.path = path; // An array of {x, y} points
        this.pathIndex = 0;
        this.width = 20; // Example size
        this.height = 20; // Example size
        this.isDefeated = false;
    }

    update(deltaTime) {
        if (this.isDefeated || this.pathIndex >= this.path.length) {
            // If already defeated or somehow past path end, do nothing.
            // If pathIndex is at length, it means it reached the last point,
            // so it should be handled by the distance check leading to pathIndex++
            return;
        }

        const targetPoint = this.path[this.pathIndex];
        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if close enough to the current target point
        if (distance < this.speed * deltaTime) {
            this.x = targetPoint.x;
            this.y = targetPoint.y;
            this.pathIndex++;

            // Check if this was the last point in the path
            if (this.pathIndex >= this.path.length) {
                this.isDefeated = true; // Mark as "defeated" for removal by game loop
                if (!isGameOver) { // Only decrement lives if game is not already over
                    lives--;
                    if (lives < 0) lives = 0;
                    updateGameInfoDisplays(); // Update display
                    if (lives === 0) {
                        isGameOver = true; // Set global game over flag
                    }
                }
            }
        } else {
            // Move towards the target point
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        }
    }

    draw(ctx) {
        // Main body of the enemy
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Health bar background
        ctx.fillStyle = '#555'; // Dark grey for background of health bar
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 7, this.width, 5);

        // Current health
        const healthPercentage = this.health / this.initialHealth;
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 7, this.width * healthPercentage, 5);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0 && !this.isDefeated) { // Ensure this only triggers once
            this.isDefeated = true;
            score += 10; // Example: add to score
            currency += 5; // Example: add to currency
            updateGameInfoDisplays(); // Update display
        }
    }
}

class Tower {
    constructor(x, y, cost, attackDamage, range, fireRate) {
        this.x = x;
        this.y = y;
        this.cost = cost;
        this.attackDamage = attackDamage;
        this.range = range; // pixels
        this.fireRate = fireRate; // shots per second
        this.cooldown = 0; // time until next shot, in seconds
        this.width = 30; // Example size
        this.height = 30; // Example size
    }

    update(deltaTime, enemies, projectiles) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }

        if (this.cooldown <= 0) {
            const target = this.findTarget(enemies);
            if (target) {
                this.shoot(target, projectiles);
                this.cooldown = 1 / this.fireRate; // Reset cooldown
            }
        }
    }

    findTarget(enemies) {
        let closestEnemy = null;
        let minDistanceSq = this.range * this.range; // Use squared distance for efficiency

        for (const enemy of enemies) {
            if (enemy.isDefeated) continue;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distanceSq = dx * dx + dy * dy; // Squared distance
            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestEnemy = enemy;
            }
        }
        return closestEnemy;
    }

    shoot(target, projectiles) {
        // Create a new projectile aimed at the target
        // Projectile speed can be a constant or a property of the tower/projectile type
        projectiles.push(new Projectile(this.x, this.y, target, this.attackDamage, 250)); // projectile speed 250
    }

    draw(ctx) {
        ctx.fillStyle = 'blue'; // Main tower color
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Optional: Draw range circle for debugging or when placing tower
        // ctx.beginPath();
        // ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        // ctx.strokeStyle = 'rgba(0, 0, 255, 0.2)'; // Light blue, semi-transparent
        // ctx.stroke();
    }
}

class Projectile {
    constructor(x, y, target, damage, speed) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed; // pixels per second
        this.width = 6; // Example size
        this.height = 6; // Example size
        this.isMarkedForRemoval = false;
    }

    update(deltaTime) {
        if (this.isMarkedForRemoval) return;

        // If target is already defeated (e.g., by another projectile), mark for removal
        if (this.target.isDefeated) {
            this.isMarkedForRemoval = true;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if projectile will reach or pass the target this frame
        if (distance < this.speed * deltaTime) {
            this.target.takeDamage(this.damage);
            this.isMarkedForRemoval = true;
        } else {
            // Move towards target
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        }
    }

    draw(ctx) {
        // No need to check isMarkedForRemoval here if gameLoop filters before drawing
        ctx.fillStyle = 'cyan';
        ctx.beginPath(); // Use beginPath for shapes like circles
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2); // Draw as a small circle
        ctx.fill();
    }
}

// Ensure startNewWave and other necessary functions are globally accessible if needed by older parts,
// or refactor to avoid global exposure if possible.
// window.startNewWave = startNewWave; // Example, if it were still needed globally.
// window.resetGame = resetGame; // Example
// window.togglePause = () => { isPaused = !isPaused; }; // Example for external control
