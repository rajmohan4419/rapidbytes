// Get DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const placeTowerButton = document.getElementById('placeTowerButton'); // Not used directly for placement yet, but good to have
const startGameButton = document.getElementById('startGameButton');

// Game elements
let towers = [];
let enemies = [];
let projectiles = [];

// Game state
let score = 0;
let lives = 10;
let currency = 100;
let waveNumber = 0; // Will be incremented when a wave actually starts
let isGameOver = false;
let waveInProgress = false;
let enemiesSpawnedThisWave = 0;
const WAVE_END_DELAY = 3000; // 3 seconds delay between waves

// Game loop
let lastTime = 0;
function gameLoop(currentTime) {
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
        // Consider adding a restart button or instruction here
        return; // Stop further game logic
    }

    handleEnemySpawning(deltaTime);

    for (let i = towers.length - 1; i >= 0; i--) {
        towers[i].update(deltaTime, enemies, projectiles);
        towers[i].draw(ctx);
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(deltaTime); // Enemy removal is handled in its update/takeDamage
        if (!enemies[i].isDefeated) { // Only draw active enemies
             enemies[i].draw(ctx);
        }
    }
     for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(deltaTime); // Projectile removal is handled in its update
        if (!projectiles[i].isMarkedForRemoval) { // Only draw active projectiles
            projectiles[i].draw(ctx);
        }
    }

    // Cleanup defeated entities
    enemies = enemies.filter(enemy => !enemy.isDefeated);
    projectiles = projectiles.filter(projectile => !projectile.isMarkedForRemoval);


    // Wave completion check
    if (waveInProgress && enemiesSpawnedThisWave === (waveNumber * 5) && enemies.length === 0) {
        waveInProgress = false;
        console.log(`Wave ${waveNumber} Complete!`);
        // Display "Wave Complete!" message (optional, can be simple text on canvas for a short duration)
        ctx.font = "30px Arial";
        ctx.fillStyle = "green";
        ctx.textAlign = "center";
        ctx.fillText(`Wave ${waveNumber} Complete!`, canvas.width / 2, canvas.height / 2 - 60);

        setTimeout(() => {
            if (!isGameOver) { // Check again in case game over happened during timeout
                startNewWave();
            }
        }, WAVE_END_DELAY);
    }

    requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
canvas.addEventListener('click', (event) => {
    if (isGameOver) return; // Don't allow actions if game over

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
    if (!waveInProgress && waveNumber === 0 && !isGameOver) { // Start game only if not already started
        startNewWave();
        startGameButton.disabled = true;
        startGameButton.style.backgroundColor = '#cccccc';
    }
});

// --- Game Logic Functions ---
function gameOver() {
    isGameOver = true;
    waveInProgress = false; // Stop any wave progression
    console.log("GAME OVER");
    // The game loop will handle displaying the message
}


let enemySpawnTimer = 0;
const ENEMY_SPAWN_INTERVAL = 0.75;
// enemiesToSpawnThisWave is now implicitly waveNumber * 5
const ENEMY_BASE_HEALTH = 50;
const ENEMY_HEALTH_PER_WAVE = 10;
const ENEMY_BASE_SPEED = 75;
const ENEMY_SPEED_PER_WAVE = 5;

function startNewWave() {
    if(isGameOver) return;
    waveNumber++;
    waveInProgress = true;
    enemiesSpawnedThisWave = 0;
    enemySpawnTimer = 0;
    console.log(`Starting Wave ${waveNumber} with ${waveNumber * 5} enemies.`);
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`; // Update UI at start of wave too
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('currencyDisplay').textContent = `Currency: ${currency}`;

}

function handleEnemySpawning(deltaTime) {
    if (!waveInProgress || isGameOver || enemiesSpawnedThisWave >= (waveNumber * 5) ) {
        return;
    }

    enemySpawnTimer -= deltaTime;
    if (enemySpawnTimer <= 0) {
        // Path: starts off-screen left, moves horizontally to off-screen right
            // Add some y variation to make it a bit more interesting
            const startY = canvas.height / 3 + (Math.random() * canvas.height / 3 - canvas.height / 6);
            const enemyPath = [{x: -20, y: startY}, {x: canvas.width + 20, y: startY}];

            const health = ENEMY_BASE_HEALTH + (waveNumber - 1) * ENEMY_HEALTH_PER_WAVE;
            const speed = ENEMY_BASE_SPEED + (waveNumber - 1) * ENEMY_SPEED_PER_WAVE;

            enemies.push(new Enemy(enemyPath[0].x, enemyPath[0].y, health, speed, enemyPath));
            enemiesSpawnedThisWave++;
            enemySpawnTimer = ENEMY_SPAWN_INTERVAL;
        }
    }
}

// --- Classes ---

// Tower Class
class Tower {
    constructor(x, y, cost, damage, range, attackSpeed) {
        this.x = x;
        this.y = y;
        this.cost = cost;
        this.damage = damage;
        this.range = range; // Radius
        this.attackSpeed = attackSpeed; // Shots per second
        this.target = null;
        this.shootCooldown = 0; // Time until next shot
    }

    draw(ctx) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30); // Draw a simple square
        // Draw range
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.stroke();
    }

    findTarget(currentEnemies) {
        let closestEnemy = null;
        let minDistanceSquared = this.range * this.range + 1; // Use squared distance for efficiency

        for (const enemy of currentEnemies) {
            if (enemy.isDefeated || enemy.health <= 0) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared <= this.range * this.range) {
                if (distanceSquared < minDistanceSquared) {
                    minDistanceSquared = distanceSquared;
                    closestEnemy = enemy;
                }
            }
        }
        this.target = closestEnemy;

        // If current target is out of range or dead/defeated, clear it
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            if (dx * dx + dy * dy > this.range * this.range || this.target.isDefeated || this.target.health <= 0) {
                this.target = null;
            }
        }
    }

    shoot(allProjectiles) {
        // This function is called when target is valid and cooldown is ready
        allProjectiles.push(new Projectile(this.x, this.y, this.target, 300, this.damage)); // Projectile speed 300
        this.shootCooldown = 1 / this.attackSpeed;
    }

    update(deltaTime, currentEnemies, allProjectiles) {
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        this.shootCooldown = Math.max(0, this.shootCooldown);

        this.findTarget(currentEnemies); // Pass along the current list of enemies

        if (this.target && this.shootCooldown <= 0) {
            this.shoot(allProjectiles); // Pass along the projectiles array
        }
    }
}

// Enemy Class
class Enemy {
    constructor(x, y, health, speed, path) {
        this.x = x;
        this.y = y;
        this.health = health;
        this.originalHealth = health; // For drawing health bar
        this.speed = speed;
        this.path = path;
        this.currentPathIndex = 0;
        this.isDefeated = false; // To mark for cleanup and stop interactions
        this.value = 10; // Currency awarded on defeat
        this.scoreValue = 20; // Score awarded on defeat
        this.radius = 12; // For projectile collision detection
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2); // Draw a circle
        ctx.fill();
    }

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2); // Slightly larger enemy
        ctx.fill();

        // Health bar
        if (this.health < this.originalHealth) {
            const barWidth = 20;
            const barHeight = 5;
            const barX = this.x - barWidth / 2;
            const barY = this.y - 15 - barHeight; // Position above enemy
            ctx.fillStyle = 'grey';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            const healthPercentage = this.health / this.originalHealth;
            ctx.fillStyle = 'green';
            ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
        }
    }

    move(deltaTime) {
        if (this.isDefeated) return;

        if (this.currentPathIndex >= this.path.length) {
            if (!this.isDefeated) { // Should only happen once
                lives--;
                document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
                console.log(`Enemy reached end. Lives: ${lives}`);
                this.isDefeated = true;
                if (lives <= 0) {
                    gameOver();
                }
            }
            return;
        }

        const targetWaypoint = this.path[this.currentPathIndex];
        const dx = targetWaypoint.x - this.x;
        const dy = targetWaypoint.y - this.y;
        const distanceToWaypoint = Math.sqrt(dx * dx + dy * dy);
        const moveDistance = this.speed * deltaTime;

        if (distanceToWaypoint <= moveDistance) {
            this.x = targetWaypoint.x;
            this.y = targetWaypoint.y;
            this.currentPathIndex++;
        } else {
            this.x += (dx / distanceToWaypoint) * moveDistance;
            this.y += (dy / distanceToWaypoint) * moveDistance;
        }
    }

    takeDamage(amount) {
        if (this.isDefeated) return;
        this.health -= amount;
        if (this.health <= 0) {
            this.isDefeated = true;
            score += this.scoreValue;
            currency += this.value;
            document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
            document.getElementById('currencyDisplay').textContent = `Currency: ${currency}`;
            console.log(`Enemy defeated. Score: ${score}, Currency: ${currency}`);
            // Removal from 'enemies' array will be handled by the filter in gameLoop
        }
    }

    update(deltaTime) {
        if (this.isDefeated) return;
        this.move(deltaTime);
    }
}

// Projectile Class
class Projectile {
    constructor(x, y, targetEnemy, speed, damage) {
        this.x = x;
        this.y = y;
        this.targetEnemy = targetEnemy;
        this.speed = speed;
        this.damage = damage;
        this.radius = 3; // For drawing and collision
        this.isMarkedForRemoval = false;
    }

    draw(ctx) {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update(deltaTime) { // Removed 'enemies' parameter as target is already known
        if (this.isMarkedForRemoval) return;

        if (!this.targetEnemy || this.targetEnemy.isDefeated || this.targetEnemy.health <= 0) {
            this.isMarkedForRemoval = true;
            return;
        }

        const dx = this.targetEnemy.x - this.x;
        const dy = this.targetEnemy.y - this.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
        const moveDistance = this.speed * deltaTime;

        // Collision threshold, e.g., sum of radii (enemy radius approx 10-12)
        const collisionThreshold = this.radius + (this.targetEnemy.radius || 10);


        if (distanceToTarget <= collisionThreshold) {
            this.targetEnemy.takeDamage(this.damage);
            this.isMarkedForRemoval = true;
        } else if (distanceToTarget <= moveDistance) { // Reached target point this frame
            this.x = this.targetEnemy.x; // Snap to target x
            this.y = this.targetEnemy.y; // Snap to target y
            this.targetEnemy.takeDamage(this.damage);
            this.isMarkedForRemoval = true;
        }

        else {
            // Move towards target
            this.x += (dx / distanceToTarget) * moveDistance;
            this.y += (dy / distanceToTarget) * moveDistance;
        }
    }
}

// Enemy class needs a radius for projectile collision if we want to be more precise
// Add to Enemy constructor: this.radius = 12;

// --- Test Instances ---
// Removed: Test tower and enemy are no longer needed as they are spawned via gameplay.
// const testTower = new Tower(canvas.width / 2, canvas.height / 2, 50, 10, 100, 1);
// towers.push(testTower);
// const testPath = [{x: 50, y: 50}, {x: 750, y: 50}, {x: 750, y: 550}, {x: 50, y: 550}, {x: 50, y: 50}];
// const testEnemy = new Enemy(testPath[0].x, testPath[0].y, 100, 50, testPath);
// enemies.push(testEnemy);

// Start game loop by passing the initial timestamp
requestAnimationFrame(gameLoop);
