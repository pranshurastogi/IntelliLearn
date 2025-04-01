import React, { useEffect, useRef, useState } from "react";
import "./ArcheryGame.css";

const ArcheryGame = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const enemyIntervalRef = useRef(null);
  const [ctx, setCtx] = useState(null);

  // Game state
  const [roundOver, setRoundOver] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [enemyScore, setEnemyScore] = useState(0);
  const [playerShots, setPlayerShots] = useState(0);
  const [enemyShots, setEnemyShots] = useState(0);

  // Shot controls
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(50);

  // Arrow objects (x, y, vx, vy, angle)
  const [playerArrow, setPlayerArrow] = useState(null);
  const [enemyArrow, setEnemyArrow] = useState(null);

  // Enemy AI memory
  const enemyAimRef = useRef({
    lastAngle: 0,
    lastSpeed: 15,
    missDistance: 0,
    improvementFactor: 0.3, // The higher this is, the more quickly the enemy adjusts
  });

  // Positions
  const [positions, setPositions] = useState({
    player: { x: 0, y: 0 },
    enemy: { x: 0, y: 0 },
  });

  // Initialize the game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    setCtx(context);

    // Random positions
    const newPositions = generateRandomPositions(canvas);
    setPositions(newPositions);

    // Start first round
    startNewRound();

    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (enemyIntervalRef.current) {
        clearInterval(enemyIntervalRef.current);
      }
    };
  }, []);

  // Main game loop
  useEffect(() => {
    if (!ctx) return;

    const animate = () => {
      drawGame();
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [ctx, positions, angle, power, playerArrow, enemyArrow]);

  /**
   * Generate random positions for player (left side) and enemy (right side)
   * with a wider range so the enemy changes position more dramatically.
   */
  const generateRandomPositions = (canvas) => {
    // Player X: ~5% to 20% of canvas width
    const playerX = Math.random() * (canvas.width * 0.15) + canvas.width * 0.05;
    // Enemy X: ~70% to 95% of canvas width
    const enemyX = Math.random() * (canvas.width * 0.25) + canvas.width * 0.7;

    // Both can vary in Y from (canvas.height - 200) to (canvas.height - 50)
    const minY = canvas.height - 200;
    const maxY = canvas.height - 50;
    const playerY = Math.random() * (maxY - minY) + minY;
    const enemyY = Math.random() * (maxY - minY) + minY;

    return {
      player: { x: playerX, y: playerY },
      enemy: { x: enemyX, y: enemyY },
    };
  };

  const startNewRound = () => {
    setRoundOver(false);
    setPlayerShots(0);
    setEnemyShots(0);
    setPlayerArrow(null);
    setEnemyArrow(null);

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const newPositions = generateRandomPositions(canvas);
      setPositions(newPositions);

      // Reset enemy AI memory
      enemyAimRef.current.lastAngle = 0;
      enemyAimRef.current.lastSpeed = 15;
      enemyAimRef.current.missDistance = 0;
    }

    // Enemy shoots at random intervals
    setupEnemyShooting();
  };

  /**
   * Single function for drawing everything each frame
   */
  const drawGame = () => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple sky & ground
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#3A5F0B";
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Draw silhouettes
    drawPlayerArcher(positions.player.x, positions.player.y, angle, power);
    drawEnemyArcher(positions.enemy.x, positions.enemy.y);

    // Update/draw player's arrow
    if (playerArrow) {
      updateArrow(playerArrow, setPlayerArrow, "Player");
    }
    // Update/draw enemy's arrow
    if (enemyArrow) {
      updateArrow(enemyArrow, setEnemyArrow, "Enemy");
    }
  };

  /**
   * Draw a stickman silhouette for the player.
   * We rotate the arm and bow based on the "angle" + "power".
   */
  const drawPlayerArcher = (x, y, angleDeg, powerPercent) => {
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#000";

    // Body line
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y - 60);
    ctx.lineTo(x, y - 100);
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(x, y - 120, 12, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    // Back arm
    ctx.beginPath();
    ctx.moveTo(x, y - 100);
    ctx.lineTo(x - 15, y - 110);
    ctx.stroke();

    // Front arm (holding bow), rotate based on angle
    const rad = (-angleDeg * Math.PI) / 180;
    const armLength = 25;
    const armX = x + armLength * Math.cos(rad);
    const armY = y - 100 + armLength * Math.sin(rad);
    ctx.beginPath();
    ctx.moveTo(x, y - 100);
    ctx.lineTo(armX, armY);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(x, y - 60);
    ctx.lineTo(x - 10, y);
    ctx.moveTo(x, y - 60);
    ctx.lineTo(x + 10, y);
    ctx.stroke();

    // Bow
    ctx.translate(armX, armY);
    ctx.rotate(rad);
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111";
    ctx.arc(0, 0, 20, -Math.PI / 2, Math.PI / 2, false);
    ctx.stroke();

    // Bow string
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 20);
    ctx.strokeStyle = "#666";
    ctx.stroke();

    // Arrow on bow
    const pullBack = (powerPercent / 100) * 15;
    ctx.fillStyle = "#333";
    ctx.fillRect(-pullBack - 20, -2, 20, 4);

    // Arrow tip
    ctx.beginPath();
    ctx.moveTo(-pullBack - 20, -4);
    ctx.lineTo(-pullBack - 30, 0);
    ctx.lineTo(-pullBack - 20, 4);
    ctx.fillStyle = "#555";
    ctx.fill();

    ctx.restore();
  };

  /**
   * Draw a simple silhouette for the enemy on the right side.
   * We'll keep the arms more or less neutral; you can animate them if you want.
   */

  const drawEnemyArcher = (x, y) => {
    if (!ctx) return;

    ctx.save();
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;

    // Body (vertical line)
    ctx.beginPath();
    ctx.moveTo(x, y - 60);
    ctx.lineTo(x, y - 100);
    ctx.stroke();

    // Head (circle)
    ctx.beginPath();
    ctx.arc(x, y - 120, 12, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.beginPath();
    ctx.moveTo(x, y - 100);
    ctx.lineTo(x + 15, y - 110); // Back arm (right)
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y - 100);
    ctx.lineTo(x - 25, y - 115); // Front arm (left)
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(x, y - 60);
    ctx.lineTo(x - 10, y);
    ctx.moveTo(x, y - 60);
    ctx.lineTo(x + 10, y);
    ctx.stroke();

    // Bow
    ctx.save();
    ctx.translate(x - 25, y - 115); // Bow anchor point

    // Bow arc (facing left)
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111";
    ctx.arc(0, 0, 20, Math.PI / 2, -Math.PI / 2, false); // Adjusted arc direction
    ctx.stroke();

    // Bow string (right side of arc)
    ctx.beginPath();
    ctx.moveTo(20, -20);
    ctx.lineTo(20, 20);
    ctx.strokeStyle = "#666";
    ctx.stroke();

    ctx.restore(); // Restore bow translation
    ctx.restore(); // Restore overall context
  };

  /**
   * Update arrow position, draw it, and check collisions.
   */
  const updateArrow = (arrow, setArrow, shooter) => {
    if (!arrow || !ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;

    // Draw arrow
    drawArrow(arrow.x, arrow.y, arrow.angle);

    // Move arrow
    arrow.x += arrow.vx;
    arrow.y += arrow.vy;
    arrow.vy += 0.4; // Gravity

    // Check out of bounds
    if (
      arrow.x < 0 ||
      arrow.x > canvas.width ||
      arrow.y < 0 ||
      arrow.y > canvas.height
    ) {
      if (shooter === "Enemy") {
        // Enemy learns from miss
        if (enemyAimRef.current.missDistance > 0) {
          learnFromMiss(enemyAimRef.current.missDistance);
          enemyAimRef.current.missDistance = 0;
        }
      }
      setArrow(null);
      return;
    }

    // Collision check
    if (shooter === "Player") {
      // Check if it hits the enemy
      const dx = arrow.x - positions.enemy.x;
      const dy = arrow.y - (positions.enemy.y - 100);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30) {
        handleHit("Player");
      }
    } else {
      // Enemy arrow => check if it hits the player
      const dx = arrow.x - positions.player.x;
      const dy = arrow.y - (positions.player.y - 100);
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Track miss distance for AI
      if (
        dist < enemyAimRef.current.missDistance ||
        enemyAimRef.current.missDistance === 0
      ) {
        enemyAimRef.current.missDistance = dist;
      }

      if (dist < 30) {
        handleHit("Enemy");
      }
    }
  };

  /**
   * Draw the arrow pointing in the direction of its velocity
   */
  const drawArrow = (x, y, angle) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Shaft
    ctx.fillStyle = "#663300";
    ctx.fillRect(-5, -2, 35, 4);

    // Head
    ctx.fillStyle = "#666";
    ctx.beginPath();
    ctx.moveTo(30, -4);
    ctx.lineTo(40, 0);
    ctx.lineTo(30, 4);
    ctx.fill();

    // Fletching
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(-15, -7);
    ctx.lineTo(-5, 0);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-5, 2);
    ctx.lineTo(-15, 7);
    ctx.lineTo(-5, 0);
    ctx.fill();

    ctx.restore();
  };

  /**
   * Fire arrow from player
   */
  const firePlayerArrow = () => {
    if (roundOver || playerArrow) return;
    setPlayerShots((prev) => prev + 1);

    const startX = positions.player.x + 20;
    const startY = positions.player.y - 120;
    const rad = (angle * Math.PI) / 180;
    const speed = 10 + (power / 100) * 20;

    setPlayerArrow({
      x: startX,
      y: startY,
      vx: speed * Math.cos(rad),
      vy: -speed * Math.sin(rad),
      angle: -rad, // arrow rotation so it faces the direction it's traveling
    });
  };

  /**
   * Fire arrow from enemy
   */
  const fireEnemyArrow = () => {
    if (roundOver || enemyArrow) return;
    setEnemyShots((prev) => prev + 1);

    // Bow anchor point and string position
    const bowAnchorX = positions.enemy.x - 25;
    const bowAnchorY = positions.enemy.y - 115;

    // Arrow starts at the bowstring's center (right side of arc)
    const startX = bowAnchorX + 20; // 20px right of bow anchor
    const startY = bowAnchorY;

    // Calculate angle to player
    const dx = positions.player.x - startX;
    const dy = positions.player.y - 100 - startY; // Target player's body
    const baseAngle = Math.atan2(dy, dx);

    // Apply AI aiming adjustments
    const angle = baseAngle + enemyAimRef.current.lastAngle;
    const speed = enemyAimRef.current.lastSpeed;

    setEnemyArrow({
      x: startX,
      y: startY,
      vx: speed * Math.cos(angle),
      vy: speed * Math.sin(angle),
      angle: angle, // Arrow points in direction of travel
    });
  };

  /**
   * The enemy "learns" from each miss, adjusting angle/speed more aggressively
   */
  const learnFromMiss = (missDistance) => {
    if (roundOver) return;

    // The bigger the miss, the bigger the adjustment
    const factor = enemyAimRef.current.improvementFactor;

    if (missDistance > 100) {
      // Big miss => large random tweak
      enemyAimRef.current.lastAngle +=
        (Math.random() * 0.2 - 0.1) * factor * 10;
      enemyAimRef.current.lastSpeed += (Math.random() * 4 - 2) * factor;
    } else {
      // Smaller miss => finer tweak
      enemyAimRef.current.lastAngle +=
        (Math.random() * 0.1 - 0.05) * factor * 5;
      enemyAimRef.current.lastSpeed += (Math.random() * 2 - 1) * factor;
    }

    // Clamp speed
    enemyAimRef.current.lastSpeed = Math.max(
      10,
      Math.min(30, enemyAimRef.current.lastSpeed)
    );
  };

  /**
   * Called when there's a hit
   */
  const handleHit = (winner) => {
    if (roundOver) return;
    setRoundOver(true);
    setPlayerArrow(null);
    setEnemyArrow(null);

    // Clear enemy shooting interval
    if (enemyIntervalRef.current) {
      clearInterval(enemyIntervalRef.current);
      enemyIntervalRef.current = null;
    }

    if (winner === "Player") {
      setPlayerScore((prev) => prev + 1);
    } else {
      setEnemyScore((prev) => prev + 1);
    }

    setTimeout(() => {
      alert(`${winner} hit the target first!`);
      startNewRound();
    }, 500);
  };

  /**
   * Set up enemy shooting at random intervals (1.5s - 2.5s).
   */
  const setupEnemyShooting = () => {
    if (enemyIntervalRef.current) {
      clearInterval(enemyIntervalRef.current);
    }
    enemyIntervalRef.current = setInterval(() => {
      if (!roundOver && !enemyArrow) {
        fireEnemyArrow();
      }
    }, Math.random() * (2500 - 1500) + 1500);
  };

  return (
    <div className="archery-game-container">
      {/* Scoreboard at the top for each side */}
      <div className="scoreboard-top-left">
        <h3>Player</h3>
        <p>Score: {playerScore}</p>
        <p>Shots: {playerShots}</p>
      </div>

      <div className="scoreboard-top-right">
        <h3>Enemy</h3>
        <p>Score: {enemyScore}</p>
        <p>Shots: {enemyShots}</p>
      </div>

      {/* The main canvas in the middle */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="game-canvas"
      />

      {/* Controls at the bottom */}
      <div className="bottom-controls">
        <div className="slider-group">
          <label>
            Angle: <span>{angle}°</span>
          </label>
          <input
            type="range"
            min="0"
            max="90"
            value={angle}
            onChange={(e) => setAngle(parseInt(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <label>
            Power: <span>{power}</span>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={power}
            onChange={(e) => setPower(parseInt(e.target.value))}
          />
        </div>

        <button
          className="fire-button"
          onClick={firePlayerArrow}
          disabled={!!playerArrow || roundOver}
        >
          Fire!
        </button>
      </div>
    </div>
  );
};

export default ArcheryGame;
