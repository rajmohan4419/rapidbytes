// --- Global DOM Elements (ensure these are in firewall_frenzy.html) ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Buttons (ensure they exist in HTML)
// const placeTowerButton = document.getElementById('placeTowerButton'); // Old button, now replaced
const startGameButton = document.getElementById('startGameButton');
const resumeGameButton = document.getElementById('resumeGameButton');
const newGameButton = document.getElementById('newGameButton');

// --- Game Configuration & State ---
const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const WAVE_END_DELAY = 3000;
const ENEMY_SPAWN_INTERVAL = 0.7;

// --- Enemy Specifications ---
const ENEMY_SPECS = { /* ... (as defined before) ... */
    BUGLET: { name: "Buglet", baseHealth: 35, baseSpeed: 1.6, color: '#ADFF2F', widthModifier: 0.45, heightModifier: 0.45, points: 1, currencyDrop: 1 },
    TROJAN_BEAST: { name: "Trojan Beast", baseHealth: 220, baseSpeed: 0.9, color: '#8B0000', widthModifier: 0.75, heightModifier: 0.75, points: 5, currencyDrop: 3 }
};

// --- Tower Specifications ---
const TOWER_SPECS = { /* ... (as defined before) ... */
    PACKET_BLASTER: { name: "Packet Blaster", cost: 50, range: 100 * (CELL_SIZE / 20), fireRate: 5, color: '#00FFFF', projectile: { damage: 7, speed: 350 * (CELL_SIZE / 20), color: '#00FFFF', size: CELL_SIZE / 4 } },
    ENCRYPTOR_NODE: { name: "Encryptor Node", cost: 75, range: 70 * (CELL_SIZE / 20), fireRate: 0.8, color: '#FF00FF', effect: { type: 'slow', duration: 2.5, multiplier: 0.5, pulseColor: 'rgba(255, 0, 255, 0.3)' }  },
    ANTIVIRUS_CANNON: { name: "AntiVirus Cannon", cost: 125, range: 130 * (CELL_SIZE / 20), fireRate: 0.75, color: '#FFA500', projectile: { damage: 25, speed: 200 * (CELL_SIZE / 20), color: '#FFA500', size: CELL_SIZE / 3, splashRadius: 60 * (CELL_SIZE / 20), splashDamage: 12 } }
};
let selectedTowerType = 'PACKET_BLASTER'; // Default selected tower

// --- Path Definitions ---
const enemyPaths = { /* ... (as defined before) ... */
    north: [ { x: 300, y: 0 }, { x: 300, y: 120 }, { x: 270, y: 150 }, { x: 270, y: 240 }, { x: 300, y: 270 }, { x: 300, y: 290 } ],
    south: [ { x: 300, y: 600 }, { x: 300, y: 480 }, { x: 330, y: 450 }, { x: 330, y: 360 }, { x: 300, y: 330 }, { x: 300, y: 310 } ],
    east: [ { x: 600, y: 300 }, { x: 480, y: 300 }, { x: 450, y: 270 }, { x: 360, y: 270 }, { x: 330, y: 300 }, { x: 310, y: 300 } ],
    west: [ { x: 0, y: 300 }, { x: 120, y: 300 }, { x: 150, y: 330 }, { x: 240, y: 330 }, { x: 270, y: 300 }, { x: 290, y: 300 } ],
    northEastLoop: [ { x: 450, y: 0 }, { x: 450, y: 150 }, { x: 300, y: 150 }, { x: 300, y: 290 } ],
    southWestLoop: [ { x: 150, y: 600 }, { x: 150, y: 450 }, { x: 300, y: 450 }, { x: 300, y: 310 } ]
};

// --- Level Settings Generation ---
const MAX_LEVELS = 10;
let levelSettings = [];
const allPathKeys = Object.keys(enemyPaths);
// ... (levelSettings generation logic as defined and verified in previous step)
for (let i = 0; i < MAX_LEVELS; i++) {
    const currentLevelNum = i + 1;
    const numWavesForLevel = 2 + currentLevelNum;
    const waveCfgs = [];
    for (let j = 0; j < numWavesForLevel; j++) {
        const waveNumInLevel = j + 1;
        let typesForThisWave = [];
        const enemyCountThisWave = 3 + waveNumInLevel + Math.floor(currentLevelNum / 2);
        for(let k=0; k < enemyCountThisWave; k++) {
            if (currentLevelNum > 1 && (k % (5 - Math.min(2, Math.floor(currentLevelNum/2))) === 0) ) {
                 typesForThisWave.push('TROJAN_BEAST');
            } else {
                typesForThisWave.push('BUGLET');
            }
        }
        let pathsForThisWave = [enemyPaths[allPathKeys[(currentLevelNum + waveNumInLevel - 2) % allPathKeys.length]]];
        if (currentLevelNum > 2 && waveNumInLevel % 2 === 0 && allPathKeys.length > 1) {
            pathsForThisWave.push(enemyPaths[allPathKeys[(currentLevelNum + waveNumInLevel -1) % allPathKeys.length]]);
        }
        if (pathsForThisWave.length > 1 && pathsForThisWave[0] === pathsForThisWave[1]) {
            pathsForThisWave[1] = enemyPaths[allPathKeys[(currentLevelNum + waveNumInLevel) % allPathKeys.length]];
        }
        waveCfgs.push({ paths: pathsForThisWave, enemyTypes: typesForThisWave });
    }
    levelSettings.push({
        level: currentLevelNum, waves: waveCfgs.length,
        healthMultiplier: 1 + (i * 0.22), speedMultiplier: 1 + (i * 0.09), waveConfigs: waveCfgs
    });
}


// --- Game State Variables ---
let towers = [];
let enemies = [];
let projectiles = [];
let score = 0;
let lives = 10;
let currency = 200;
let waveNumber = 0;
let currentLevel = 1;
let isGameOver = false;
let gameWon = false;
let waveInProgress = false;
let enemiesSpawnedThisWave = 0;
let enemySpawnTimer = 0;
let enemySpawnCounterForPathSelection = 0;
let isPaused = false;
let lastTime = 0;

// --- Path Drawing Function ---
function drawPaths(ctx) { /* ... (as defined before) ... */
    ctx.save(); ctx.globalAlpha = 0.15; ctx.lineWidth = CELL_SIZE * 0.8;
    for (const pathName in enemyPaths) {
        const path = enemyPaths[pathName]; if (path.length === 0) continue; ctx.beginPath();
        if (pathName.includes("north")) ctx.strokeStyle = '#6688cc'; else if (pathName.includes("south")) ctx.strokeStyle = '#cc6666'; else if (pathName.includes("east")) ctx.strokeStyle = '#66cc66'; else if (pathName.includes("west")) ctx.strokeStyle = '#cccc66'; else ctx.strokeStyle = '#555';
        for (let i = 0; i < path.length; i++) { const point = path[i]; if (i === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); }
        ctx.stroke();
    } ctx.restore();
}

// --- Main Game Loop ---
function gameLoop(currentTime) { /* ... (as defined before) ... */
    if (isPaused && !isGameOver) { requestAnimationFrame(gameLoop); return; }
    const deltaTime = (currentTime - (lastTime || currentTime)) / 1000; lastTime = currentTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height); drawPaths(ctx);
    if (isGameOver) { displayGameOver(); return; }
    handleEnemySpawning(deltaTime);
    for (let i = towers.length - 1; i >= 0; i--) { towers[i].update(deltaTime, enemies, projectiles); towers[i].draw(ctx); }
    for (let i = enemies.length - 1; i >= 0; i--) { enemies[i].update(deltaTime); if (!enemies[i].isDefeated) enemies[i].draw(ctx); }
    for (let i = projectiles.length - 1; i >= 0; i--) { projectiles[i].update(deltaTime, enemies); if (!projectiles[i].isMarkedForRemoval) projectiles[i].draw(ctx); }
    enemies = enemies.filter(enemy => !enemy.isDefeated); projectiles = projectiles.filter(p => !p.isMarkedForRemoval);
    checkWaveCompletion(); requestAnimationFrame(gameLoop);
}

// --- Game State Management Functions ---
function displayGameOver() { /* ... (as defined before) ... */
    ctx.save(); ctx.fillStyle = "rgba(0, 0, 0, 0.75)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "48px monospace"; ctx.textAlign = "center";
    if (gameWon) { ctx.fillStyle = "gold"; ctx.fillText("YOU WON!", canvas.width / 2, canvas.height / 2 - 40); ctx.font = "24px monospace"; ctx.fillStyle = "white"; ctx.fillText("All levels cleared!", canvas.width / 2, canvas.height / 2); }
    else { ctx.fillStyle = "red"; ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20); }
    ctx.font = "24px monospace"; ctx.fillStyle = "white"; ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + (gameWon ? 40 : 30));
    if(startGameButton) { startGameButton.disabled = false; startGameButton.textContent = 'Play Again?'; }
    if (resumeGameButton) resumeGameButton.disabled = true;
    ctx.restore();
}

function getEnemiesThisWaveCount() { /* ... (as defined before) ... */
    if (currentLevel > MAX_LEVELS || waveNumber === 0 || currentLevel === 0) return 0;
    const currentLevelIndex = currentLevel - 1; const waveIndex = waveNumber - 1;
    if (!levelSettings[currentLevelIndex] || !levelSettings[currentLevelIndex].waveConfigs[waveIndex] || !levelSettings[currentLevelIndex].waveConfigs[waveIndex].enemyTypes) { console.error(`Incomplete wave config for Level ${currentLevel}, Wave ${waveNumber}`); return 0;  }
    return levelSettings[currentLevelIndex].waveConfigs[waveIndex].enemyTypes.length;
}

function checkWaveCompletion() { /* ... (as defined before) ... */
    const totalEnemiesInWave = getEnemiesThisWaveCount();
    if (waveInProgress && enemiesSpawnedThisWave >= totalEnemiesInWave && enemies.length === 0 && !isGameOver) {
        waveInProgress = false; console.log(`Level ${currentLevel} - Wave ${waveNumber} Complete!`); currency += 25 + waveNumber * 5 + currentLevel * 10;
        updateGameInfoDisplays();
        setTimeout(() => { if (!isGameOver) { startNewWave(); } }, WAVE_END_DELAY);
    }
}

function startNewWave() { /* ... (as defined before) ... */
    if (isGameOver) return; waveNumber++;
    const currentLevelIndex = currentLevel - 1;
    if (currentLevelIndex >= levelSettings.length) { console.error("Attempting to access level settings beyond MAX_LEVELS."); isGameOver = true; gameWon = true; displayGameOver(); return; }
    const levelConf = levelSettings[currentLevelIndex];
    if (waveNumber > levelConf.waveConfigs.length) {
        currentLevel++; waveNumber = 1; currency += 100 * (currentLevel - 1);
        console.log(`Level ${currentLevel -1} completed! Advancing to Level ${currentLevel}`);
        if (currentLevel > MAX_LEVELS) { isGameOver = true; gameWon = true; console.log("Congratulations! All levels cleared!"); updateGameInfoDisplays(); return; }
    }
    waveInProgress = true; enemiesSpawnedThisWave = 0; enemySpawnTimer = ENEMY_SPAWN_INTERVAL; enemySpawnCounterForPathSelection = 0;
    console.log(`Starting Level ${currentLevel} - Wave ${waveNumber}`); updateGameInfoDisplays();
}

function resetGame() {
    selectedTowerType = 'PACKET_BLASTER'; // Reset to default tower type
    towers = []; enemies = []; projectiles = []; score = 0; lives = 10; currency = 200;
    waveNumber = 0; currentLevel = 1;
    isGameOver = false; gameWon = false; waveInProgress = false; enemiesSpawnedThisWave = 0;
    enemySpawnCounterForPathSelection = 0; isPaused = false; lastTime = performance.now();
    updateGameInfoDisplays();
    if(startGameButton) { startGameButton.disabled = false; startGameButton.textContent = 'Start Game'; }
    if (resumeGameButton) resumeGameButton.disabled = true;
    if (newGameButton) newGameButton.disabled = false;
    ctx.clearRect(0,0,canvas.width, canvas.height); drawPaths(ctx);
    ctx.save(); ctx.font = "20px monospace"; ctx.fillStyle = "#0f0"; ctx.textAlign = "center";
    ctx.fillText("Press 'Start Game' to begin!", canvas.width/2, canvas.height/2);
    ctx.restore();
 }

function updateGameInfoDisplays() {
    const currentLevelIndex = currentLevel - 1;
    let totalWavesInLevelDisplay = 'N/A';
    if (currentLevelIndex >= 0 && currentLevelIndex < levelSettings.length && levelSettings[currentLevelIndex] && levelSettings[currentLevelIndex].waveConfigs) {
        totalWavesInLevelDisplay = levelSettings[currentLevelIndex].waveConfigs.length;
    }

    if(document.getElementById('livesDisplay')) document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    if(document.getElementById('scoreDisplay')) document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    if(document.getElementById('currencyDisplay')) document.getElementById('currencyDisplay').textContent = `Currency: ${currency}`;
    if(document.getElementById('levelDisplay')) document.getElementById('levelDisplay').textContent = `Level: ${currentLevel}`;
    if(document.getElementById('waveDisplay')) document.getElementById('waveDisplay').textContent = `Wave: ${waveNumber} / ${totalWavesInLevelDisplay}`;

    const towerSelectDisplayEl = document.getElementById('towerSelectDisplay'); // For potential future use
    if(towerSelectDisplayEl && TOWER_SPECS[selectedTowerType]) {
         towerSelectDisplayEl.textContent = `Selected: ${TOWER_SPECS[selectedTowerType].name}`;
    }
}

function handleEnemySpawning(deltaTime) { /* ... (as defined before, uses currentLevel and waveNumber) ... */
    const currentLevelIndex = currentLevel - 1; const waveIndex = waveNumber - 1;
    if (!waveInProgress || isGameOver || currentLevelIndex < 0 || currentLevelIndex >= levelSettings.length || waveIndex < 0 || !levelSettings[currentLevelIndex].waveConfigs || waveIndex >= levelSettings[currentLevelIndex].waveConfigs.length) { return; }
    const waveConfig = levelSettings[currentLevelIndex].waveConfigs[waveIndex]; const enemiesToSpawnThisWave = waveConfig.enemyTypes.length;
    if (enemiesSpawnedThisWave >= enemiesToSpawnThisWave) { return; }
    enemySpawnTimer -= deltaTime;
    if (enemySpawnTimer <= 0) {
        const enemyType = waveConfig.enemyTypes[enemiesSpawnedThisWave]; const availablePathsForWave = waveConfig.paths;
        if (!availablePathsForWave || availablePathsForWave.length === 0) { console.error(`No paths for L${currentLevel} W${waveNumber}`); waveInProgress = false; return; }
        const selectedPath = availablePathsForWave[enemySpawnCounterForPathSelection % availablePathsForWave.length]; enemySpawnCounterForPathSelection++;
        const startX = selectedPath[0].x; const startY = selectedPath[0].y;
        enemies.push(new Enemy(startX, startY, enemyType, selectedPath, currentLevel));
        enemiesSpawnedThisWave++; enemySpawnTimer = ENEMY_SPAWN_INTERVAL;
    }
}

// --- Event Listeners ---
if (canvas) {
    canvas.addEventListener('click', (event) => {
        if (isGameOver || isPaused) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const gridX = Math.floor(x / CELL_SIZE); // Grid column
        const gridY = Math.floor(y / CELL_SIZE); // Grid row

        if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) return; // Click outside grid

        if (selectedTowerType && TOWER_SPECS[selectedTowerType]) {
            const towerCost = TOWER_SPECS[selectedTowerType].cost;
            if (currency >= towerCost) {
                const existingTower = towers.find(t => t.gridX === gridX && t.gridY === gridY);
                if (!existingTower) {
                    towers.push(new Tower(gridX, gridY, selectedTowerType));
                    currency -= towerCost;
                    updateGameInfoDisplays();
                } else {
                    console.log("Cell occupied by another tower!");
                }
            } else {
                console.log("Not enough currency for:", TOWER_SPECS[selectedTowerType].name);
            }
        }
    });
}

// Initialize Tower Selection Button Listeners
function initializeTowerSelection() {
    const towerButtons = document.querySelectorAll('.tower-select-button');
    towerButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectedTowerType = button.getAttribute('data-tower-type');
            towerButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            console.log("Selected tower:", TOWER_SPECS[selectedTowerType].name);
            updateGameInfoDisplays(); // Update if towerSelectDisplay is used
        });
        // Optional: Update button text with dynamic cost - already hardcoded in HTML for this task
        // const type = button.getAttribute('data-tower-type');
        // if (TOWER_SPECS[type]) {
        //    button.textContent = `${TOWER_SPECS[type].name} (${TOWER_SPECS[type].cost})`;
        // }
    });
     // Set initial active button based on default selectedTowerType
    const initialActiveButton = document.querySelector(`.tower-select-button[data-tower-type="${selectedTowerType}"]`);
    if (initialActiveButton) {
        initialActiveButton.classList.add('active');
    }
}


if (startGameButton) { /* ... (logic largely same, ensure resetGame and startNewWave are effective) ... */
    startGameButton.addEventListener('click', () => {
        if (isGameOver) { resetGame(); }
        if (waveNumber === 0 && !waveInProgress) { resetGame(); }
        isPaused = false;
        startNewWave();
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
        startGameButton.disabled = true;
        if (resumeGameButton) { resumeGameButton.disabled = false; resumeGameButton.textContent = 'Pause Game';}
    });
}
if (resumeGameButton) { /* ... (no change) ... */
    resumeGameButton.addEventListener('click', () => {
        if (isGameOver) return; isPaused = !isPaused;
        if (!isPaused) { lastTime = performance.now(); requestAnimationFrame(gameLoop); resumeGameButton.textContent = 'Pause Game'; }
        else { resumeGameButton.textContent = 'Resume Game'; ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.font="30px monospace"; ctx.fillStyle="white"; ctx.textAlign="center"; ctx.fillText("Paused",canvas.width/2,canvas.height/2); ctx.restore(); }
    });
}
if (newGameButton) { /* ... (no change) ... */
    newGameButton.addEventListener('click', () => { isPaused = true; resetGame(); });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!canvas) { console.error("Canvas not found! Game cannot start."); return; }
    initializeTowerSelection(); // Setup tower select button listeners
    resetGame();
    if (resumeGameButton) resumeGameButton.disabled = true;
});

// --- Class Definitions ---
class Enemy { /* ... (constructor uses currentLevelContext) ... */
    constructor(x, y, type, pathObject, currentLevelContext) {
        this.type = type; const specs = ENEMY_SPECS[type];
        if (!specs) { console.error("Unknown enemy type:", type); const fallbackSpecs = ENEMY_SPECS['BUGLET']; this.name = fallbackSpecs.name; this.maxHealth = fallbackSpecs.baseHealth; this.baseSpeed = fallbackSpecs.baseSpeed * CELL_SIZE; this.color = fallbackSpecs.color; this.width = CELL_SIZE * fallbackSpecs.widthModifier; this.height = CELL_SIZE * fallbackSpecs.heightModifier; this.points = fallbackSpecs.points; this.currencyDrop = fallbackSpecs.currencyDrop; }
        else { const levelConf = levelSettings[currentLevelContext - 1]; this.name = specs.name; this.maxHealth = specs.baseHealth * (levelConf.healthMultiplier || 1); this.baseSpeed = specs.baseSpeed * CELL_SIZE * (levelConf.speedMultiplier || 1); this.color = specs.color; this.width = CELL_SIZE * specs.widthModifier; this.height = CELL_SIZE * specs.heightModifier; this.points = specs.points; this.currencyDrop = specs.currencyDrop || 0; }
        this.health = this.maxHealth; this.currentSpeed = this.baseSpeed;
        this.path = pathObject; this.pathIndex = 0; this.x = x; this.y = y; this.isDefeated = false; this.effects = {};
    }
    applyEffect(effectName, effectData) { this.effects[effectName] = { ...effectData, active: true }; }
    removeEffect(effectName) { delete this.effects[effectName]; }
    update(deltaTime) { /* ... (as defined before) ... */
        if (this.isDefeated) return; this.currentSpeed = this.baseSpeed;
        for (const effectName in this.effects) { const effect = this.effects[effectName]; if (effect.active) { if (effect.duration > 0) { if (effect.type === 'slow') { this.currentSpeed *= effect.multiplier; } effect.duration -= deltaTime; } else { this.removeEffect(effectName); } } }
        if (this.pathIndex >= this.path.length) { this.isDefeated = true; if (!isGameOver) { lives--; if (lives < 0) lives = 0; updateGameInfoDisplays(); if (lives === 0) { isGameOver = true; gameWon = false; } } return; }
        const targetPoint = this.path[this.pathIndex]; const dx = targetPoint.x - this.x; const dy = targetPoint.y - this.y; const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.currentSpeed * deltaTime * 1.1) { this.x = targetPoint.x; this.y = targetPoint.y; this.pathIndex++; if (this.pathIndex >= this.path.length) { this.isDefeated = true; if (!isGameOver) { lives--; if (lives < 0) lives = 0; updateGameInfoDisplays(); if (lives === 0) { isGameOver = true; gameWon = false; } } } }
        else { this.x += (dx / distance) * this.currentSpeed * deltaTime; this.y += (dy / distance) * this.currentSpeed * deltaTime; }
    }
    draw(ctx) { /* ... (as defined before) ... */
        ctx.save(); if (this.effects.slow && this.effects.slow.active) { ctx.fillStyle = 'rgba(100, 100, 255, 0.8)'; } else { ctx.fillStyle = this.color; }
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        const healthBarWidth = this.width; const healthBarHeight = 5; const healthBarX = this.x - healthBarWidth / 2; const healthBarY = this.y - this.height / 2 - healthBarHeight - 3;
        ctx.fillStyle = '#333'; ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        const healthPercentage = Math.max(0, this.health / this.maxHealth); ctx.fillStyle = 'lime'; ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
        ctx.restore();
    }
    takeDamage(amount) { /* ... (as defined before) ... */
        this.health -= amount; if (this.health <= 0 && !this.isDefeated) { this.isDefeated = true; score += this.points; currency += this.currencyDrop; updateGameInfoDisplays(); }
    }
}

class Tower {
    constructor(gridX, gridY, type) { // Changed signature
        this.gridX = gridX;
        this.gridY = gridY;
        this.x = gridX * CELL_SIZE + CELL_SIZE / 2; // Calculate canvas X
        this.y = gridY * CELL_SIZE + CELL_SIZE / 2; // Calculate canvas Y
        this.type = type;
        const specs = TOWER_SPECS[type];

        this.name = specs.name;
        this.cost = specs.cost;
        this.range = specs.range;
        this.fireRate = specs.fireRate;
        this.color = specs.color;
        this.cooldown = 0;

        this.projectileSpecs = specs.projectile;
        this.effectSpecs = specs.effect;

        this.width = CELL_SIZE * 0.9;
        this.height = CELL_SIZE * 0.9;
        this.auraPulseTime = 0;
    }
    update(deltaTime, enemies, projectiles) { /* ... (as defined before) ... */
        if (this.cooldown > 0) { this.cooldown -= deltaTime; } if (this.auraPulseTime > 0) this.auraPulseTime -= deltaTime;
        if (this.type === 'ENCRYPTOR_NODE') { if (this.cooldown <= 0 && this.effectSpecs) { let affectedCount = 0; for (const enemy of enemies) { if (enemy.isDefeated) continue; const dx = enemy.x - this.x; const dy = enemy.y - this.y; const distanceSq = dx * dx + dy * dy; if (distanceSq < this.range * this.range) { enemy.applyEffect(this.effectSpecs.type, { ...this.effectSpecs }); affectedCount++; } } if (affectedCount > 0) { this.cooldown = 1 / this.fireRate; this.auraPulseTime = 0.3; } else { this.cooldown = 0.2; } } }
        else { if (this.cooldown <= 0 && this.projectileSpecs) { const target = this.findTarget(enemies); if (target) { this.shoot(target, projectiles); this.cooldown = 1 / this.fireRate; } } }
    }
    findTarget(enemies) { /* ... (as defined before) ... */
        let closestEnemy = null; let minDistanceSq = this.range * this.range;
        for (const enemy of enemies) { if (enemy.isDefeated) continue; const dx = enemy.x - this.x; const dy = enemy.y - this.y; const distanceSq = dx * dx + dy * dy; if (distanceSq < minDistanceSq) { minDistanceSq = distanceSq; closestEnemy = enemy; } }
        return closestEnemy;
    }
    shoot(target, projectiles) { /* ... (as defined before) ... */
        if (!this.projectileSpecs) return; projectiles.push(new Projectile(this.x, this.y, target, this.projectileSpecs));
    }
    draw(ctx) { /* ... (as defined before) ... */
        ctx.save(); ctx.fillStyle = this.color; ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2); ctx.stroke();
        if (this.type === 'ENCRYPTOR_NODE' && this.auraPulseTime > 0 && this.effectSpecs) { const pulseProgress = 1 - (this.auraPulseTime / 0.3); ctx.fillStyle = this.effectSpecs.pulseColor; ctx.beginPath(); ctx.arc(this.x, this.y, this.range * pulseProgress, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
    }
}
class Projectile { /* ... (as defined before) ... */
    constructor(x, y, target, specs) {
        this.x = x; this.y = y; this.target = target;
        this.damage = specs.damage; this.speed = specs.speed; this.color = specs.color; this.size = specs.size || CELL_SIZE / 5;
        this.splashRadius = specs.splashRadius || 0; this.splashDamage = specs.splashDamage || 0;
        this.isMarkedForRemoval = false;
    }
    update(deltaTime, enemies) {
        if (this.isMarkedForRemoval) return; if (this.target.isDefeated && this.target.health <=0 ) { this.isMarkedForRemoval = true; return; }
        const dx = this.target.x - this.x; const dy = this.target.y - this.y; const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.speed * deltaTime || distance < this.size / 2) {
            this.target.takeDamage(this.damage);
            if (this.splashRadius > 0) { for (const enemy of enemies) { if (enemy === this.target || enemy.isDefeated) continue; const distToSplashVictimSq = (enemy.x - this.target.x) * (enemy.x - this.target.x) + (enemy.y - this.target.y) * (enemy.y - this.target.y); if (distToSplashVictimSq < this.splashRadius * this.splashRadius) { enemy.takeDamage(this.splashDamage); } } }
            this.isMarkedForRemoval = true;
        } else { this.x += (dx / distance) * this.speed * deltaTime; this.y += (dy / distance) * this.speed * deltaTime; }
    }
    draw(ctx) {
        ctx.save(); ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
}
