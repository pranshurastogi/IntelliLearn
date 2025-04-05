import React, { useEffect, useRef, useState, useCallback } from "react";
import "./ArcheryGame.css"; // Make sure you have a corresponding CSS file

// --- Constants ---
const NUM_ENEMIES = 4;
const SCALE_FACTOR = 0.7; // Adjust this value (e.g., 0.7 for 70% size)
const MIN_ENEMY_DISTANCE = 60 * SCALE_FACTOR; // Minimum distance between enemy centers
const PLAYER_HIT_RADIUS = 35 * SCALE_FACTOR; // Scaled hit radius
const ENEMY_HIT_RADIUS = 35 * SCALE_FACTOR; // Scaled hit radius
const GRAVITY = 0.3 * SCALE_FACTOR; // Apply scale to gravity for visual consistency? (Optional)
const BASE_ENEMY_SPEED = 15 * Math.sqrt(SCALE_FACTOR); // Adjust speed based on scale
const enemy_firetime = 2000
const enemyPower = [0, 0, 0, 1];
const enemyNames = ["Alpha", "Beta", "Gamma", "Omega"];



const ArcheryGame = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  // No longer need single enemy interval ref
  const [ctx, setCtx] = useState(null);
  const [enemyCanFire, setEnemyCanFire] = useState(false);

  // Game state
  const [roundOver, setRoundOver] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [enemyScore, setEnemyScore] = useState(0);
  const [playerShots, setPlayerShots] = useState(0);
  const [enemyTotalShots, setEnemyTotalShots] = useState(0); // Total shots by all enemies

  // Shot controls
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(50);

  // Arrow objects
  const [playerArrow, setPlayerArrow] = useState(null);
  const [enemyArrows, setEnemyArrows] = useState([]); // Array for multiple enemy arrows { x, y, vx, vy, id, enemyIndex, minMissDistance }

  // Enemy AI memory - Now an array, one for each enemy
  const enemyAiRef = useRef([]); // Will be initialized in startNewRound

  // Positions
  const [positions, setPositions] = useState({
    player: { x: 0, y: 0 },
    enemies: [], // Array for multiple enemies { x, y, id }
  });

  // --- Utility Functions ---

  // Helper to initialize AI state for one enemy
  const createInitialAiState = (index, power = 1) => ({
    id: index,
    lastAngle: 0,
    lastSpeed: BASE_ENEMY_SPEED,
    missDistance: 0,
    improvementFactor: 0.3 + (Math.random() - 0.5) * 0.1,
    nextShotDelay: Math.random() * 1500 + 1000,
    shotsFired: 0,
  
    // NEW:
    power, // 0 or 1
  });

  // --- Memoized Functions ---

  const generateRandomPositions = useCallback((canvas) => {
    if (!canvas) return { player: { x: 0, y: 0 }, enemies: [] };
  
    const minY = canvas.height - 200 * SCALE_FACTOR;
    const maxY = canvas.height - 50 * SCALE_FACTOR;
  
    // 1. Player
    const playerMinX = canvas.width * 0.05;
    const playerMaxX = canvas.width * 0.15;
    const playerX = Math.random() * (playerMaxX - playerMinX) + playerMinX;
    const playerY = Math.random() * (maxY - minY) + minY;
    const playerPos = { x: playerX, y: playerY };
  
    // 2. Enemies
    const enemies = [];
    const enemyPlacementAttempts = 100;
    const safeZoneFromPlayer = MIN_ENEMY_DISTANCE * 1.5;
  
    const enemyMinX = playerMaxX + 50 * SCALE_FACTOR;
    const enemyMaxX = canvas.width - 50 * SCALE_FACTOR;
  
    for (let i = 0; i < NUM_ENEMIES; i++) {
      let enemyX, enemyY;
      let validPosition = false;
      let attempts = 0;
  
      while (!validPosition && attempts < enemyPlacementAttempts) {
        attempts++;
        enemyX = Math.random() * (enemyMaxX - enemyMinX) + enemyMinX;
        enemyY = Math.random() * (maxY - minY) + minY;
  
        // Check distance from player
        const dxPlayer = enemyX - playerPos.x;
        const dyPlayer = enemyY - playerPos.y;
        if (Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer) < safeZoneFromPlayer) {
          continue; 
        }
  
        // Check distance from other enemies
        let tooCloseToOtherEnemy = false;
        for (let j = 0; j < enemies.length; j++) {
          const dxEnemy = enemyX - enemies[j].x;
          const dyEnemy = enemyY - enemies[j].y;
          if (Math.sqrt(dxEnemy * dxEnemy + dyEnemy * dyEnemy) < MIN_ENEMY_DISTANCE) {
            tooCloseToOtherEnemy = true;
            break;
          }
        }
  
        if (!tooCloseToOtherEnemy) {
          validPosition = true;
        }
      }
  
      if (validPosition) {
        // Attach a name from enemyNames[i]
        enemies.push({ x: enemyX, y: enemyY, id: i, name: enemyNames[i] });
      } else {
        console.warn(`Could not place enemy ${i} without overlap after ${enemyPlacementAttempts} attempts.`);
        enemies.push({ x: enemyX, y: enemyY, id: i, name: enemyNames[i] });
      }
    }
  
    return { player: playerPos, enemies };
  }, []);
   // SCALE_FACTOR and NUM_ENEMIES are constants, MIN_ENEMY_DISTANCE is constant

  // Fire an enemy arrow for a specific enemy
  const fireEnemyArrow = useCallback(
    (enemyIndex) => {
      // Guard conditions
      const enemy = positions.enemies[enemyIndex];
      const enemyAi = enemyAiRef.current[enemyIndex];
      if (
        roundOver ||
        !enemy ||
        !enemyAi ||
        enemyArrows.some((arrow) => arrow.enemyIndex === enemyIndex)
      ) {
        // console.log(`Skipping fire for enemy ${enemyIndex}: roundOver=${roundOver}, no enemy=${!enemy}, no AI=${!enemyAi}, arrowExists=${enemyArrows.some(arrow => arrow.enemyIndex === enemyIndex)}`);
        return;
      }

      enemyAi.shotsFired++;
      setEnemyTotalShots((prev) => prev + 1); // Increment total count

      // --- Calculate Arrow Start Position (Scaled) ---
      const bodyTopOffsetY = -100 * SCALE_FACTOR;
      const armLength = 25 * SCALE_FACTOR;
      const frontArmX = enemy.x - armLength; // Arm reaching left towards player
      const frontArmY = enemy.y + bodyTopOffsetY - 5 * SCALE_FACTOR; // Adjusted Y
      const bowAnchorX = frontArmX;
      const bowAnchorY = frontArmY;

      // Target the player's head/upper body (scaled)
      const targetX = positions.player.x;
      const targetY = positions.player.y - 100 * SCALE_FACTOR; // Aim at scaled player height
      const dx = targetX - bowAnchorX;
      const dy = targetY - bowAnchorY;
      const baseAngleRad = Math.atan2(dy, dx);

      const launchAngleRad = baseAngleRad + enemyAi.lastAngle;
      const launchSpeed = enemyAi.lastSpeed;

      const startX = bowAnchorX;
      const startY = bowAnchorY;

      // console.log(`Enemy ${enemyIndex} Firing: Start=(${startX.toFixed(1)}, ${startY.toFixed(1)}), TargetAngle=${baseAngleRad.toFixed(2)}, Final Angle=${launchAngleRad.toFixed(2)}, Speed=${launchSpeed.toFixed(2)}`);

      const newArrow = {
        x: startX,
        y: startY,
        vx: launchSpeed * Math.cos(launchAngleRad),
        vy: launchSpeed * Math.sin(launchAngleRad),
        id: Date.now() + Math.random(),
        enemyIndex,
        minMissDistance: Infinity,
    
        // NEW: carry over the enemy’s power
        power: enemyAi.power,
      };

      setEnemyArrows((prev) => [...prev, newArrow]); // Add new arrow immutably
      enemyAi.missDistance = 0; // Reset miss distance for the AI's *next* learning cycle
      enemyAi.nextShotDelay = Math.random() * 2000 + 1500; // Reset delay for next shot
    },
    [roundOver, positions, enemyArrows]
  ); // Dependencies

  // Start a new round
  const startNewRound = useCallback(() => {
    console.log("startNewRound called: Resetting state.");
    setRoundOver(false);
    setPlayerShots(0);
    setEnemyTotalShots(0);
    setPlayerArrow(null);
    setEnemyArrows([]);

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const newPositions = generateRandomPositions(canvas);
      setPositions(newPositions);

      // Initialize AI
      enemyAiRef.current = Array.from({ length: NUM_ENEMIES }, (_, i) => {
        // Example: randomly assign 0 or 1
        // const randomPower = Math.random() < 0.5 ? 0 : 1;
        return createInitialAiState(i, enemyPower[i]);
      });
      console.log("Initialized Enemy AI states:", enemyAiRef.current);
    }

    // Prevent enemies from firing immediately
    setEnemyCanFire(false);

    // After 2 seconds, allow enemies to fire
    setTimeout(() => {
      setEnemyCanFire(true);
    }, enemy_firetime);
  }, [generateRandomPositions]);

  // Enemy learns from misses (needs enemy index)
  const learnFromMiss = useCallback(
    (enemyIndex, missDistance) => {
      if (roundOver || !enemyAiRef.current[enemyIndex]) return;

      const enemyAi = enemyAiRef.current[enemyIndex];
      const factor = enemyAi.improvementFactor;
      let angleChange = 0;
      let speedChange = 0;

      // Simplified learning: Adjust based on how far the miss was
      const missSeverity = Math.min(
        1,
        missDistance / (canvasRef.current?.width * 0.3 || 300)
      ); // Normalized miss

      angleChange = (Math.random() - 0.5) * 0.15 * factor * (1 + missSeverity); // More random adjustments for bigger misses
      speedChange = (Math.random() - 0.5) * 2.5 * factor * (1 + missSeverity);

      // Apply some bias based on miss direction (basic - needs refinement if positions change drastically)
      // This is tricky without knowing *where* the arrow went relative to the target.
      // A simple approach: if missDistance is large, maybe speed was way off. If small, maybe angle.
      if (missDistance > 150 * SCALE_FACTOR) {
        speedChange *= 1.5; // Prioritize speed change for large misses
      } else if (missDistance < 50 * SCALE_FACTOR) {
        angleChange *= 1.5; // Prioritize angle change for near misses
      }

      enemyAi.lastAngle += angleChange;
      enemyAi.lastSpeed += speedChange;
      // Clamp speed to reasonable values
      enemyAi.lastSpeed = Math.max(
        BASE_ENEMY_SPEED * 0.7,
        Math.min(BASE_ENEMY_SPEED * 1.8, enemyAi.lastSpeed)
      );

      // console.log(`Enemy ${enemyIndex} learned: MissDist=${missDistance.toFixed(0)}, AngleAdj=${angleChange.toFixed(3)}, SpeedAdj=${speedChange.toFixed(2)} => New AngleOffset=${enemyAi.lastAngle.toFixed(3)}, New Speed=${enemyAi.lastSpeed.toFixed(2)}`);
    },
    [roundOver]
  ); // Dependencies

  // Handle a hit event (Player hits Enemy, or Enemy hits Player)
  const handleHit = useCallback(
    (winner, targetInfo = null) => {
      // targetInfo could be enemyIndex if player hits enemy
      if (roundOver) return;
      console.log(`${winner} HIT! Round over.`);
      setRoundOver(true);
      setPlayerArrow(null); // Stop player arrow immediately
      // Keep enemy arrows flying for a moment visually? Or stop them too? Let's stop them.
      setEnemyArrows([]); // Clear all enemy arrows on hit

      if (winner === "Player") {
        setPlayerScore((prev) => prev + 1);
        // Maybe visually mark the hit enemy? (Future enhancement)
        console.log("Player hit enemy:", targetInfo); // Log which enemy was hit (if needed)
      } else {
        // Enemy hit Player
        setEnemyScore((prev) => prev + 1);
        console.log("Enemy hit player:", targetInfo); // Log which enemy arrow hit (if needed)
      }

      setTimeout(() => {
        alert(`${winner} hit the target first!`);
        startNewRound(); // Prepare for the next round
      }, 500); // Short delay before alert and reset
    },
    [roundOver, startNewRound]
  );

  // Draw the arrow graphic (scaled)
  const drawArrow = useCallback(
    (x, y, angle) => {
      if (!ctx) return;
      const arrowLength = 30 * SCALE_FACTOR;
      const shaftWidth = 3 * SCALE_FACTOR;
      const headLength = 8 * SCALE_FACTOR;
      const headWidth = 4 * SCALE_FACTOR;
      const fletchingLength = 10 * SCALE_FACTOR;
      const fletchingWidth = 5 * SCALE_FACTOR;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = "#8B4513"; // SaddleBrown shaft
      ctx.fillRect(
        -arrowLength * 0.6,
        -shaftWidth / 2,
        arrowLength * 0.8,
        shaftWidth
      ); // ShiftedfillRect
      ctx.fillStyle = "#A9A9A9"; // DarkGray head
      ctx.beginPath();
      const headBaseX = arrowLength * 0.2; // Base of the head relative to center
      ctx.moveTo(headBaseX, -headWidth);
      ctx.lineTo(headBaseX + headLength, 0);
      ctx.lineTo(headBaseX, headWidth);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#F5F5DC"; // Beige fletching
      const fletchingBaseX = -arrowLength * 0.6;
      ctx.beginPath();
      ctx.moveTo(fletchingBaseX + fletchingLength, -shaftWidth / 2);
      ctx.lineTo(fletchingBaseX, -fletchingWidth);
      ctx.lineTo(fletchingBaseX, -shaftWidth / 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fletchingBaseX + fletchingLength, shaftWidth / 2);
      ctx.lineTo(fletchingBaseX, fletchingWidth);
      ctx.lineTo(fletchingBaseX, shaftWidth / 2);
      ctx.fill();
      ctx.restore();
    },
    [ctx]
  ); // Removed SCALE_FACTOR dependency

  // Draw the player archer (scaled)
  const drawPlayerArcher = useCallback(
    (x, y, angleDeg, powerPercent) => {
      if (!ctx) return;
      ctx.save();
      ctx.fillStyle = "blue";
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 4 * SCALE_FACTOR;
      const headRadius = 12 * SCALE_FACTOR;
      const bodyTopOffsetY = -100 * SCALE_FACTOR;
      const bodyBottomOffsetY = -60 * SCALE_FACTOR;
      const headOffsetY = y + bodyTopOffsetY - headRadius * 1.5; // Adjusted head pos
      const groundY = y;
      const armLength = 25 * SCALE_FACTOR;
      const bowRadius = 20 * SCALE_FACTOR;
      const legSpread = 10 * SCALE_FACTOR;

      const bodyTopY = y + bodyTopOffsetY;
      const bodyBottomY = y + bodyBottomOffsetY;

      ctx.beginPath();
      ctx.moveTo(x, bodyBottomY);
      ctx.lineTo(x, bodyTopY);
      ctx.stroke(); // Body
      ctx.beginPath();
      ctx.arc(x, headOffsetY, headRadius, 0, Math.PI * 2);
      ctx.fill(); // Head
      ctx.beginPath();
      ctx.moveTo(x, bodyBottomY);
      ctx.lineTo(x - legSpread, groundY);
      ctx.stroke(); // Leg 1
      ctx.beginPath();
      ctx.moveTo(x, bodyBottomY);
      ctx.lineTo(x + legSpread, groundY);
      ctx.stroke(); // Leg 2
      ctx.beginPath();
      ctx.moveTo(x, bodyTopY);
      ctx.lineTo(x - 15 * SCALE_FACTOR, bodyTopY - 10 * SCALE_FACTOR);
      ctx.stroke(); // Back Arm

      const angleRad = (-angleDeg * Math.PI) / 180;
      const armEndX = x + armLength * Math.cos(angleRad);
      const armEndY = bodyTopY + armLength * Math.sin(angleRad);
      ctx.beginPath();
      ctx.moveTo(x, bodyTopY);
      ctx.lineTo(armEndX, armEndY);
      ctx.stroke(); // Front Arm (Bow Arm)

      // --- Bow and Arrow ---
      ctx.save(); // Save context before moving to arm end
      ctx.translate(armEndX, armEndY); // Move origin to hand position
      ctx.rotate(angleRad); // Rotate context to match arm angle

      // Draw Bow
      ctx.lineWidth = 3 * SCALE_FACTOR;
      ctx.strokeStyle = "#8B4513"; // Brown bow
      ctx.beginPath();
      ctx.arc(0, 0, bowRadius, Math.PI / 2, -Math.PI / 2, true);
      ctx.stroke(); // Bow arc

      // Draw Bow String
      const pullBack = (powerPercent / 100) * (15 * SCALE_FACTOR); // Scaled pullback
      ctx.lineWidth = 1 * SCALE_FACTOR;
      ctx.strokeStyle = "#A9A9A9"; // Grey string
      ctx.beginPath();
      ctx.moveTo(0, -bowRadius);
      ctx.lineTo(-pullBack, 0);
      ctx.lineTo(0, bowRadius);
      ctx.stroke(); // Drawn string

      // Nocked Arrow Visual (aligned with string)
      const visualArrowLength = 30 * SCALE_FACTOR;
      const visualArrowYOffset = 0; // Align center with string pull point
      const visualArrowShaftWidth = 3 * SCALE_FACTOR;
      const visualHeadLength = 8 * SCALE_FACTOR;
      const visualHeadWidth = 5 * SCALE_FACTOR;

      ctx.fillStyle = "#D2691E"; // Arrow shaft color (e.g., Chocolate)
      ctx.fillRect(
        -pullBack - visualArrowLength * 0.8,
        visualArrowYOffset - visualArrowShaftWidth / 2,
        visualArrowLength,
        visualArrowShaftWidth
      ); // Shaft

      ctx.fillStyle = "#696969"; // Arrow head color (e.g., DimGray)
      ctx.beginPath();
      const headStartX =
        -pullBack - visualArrowLength * 0.8 + visualArrowLength; // Tip of the shaft
      ctx.moveTo(headStartX, visualArrowYOffset - visualHeadWidth / 2);
      ctx.lineTo(headStartX + visualHeadLength, visualArrowYOffset);
      ctx.lineTo(headStartX, visualArrowYOffset + visualHeadWidth / 2);
      ctx.closePath();
      ctx.fill(); // Head

      ctx.restore(); // Restore context translation/rotation for bow/arrow
      ctx.restore(); // Restore context before player draw
    },
    [ctx]
  ); // Removed angle, power, SCALE_FACTOR dependency

  // Draw an enemy archer (scaled)
  const drawEnemyArcher = useCallback((x, y, name) => {
    if (!ctx) return;
  
    ctx.save();
  
    // Basic styling
    ctx.fillStyle = "red";
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4 * SCALE_FACTOR;
  
    // Body metrics
    const headRadius = 12 * SCALE_FACTOR;
    const bodyTopOffsetY = -100 * SCALE_FACTOR;
    const bodyBottomOffsetY = -60 * SCALE_FACTOR;
    const headOffsetY = y + bodyTopOffsetY - headRadius * 1.5;
    const groundY = y; // "Ground" for this stick figure
    const armLength = 25 * SCALE_FACTOR;
    const bowRadius = 20 * SCALE_FACTOR;
    const legSpread = 10 * SCALE_FACTOR;
  
    const bodyTopY = y + bodyTopOffsetY;
    const bodyBottomY = y + bodyBottomOffsetY;
  
    // --- Body ---
    ctx.beginPath();
    ctx.moveTo(x, bodyBottomY);
    ctx.lineTo(x, bodyTopY);
    ctx.stroke();
  
    // --- Head ---
    ctx.beginPath();
    ctx.arc(x, headOffsetY, headRadius, 0, Math.PI * 2);
    ctx.fill();
  
    // --- Legs ---
    ctx.beginPath();
    ctx.moveTo(x, bodyBottomY);
    ctx.lineTo(x - legSpread, groundY);
    ctx.stroke();
  
    ctx.beginPath();
    ctx.moveTo(x, bodyBottomY);
    ctx.lineTo(x + legSpread, groundY);
    ctx.stroke();
  
    // --- Arms (facing left) ---
    const frontArmX = x - armLength;
    const frontArmY = bodyTopY - 5 * SCALE_FACTOR;
    // Arm holding the bow
    ctx.beginPath();
    ctx.moveTo(x, bodyTopY);
    ctx.lineTo(frontArmX, frontArmY);
    ctx.stroke();
    // Back arm (for a little shape)
    ctx.beginPath();
    ctx.moveTo(x, bodyTopY);
    ctx.lineTo(x + 15 * SCALE_FACTOR, bodyTopY - 10 * SCALE_FACTOR);
    ctx.stroke();
  
    // --- Bow ---
    ctx.save();
    ctx.translate(frontArmX, frontArmY);
    ctx.lineWidth = 3 * SCALE_FACTOR;
    ctx.strokeStyle = "#8B4513"; // Brown
    ctx.beginPath();
    // Arc from -90° to +90° to form bow facing left
    ctx.arc(0, 0, bowRadius, Math.PI / 2, -Math.PI / 2, false);
    ctx.stroke();
  
    // Bow string
    ctx.lineWidth = 1 * SCALE_FACTOR;
    ctx.strokeStyle = "#A9A9A9"; // Gray
    ctx.beginPath();
    ctx.moveTo(0, -bowRadius);
    ctx.lineTo(0, bowRadius);
    ctx.stroke();
  
    ctx.restore(); // Restore after bow
  
    // --- Draw Enemy Name above head ---
    ctx.save();
    ctx.font = `${14 * SCALE_FACTOR}px Arial`;
    ctx.fillStyle = "black";
  
    // Measure the text for horizontal centering
    const textWidth = ctx.measureText(name).width;
    // Place text above the head
    const textX = x - (textWidth / 2);
    const textY = headOffsetY - (20 * SCALE_FACTOR); // 10px above head
  
    ctx.fillText(name, textX, textY);
    ctx.restore();
  
    ctx.restore(); // Restore main context
  }, [ctx]);
   // Removed SCALE_FACTOR dependency

  // Draw the entire game scene
  const drawGame = useCallback(() => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Sky
    const groundHeight = 50 * SCALE_FACTOR;
    ctx.fillStyle = "#228B22";
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight); // Ground

    // Draw Player
    if (positions.player.x > 0) {
      drawPlayerArcher(positions.player.x, positions.player.y, angle, power);
    }

    // Draw Enemies
    positions.enemies.forEach((enemy) => {
      drawEnemyArcher(enemy.x, enemy.y,enemy.name);
    });

    // Draw Player Arrow
    if (playerArrow) {
      const currentAngle = Math.atan2(playerArrow.vy, playerArrow.vx);
      drawArrow(playerArrow.x, playerArrow.y, currentAngle);
    }
    // Draw Enemy Arrows
    enemyArrows.forEach((arrow) => {
      const currentAngle = Math.atan2(arrow.vy, arrow.vx);
      drawArrow(arrow.x, arrow.y, currentAngle);
    });
  }, [
    ctx,
    positions,
    angle,
    power,
    playerArrow,
    enemyArrows,
    drawPlayerArcher,
    drawEnemyArcher,
    drawArrow,
  ]);

  // Fire the player's arrow (scaled position)
  const firePlayerArrow = useCallback(() => {
    if (roundOver || playerArrow || positions.player.x <= 0) return;
    setPlayerShots((prev) => prev + 1);

    const angleRad = (-angle * Math.PI) / 180;
    const armLength = 25 * SCALE_FACTOR;
    const bodyTopOffsetY = -100 * SCALE_FACTOR;
    const bodyTopY = positions.player.y + bodyTopOffsetY;

    // Calculate the hand position based on scaled drawing
    const armEndX = positions.player.x + armLength * Math.cos(angleRad);
    const armEndY = bodyTopY + armLength * Math.sin(angleRad);

    // Start arrow slightly ahead of the calculated hand position (bow center)
    const arrowOffset = 10 * SCALE_FACTOR;
    const startX = armEndX + arrowOffset * Math.cos(angleRad);
    const startY = armEndY + arrowOffset * Math.sin(angleRad);

    // Adjust speed based on power and maybe scale factor
    const baseSpeed = 10 * Math.sqrt(SCALE_FACTOR);
    const powerMultiplier = 20 * Math.sqrt(SCALE_FACTOR);
    const speed = baseSpeed + (power / 100) * powerMultiplier;

    setPlayerArrow({
      x: startX,
      y: startY,
      vx: speed * Math.cos(angleRad),
      vy: speed * Math.sin(angleRad),
      id: Date.now(), // Give player arrow an ID too
    });
  }, [roundOver, playerArrow, positions, angle, power]);

  // --- Effects ---

  // Effect 1: Initialize context
  useEffect(() => {
    console.log("Game component mounted");
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas ref not found on mount");
      return;
    }
    const context = canvas.getContext("2d");
    setCtx(context);
    console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
    // Start the first round automatically *after* context is set
    startNewRound();
    return () => {
      console.log("Game component unmounting");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Effect 2: Main game loop (Animation, Physics, AI Shooting Trigger)
  useEffect(() => {
    if (!ctx) return; // We need a rendering context
  
    let lastTimestamp = 0;
    let isActive = true; // Flag to stop animation on cleanup
  
    // Main animation/physics loop
    const animate = (timestamp) => {
      if (!isActive || !ctx) return;
  
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
  
      if (!roundOver) {
        // --- Enemy Shooting Logic (only if enemies are allowed to fire) ---
        //   e.g., if you have a state [enemyCanFire] that is true after 2s
        if (deltaTime > 0 && enemyCanFire && enemyAiRef.current.length === NUM_ENEMIES) {
          enemyAiRef.current.forEach((aiState, index) => {
            aiState.nextShotDelay -= deltaTime;
            if (aiState.nextShotDelay <= 0) {
              // Check if this enemy already has an arrow in flight
              const hasArrow = enemyArrows.some(arrow => arrow.enemyIndex === index);
              if (!hasArrow && positions.enemies[index]) {
                fireEnemyArrow(index);
              } else {
                // If we can't fire now, try again soon
                if (hasArrow) aiState.nextShotDelay = 200;
              }
            }
          });
        }
  
        // --- Physics Updates ---
        const canvas = canvasRef.current;
        const groundY = canvas ? canvas.height - 50 * SCALE_FACTOR : Infinity;
        const outOfBoundsMargin = 50 * SCALE_FACTOR;
  
        // --- Player Arrow Physics ---
        if (playerArrow) {
          const newVx = playerArrow.vx;
          const newVy = playerArrow.vy + GRAVITY;
          const newX = playerArrow.x + newVx;
          const newY = playerArrow.y + newVy;
  
          // Check if player arrow is out-of-bounds or hits ground
          if (
            !canvas ||
            newX < -outOfBoundsMargin ||
            newX > canvas.width + outOfBoundsMargin ||
            newY > groundY
          ) {
            // Remove the arrow
            setPlayerArrow(null);
          } else {
            // Check collision with Enemies
            let hitEnemyIndex = -1;
            for (let i = 0; i < positions.enemies.length; i++) {
              const enemy = positions.enemies[i];
              // Approximate the enemy's center
              const enemyCenterY = enemy.y - 100 * SCALE_FACTOR; 
              const dx = newX - enemy.x;
              const dy = newY - enemyCenterY;
              if (Math.sqrt(dx * dx + dy * dy) < ENEMY_HIT_RADIUS) {
                hitEnemyIndex = i;
                break;
              }
            }
  
            if (hitEnemyIndex !== -1) {
              // Player hits enemy
              handleHit("Player", { enemyIndex: hitEnemyIndex });
              // handleHit typically sets roundOver = true, resets arrows, etc.
            } else {
              // Update the arrow’s position
              setPlayerArrow({
                ...playerArrow,
                x: newX,
                y: newY,
                vx: newVx,
                vy: newVy
              });
            }
          }
        }
  
        // --- Enemy Arrows Physics (with collision power check) ---
        if (enemyArrows.length > 0) {
          const nextEnemyArrows = enemyArrows
            .map(arrow => {
              const newVx = arrow.vx;
              const newVy = arrow.vy + GRAVITY;
              const newX = arrow.x + newVx;
              const newY = arrow.y + newVy;
  
              // Check collision with Player
              const playerCenterY = positions.player.y - 100 * SCALE_FACTOR;
              const dxPlayer = newX - positions.player.x;
              const dyPlayer = newY - playerCenterY;
              const distPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer);
  
              // Track arrow’s closest distance (for AI learning)
              const currentMinMiss = Math.min(arrow.minMissDistance, distPlayer);
  
              // If arrow is within hit radius:
              if (distPlayer < PLAYER_HIT_RADIUS) {
                // Only trigger an enemy hit if arrow has power=1
                if (arrow.power === 1) {
                  handleHit("Enemy", {
                    enemyIndex: arrow.enemyIndex,
                    arrowId: arrow.id
                  });
                }
                // Either way, remove the arrow from play
                return null;
              }
  
              // If arrow is out-of-bounds or hits the ground
              if (
                !canvas ||
                newX < -outOfBoundsMargin ||
                newX > canvas.width + outOfBoundsMargin ||
                newY > groundY
              ) {
                // Let the enemy learn from its miss
                if (enemyAiRef.current[arrow.enemyIndex]) {
                  learnFromMiss(arrow.enemyIndex, currentMinMiss);
                }
                return null;
              }
  
              // Otherwise, keep updating arrow position
              return {
                ...arrow,
                x: newX,
                y: newY,
                vx: newVx,
                vy: newVy,
                minMissDistance: currentMinMiss
              };
            })
            .filter(arrow => arrow !== null);
  
          // If the new array differs, update state
          if (nextEnemyArrows.length !== enemyArrows.length) {
            setEnemyArrows(nextEnemyArrows);
          } else {
            // Optional optimization check for any position changes
            let changed = false;
            for (let i = 0; i < nextEnemyArrows.length; i++) {
              if (
                nextEnemyArrows[i].x !== enemyArrows[i].x ||
                nextEnemyArrows[i].y !== enemyArrows[i].y
              ) {
                changed = true;
                break;
              }
            }
            if (changed) setEnemyArrows(nextEnemyArrows);
          }
        }
      }
  
      // --- Drawing (always draw current state) ---
      drawGame();
  
      // Request next frame
      requestRef.current = requestAnimationFrame(animate);
    };
  
    // Kick off animation
    requestRef.current = requestAnimationFrame(animate);
  
    // Cleanup on unmount or re-render
    return () => {
      isActive = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [
    // Dependencies
    ctx,
    roundOver,
    enemyCanFire,      // if you have state controlling when enemies can fire
    playerArrow,
    enemyArrows,
    positions,
    angle,
    power,
    handleHit,
    learnFromMiss,
    drawGame,
    fireEnemyArrow,
    startNewRound
  ]);
  

  // --- Render JSX ---
  return (
    <div className="archery-game-container">
      {/* Scoreboards */}
      <div className="scoreboard scoreboard-top-left">
        <h3>Player</h3>
        <p>Score: {playerScore}</p>
        <p>Shots: {playerShots}</p>
      </div>
      <div className="scoreboard scoreboard-top-right">
        <h3>Enemies</h3>
        <p>Score: {enemyScore}</p>
        <p>Shots: {enemyTotalShots}</p>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={1000} // Keep canvas size fixed
        height={600}
        className="game-canvas"
        style={{ border: "1px solid black", background: "#f0f0f0" }}
      />

      {/* Controls Area */}
      <div className="controls-area">
        {!roundOver && ctx && positions.player.x !== 0 && (
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
                disabled={!!playerArrow}
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
                disabled={!!playerArrow}
              />
            </div>
            <button
              className="fire-button"
              onClick={firePlayerArrow}
              disabled={!!playerArrow}
            >
              Fire!
            </button>
          </div>
        )}
        {roundOver && (
          <div className="round-over-message">
            Round Over! Starting next round...
          </div>
        )}
        {!ctx && <div className="loading-message">Loading Game...</div>}
      </div>
    </div>
  );
};

export default ArcheryGame;
