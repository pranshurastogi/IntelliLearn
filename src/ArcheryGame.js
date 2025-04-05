import React, { useEffect, useRef, useState, useCallback } from "react";
import "./ArcheryGame.css"; // Make sure you have the updated CSS file

// --- Constants ---
const NUM_ENEMIES = 4;
// NOTE: SCALE_FACTOR might need adjustment or removal if using fixed pixel sizes for new assets
const SCALE_FACTOR = 0.7;
const MIN_ENEMY_DISTANCE = 80 * SCALE_FACTOR; // Increase min distance slightly for platforms
const PLAYER_HIT_RADIUS = 25 * SCALE_FACTOR; // Adjusted hit radius for potentially smaller black figures
const ENEMY_HIT_RADIUS = 25 * SCALE_FACTOR; // Adjusted hit radius
const GRAVITY = 0.25 * SCALE_FACTOR; // Slightly adjust gravity if needed
const BASE_ENEMY_SPEED = 14 * Math.sqrt(SCALE_FACTOR);
const enemy_firetime = 2000;
const enemyPower = [0, 0, 0, 1]; // Example: Only Omega has power=1
const enemyNames = ["Alpha", "Beta", "Gamma", "Omega"];

// New Theme Colors
// Revised Theme Colors (place this near the top of ArcheryGame.js)
// --- Theme Colors (Consolidated) ---
const THEME_COLORS = {
  // Background & Scenery
  BACKGROUND: "#383838",
  LAVA: "#ff4757",
  LAVA_SPARK: "rgba(255, 220, 100, 0.9)",
  MOUNTAIN: "#2a2a2a",
  MOON: "#d5d5d5",
  MOON_CRATER: "rgba(255, 255, 255, 0.18)",

  // Platforms & UI Elements
  PLATFORM: "#181818",
  PLAYER_HEALTH_BAR: "#0090ff",
  ENEMY_HEALTH_BAR: "#888888",
  TEXT: "#ffffff",

  // Player (Silhouette Style)
  PLAYER_SILHOUETTE: "#5a3d2b",
  // QUIVER_FILL removed
  // QUIVER_OUTLINE removed
  // ARROW_FLETCHING removed
  NOCKED_ARROW_SHAFT: "#a4785f",
  NOCKED_ARROW_HEAD: "#666666",

  // Enemy (Stick Figure Style)
  ENEMY: "black",
  ENEMY_ACCENT: "#ff6b6b",
  BOW: "#c87d33",

  // Shared / Projectiles
  BOW_STRING: "#dddddd",
  ARROW: "#f5f5f5",
  ARROW_HEAD: "#b0b0b0",
};

const ArcheryGame = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [enemyCanFire, setEnemyCanFire] = useState(false);

  // Game state
  const [roundOver, setRoundOver] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [enemyScore, setEnemyScore] = useState(0);
  const [playerShots, setPlayerShots] = useState(0);
  const [enemyTotalShots, setEnemyTotalShots] = useState(0);

  // Shot controls
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(50);

  // Arrow objects
  const [playerArrow, setPlayerArrow] = useState(null);
  const [enemyArrows, setEnemyArrows] = useState([]);

  // Enemy AI memory
  const enemyAiRef = useRef([]);

  // Positions (now includes platform info implicitly via Y)
  const [positions, setPositions] = useState({
    player: { x: 0, y: 0, platformY: 0 }, // Added platformY
    enemies: [], // { x, y, id, name, platformY }
  });

  // Platform dimensions
  const PLATFORM_HEIGHT = 15 * SCALE_FACTOR;
  const PLATFORM_WIDTH = 60 * SCALE_FACTOR;
  const CHARACTER_FOOT_OFFSET = 5 * SCALE_FACTOR; // How high feet are above platformY

  // --- Utility Functions ---
  const createInitialAiState = (index, power = 1) => ({
    id: index,
    lastAngle: 0,
    lastSpeed: BASE_ENEMY_SPEED * (0.8 + Math.random() * 0.4), // Add variability
    missDistance: 0,
    improvementFactor: 0.25 + (Math.random() - 0.5) * 0.1,
    nextShotDelay: Math.random() * 1500 + 1000,
    shotsFired: 0,
    power, // 0 or 1
  });

  // --- Memoized Functions ---

  const generateRandomPositions = useCallback(
    (canvas) => {
      if (!canvas) return { player: { x: 0, y: 0, platformY: 0 }, enemies: [] };

      // Define vertical range for *platforms*
      const platformMinY = canvas.height * 0.65;
      const platformMaxY = canvas.height - PLATFORM_HEIGHT - 50 * SCALE_FACTOR; // Leave space for lava

      // 1. Player Platform
      const playerMinX = canvas.width * 0.05 + PLATFORM_WIDTH / 2;
      const playerMaxX = canvas.width * 0.15 - PLATFORM_WIDTH / 2;
      const playerPlatformX =
        Math.random() * (playerMaxX - playerMinX) + playerMinX;
      const playerPlatformY =
        Math.random() * (platformMaxY - platformMinY) + platformMinY;
      const playerPos = {
        x: playerPlatformX, // Character X is platform center
        platformY: playerPlatformY,
        y: playerPlatformY - CHARACTER_FOOT_OFFSET, // Character Y based on platform
      };

      // 2. Enemy Platforms
      const enemies = [];
      const enemyPlacementAttempts = 100;
      const safeZoneFromPlayer = MIN_ENEMY_DISTANCE * 1.2;
      const enemyMinX = playerMaxX + 50 * SCALE_FACTOR + PLATFORM_WIDTH / 2;
      const enemyMaxX = canvas.width - 50 * SCALE_FACTOR - PLATFORM_WIDTH / 2;

      for (let i = 0; i < NUM_ENEMIES; i++) {
        let enemyPlatformX, enemyPlatformY;
        let validPosition = false;
        let attempts = 0;

        while (!validPosition && attempts < enemyPlacementAttempts) {
          attempts++;
          enemyPlatformX = Math.random() * (enemyMaxX - enemyMinX) + enemyMinX;
          enemyPlatformY =
            Math.random() * (platformMaxY - platformMinY) + platformMinY;

          // Check distance from player platform center
          const dxPlayer = enemyPlatformX - playerPos.x;
          // const dyPlayer = enemyPlatformY - playerPos.platformY; // Y distance less critical here
          if (Math.abs(dxPlayer) < safeZoneFromPlayer) {
            continue;
          }

          // Check distance from other enemy platform centers
          let tooCloseToOtherEnemy = false;
          for (let j = 0; j < enemies.length; j++) {
            const dxEnemy = enemyPlatformX - enemies[j].x;
            // const dyEnemy = enemyPlatformY - enemies[j].platformY;
            if (Math.abs(dxEnemy) < MIN_ENEMY_DISTANCE) {
              tooCloseToOtherEnemy = true;
              break;
            }
          }

          if (!tooCloseToOtherEnemy) {
            validPosition = true;
          }
        }

        if (validPosition) {
          enemies.push({
            x: enemyPlatformX,
            platformY: enemyPlatformY,
            y: enemyPlatformY - CHARACTER_FOOT_OFFSET, // Set character Y
            id: i,
            name: enemyNames[i],
          });
        } else {
          console.warn(`Could not place enemy ${i} optimally.`);
          // Place it anyway, might overlap slightly
          enemies.push({
            x: enemyPlatformX,
            platformY: enemyPlatformY,
            y: enemyPlatformY - CHARACTER_FOOT_OFFSET,
            id: i,
            name: enemyNames[i],
          });
        }
      }

      return { player: playerPos, enemies };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      SCALE_FACTOR,
      NUM_ENEMIES,
      MIN_ENEMY_DISTANCE,
      PLATFORM_WIDTH,
      PLATFORM_HEIGHT,
      CHARACTER_FOOT_OFFSET,
    ]
  ); // Add new dependencies

  // Fire an enemy arrow
  const fireEnemyArrow = useCallback(
    (enemyIndex) => {
      const enemy = positions.enemies[enemyIndex];
      const enemyAi = enemyAiRef.current[enemyIndex];
      if (
        roundOver ||
        !enemy ||
        !enemyAi ||
        enemyArrows.some((arrow) => arrow.enemyIndex === enemyIndex)
      ) {
        return;
      }

      enemyAi.shotsFired++;
      setEnemyTotalShots((prev) => prev + 1);

      // Character dimensions (relative to enemy.x, enemy.y)
      const bodyTopOffsetY = -60 * SCALE_FACTOR; // Adjusted for new style
      const armLength = 20 * SCALE_FACTOR;

      // Aiming from the bow position (left side of enemy)
      const bowAnchorX = enemy.x - armLength * 0.5; // Approx bow center X
      const bowAnchorY = enemy.y + bodyTopOffsetY; // Approx bow center Y

      // Target player's center mass
      const targetX = positions.player.x;
      const targetY = positions.player.y - 30 * SCALE_FACTOR; // Aim slightly higher than feet
      const dx = targetX - bowAnchorX;
      const dy = targetY - bowAnchorY;

      // Calculate base angle + AI adjustment
      const baseAngleRad = Math.atan2(dy, dx);
      const launchAngleRad = baseAngleRad + enemyAi.lastAngle;
      const launchSpeed = enemyAi.lastSpeed;

      const newArrow = {
        x: bowAnchorX,
        y: bowAnchorY,
        vx: launchSpeed * Math.cos(launchAngleRad),
        vy: launchSpeed * Math.sin(launchAngleRad),
        id: Date.now() + Math.random(),
        enemyIndex,
        minMissDistance: Infinity,
        power: enemyAi.power,
      };

      setEnemyArrows((prev) => [...prev, newArrow]);
      enemyAi.missDistance = 0;
      enemyAi.nextShotDelay = Math.random() * 2000 + 1500;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [roundOver, positions, enemyArrows, SCALE_FACTOR /* Add others if needed */]
  );

  // Start new round
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

      enemyAiRef.current = Array.from({ length: NUM_ENEMIES }, (_, i) =>
        createInitialAiState(i, enemyPower[i])
      );
      console.log("Initialized Enemy AI states:", enemyAiRef.current);
    }

    setEnemyCanFire(false);
    setTimeout(() => setEnemyCanFire(true), enemy_firetime);
  }, [generateRandomPositions]); // Added dependency

  // Enemy learning
  const learnFromMiss = useCallback(
    (enemyIndex, missDistance) => {
      if (roundOver || !enemyAiRef.current[enemyIndex]) return;

      const enemyAi = enemyAiRef.current[enemyIndex];
      const factor = enemyAi.improvementFactor;
      let angleChange = 0;
      let speedChange = 0;

      // Simple learning based on miss distance
      const missSeverity = Math.min(1, missDistance / (300 * SCALE_FACTOR));
      angleChange = (Math.random() - 0.5) * 0.1 * factor * (1 + missSeverity);
      speedChange = (Math.random() - 0.5) * 1.5 * factor * (1 + missSeverity);

      // Basic bias (can be improved)
      if (missDistance > 100 * SCALE_FACTOR) speedChange *= 1.2;
      else if (missDistance < 40 * SCALE_FACTOR) angleChange *= 1.2;

      enemyAi.lastAngle += angleChange;
      enemyAi.lastSpeed += speedChange;
      enemyAi.lastSpeed = Math.max(
        BASE_ENEMY_SPEED * 0.6,
        Math.min(BASE_ENEMY_SPEED * 1.6, enemyAi.lastSpeed)
      );

      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [roundOver, SCALE_FACTOR /* Add others if needed */]
  );

  // Handle hit
  const handleHit = useCallback(
    (winner, targetInfo = null) => {
      if (roundOver) return;
      console.log(`${winner} HIT! Round over.`);
      setRoundOver(true);
      setPlayerArrow(null);
      // Optional: Add visual effect for hit (e.g., flash, particle burst)

      // Keep enemy arrows briefly for visual feedback? Or clear immediately.
      // Let's clear them after a short delay to see the hit
      setTimeout(() => {
        setEnemyArrows([]);
      }, 100); // Clear arrows slightly after hit registered

      if (winner === "Player") {
        setPlayerScore((prev) => prev + 1);
        // console.log("Player hit enemy:", targetInfo);
      } else {
        setEnemyScore((prev) => prev + 1);
        // console.log("Enemy hit player:", targetInfo);
      }

      // Display message and start next round
      // Use a state for the message instead of alert
      // setRoundEndMessage(`${winner} hit the target!`); // Example state
      setTimeout(() => {
        // setRoundEndMessage(null);
        startNewRound();
      }, 1500); // Longer delay before reset for new visuals
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [roundOver, startNewRound]
  );

  // Draw the arrow (new style)
  const drawArrow = useCallback(
    (x, y, angle) => {
      if (!ctx) return;
      const arrowLength = 25 * SCALE_FACTOR;
      const shaftWidth = 2 * SCALE_FACTOR;
      const headLength = 6 * SCALE_FACTOR;
      const headWidth = 5 * SCALE_FACTOR;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Shaft
      ctx.fillStyle = THEME_COLORS.ARROW;
      ctx.fillRect(
        -arrowLength * 0.7,
        -shaftWidth / 2,
        arrowLength,
        shaftWidth
      );

      // Head
      ctx.fillStyle = THEME_COLORS.ARROW_HEAD;
      const headBaseX = arrowLength * 0.3;
      ctx.beginPath();
      ctx.moveTo(headBaseX, -headWidth / 2);
      ctx.lineTo(headBaseX + headLength, 0);
      ctx.lineTo(headBaseX, headWidth / 2);
      ctx.closePath();
      ctx.fill();

      // Simple fletching (optional)
      // ctx.fillStyle = THEME_COLORS.ARROW; // Use same as shaft or different
      // ctx.fillRect(-arrowLength * 0.7, -shaftWidth * 1.5, 5 * SCALE_FACTOR, shaftWidth * 3);

      ctx.restore();
    },
    [ctx, SCALE_FACTOR]
  ); // Added SCALE_FACTOR dependency

  // Draw player archer (SILHOUETTE STYLE - Rearranged Order)
      // Draw player archer (SILHOUETTE STYLE - NO QUIVER)
      const drawPlayerArcher = useCallback((x, y, angleDeg, powerPercent) => {
        if (!ctx) return;
        ctx.save(); // Save initial context state

        // --- Define Colors and Styles ---
        const bodyColor = THEME_COLORS.PLAYER_SILHOUETTE;
        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = bodyColor;
        ctx.lineCap = 'round'; // Use round caps for thicker lines
        ctx.lineJoin = 'round';

        // --- Define Dimensions ---
        const headRadius = 9 * SCALE_FACTOR;
        const bodyHeight = 45 * SCALE_FACTOR;
        const legLength = 35 * SCALE_FACTOR;
        const armLength = 25 * SCALE_FACTOR;
        const limbThickness = 8 * SCALE_FACTOR; // Thickness for body, arms, legs
        const bowThickness = 6 * SCALE_FACTOR;  // Thickness for the bow stroke
        // Quiver dimensions removed
        const legSpread = 15 * SCALE_FACTOR;

        // --- Calculate Key Y Positions ---
        const groundY = y + CHARACTER_FOOT_OFFSET;
        const bodyBottomY = groundY - legLength;
        const bodyTopY = bodyBottomY - bodyHeight; // Shoulder level
        const headCenterY = bodyTopY - headRadius * 0.7;

        // --- Calculate Aiming Angle ---
        const angleRad = (-angleDeg * Math.PI) / 180;

        // --- Draw Limbs and Body (Thick Strokes) ---
        ctx.lineWidth = limbThickness;
        ctx.strokeStyle = bodyColor;

        // Legs
        ctx.beginPath();
        const leftKneeX = x - legSpread * 0.8;
        const leftKneeY = bodyBottomY + legLength * 0.5;
        ctx.moveTo(x, bodyBottomY);
        ctx.quadraticCurveTo(leftKneeX, leftKneeY, x - legSpread, groundY);
        const rightKneeX = x + legSpread * 0.2;
        const rightKneeY = bodyBottomY + legLength * 0.6;
        ctx.moveTo(x, bodyBottomY);
        ctx.quadraticCurveTo(rightKneeX, rightKneeY, x + legSpread, groundY);
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.moveTo(x, bodyBottomY);
        ctx.lineTo(x, bodyTopY);
        ctx.stroke();

        // Head (Filled Circle)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(x, headCenterY, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // --- Draw Arms ---
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = limbThickness;

        const shoulderX = x;
        const shoulderY = bodyTopY + 5 * SCALE_FACTOR;

        // Calculate Back Arm (Bent - pulling string) position
        const elbowAngle = Math.PI * 1.1;
        const elbowDist = armLength * 0.6;
        const backElbowX = shoulderX + elbowDist * Math.cos(elbowAngle);
        const backElbowY = shoulderY + elbowDist * Math.sin(elbowAngle);
        const pullBackDist = (powerPercent / 100) * (armLength * 0.5);
        const bowCenterApproxX = shoulderX + armLength * Math.cos(angleRad) * 0.8;
        const bowCenterApproxY = shoulderY + armLength * Math.sin(angleRad) * 0.8;
        const backHandX = bowCenterApproxX - pullBackDist * Math.cos(angleRad + Math.PI * 0.1);
        const backHandY = bowCenterApproxY - pullBackDist * Math.sin(angleRad + Math.PI * 0.1);

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.quadraticCurveTo(backElbowX, backElbowY, backHandX, backHandY); // Curve through elbow
        ctx.stroke();

        // Front Arm (Extended - holding bow)
        const frontHandX = shoulderX + armLength * Math.cos(angleRad);
        const frontHandY = shoulderY + armLength * Math.sin(angleRad);
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(frontHandX, frontHandY);
        ctx.stroke();


        // --- Draw Bow ---
        ctx.save(); // Save before bow drawing
        ctx.translate(frontHandX, frontHandY); // Move to hand position
        ctx.rotate(angleRad); // Rotate context to arm angle
        ctx.strokeStyle = bodyColor; // Bow uses silhouette color
        ctx.lineWidth = bowThickness;
        ctx.beginPath();
        const bowRadius = armLength * 1.3; // Visual radius of the bow arc
        const bowStartAngle = Math.PI * 0.4; // Start angle of bow curve
        const bowEndAngle = -Math.PI * 0.4; // End angle of bow curve
        ctx.arc(0, 0, bowRadius, bowStartAngle, bowEndAngle, true); // Draw the arc stroke
        ctx.stroke();
        ctx.restore(); // Restore after bow drawing


        // --- Draw Bow String ---
        ctx.save(); // Save before string drawing
        ctx.strokeStyle = THEME_COLORS.BOW_STRING;
        ctx.lineWidth = 1 * SCALE_FACTOR;
        ctx.beginPath();
        // Calculate tip positions based on hand, angle, radius, and arc angles
        const tipDist = bowRadius;
        const topTipX = frontHandX + tipDist * Math.cos(angleRad + bowStartAngle);
        const topTipY = frontHandY + tipDist * Math.sin(angleRad + bowStartAngle);
        const bottomTipX = frontHandX + tipDist * Math.cos(angleRad + bowEndAngle);
        const bottomTipY = frontHandY + tipDist * Math.sin(angleRad + bowEndAngle);
        // Draw line from top tip, to pulling hand, to bottom tip
        ctx.moveTo(topTipX, topTipY);
        ctx.lineTo(backHandX, backHandY);
        ctx.lineTo(bottomTipX, bottomTipY);
        ctx.stroke();
        ctx.restore(); // Restore after string drawing


        // --- Draw Nocked Arrow ---
        ctx.save(); // Save before nocked arrow drawing
        const arrowLength = armLength * 1.5;
        const arrowAngle = angleRad; // Align arrow with aiming angle
        const arrowStartX = backHandX; // Start arrow at pulling hand
        const arrowStartY = backHandY;
        // Calculate end point of the arrow shaft
        const arrowEndX = arrowStartX + arrowLength * Math.cos(arrowAngle);
        const arrowEndY = arrowStartY + arrowLength * Math.sin(arrowAngle);

        // Arrow Shaft
        ctx.strokeStyle = THEME_COLORS.NOCKED_ARROW_SHAFT;
        ctx.lineWidth = 2.5 * SCALE_FACTOR;
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY);
        ctx.lineTo(arrowEndX, arrowEndY);
        ctx.stroke();

        // Arrow Head
        ctx.fillStyle = THEME_COLORS.NOCKED_ARROW_HEAD;
        const headLength = 10 * SCALE_FACTOR;
        const headWidth = 5 * SCALE_FACTOR;
        // Draw triangular head shape at the end of the shaft
        ctx.beginPath();
        ctx.moveTo(arrowEndX + headLength * Math.cos(arrowAngle), arrowEndY + headLength * Math.sin(arrowAngle)); // Tip point
        ctx.lineTo(arrowEndX + headWidth * Math.cos(arrowAngle + Math.PI/2), arrowEndY + headWidth * Math.sin(arrowAngle + Math.PI/2)); // One side point
        ctx.lineTo(arrowEndX + headWidth * Math.cos(arrowAngle - Math.PI/2), arrowEndY + headWidth * Math.sin(arrowAngle - Math.PI/2)); // Other side point
        ctx.closePath();
        ctx.fill();
        ctx.restore(); // Restore after nocked arrow drawing


        ctx.restore(); // Restore initial context state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctx, SCALE_FACTOR, CHARACTER_FOOT_OFFSET, THEME_COLORS]); // Dependencies

  // Draw enemy archer (new style)
  // Draw enemy archer (new style)
  // Draw enemy archer (NEW STYLE with ACCENT)
  const drawEnemyArcher = useCallback(
    (x, y, name) => {
      if (!ctx) return;
      ctx.save();
      const bodyColor = THEME_COLORS.ENEMY; // Black
      const accentColor = THEME_COLORS.ENEMY_ACCENT; // Red
      ctx.strokeStyle = bodyColor;
      ctx.fillStyle = bodyColor;
      ctx.lineWidth = 3 * SCALE_FACTOR; // Main body thickness

      // Dimensions
      const headRadius = 8 * SCALE_FACTOR;
      const bodyHeight = 45 * SCALE_FACTOR;
      const legLength = 30 * SCALE_FACTOR;
      const armLength = 20 * SCALE_FACTOR;
      const bowRadius = 18 * SCALE_FACTOR;
      const legSpread = 10 * SCALE_FACTOR;

      const groundY = y + CHARACTER_FOOT_OFFSET;
      const bodyBottomY = groundY - legLength;
      const bodyTopY = bodyBottomY - bodyHeight;
      const headCenterY = bodyTopY - headRadius;

      // --- Draw Body and Limbs (Black) ---
      // Legs
      ctx.beginPath();
      ctx.moveTo(x, bodyBottomY);
      ctx.lineTo(x - legSpread, groundY);
      ctx.moveTo(x, bodyBottomY);
      ctx.lineTo(x + legSpread, groundY);
      ctx.stroke();
      // Body
      ctx.beginPath();
      ctx.moveTo(x, bodyBottomY);
      ctx.lineTo(x, bodyTopY);
      ctx.stroke();
      // Head
      ctx.beginPath();
      ctx.arc(x, headCenterY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // --- Draw Red Eye (Enemy Accent) ---
      ctx.fillStyle = accentColor;
      const eyeRadius = 1.8 * SCALE_FACTOR; // Slightly larger dot for visibility
      // Position eye on the side facing the player (left side)
      const eyeX = x - headRadius * 0.4;
      const eyeY = headCenterY - headRadius * 0.1; // Slightly above center
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      // --- End Accent ---

      // --- Draw Arms & Bow (Black Base) ---
      const shoulderX = x;
      const shoulderY = bodyTopY + 5 * SCALE_FACTOR;

      // Back arm
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(shoulderX + 10 * SCALE_FACTOR, shoulderY + 15 * SCALE_FACTOR);
      ctx.stroke();
      // Front arm (bow arm, pointing left)
      const handX = shoulderX - armLength;
      const handY = shoulderY;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(handX, handY);
      ctx.stroke();

      // --- Draw Bow (Themed Color) ---
      ctx.save();
      ctx.translate(handX, handY);

      ctx.strokeStyle = THEME_COLORS.BOW; // Use themed bow color
      ctx.lineWidth = 2.5 * SCALE_FACTOR; // Bow thickness
      ctx.beginPath();
      // Keep enemy bow simple
      ctx.arc(0, 0, bowRadius, Math.PI / 2, -Math.PI / 2, false); // Standard arc facing left
      ctx.stroke();

      // Draw Bow String (straight)
      ctx.strokeStyle = THEME_COLORS.BOW_STRING;
      ctx.lineWidth = 1 * SCALE_FACTOR;
      ctx.beginPath();
      ctx.moveTo(0, bowRadius);
      ctx.lineTo(0, -bowRadius);
      ctx.stroke();

      ctx.restore(); // Restore bow context

      // --- Draw Enemy Name ---
      ctx.save();
      ctx.fillStyle = THEME_COLORS.TEXT;
      ctx.font = `${11 * SCALE_FACTOR}px Arial`;
      ctx.textAlign = "center";
      const textY = headCenterY - headRadius - 5 * SCALE_FACTOR;
      ctx.fillText(name, x, textY);
      ctx.restore();

      ctx.restore(); // Restore main enemy context
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [ctx, SCALE_FACTOR, CHARACTER_FOOT_OFFSET, THEME_COLORS]
  ); // Added THEME_COLORS dependency // Make sure dependencies are correct // Added dependencies

  // Draw the entire game scene (new style)
  // Draw the entire game scene (REVISED STYLE)
  const drawGame = useCallback(() => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const cw = canvas.width;
    const ch = canvas.height;

    // 1. Background
    ctx.fillStyle = THEME_COLORS.BACKGROUND;
    ctx.fillRect(0, 0, cw, ch);

    // 2. Moon
    const moonRadius = Math.min(cw, ch) * 0.2;
    const moonX = cw * 0.75;
    const moonY = ch * 0.2;
    ctx.fillStyle = THEME_COLORS.MOON;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
    // Revised Craters (lighter overlay)
    ctx.fillStyle = THEME_COLORS.MOON_CRATER; // Use new color
    for (let i = 0; i < 5; i++) {
      const craterR = Math.random() * moonRadius * 0.2 + moonRadius * 0.05;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (moonRadius - craterR * 0.8); // Ensure craters are well within moon
      const craterX = moonX + Math.cos(angle) * dist;
      const craterY = moonY + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(craterX, craterY, craterR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Mountains
    const mountainStartY = ch * 0.55; // Slightly lower maybe
    ctx.fillStyle = THEME_COLORS.MOUNTAIN;
    ctx.beginPath();
    ctx.moveTo(0, mountainStartY);
    // Keep mountain shape simple
    ctx.lineTo(cw * 0.15, mountainStartY + 40 * SCALE_FACTOR);
    ctx.lineTo(cw * 0.3, mountainStartY - 15 * SCALE_FACTOR);
    ctx.lineTo(cw * 0.5, mountainStartY + 60 * SCALE_FACTOR);
    ctx.lineTo(cw * 0.7, mountainStartY - 25 * SCALE_FACTOR);
    ctx.lineTo(cw * 0.85, mountainStartY + 35 * SCALE_FACTOR);
    ctx.lineTo(cw, mountainStartY - 5 * SCALE_FACTOR);
    ctx.lineTo(cw, ch); // Bottom right
    ctx.lineTo(0, ch); // Bottom left
    ctx.closePath();
    ctx.fill();

    // 4. Lava Floor
    const lavaHeight = 30 * SCALE_FACTOR;
    ctx.fillStyle = THEME_COLORS.LAVA;
    ctx.fillRect(0, ch - lavaHeight, cw, lavaHeight);
    // Revised Sparks (smaller, brighter)
    ctx.fillStyle = THEME_COLORS.LAVA_SPARK; // Use new color
    for (let i = 0; i < 25; i++) {
      // Increased count slightly
      ctx.beginPath();
      // Smaller radius for sparks
      ctx.arc(
        Math.random() * cw,
        ch - Math.random() * lavaHeight * 0.9,
        Math.random() * 2.5 + 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // 5. Platforms & Health Bars (Revised - Top Line Only)
    const healthBarThickness = 4 * SCALE_FACTOR; // How thick the top line is

    // Player Platform & Health
    if (positions.player.x > 0) {
      const platformX = positions.player.x - PLATFORM_WIDTH / 2;
      const platformY = positions.player.platformY;
      // Draw platform base
      ctx.fillStyle = THEME_COLORS.PLATFORM;
      ctx.fillRect(platformX, platformY, PLATFORM_WIDTH, PLATFORM_HEIGHT);
      // Draw health bar as top line
      ctx.fillStyle = THEME_COLORS.PLAYER_HEALTH_BAR;
      ctx.fillRect(platformX, platformY, PLATFORM_WIDTH, healthBarThickness); // Draw on top edge
    }

    // Enemy Platforms & Health
    positions.enemies.forEach((enemy) => {
      const platformX = enemy.x - PLATFORM_WIDTH / 2;
      const platformY = enemy.platformY;
      // Draw platform base
      ctx.fillStyle = THEME_COLORS.PLATFORM;
      ctx.fillRect(platformX, platformY, PLATFORM_WIDTH, PLATFORM_HEIGHT);
      // Draw health bar as top line
      ctx.fillStyle = THEME_COLORS.ENEMY_HEALTH_BAR;
      ctx.fillRect(platformX, platformY, PLATFORM_WIDTH, healthBarThickness); // Draw on top edge
    });

    // 6. Draw Characters (Uses updated THEME_COLORS.BOW implicitly now)
    if (positions.player.x > 0) {
      drawPlayerArcher(positions.player.x, positions.player.y, angle, power);
    }
    positions.enemies.forEach((enemy) => {
      drawEnemyArcher(enemy.x, enemy.y, enemy.name);
    });

    // 7. Draw Arrows (Uses updated THEME_COLORS.ARROW/HEAD implicitly)
    if (playerArrow) {
      const currentAngle = Math.atan2(playerArrow.vy, playerArrow.vx);
      drawArrow(playerArrow.x, playerArrow.y, currentAngle);
    }
    enemyArrows.forEach((arrow) => {
      const currentAngle = Math.atan2(arrow.vy, arrow.vx);
      drawArrow(arrow.x, arrow.y, currentAngle);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    SCALE_FACTOR,
    PLATFORM_WIDTH,
    PLATFORM_HEIGHT /* Include other dependencies if needed */,
  ]);

  // Fire the player's arrow
  const firePlayerArrow = useCallback(() => {
    if (roundOver || playerArrow || positions.player.x <= 0) return;
    setPlayerShots((prev) => prev + 1);

    const angleRad = (-angle * Math.PI) / 180;
    const armLength = 20 * SCALE_FACTOR; // Match drawing
    const bodyTopOffsetY = -60 * SCALE_FACTOR + 5 * SCALE_FACTOR; // Shoulder Y offset
    const shoulderY = positions.player.y + bodyTopOffsetY;

    // Calculate hand position based on drawing logic
    const handX = positions.player.x + armLength * Math.cos(angleRad);
    const handY = shoulderY + armLength * Math.sin(angleRad);

    // Start arrow from approx bow center relative to hand
    const bowRadius = 18 * SCALE_FACTOR;
    const arrowStartX = handX - bowRadius * 0.5 * Math.cos(angleRad); // Adjust start pos
    const arrowStartY = handY - bowRadius * 0.5 * Math.sin(angleRad);

    // Adjust speed maybe
    const baseSpeed = 9 * Math.sqrt(SCALE_FACTOR); // Slightly lower base?
    const powerMultiplier = 18 * Math.sqrt(SCALE_FACTOR);
    const speed = baseSpeed + (power / 100) * powerMultiplier;

    setPlayerArrow({
      x: arrowStartX,
      y: arrowStartY,
      vx: speed * Math.cos(angleRad),
      vy: speed * Math.sin(angleRad),
      id: Date.now(),
    });
  }, [roundOver, playerArrow, positions, angle, power, SCALE_FACTOR]); // Added dependencies

  // --- Effects ---

  // Effect 1: Initialize context & Start Round
  useEffect(() => {
    console.log("Game component mounted");
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas ref not found on mount");
      return;
    }
    // Set canvas size based on container, but maintain aspect ratio if needed
    // For simplicity, using fixed size now. Responsive would need resize listeners.
    canvas.width = 1000;
    canvas.height = 600;

    const context = canvas.getContext("2d");
    setCtx(context);
    console.log(`Canvas size set to: ${canvas.width}x${canvas.height}`);

    startNewRound(); // Start first round after context is ready

    return () => {
      console.log("Game component unmounting");
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Effect 2: Main game loop (Animation, Physics, AI Shooting Trigger)
  useEffect(() => {
    if (!ctx) return;

    let lastTimestamp = 0;
    let isActive = true;

    const animate = (timestamp) => {
      if (!isActive || !ctx || !canvasRef.current) return; // Add canvas check

      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (!roundOver && deltaTime > 0) {
        // Ensure deltaTime is positive
        // --- Enemy Shooting ---
        if (enemyCanFire && enemyAiRef.current.length === NUM_ENEMIES) {
          enemyAiRef.current.forEach((aiState, index) => {
            aiState.nextShotDelay -= deltaTime;
            if (aiState.nextShotDelay <= 0) {
              const hasArrow = enemyArrows.some(
                (arrow) => arrow.enemyIndex === index
              );
              if (!hasArrow && positions.enemies[index]) {
                fireEnemyArrow(index);
                // Reset delay even if fire failed (e.g. no position yet)
                // This happens inside fireEnemyArrow now
              } else if (!hasArrow) {
                // If enemy doesn't exist yet but timer ran out, reset delay
                aiState.nextShotDelay = 500;
              } else {
                // If has arrow, short delay before retry
                aiState.nextShotDelay = 200;
              }
            }
          });
        }

        // --- Physics Updates ---
        const canvas = canvasRef.current;
        // Ground collision now means hitting the lava level or below
        const lavaLevel = canvas.height - 30 * SCALE_FACTOR;
        const outOfBoundsMargin = 100 * SCALE_FACTOR; // Wider margin maybe

        // --- Player Arrow Physics ---
        if (playerArrow) {
          const newVx = playerArrow.vx;
          const newVy = playerArrow.vy + GRAVITY;
          const newX = playerArrow.x + newVx;
          const newY = playerArrow.y + newVy;

          let hitDetected = false;

          // Check OOB / Lava Hit
          if (
            newX < -outOfBoundsMargin ||
            newX > canvas.width + outOfBoundsMargin ||
            newY > lavaLevel + 10 // Arrow goes slightly into lava before disappearing
          ) {
            setPlayerArrow(null);
            hitDetected = true; // Treat OOB as a non-scoring 'hit' for removal
          } else {
            // Collision check with enemies
            for (let i = 0; i < positions.enemies.length; i++) {
              const enemy = positions.enemies[i];
              // Check collision with enemy body/head area
              const enemyCenterX = enemy.x;
              const enemyCenterY = enemy.y - 30 * SCALE_FACTOR; // Approx center mass Y
              const dx = newX - enemyCenterX;
              const dy = newY - enemyCenterY;
              if (Math.sqrt(dx * dx + dy * dy) < ENEMY_HIT_RADIUS) {
                const enemyId = enemy.id; // Use stored ID
                const enemyPower = enemyAiRef.current[enemyId]?.power;

                if (enemyPower === 1) {
                  handleHit("Player", { enemyIndex: i });
                } else {
                  // Hit non-powered enemy - maybe visual cue?
                  console.log("Player hit non-critical enemy", i);
                }
                setPlayerArrow(null); // Remove arrow on any hit
                hitDetected = true;
                break; // Stop checking enemies after a hit
              }
            }
          }

          // Update arrow if no hit occurred
          if (!hitDetected) {
            setPlayerArrow((prev) => ({
              ...prev,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy,
            }));
          }
        }

        // --- Enemy Arrows Physics ---
        if (enemyArrows.length > 0) {
          const nextEnemyArrows = [];
          let updateState = false; // Flag to update state only if needed

          for (const arrow of enemyArrows) {
            const newVx = arrow.vx;
            const newVy = arrow.vy + GRAVITY;
            const newX = arrow.x + newVx;
            const newY = arrow.y + newVy;

            let arrowRemoved = false;

            // Check OOB / Lava Hit
            if (
              newX < -outOfBoundsMargin ||
              newX > canvas.width + outOfBoundsMargin ||
              newY > lavaLevel + 10
            ) {
              // Learn from miss when arrow goes OOB/hits ground
              if (enemyAiRef.current[arrow.enemyIndex]) {
                learnFromMiss(arrow.enemyIndex, arrow.minMissDistance);
              }
              arrowRemoved = true;
              updateState = true; // Arrow removed, need state update
            } else {
              // Check collision with Player
              const playerCenterX = positions.player.x;
              const playerCenterY = positions.player.y - 30 * SCALE_FACTOR; // Approx center mass
              const dxPlayer = newX - playerCenterX;
              const dyPlayer = newY - playerCenterY;
              const distPlayer = Math.sqrt(
                dxPlayer * dxPlayer + dyPlayer * dyPlayer
              );

              const currentMinMiss = Math.min(
                arrow.minMissDistance,
                distPlayer
              );

              if (distPlayer < PLAYER_HIT_RADIUS) {
                if (arrow.power === 1) {
                  handleHit("Enemy", {
                    enemyIndex: arrow.enemyIndex,
                    arrowId: arrow.id,
                  });
                } else {
                  console.log(`Non-critical hit by enemy ${arrow.enemyIndex}`);
                }
                // Learn from hit distance (could be useful)
                if (enemyAiRef.current[arrow.enemyIndex]) {
                  learnFromMiss(arrow.enemyIndex, distPlayer); // Learn even on non-critical hits
                }
                arrowRemoved = true;
                updateState = true; // Arrow removed
              } else {
                // Keep arrow, update position and minMissDistance
                nextEnemyArrows.push({
                  ...arrow,
                  x: newX,
                  y: newY,
                  vx: newVx,
                  vy: newVy,
                  minMissDistance: currentMinMiss,
                });
                // Check if position actually changed significantly
                if (
                  Math.abs(newX - arrow.x) > 0.1 ||
                  Math.abs(newY - arrow.y) > 0.1
                ) {
                  updateState = true;
                }
              }
            }
          }
          // Only update state if arrows were removed or moved
          if (updateState) {
            setEnemyArrows(nextEnemyArrows);
          }
        }
      } // End if (!roundOver)

      // --- Drawing ---
      drawGame();

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [
    // Critical dependencies for the loop:
    ctx,
    roundOver,
    enemyCanFire,
    playerArrow,
    enemyArrows,
    positions,
    // Functions called within the loop:
    fireEnemyArrow,
    learnFromMiss,
    handleHit,
    drawGame,
    // Constants/Config used in physics/collision:
    GRAVITY,
    SCALE_FACTOR,
    PLAYER_HIT_RADIUS,
    ENEMY_HIT_RADIUS,
    NUM_ENEMIES,
    // Note: angle, power are only used by drawGame & firePlayerArrow (event handler)
    // startNewRound is called by handleHit, so indirectly included
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
        <p>Shots: {enemyTotalShots}</p> {/* Updated state name */}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        // Width and height are set in useEffect now
        className="game-canvas"
        // style={{ background: THEME_COLORS.BACKGROUND }} // Set initial bg here too
      />

      {/* Controls Area */}
      <div className="controls-area">
        {/* Conditionally render based on game state */}
        {!ctx && <div className="loading-message">Loading Game...</div>}
        {ctx && roundOver && (
          <div className="round-over-message">
            Round Over! Preparing next round...
          </div>
        )}
        {ctx && !roundOver && positions.player.x !== 0 && (
          <div className="bottom-controls">
            <div className="slider-group">
              <label>Angle:</label>
              <input
                type="range"
                min="0"
                max="90"
                value={angle}
                onChange={(e) => setAngle(parseInt(e.target.value))}
                disabled={!!playerArrow || roundOver}
              />
              <span>{angle}°</span>
            </div>
            <div className="slider-group">
              <label>Power:</label>
              <input
                type="range"
                min="10"
                max="100"
                value={power}
                onChange={(e) => setPower(parseInt(e.target.value))}
                disabled={!!playerArrow || roundOver}
              />
              <span>{power}</span>
            </div>
            <button
              className="fire-button"
              onClick={firePlayerArrow}
              disabled={!!playerArrow || roundOver}
            >
              Fire!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArcheryGame;
