// --- Global DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startGameButton = document.getElementById('startGameButton');
const resumeGameButton = document.getElementById('resumeGameButton');
const newGameButton = document.getElementById('newGameButton');
const soundFire = document.getElementById('soundFire');
const soundKilled = document.getElementById('soundKilled');
const soundLevelFinished = document.getElementById('soundLevelFinished');
const soundGameWon = document.getElementById('soundGameWon');
const soundGameOver = document.getElementById('soundGameOver');
// Tower Info Panel Elements (will be accessed after DOMContentLoaded)
let towerInfoPanel, infoTowerName, infoTowerLevel, infoTowerStat1, infoTowerStat2, infoTowerStat3, infoTowerSpecial, upgradeTowerButton, closeTowerInfoButton;


// --- Game Configuration & State ---
const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const WAVE_END_DELAY = 3000;
const ENEMY_SPAWN_INTERVAL = 0.6; // Slightly faster spawn

// --- Enemy Specifications ---
const ENEMY_SPECS = {
    BUGLET: { name: "Buglet", baseHealth: 35, baseSpeed: 1.6, color: '#ADFF2F', widthModifier: 0.45, heightModifier: 0.45, points: 1, currencyDrop: 1, attackDamage: 5, attackRate: 1},
    TROJAN_BEAST: { name: "Trojan Beast", baseHealth: 220, baseSpeed: 0.9, color: '#8B0000', widthModifier: 0.75, heightModifier: 0.75, points: 5, currencyDrop: 3, attackDamage: 15, attackRate: 0.5 },
    SPAM_SWARM: { name: "Spam Swarm", baseHealth: 60, baseSpeed: 1.3, color: '#FF69B4', widthModifier: 0.5, heightModifier: 0.5, points: 2, currencyDrop: 1, special: 'accuracyDebuff', debuffRadius: CELL_SIZE * 2.5, accuracyReduction: 0.3 },
    CRYPTO_LOCKER: { name: "CryptoLocker", baseHealth: 150, baseSpeed: 0.7, color: '#4B0082', widthModifier: 0.6, heightModifier: 0.6, points: 8, currencyDrop: 5, special: 'towerDisable', disableRange: CELL_SIZE * 0.8, disableDuration: 5 }
};

// --- Tower Specifications ---
const TOWER_SPECS = {
    PACKET_BLASTER: {
        name: "Packet Blaster", cost: 50, range: 100 * (CELL_SIZE / 20), fireRate: 5, color: '#00FFFF',
        projectile: { damage: 8, speed: 350 * (CELL_SIZE / 20), color: '#00FFFF', size: CELL_SIZE / 4 },
        upgrades: [
            { cost: 75, projectile: { damage: 14 }, fireRate: 5.5, range: 115 * (CELL_SIZE/20) },
            { cost: 125, projectile: { damage: 22 }, fireRate: 6.0, range: 130 * (CELL_SIZE/20) }
        ]
    },
    ENCRYPTOR_NODE: {
        name: "Encryptor Node", cost: 75, range: 70 * (CELL_SIZE / 20), fireRate: 0.8, color: '#FF00FF',
        effect: { type: 'slow', duration: 2.5, multiplier: 0.5, pulseColor: 'rgba(255, 0, 255, 0.3)' },
        upgrades: [
            { cost: 100, effect: { duration: 3.0, multiplier: 0.45 }, range: 80 * (CELL_SIZE/20) },
            { cost: 150, effect: { duration: 3.5, multiplier: 0.40 }, range: 90 * (CELL_SIZE/20) }
        ]
    },
    ANTIVIRUS_CANNON: {
        name: "AntiVirus Cannon", cost: 125, range: 130 * (CELL_SIZE / 20), fireRate: 0.75, color: '#FFA500',
        projectile: { damage: 25, speed: 200 * (CELL_SIZE / 20), color: '#FFA500', size: CELL_SIZE / 3, splashRadius: 60 * (CELL_SIZE / 20), splashDamage: 12 },
        upgrades: [
            { cost: 150, projectile: { damage: 35, splashDamage: 18, splashRadius: 65 * (CELL_SIZE/20) }, fireRate: 0.85 },
            { cost: 225, projectile: { damage: 50, splashDamage: 25, splashRadius: 70 * (CELL_SIZE/20) }, fireRate: 1.0 }
        ]
    },
    ML_SNIPER: {
        name: "ML Sniper", cost: 175, range: 250 * (CELL_SIZE / 20), fireRate: 0.6, color: '#8A2BE2',
        projectile: { damage: 60, speed: 450 * (CELL_SIZE / 20), color: '#9370DB' },
        special: 'learning', bonusDamageMultiplier: 1.5,
        upgrades: [
            { cost: 200, projectile: { damage: 80 }, bonusDamageMultiplier: 1.75, range: 270 * (CELL_SIZE/20) },
            { cost: 300, projectile: { damage: 110 }, bonusDamageMultiplier: 2.0, fireRate: 0.7 }
        ]
    },
    FIREWALL_WALL: {
        name: "Firewall Wall", cost: 40, health: 300, duration: 25,
        isBlocker: true, color: '#A9A9A9', widthModifier: 1.0, heightModifier: 1.0,
        upgrades: [
            { cost: 50, health: 450, duration: 35 },
            { cost: 75, health: 650, duration: 45 }
        ]
    }
};
let selectedTowerType = 'PACKET_BLASTER';
let selectedTowerInstance = null;

// --- Path Definitions & Level Settings ---
const enemyPaths = { /* ... (as defined before) ... */ north:[{x:300,y:0},{x:300,y:120},{x:270,y:150},{x:270,y:240},{x:300,y:270},{x:300,y:290}],south:[{x:300,y:600},{x:300,y:480},{x:330,y:450},{x:330,y:360},{x:300,y:330},{x:300,y:310}],east:[{x:600,y:300},{x:480,y:300},{x:450,y:270},{x:360,y:270},{x:330,y:300},{x:310,y:300}],west:[{x:0,y:300},{x:120,y:300},{x:150,y:330},{x:240,y:330},{x:270,y:300},{x:290,y:300}],northEastLoop:[{x:450,y:0},{x:450,y:150},{x:300,y:150},{x:300,y:290}],southWestLoop:[{x:150,y:600},{x:150,y:450},{x:300,y:450},{x:300,y:310}]};
const MAX_LEVELS = 10;
let levelSettings = [];
const allPathKeys = Object.keys(enemyPaths);

for (let i = 0; i < MAX_LEVELS; i++) {
    const currentLevelNum = i + 1;
    const numWavesForLevel = 2 + currentLevelNum;
    const waveCfgs = [];

    // Determine paths for THIS level (refined)
    let pathsForThisEntireLevel = [];
    if (allPathKeys.length > 0) {
        const path1Key = allPathKeys[i % allPathKeys.length];
        pathsForThisEntireLevel.push(enemyPaths[path1Key]);

        if (allPathKeys.length > 1) {
            let path2KeyIndex = (i + 1) % allPathKeys.length;
            // Ensure the second path is different from the first if possible
            if (allPathKeys[path2KeyIndex] === path1Key) {
                path2KeyIndex = (i + 2) % allPathKeys.length;
            }
            // If still same (e.g., only 1 unique path, or 2 paths and indices wrapped around to be same)
            // we push it anyway. If it's the same path object, enemy spawning logic will handle it.
            // If different paths were available and path2KeyIndex is now different, we get two distinct paths.
            if (allPathKeys[path2KeyIndex]) { // Check if the key exists
                 pathsForThisEntireLevel.push(enemyPaths[allPathKeys[path2KeyIndex]]);
            } else if (allPathKeys.length > 0) { // Fallback if path2KeyIndex is somehow invalid but keys exist
                 pathsForThisEntireLevel.push(enemyPaths[allPathKeys[0]]); // Push first path again
            }
        } else {
            // If only one path definition, use it for the second "slot" as well
            pathsForThisEntireLevel.push(enemyPaths[path1Key]);
        }
    }

    if (pathsForThisEntireLevel.length === 0 && allPathKeys.length > 0) {
        // This case should ideally not be reached if allPathKeys.length > 0
        // but as a fallback, populate with the first available path to prevent empty paths array.
        console.warn("Warning: pathsForThisEntireLevel was empty but allPathKeys was not. Defaulting to first path.");
        pathsForThisEntireLevel.push(enemyPaths[allPathKeys[0]]);
        pathsForThisEntireLevel.push(enemyPaths[allPathKeys[0]]);
    } else if (allPathKeys.length === 0) {
         console.error("CRITICAL: allPathKeys is empty. No paths available for level generation.");
         // Consider adding a default dummy path:
         // pathsForThisEntireLevel.push([{x:0,y:canvas.height/2},{x:canvas.width,y:canvas.height/2}]);
         // pathsForThisEntireLevel.push([{x:0,y:canvas.height/2},{x:canvas.width,y:canvas.height/2}]);
    }


    for (let j = 0; j < numWavesForLevel; j++) {
        const waveNumInLevel = j + 1; // already exists
        let typesForThisWave = []; // already exists
        const enemyCountThisWave = 3 + waveNumInLevel + Math.floor(currentLevelNum / 2) + i; // Gradual increase
        for(let k=0; k < enemyCountThisWave; k++) {
            if (currentLevelNum >= 4 && k % (6 - Math.min(3, Math.floor(currentLevelNum/2))) === 0) typesForThisWave.push('CRYPTO_LOCKER');
            else if (currentLevelNum >= 3 && k % (5 - Math.min(2, Math.floor(currentLevelNum/2))) === 0) typesForThisWave.push('SPAM_SWARM');
            else if (currentLevelNum >= 2 && k % (4 - Math.min(2, Math.floor(currentLevelNum/3))) === 0) typesForThisWave.push('TROJAN_BEAST');
            else typesForThisWave.push('BUGLET');
        }

        let pathsForThisWave = pathsForThisEntireLevel; // Use the paths determined for the entire level

        waveCfgs.push({ paths: pathsForThisWave, enemyTypes: typesForThisWave });
    }
    levelSettings.push({ level: currentLevelNum, waves: waveCfgs.length, healthMultiplier: 1 + (i * 0.23), speedMultiplier: 1 + (i * 0.10), waveConfigs: waveCfgs });
}

// --- Game State Variables ---
let towers = []; let enemies = []; let projectiles = [];
let score = 0; let lives = 10; let currency = 200;
let waveNumber = 0; let currentLevel = 1;
let isGameOver = false; let gameWon = false; let waveInProgress = false;
let enemiesSpawnedThisWave = 0; let enemySpawnTimer = 0; let enemySpawnCounterForPathSelection = 0;
let isPaused = false; let lastTime = 0; let placementGrid = [];

// --- Sound Helper Function ---
function playSound(soundElement) {
    if (soundElement && typeof soundElement.play === 'function') {
        soundElement.currentTime = 0; // Rewind to the start
        soundElement.play().catch(error => console.error("Error playing sound:", error));
    } else {
        console.warn("Sound element not found or not playable:", soundElement);
    }
}

// --- Grid, Path, Drawing, and Core Game Logic ---
function initializePlacementGrid() { /* ... (no change) ... */ placementGrid=Array(GRID_SIZE).fill(null).map(()=>Array(GRID_SIZE).fill(true));for(const pathName in enemyPaths){const path=enemyPaths[pathName];for(let i=0;i<path.length;i++){const p1=path[i];const p1GridX=Math.floor(p1.x/CELL_SIZE);const p1GridY=Math.floor(p1.y/CELL_SIZE);if(p1GridX>=0&&p1GridX<GRID_SIZE&&p1GridY>=0&&p1GridY<GRID_SIZE){placementGrid[p1GridY][p1GridX]=false;}if(i<path.length-1){const p2=path[i+1];const dx=p2.x-p1.x;const dy=p2.y-p1.y;const steps=Math.max(Math.abs(dx),Math.abs(dy))/(CELL_SIZE/4);for(let step=0;step<=steps;step++){const x=p1.x+(dx/steps)*step;const y=p1.y+(dy/steps)*step;const gridX=Math.floor(x/CELL_SIZE);const gridY=Math.floor(y/CELL_SIZE);if(gridX>=0&&gridX<GRID_SIZE&&gridY>=0&&gridY<GRID_SIZE){placementGrid[gridY][gridX]=false;}}}}}}
function drawGrid(ctx) { /* ... (no change) ... */ for(let r=0;r<GRID_SIZE;r++){for(let c=0;c<GRID_SIZE;c++){if(placementGrid[r]&&placementGrid[r][c]===false){ctx.fillStyle='#1B1B1B';}else if(placementGrid[r]&&placementGrid[r][c]===true){ctx.fillStyle='#2A2A2A';}else{ctx.fillStyle='#222222';}ctx.fillRect(c*CELL_SIZE,r*CELL_SIZE,CELL_SIZE,CELL_SIZE);ctx.strokeStyle='#333333';ctx.strokeRect(c*CELL_SIZE,r*CELL_SIZE,CELL_SIZE,CELL_SIZE);}}}
function drawPaths(ctx) { /* ... (no change) ... */ ctx.save();ctx.globalAlpha=0.25;ctx.lineWidth=CELL_SIZE*0.7;for(const pathName in enemyPaths){const path=enemyPaths[pathName];if(path.length===0)continue;ctx.beginPath();if(pathName.includes("north"))ctx.strokeStyle='#7799dd';else if(pathName.includes("south"))ctx.strokeStyle='#dd7777';else if(pathName.includes("east"))ctx.strokeStyle='#77dd77';else if(pathName.includes("west"))ctx.strokeStyle='#dddd77';else ctx.strokeStyle='#666';for(let i=0;i<path.length;i++){const point=path[i];if(i===0)ctx.moveTo(point.x,point.y);else ctx.lineTo(point.x,point.y);}ctx.stroke();}ctx.restore();}

function drawPathIndicators(ctx) {
    if (isGameOver) return; // Don't draw if game is over

    let pathsToIndicate;
    const currentLevelIdx = currentLevel - 1; // 0-indexed

    if (currentLevelIdx < 0 || currentLevelIdx >= levelSettings.length) return;

    const currentLvlSettings = levelSettings[currentLevelIdx];
    if (!currentLvlSettings || !currentLvlSettings.waveConfigs) return;

    if (waveInProgress) {
        // Only show indicators when wave is NOT in progress to avoid clutter.
        return;
    } else {
        // Wave is NOT in progress.
        // waveNumber is the number of completed waves in the current level (1-based for UI display, but effectively 0-indexed for next wave access here as it's post-increment or 0 if level just started)
        // Or, if checkWaveCompletion just ran, waveNumber is the wave that just FINISHED.
        // startNewWave increments waveNumber for the *new* wave.
        // So, if !waveInProgress, waveNumber refers to the wave that *just ended* or 0 if the level just started.
        // The next wave to be configured by startNewWave (if called) would be based on this current waveNumber.

        let levelConfigToUse = currentLvlSettings;
        let waveIndexInConfig = waveNumber; // If waveNumber is 0 (start of level), this is the 0th config.
                                          // If waveNumber is 1 (after wave 1 ends), this is 1st config (for wave 2).

        if (waveNumber >= currentLvlSettings.waveConfigs.length) { // All waves of current level done
            const nextLevelActual = currentLevel + 1; // e.g. currentLevel 1 becomes 2
            if (nextLevelActual > MAX_LEVELS) { return; /* Game won */ }

            const nextLevelConfigIndex = currentLevel; // currentLevel is 1-based, so currentLevel is next 0-based index for levelSettings
            if (nextLevelConfigIndex < levelSettings.length) {
                levelConfigToUse = levelSettings[nextLevelConfigIndex];
                waveIndexInConfig = 0; // First wave of next level
            } else { return; /* Should be game won or error */ }
        }

        if (!levelConfigToUse || !levelConfigToUse.waveConfigs || waveIndexInConfig < 0 || waveIndexInConfig >= levelConfigToUse.waveConfigs.length) {
            return; // No valid config found
        }
        pathsToIndicate = levelConfigToUse.waveConfigs[waveIndexInConfig].paths;
    }

    if (!pathsToIndicate || pathsToIndicate.length === 0) return;

    ctx.save();
    ctx.lineWidth = CELL_SIZE * 0.6; // Slightly thicker
    // Pulsating alpha: (Math.sin(performance.now() / Period) + 1) / 2 gives range 0-1.
    // Adjust period for speed, multiplier for amplitude, and additive for base alpha.
    ctx.globalAlpha = 0.3 + (Math.sin(performance.now() / 250) + 1) * 0.35; // Pulsates between 0.3 and 1.0

    for (const path of pathsToIndicate) {
        if (!path || path.length === 0) continue;
        ctx.beginPath();
        ctx.strokeStyle = '#FFFF00'; // Bright yellow

        const startPoint = path[0];
        ctx.moveTo(startPoint.x, startPoint.y);

        if (path.length > 1) {
            const endPoint = path[1]; // Draw first segment
            ctx.lineTo(endPoint.x, endPoint.y);
        } else { // Path with only one point, draw a circle marker
            ctx.arc(startPoint.x, startPoint.y, CELL_SIZE * 0.5, 0, Math.PI * 2);
        }
        ctx.stroke();
    }
    ctx.restore();
}

function gameLoop(currentTime) {
    if (isPaused && !isGameOver) { requestAnimationFrame(gameLoop); return; }
    const deltaTime = (currentTime - (lastTime || currentTime)) / 1000; lastTime = currentTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx);
    drawPaths(ctx);
    drawPathIndicators(ctx); // Add this line
    if (isGameOver) { displayGameOver(); return; }
    handleEnemySpawning(deltaTime);
    towers = towers.filter(tower => !tower.isMarkedForRemoval);
    for (let i = towers.length - 1; i >= 0; i--) { towers[i].update(deltaTime, enemies, projectiles); towers[i].draw(ctx); }
    for (let i = enemies.length - 1; i >= 0; i--) { enemies[i].update(deltaTime, towers); if (!enemies[i].isDefeated) enemies[i].draw(ctx); }
    for (let i = projectiles.length - 1; i >= 0; i--) { projectiles[i].update(deltaTime, enemies); if (!projectiles[i].isMarkedForRemoval) projectiles[i].draw(ctx); }
    enemies = enemies.filter(enemy => !enemy.isDefeated); projectiles = projectiles.filter(p => !p.isMarkedForRemoval);
    checkWaveCompletion(); requestAnimationFrame(gameLoop);
}

function displayGameOver() {
    if (!gameWon) {
        playSound(soundGameOver);
    }
    /* ... (no change) ... */ ctx.save();ctx.fillStyle="rgba(0,0,0,0.75)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font="48px monospace";ctx.textAlign="center";if(gameWon){ctx.fillStyle="gold";ctx.fillText("YOU WON!",canvas.width/2,canvas.height/2-40);ctx.font="24px monospace";ctx.fillStyle="white";ctx.fillText("All levels cleared!",canvas.width/2,canvas.height/2);}else{ctx.fillStyle="red";ctx.fillText("GAME OVER",canvas.width/2,canvas.height/2-20);}ctx.font="24px monospace";ctx.fillStyle="white";ctx.fillText(`Final Score: ${score}`,canvas.width/2,canvas.height/2+(gameWon?40:30));if(startGameButton){startGameButton.disabled=false;startGameButton.textContent='Play Again?';}if(resumeGameButton)resumeGameButton.disabled=true;ctx.restore();}
function getEnemiesThisWaveCount() { /* ... (no change) ... */ if(currentLevel>MAX_LEVELS||waveNumber===0||currentLevel===0)return 0;const i=currentLevel-1;const j=waveNumber-1;if(!levelSettings[i]||!levelSettings[i].waveConfigs[j]||!levelSettings[i].waveConfigs[j].enemyTypes){console.error(`Incomplete wave config for L${currentLevel}W${waveNumber}`);return 0;}return levelSettings[i].waveConfigs[j].enemyTypes.length;}
function checkWaveCompletion() { /* ... (no change) ... */ const count=getEnemiesThisWaveCount();if(waveInProgress&&enemiesSpawnedThisWave>=count&&enemies.length===0&&!isGameOver){waveInProgress=false;console.log(`L${currentLevel}W${waveNumber} Complete!`);currency+=25+waveNumber*5+currentLevel*10;updateGameInfoDisplays();setTimeout(()=>{if(!isGameOver)startNewWave();},WAVE_END_DELAY);}}
function startNewWave() { /* ... (no change) ... */
    if(isGameOver) return;
    waveNumber++;
    const i = currentLevel - 1;

    if(i >= levelSettings.length) { // Should ideally be caught by currentLevel > MAX_LEVELS check first
        console.error("Level settings error - beyond MAX_LEVELS or config missing.");
        isGameOver = true;
        gameWon = true; // Assume win if settings run out beyond max levels
        playSound(soundGameWon);
        displayGameOver();
        return;
    }

    const conf = levelSettings[i];
    if (waveNumber > conf.waveConfigs.length) {
        if (currentLevel < MAX_LEVELS) { // Check if it's a regular level completion, not final one
            playSound(soundLevelFinished);
        }
        currentLevel++;
        waveNumber = 1;
        currency += 100 * (currentLevel - 1);
        console.log(`L${currentLevel - 1} complete! -> L${currentLevel}`);

        if (currentLevel > MAX_LEVELS) {
            isGameOver = true;
            gameWon = true;
            playSound(soundGameWon);
            console.log("All levels cleared!");
            updateGameInfoDisplays();
            // displayGameOver(); // displayGameOver is called by gameLoop if isGameOver is true
            return;
        }
    }
    waveInProgress = true;
    enemiesSpawnedThisWave = 0;
    enemySpawnTimer = ENEMY_SPAWN_INTERVAL;
    enemySpawnCounterForPathSelection = 0;
    console.log(`Starting L${currentLevel}W${waveNumber}`);
    updateGameInfoDisplays();
}
function resetGame() { /* ... (added selectedTowerInstance = null) ... */ selectedTowerType='PACKET_BLASTER';selectedTowerInstance=null;hideTowerInfoPanel();towers=[];enemies=[];projectiles=[];score=0;lives=10;currency=200;waveNumber=0;currentLevel=1;isGameOver=false;gameWon=false;waveInProgress=false;enemiesSpawnedThisWave=0;enemySpawnCounterForPathSelection=0;isPaused=false;lastTime=performance.now();initializePlacementGrid();updateGameInfoDisplays();if(startGameButton){startGameButton.disabled=false;startGameButton.textContent='Start Game';}if(resumeGameButton)resumeGameButton.disabled=true;if(newGameButton)newGameButton.disabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);drawGrid(ctx);drawPaths(ctx);ctx.save();ctx.font="20px monospace";ctx.fillStyle="#0f0";ctx.textAlign="center";ctx.fillText("Press 'Start Game' to begin!",canvas.width/2,canvas.height/2);ctx.restore();}

function updateGameInfoDisplays() { /* ... (no change) ... */ const i=currentLevel-1;let totalWaves='N/A';if(i>=0&&i<levelSettings.length&&levelSettings[i]&&levelSettings[i].waveConfigs)totalWaves=levelSettings[i].waveConfigs.length;if(document.getElementById('livesDisplay'))document.getElementById('livesDisplay').textContent=`Lives: ${lives}`;if(document.getElementById('scoreDisplay'))document.getElementById('scoreDisplay').textContent=`Score: ${score}`;if(document.getElementById('currencyDisplay'))document.getElementById('currencyDisplay').textContent=`Currency: ${currency}`;if(document.getElementById('levelDisplay'))document.getElementById('levelDisplay').textContent=`Level: ${currentLevel}`;if(document.getElementById('waveDisplay'))document.getElementById('waveDisplay').textContent=`Wave: ${waveNumber}/${totalWaves}`;const ts=document.getElementById('towerSelectDisplay');if(ts&&TOWER_SPECS[selectedTowerType])ts.textContent=`Selected: ${TOWER_SPECS[selectedTowerType].name}`;else if(ts)ts.textContent='Selected: None';}
function handleEnemySpawning(deltaTime) { /* ... (no change) ... */ const i=currentLevel-1;const j=waveNumber-1;if(!waveInProgress||isGameOver||i<0||i>=levelSettings.length||j<0||!levelSettings[i].waveConfigs||j>=levelSettings[i].waveConfigs.length)return;const conf=levelSettings[i].waveConfigs[j];const numEnemies=conf.enemyTypes.length;if(enemiesSpawnedThisWave>=numEnemies)return;enemySpawnTimer-=deltaTime;if(enemySpawnTimer<=0){const type=conf.enemyTypes[enemiesSpawnedThisWave];const paths=conf.paths;if(!paths||paths.length===0){console.error(`No paths L${currentLevel}W${waveNumber}`);waveInProgress=false;return;}const path=paths[enemySpawnCounterForPathSelection%paths.length];enemySpawnCounterForPathSelection++;const x=path[0].x;const y=path[0].y;enemies.push(new Enemy(x,y,type,path,currentLevel));enemiesSpawnedThisWave++;enemySpawnTimer=ENEMY_SPAWN_INTERVAL;}}

// --- Tower Info Panel Logic ---
function displayTowerInfo(tower) {
    if (!towerInfoPanel) return; // Panel elements not yet initialized
    selectedTowerInstance = tower; // Ensure this is set
    panel.style.display = 'block';
    infoTowerName.textContent = `${tower.name}`;
    infoTowerLevel.textContent = `Level: ${tower.level} / ${tower.maxLevel}`;

    let stat1 = '', stat2 = '', stat3 = '', special = '';
    const specs = TOWER_SPECS[tower.type];

    if (tower.type === 'PACKET_BLASTER' || tower.type === 'ANTIVIRUS_CANNON' || tower.type === 'ML_SNIPER') {
        stat1 = `Damage: ${tower.projectileSpecs.damage}`;
        stat2 = `Range: ${Math.round(tower.range)}`;
        stat3 = `Rate: ${tower.fireRate.toFixed(1)}/s`;
        if (tower.type === 'ANTIVIRUS_CANNON') special = `Splash Dmg: ${tower.projectileSpecs.splashDamage}, Radius: ${Math.round(tower.projectileSpecs.splashRadius)}`;
        if (tower.type === 'ML_SNIPER') special = `Bonus: x${tower.bonusDamageMultiplier.toFixed(2)}, Learned: ${tower.learnedEnemyTypes.size} types`;
    } else if (tower.type === 'ENCRYPTOR_NODE') {
        stat1 = `Slow: ${(1 - tower.effectSpecs.multiplier) * 100}%`;
        stat2 = `Duration: ${tower.effectSpecs.duration.toFixed(1)}s`;
        stat3 = `Range: ${Math.round(tower.range)}`;
    } else if (tower.type === 'FIREWALL_WALL') {
        stat1 = `Health: ${tower.health} / ${tower.maxHealth}`;
        stat2 = `Duration: ${tower.duration.toFixed(1)}s`;
        stat3 = `Blocker`;
    }
    infoTowerStat1.textContent = stat1;
    infoTowerStat2.textContent = stat2;
    infoTowerStat3.textContent = stat3;
    infoTowerSpecial.textContent = special;

    if (tower.level < tower.maxLevel && specs.upgrades && specs.upgrades[tower.level - 1]) {
        const upgradeCost = specs.upgrades[tower.level - 1].cost;
        upgradeTowerButton.textContent = `Upgrade (${upgradeCost} C)`;
        upgradeTowerButton.disabled = currency < upgradeCost;
        upgradeTowerButton.style.display = 'block';
    } else {
        upgradeTowerButton.textContent = 'Max Level';
        upgradeTowerButton.disabled = true;
        upgradeTowerButton.style.display = 'block';
    }
}

function hideTowerInfoPanel() {
    if (towerInfoPanel) towerInfoPanel.style.display = 'none';
}

// --- Event Listeners ---
if (canvas) {
    canvas.addEventListener('click',(e)=>{
        if(isGameOver||isPaused)return;
        const rect=canvas.getBoundingClientRect();const x=e.clientX-rect.left;const y=e.clientY-rect.top;
        const gridX=Math.floor(x/CELL_SIZE);const gridY=Math.floor(y/CELL_SIZE);

        if(gridY<0||gridY>=GRID_SIZE||gridX<0||gridX>=GRID_SIZE) { // Clicked outside
            selectedTowerInstance = null; hideTowerInfoPanel(); selectedTowerType = null;
            document.querySelectorAll('.tower-select-button').forEach(btn => btn.classList.remove('active'));
            updateGameInfoDisplays(); // To clear "Selected: TowerName"
            return;
        }

        const clickedExistingTower = towers.find(t => t.gridX === gridX && t.gridY === gridY);

        if (clickedExistingTower) {
            selectedTowerType = null; // Not in build mode
            document.querySelectorAll('.tower-select-button').forEach(btn => btn.classList.remove('active'));
            selectedTowerInstance = clickedExistingTower;
            displayTowerInfo(selectedTowerInstance);
        } else { // Clicked an empty cell
            if (selectedTowerType && TOWER_SPECS[selectedTowerType]) { // If in build mode
                if (!placementGrid[gridY] || placementGrid[gridY][gridX] === false) {
                    console.log("Cannot place tower here: Non-placeable area.");
                    // selectedTowerInstance = null; hideTowerInfoPanel(); // Keep build mode active
                    return;
                }
                const towerCost = TOWER_SPECS[selectedTowerType].cost;
                if (currency >= towerCost) {
                    const newTower = new Tower(gridX, gridY, selectedTowerType);
                    towers.push(newTower);
                    placementGrid[gridY][gridX] = false;
                    currency -= towerCost;

                    selectedTowerInstance = newTower; // Select the newly placed tower
                    displayTowerInfo(selectedTowerInstance);
                    // selectedTowerType = null; // Optional: exit build mode after placement
                    // document.querySelectorAll('.tower-select-button').forEach(btn => btn.classList.remove('active'));
                    updateGameInfoDisplays();
                } else {
                    console.log("Not enough currency for:", TOWER_SPECS[selectedTowerType].name);
                    // selectedTowerInstance = null; hideTowerInfoPanel(); // Keep build mode active
                }
            } else { // Not in build mode and clicked empty cell
                selectedTowerInstance = null;
                hideTowerInfoPanel();
            }
        }
        updateGameInfoDisplays(); // Update general game info
    });
}

function initializeTowerSelection() {
    const towerButtons = document.querySelectorAll('.tower-select-button');
    towerButtons.forEach(b => {
        b.addEventListener('click', () => {
            selectedTowerType = b.getAttribute('data-tower-type');
            selectedTowerInstance = null; // Deselect any currently selected tower instance
            hideTowerInfoPanel();         // Hide info panel when selecting a new type to build
            towerButtons.forEach(btn => btn.classList.remove('active'));
            b.classList.add('active');
            console.log("Selected tower type for placement:", TOWER_SPECS[selectedTowerType].name);
            updateGameInfoDisplays();
        });
    });
    const initialActiveButton = document.querySelector(`.tower-select-button[data-tower-type="${selectedTowerType}"]`);
    if (initialActiveButton) initialActiveButton.classList.add('active');
}

// Initialize Info Panel Buttons (Done in DOMContentLoaded)

// startGameButton, resumeGameButton, newGameButton listeners remain the same...
if (startGameButton) { /* ... (no change) ... */ startGameButton.addEventListener('click',()=>{if(isGameOver)resetGame();if(waveNumber===0&&!waveInProgress)resetGame();isPaused=false;startNewWave();lastTime=performance.now();requestAnimationFrame(gameLoop);startGameButton.disabled=true;if(resumeGameButton){resumeGameButton.disabled=false;resumeGameButton.textContent='Pause Game';}}); }
if (resumeGameButton) { /* ... (no change) ... */ resumeGameButton.addEventListener('click',()=>{if(isGameOver)return;isPaused=!isPaused;if(!isPaused){lastTime=performance.now();requestAnimationFrame(gameLoop);resumeGameButton.textContent='Pause Game';}else{resumeGameButton.textContent='Resume Game';ctx.save();ctx.fillStyle="rgba(0,0,0,0.5)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font="30px monospace";ctx.fillStyle="white";ctx.textAlign="center";ctx.fillText("Paused",canvas.width/2,canvas.height/2);ctx.restore();}}); }
if (newGameButton) { /* ... (no change) ... */ newGameButton.addEventListener('click',()=>{isPaused=true;resetGame();}); }

document.addEventListener('DOMContentLoaded', () => {
    if (!canvas) { console.error("Canvas not found!"); return; }

    // Initialize Tower Info Panel Elements
    towerInfoPanel = document.getElementById('towerInfoPanel');
    infoTowerName = document.getElementById('infoTowerName');
    infoTowerLevel = document.getElementById('infoTowerLevel');
    infoTowerStat1 = document.getElementById('infoTowerStat1');
    infoTowerStat2 = document.getElementById('infoTowerStat2');
    infoTowerStat3 = document.getElementById('infoTowerStat3');
    infoTowerSpecial = document.getElementById('infoTowerSpecial'); // Ensure this exists in HTML
    upgradeTowerButton = document.getElementById('upgradeTowerButton');
    closeTowerInfoButton = document.getElementById('closeTowerInfoButton');

    if (upgradeTowerButton) {
        upgradeTowerButton.addEventListener('click', () => {
            if (selectedTowerInstance) {
                selectedTowerInstance.upgrade();
            }
        });
    }
    if (closeTowerInfoButton) {
        closeTowerInfoButton.addEventListener('click', () => {
            hideTowerInfoPanel();
            selectedTowerInstance = null;
        });
    }

    initializeTowerSelection();
    resetGame();
    if (resumeGameButton) resumeGameButton.disabled = true;
});

// --- Class Definitions ---
class Enemy { /* ... (constructor uses currentLevelContext, update uses towersArray, takeDamage returns boolean) ... */
    constructor(x,y,type,pathObject,currentLevelContext){this.type=type;const specs=ENEMY_SPECS[type]||ENEMY_SPECS['BUGLET'];const levelConf=levelSettings[currentLevelContext-1];this.name=specs.name;this.maxHealth=specs.baseHealth*(levelConf?.healthMultiplier||1);this.baseSpeed=specs.baseSpeed*CELL_SIZE*(levelConf?.speedMultiplier||1);this.attackDamage=specs.attackDamage||0;this.attackRate=specs.attackRate||1;this.attackCooldown=0;this.currentTargettedBlocker=null;this.health=this.maxHealth;this.currentSpeed=this.baseSpeed;this.color=specs.color;this.width=CELL_SIZE*specs.widthModifier;this.height=CELL_SIZE*specs.heightModifier;this.points=specs.points;this.currencyDrop=specs.currencyDrop||0;this.path=pathObject;this.pathIndex=0;this.x=x;this.y=y;this.isDefeated=false;this.effects={};}
    applyEffect(effectName,effectData){this.effects[effectName]={...effectData,active:true};}
    removeEffect(effectName){delete this.effects[effectName];}
    update(deltaTime,towersArray){if(this.isDefeated)return;this.currentSpeed=this.baseSpeed;this.currentTargettedBlocker=null;for(const effectName in this.effects){const effect=this.effects[effectName];if(effect.active){if(effect.duration>0){if(effect.type==='slow')this.currentSpeed*=effect.multiplier;effect.duration-=deltaTime;}else this.removeEffect(effectName);}}
    if(this.type==='CRYPTO_LOCKER'&&!this.isDefeated){for(const tower of towersArray){if(tower.effects.disabled&&tower.effects.disabled.active)continue;const distToTower=Math.sqrt(Math.pow(this.x-tower.x,2)+Math.pow(this.y-tower.y,2));if(distToTower<ENEMY_SPECS.CRYPTO_LOCKER.disableRange){tower.applyEffect('disabled',{duration:ENEMY_SPECS.CRYPTO_LOCKER.disableDuration});this.isDefeated=true;score+=this.points;currency+=this.currencyDrop;updateGameInfoDisplays();break;}}if(this.isDefeated)return;}
    const enemyGridX=Math.floor(this.x/CELL_SIZE);const enemyGridY=Math.floor(this.y/CELL_SIZE);for(const tower of towersArray){if(tower.type==='FIREWALL_WALL'&&!tower.isMarkedForRemoval){if(Math.abs(enemyGridX-tower.gridX)<=1&&Math.abs(enemyGridY-tower.gridY)<=1){const distToWallSq=Math.pow(this.x-tower.x,2)+Math.pow(this.y-tower.y,2);const collisionDist=(this.width/2+tower.width/2);if(distToWallSq<collisionDist*collisionDist){this.currentTargettedBlocker=tower;break;}}}}
    if(this.currentTargettedBlocker){if(this.attackCooldown>0)this.attackCooldown-=deltaTime;if(this.attackCooldown<=0){this.currentTargettedBlocker.takeDamage(this.attackDamage);this.attackCooldown=1/this.attackRate;}}else{if(this.pathIndex>=this.path.length){this.isDefeated=true;if(!isGameOver){lives--;if(lives<0)lives=0;updateGameInfoDisplays();if(lives===0){isGameOver=true;gameWon=false;if(!gameWon) playSound(soundGameOver);}}return;}const targetPoint=this.path[this.pathIndex];const dx=targetPoint.x-this.x;const dy=targetPoint.y-this.y;const distance=Math.sqrt(dx*dx+dy*dy);if(distance<this.currentSpeed*deltaTime*1.1){this.x=targetPoint.x;this.y=targetPoint.y;this.pathIndex++;if(this.pathIndex>=this.path.length){this.isDefeated=true;if(!isGameOver){lives--;if(lives<0)lives=0;updateGameInfoDisplays();if(lives===0){isGameOver=true;gameWon=false;if(!gameWon) playSound(soundGameOver);}}}}else{this.x+=(dx/distance)*this.currentSpeed*deltaTime;this.y+=(dy/distance)*this.currentSpeed*deltaTime;}}}
    draw(ctx){ctx.save();if(this.effects.slow&&this.effects.slow.active){ctx.fillStyle='rgba(100,100,255,0.8)';}else{ctx.fillStyle=this.color;}ctx.fillRect(this.x-this.width/2,this.y-this.height/2,this.width,this.height);const hw=this.width;const hh=5;const hx=this.x-hw/2;const hy=this.y-this.height/2-hh-3;ctx.fillStyle='#333';ctx.fillRect(hx,hy,hw,hh);const hp=Math.max(0,this.health/this.maxHealth);ctx.fillStyle='lime';ctx.fillRect(hx,hy,hw*hp,hh);ctx.restore();}
    takeDamage(amount){this.health-=amount;let defeated=false;if(this.health<=0&&!this.isDefeated){this.isDefeated=true;score+=this.points;currency+=this.currencyDrop;playSound(soundKilled);updateGameInfoDisplays();defeated=true;}return defeated;}
}

class Tower {
    constructor(gridX, gridY, type) {
        this.gridX = gridX; this.gridY = gridY;
        this.x = gridX * CELL_SIZE + CELL_SIZE / 2;
        this.y = gridY * CELL_SIZE + CELL_SIZE / 2;
        this.type = type; const specs = TOWER_SPECS[type];
        this.name = specs.name; this.cost = specs.cost; this.range = specs.range;
        this.fireRate = specs.fireRate; this.color = specs.color; this.cooldown = 0;
        this.projectileSpecs = specs.projectile ? {...specs.projectile} : null; // Clone projectileSpecs
        this.effectSpecs = specs.effect ? {...specs.effect} : null; // Clone effectSpecs
        this.width = CELL_SIZE * (specs.widthModifier || 0.9);
        this.height = CELL_SIZE * (specs.heightModifier || 0.9);
        this.auraPulseTime = 0; this.isMarkedForRemoval = false;
        this.effects = {}; this.currentAccuracy = 1.0;
        this.level = 1; this.maxLevel = 1 + (specs.upgrades ? specs.upgrades.length : 0);

        if (type === 'ML_SNIPER') { this.learnedEnemyTypes = new Set(); this.bonusDamageMultiplier = specs.bonusDamageMultiplier || 1.5;}
        if (type === 'FIREWALL_WALL') { this.health = specs.health; this.maxHealth = specs.health; this.duration = specs.duration; }
    }

    applyEffect(effectName, effectData) { this.effects[effectName] = { active: true, ...effectData };}
    updateEffects(deltaTime) {
        this.currentAccuracy = 1.0; // Reset before recalculating based on Spam Swarms
        for (const effectName in this.effects) {
            const effect = this.effects[effectName];
            if (effect.active) {
                if (effect.duration !== undefined && effect.duration > 0) { // Check for undefined duration
                    effect.duration -= deltaTime;
                    if (effect.duration <= 0) {
                        delete this.effects[effectName]; // Remove expired effect
                    }
                }
            } else { // Should not happen if only active:true is added
                 delete this.effects[effectName];
            }
        }
    }

    upgrade() {
        if (this.level >= this.maxLevel) { console.log(`${this.name} is already at max level.`); return; }
        const upgradeData = TOWER_SPECS[this.type].upgrades[this.level - 1];
        if (!upgradeData) { console.log(`No upgrade data found for ${this.name} at level ${this.level + 1}.`); return; }
        if (currency < upgradeData.cost) { console.log(`Not enough currency to upgrade ${this.name}.`); return; }

        currency -= upgradeData.cost;
        this.level++;
        console.log(`${this.name} upgraded to Level ${this.level}.`);

        // Apply upgrades - ensure to merge deeply for nested specs like projectile
        if (upgradeData.range) this.range = upgradeData.range;
        if (upgradeData.fireRate) this.fireRate = upgradeData.fireRate;
        if (upgradeData.health) { this.health += (upgradeData.health - (this.maxHealth || 0)); this.maxHealth = upgradeData.health; } // Add diff to current health
        if (upgradeData.duration) this.duration += upgradeData.duration; // Add to remaining duration or reset? For now, adds.
        if (upgradeData.bonusDamageMultiplier) this.bonusDamageMultiplier = upgradeData.bonusDamageMultiplier;

        if (this.projectileSpecs && upgradeData.projectile) {
            this.projectileSpecs = { ...this.projectileSpecs, ...upgradeData.projectile };
        }
        if (this.effectSpecs && upgradeData.effect) {
            this.effectSpecs = { ...this.effectSpecs, ...upgradeData.effect };
        }

        updateGameInfoDisplays(); // For currency
        if (selectedTowerInstance === this) displayTowerInfo(this); // Refresh panel if this tower is selected
    }

    takeDamage(amount) { /* ... (as defined before) ... */ if(this.type==='FIREWALL_WALL'){this.health-=amount;if(this.health<=0&&!this.isMarkedForRemoval){this.isMarkedForRemoval=true;if(placementGrid[this.gridY]&&typeof placementGrid[this.gridY][this.gridX]!=='undefined'){placementGrid[this.gridY][this.gridX]=true;}console.log(`${this.name} at [${this.gridX},${this.gridY}] destroyed.`);}}}
    update(deltaTime, enemies, projectiles) {
        this.updateEffects(deltaTime);
        if (this.effects.disabled && this.effects.disabled.active) {
            this.cooldown = this.fireRate > 0 ? 1 / this.fireRate : 1; // Keep cooldown full
            return;
        }

        // Spam Swarm accuracy debuff
        for (const enemy of enemies) {
            if (enemy.type === 'SPAM_SWARM' && !enemy.isDefeated) {
                const distToSpam = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distToSpam < ENEMY_SPECS.SPAM_SWARM.debuffRadius) {
                    this.currentAccuracy -= ENEMY_SPECS.SPAM_SWARM.accuracyReduction;
                }
            }
        }
        if (this.currentAccuracy < 0) this.currentAccuracy = 0;


        if (this.cooldown > 0) this.cooldown -= deltaTime;
        if (this.auraPulseTime > 0) this.auraPulseTime -= deltaTime;
        if (this.type === 'FIREWALL_WALL') { /* ... (duration logic as before) ... */ if(this.duration>0){this.duration-=deltaTime;if(this.duration<=0&&!this.isMarkedForRemoval){this.isMarkedForRemoval=true;if(placementGrid[this.gridY]&&typeof placementGrid[this.gridY][this.gridX]!=='undefined'){placementGrid[this.gridY][this.gridX]=true;}console.log(`${this.name} at [${this.gridX},${this.gridY}] expired.`);}}return;}
        if (this.type === 'ENCRYPTOR_NODE') { /* ... (aura logic as before) ... */ if(this.cooldown<=0&&this.effectSpecs){let aff=0;for(const e of enemies){if(e.isDefeated)continue;const dx=e.x-this.x;const dy=e.y-this.y;const dSq=dx*dx+dy*dy;if(dSq<this.range*this.range){e.applyEffect(this.effectSpecs.type,{...this.effectSpecs});aff++;}}if(aff>0){this.cooldown=1/this.fireRate;this.auraPulseTime=0.3;}else this.cooldown=0.2;} }
        else {
            if (this.cooldown <= 0 && this.projectileSpecs) {
                const target = this.findTarget(enemies);
                if (target) { this.shoot(target, projectiles); this.cooldown = 1 / this.fireRate; }
            }
        }
    }
    findTarget(enemies) { /* ... (no change) ... */ let cE=null;let mDSq=this.range*this.range;for(const e of enemies){if(e.isDefeated)continue;const dX=e.x-this.x;const dY=e.y-this.y;const dSq=dX*dX+dY*dY;if(dSq<mDSq){mDSq=dSq;cE=e;}}return cE; }
    shoot(target, projectiles) {
        if (!this.projectileSpecs) return;
        if (Math.random() > this.currentAccuracy) { console.log(`${this.name} missed due to low accuracy!`); return; } // Missed shot
        playSound(soundFire);
        projectiles.push(new Projectile(this.x, this.y, target, this.projectileSpecs, this));
    }
    draw(ctx) { /* ... (draw disabled state) ... */
        ctx.save();
        if (this.effects.disabled && this.effects.disabled.active) {
            ctx.fillStyle = '#555'; // Greyed out if disabled
            ctx.globalAlpha = 0.7;
        } else if (this.type === 'FIREWALL_WALL') {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = Math.max(0.2, this.duration / TOWER_SPECS.FIREWALL_WALL.duration);
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.globalAlpha = 1.0;

        if (this.type === 'FIREWALL_WALL' && this.health < this.maxHealth) { /* health bar */ const hw=this.width;const hh=5;const hx=this.x-hw/2;const hy=this.y-this.height/2-hh-2;ctx.fillStyle='#333';ctx.fillRect(hx,hy,hw,hh);const hp=Math.max(0,this.health/this.maxHealth);ctx.fillStyle='orange';ctx.fillRect(hx,hy,hw*hp,hh); }
        if (this.type !== 'FIREWALL_WALL') { /* range circle */ ctx.strokeStyle='rgba(200,200,200,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(this.x,this.y,this.range,0,Math.PI*2);ctx.stroke(); }
        if (this.type === 'ENCRYPTOR_NODE' && this.auraPulseTime > 0 && this.effectSpecs) { /* pulse */ const p=1-(this.auraPulseTime/0.3);ctx.fillStyle=this.effectSpecs.pulseColor;ctx.beginPath();ctx.arc(this.x,this.y,this.range*p,0,Math.PI*2);ctx.fill(); }
        if (this.effects.disabled && this.effects.disabled.active) { // Lock icon
            ctx.fillStyle = 'yellow'; ctx.font = `${this.width * 0.6}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('🔒', this.x, this.y);
        }
        ctx.restore();
    }
}
class Projectile { /* ... (no change from previous committed version) ... */
    constructor(x,y,target,specs,firedByTower){this.x=x;this.y=y;this.target=target;this.damage=specs.damage;this.speed=specs.speed;this.color=specs.color;this.size=specs.size||CELL_SIZE/5;this.splashRadius=specs.splashRadius||0;this.splashDamage=specs.splashDamage||0;this.firedBy=firedByTower;this.isMarkedForRemoval=false;}
    update(deltaTime,enemies){if(this.isMarkedForRemoval)return;if(this.target.isDefeated&&this.target.health<=0){this.isMarkedForRemoval=true;return;}const dx=this.target.x-this.x;const dy=this.target.y-this.y;const distance=Math.sqrt(dx*dx+dy*dy);if(distance<this.speed*deltaTime||distance<this.size/2){let actualDamage=this.damage;if(this.firedBy&&this.firedBy.type==='ML_SNIPER'&&this.firedBy.learnedEnemyTypes&&this.target.type&&this.firedBy.learnedEnemyTypes.has(this.target.type)){actualDamage*=this.firedBy.bonusDamageMultiplier;console.log(`ML Sniper bonus to ${this.target.type}! Dmg: ${actualDamage}`);}const enemyWasDefeated=this.target.takeDamage(actualDamage);if(enemyWasDefeated&&this.firedBy&&this.firedBy.type==='ML_SNIPER'&&this.target.type){if(!this.firedBy.learnedEnemyTypes.has(this.target.type)){this.firedBy.learnedEnemyTypes.add(this.target.type);console.log(`ML Sniper learned: ${this.target.type}`);}}if(this.splashRadius>0){for(const e of enemies){if(e===this.target||e.isDefeated)continue;const dSq=(e.x-this.target.x)*(e.x-this.target.x)+(e.y-this.target.y)*(e.y-this.target.y);if(dSq<this.splashRadius*this.splashRadius)e.takeDamage(this.splashDamage);}}this.isMarkedForRemoval=true;}else{this.x+=(dx/distance)*this.speed*deltaTime;this.y+=(dy/distance)*this.speed*deltaTime;}}
    draw(ctx){ctx.save();ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,this.size/2,0,Math.PI*2);ctx.fill();ctx.restore();}
}
