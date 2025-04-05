import React, { useEffect, useRef, useState, useCallback } from "react";
import "./ArcheryGame.css"; // Make sure you have the updated CSS file

// --- Constants ---
const NUM_ENEMIES = 4;
const SCALE_FACTOR = 0.7;
const MIN_ENEMY_DISTANCE = 80 * SCALE_FACTOR;
const PLAYER_HIT_RADIUS = 25 * SCALE_FACTOR;
const ENEMY_HIT_RADIUS = 25 * SCALE_FACTOR;
const GRAVITY = 0.25 * SCALE_FACTOR;
const BASE_ENEMY_SPEED = 14 * Math.sqrt(SCALE_FACTOR);
const enemy_firetime = 2000;
const enemyPower = [0, 0, 0, 1]; // Omega has power
const enemyNames = ["Alpha", "Beta", "Gamma", "Omega"];


// --- Theme Colors (Consolidated) ---
const THEME_COLORS = {
  BACKGROUND: "#383838", LAVA: "#ff4757", LAVA_SPARK: "rgba(255, 220, 100, 0.9)",
  MOUNTAIN: "#2a2a2a", MOON: "#d5d5d5", MOON_CRATER: "rgba(255, 255, 255, 0.18)",
  PLATFORM: "#181818", PLAYER_HEALTH_BAR: "#0090ff", ENEMY_HEALTH_BAR: "#888888",
  TEXT: "#ffffff", QUESTION_BG: "rgba(0, 0, 0, 0.7)", BUTTON: "#007bff", BUTTON_TEXT: "#ffffff",
  PLAYER_SILHOUETTE: "#5a3d2b", NOCKED_ARROW_SHAFT: "#a4785f", NOCKED_ARROW_HEAD: "#666666",
  ENEMY: "black", ENEMY_ACCENT: "#ff6b6b", BOW: "#c87d33",
  BOW_STRING: "#dddddd", ARROW: "#f5f5f5", ARROW_HEAD: "#b0b0b0",
};

// --- Assessment Data (Example) ---
const assessmentData = [
    {
        "question": "What is the primary color of the lava in this game?",
        "options": ["Blue", "Green", "Red/Orange", "Yellow"],
        "Correct_option_index": 2,
        "difficulty": 1,
        "category": "Observation",
        "explanation": "The lava floor at the bottom of the screen is depicted in shades of red and orange, consistent with typical representations of molten rock.",
        "round": 1
    },
    {
        "question": "Which enemy archer is designated as the 'critical' target (Omega)?",
        "options": ["Alpha", "Beta", "Gamma", "Omega"],
        "Correct_option_index": 3,
        "difficulty": 1,
        "category": "Game Mechanics",
        "explanation": "In the game's code and setup, 'Omega' is the enemy whose hit ends the round (enemyPower[3] is 1).",
        "round": 2
    },
    {
        "question": "What force affects the arrows after they are fired?",
        "options": ["Wind", "Magnetism", "Gravity", "Magic"],
        "Correct_option_index": 2,
        "difficulty": 2,
        "category": "Physics",
        "explanation": "The arrows follow a parabolic trajectory because of the constant downward acceleration due to gravity, simulated in the game's physics.",
        "round": 3
    },
    // Add more questions as needed
];


const ArcheryGame = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const enemyArrowsRef = useRef([]);
  const [ctx, setCtx] = useState(null);
  const [enemyCanFire, setEnemyCanFire] = useState(false);

  // --- NEW Game State Management ---
  const [gameState, setGameState] = useState('loading'); // 'loading', 'showing_question', 'playing', 'showing_explanation', 'game_over'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [explanationText, setExplanationText] = useState("");
  const clickableAreasRef = useRef({}); // To store coords for clickable canvas elements

  // Game state
  // const [roundOver, setRoundOver] = useState(false); // Replaced by gameState
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

  // Positions
  const [positions, setPositions] = useState({
    player: { x: 0, y: 0, platformY: 0 },
    enemies: [],
  });

  // Platform dimensions
  const PLATFORM_HEIGHT = 15 * SCALE_FACTOR;
  const PLATFORM_WIDTH = 60 * SCALE_FACTOR;
  const CHARACTER_FOOT_OFFSET = 5 * SCALE_FACTOR;

  // --- Utility Functions ---
  const createInitialAiState = (index, power = 1) => ({
    id: index, lastAngle: 0, lastSpeed: BASE_ENEMY_SPEED * (0.8 + Math.random() * 0.4),
    missDistance: 0, improvementFactor: 0.25 + (Math.random() - 0.5) * 0.1,
    nextShotDelay: Math.random() * 1500 + 1000, shotsFired: 0, power,
    isDrawingBow: false, drawProgress: 0, drawDuration: 300, firePending: false
  });

  // --- Memoized Functions ---

  const generateRandomPositions = useCallback( /* ... (keep existing code) ... */
    (canvas) => {
      if (!canvas) return { player: { x: 0, y: 0, platformY: 0 }, enemies: [] };
      const platformMinY = canvas.height * 0.65;
      const platformMaxY = canvas.height - PLATFORM_HEIGHT - 50 * SCALE_FACTOR;
      const playerMinX = canvas.width * 0.05 + PLATFORM_WIDTH / 2;
      const playerMaxX = canvas.width * 0.15 - PLATFORM_WIDTH / 2;
      const playerPlatformX = Math.random() * (playerMaxX - playerMinX) + playerMinX;
      const playerPlatformY = Math.random() * (platformMaxY - platformMinY) + platformMinY;
      const playerPos = { x: playerPlatformX, platformY: playerPlatformY, y: playerPlatformY - CHARACTER_FOOT_OFFSET };
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
          enemyPlatformY = Math.random() * (platformMaxY - platformMinY) + platformMinY;
          const dxPlayer = enemyPlatformX - playerPos.x;
          if (Math.abs(dxPlayer) < safeZoneFromPlayer) { continue; }
          let tooCloseToOtherEnemy = false;
          for (let j = 0; j < enemies.length; j++) {
            const dxEnemy = enemyPlatformX - enemies[j].x;
            if (Math.abs(dxEnemy) < MIN_ENEMY_DISTANCE) { tooCloseToOtherEnemy = true; break; }
          }
          if (!tooCloseToOtherEnemy) { validPosition = true; }
        }
        if (validPosition) {
          enemies.push({ x: enemyPlatformX, platformY: enemyPlatformY, y: enemyPlatformY - CHARACTER_FOOT_OFFSET, id: i, name: enemyNames[i] });
        } else {
          console.warn(`Could not place enemy ${i} optimally.`);
          enemies.push({ x: enemyPlatformX, platformY: enemyPlatformY, y: enemyPlatformY - CHARACTER_FOOT_OFFSET, id: i, name: enemyNames[i] });
        }
      }
      return { player: playerPos, enemies };
    },
    [PLATFORM_WIDTH, PLATFORM_HEIGHT, CHARACTER_FOOT_OFFSET]
  );

  // Fire an enemy arrow
  const fireEnemyArrow = useCallback( /* ... (keep existing code, ensure it checks gameState === 'playing') ... */
    (enemyIndex) => {
       // Add gameState check at the beginning
      if (gameState !== 'playing') return;

      const enemy = positions.enemies[enemyIndex];
      const enemyAi = enemyAiRef.current[enemyIndex];

      // Original checks remain
      if (
        !enemy ||
        !enemyAi ||
        enemyArrowsRef.current.some(arrow => arrow.enemyIndex === enemyIndex)
      ) {
        return;
      }

      // Update shot counters
      enemyAi.shotsFired++;
      setEnemyTotalShots(prev => prev + 1);

      // Calculate firing position
      const bodyTopOffsetY = -60 * SCALE_FACTOR;
      const armLength = 20 * SCALE_FACTOR;
      const bowAnchorX = enemy.x - armLength * 0.5;
      const bowAnchorY = enemy.y + bodyTopOffsetY;

      // Calculate trajectory
      const targetX = positions.player.x;
      const targetY = positions.player.y - 30 * SCALE_FACTOR;
      const dx = targetX - bowAnchorX;
      const dy = targetY - bowAnchorY;
      const baseAngleRad = Math.atan2(dy, dx);
      const launchAngleRad = baseAngleRad + enemyAi.lastAngle;
      const launchSpeed = enemyAi.lastSpeed;

      // Create new arrow
      const newArrow = {
        x: bowAnchorX, y: bowAnchorY,
        vx: launchSpeed * Math.cos(launchAngleRad),
        vy: launchSpeed * Math.sin(launchAngleRad),
        id: Date.now() + Math.random(), enemyIndex,
        minMissDistance: Infinity, power: enemyAi.power,
      };

      // Update state and ref atomically
      setEnemyArrows(prev => {
        const updatedArrows = [...prev, newArrow];
        enemyArrowsRef.current = updatedArrows; // Keep ref in sync
        return updatedArrows;
      });

      // Reset AI timing values
      enemyAi.missDistance = 0;
      enemyAi.nextShotDelay = Math.random() * 2000 + 1500;
    },
    [gameState, positions] // Add gameState dependency
  );

  // Start a new *archery round* (not the whole assessment cycle)
  const startArcheryRound = useCallback(() => {
    console.log("startArcheryRound called: Initializing gameplay elements.");
    // Note: Scores are NOT reset here, only round-specific things
    setPlayerShots(0);
    setEnemyTotalShots(0); // Reset total shots for the round/question
    setPlayerArrow(null);
    setEnemyArrows([]);
    enemyArrowsRef.current = []; // Clear ref too

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const newPositions = generateRandomPositions(canvas);
      setPositions(newPositions);

      enemyAiRef.current = Array.from({ length: NUM_ENEMIES }, (_, i) =>
        createInitialAiState(i, enemyPower[i])
      );
      console.log("Initialized Enemy AI states for round:", enemyAiRef.current);
    }

    setEnemyCanFire(false);
    setTimeout(() => setEnemyCanFire(true), enemy_firetime);

    setGameState('playing'); // Set state to playing

  }, [generateRandomPositions]); // Dependency

  // Enemy learning
  const learnFromMiss = useCallback( /* ... (keep existing code, check gameState) ... */
    (enemyIndex, missDistance) => {
        if (gameState !== 'playing' || !enemyAiRef.current[enemyIndex]) return;

        const enemyAi = enemyAiRef.current[enemyIndex];
        const factor = enemyAi.improvementFactor;
        let angleChange = 0;
        let speedChange = 0;

        const missSeverity = Math.min(1, missDistance / (300 * SCALE_FACTOR));
        angleChange = (Math.random() - 0.5) * 0.1 * factor * (1 + missSeverity);
        speedChange = (Math.random() - 0.5) * 1.5 * factor * (1 + missSeverity);

        if (missDistance > 100 * SCALE_FACTOR) speedChange *= 1.2;
        else if (missDistance < 40 * SCALE_FACTOR) angleChange *= 1.2;

        enemyAi.lastAngle += angleChange;
        enemyAi.lastSpeed += speedChange;
        enemyAi.lastSpeed = Math.max(
            BASE_ENEMY_SPEED * 0.6,
            Math.min(BASE_ENEMY_SPEED * 1.6, enemyAi.lastSpeed)
        );
    },
    [gameState] // Add gameState
  );

  // Handle hit -> Transition to Explanation
  const handleHit = useCallback(
    (winner, targetInfo = null) => {
      if (gameState !== 'playing') return; // Only handle hits during play

      console.log(`${winner} HIT! Round over.`);
      setGameState('showing_explanation'); // Change state
      setPlayerArrow(null); // Clear player arrow immediately
      // Keep enemy arrows for a moment for visuals? Or clear too.
      // setEnemyArrows([]); // Optional: clear enemy arrows now

      // Set the explanation text based on the current question
      if (currentQuestionIndex < assessmentData.length) {
        setExplanationText(assessmentData[currentQuestionIndex].explanation);
      } else {
        setExplanationText("Error: Question data not found."); // Fallback
      }

      if (winner === "Player") {
        setPlayerScore((prev) => prev + 1);
        console.log("Player hit enemy:", targetInfo);
      } else {
        setEnemyScore((prev) => prev + 1);
        console.log("Enemy hit player:", targetInfo);
      }

       // Do NOT automatically start next round here. User clicks 'Next' on explanation screen.

    },
    [gameState, currentQuestionIndex] // Add dependencies
  );

  // --- Drawing Functions ---

  // Helper to wrap text on canvas
  const wrapText = useCallback((text, x, y, maxWidth, lineHeight, color = THEME_COLORS.TEXT, font = `${14 * SCALE_FACTOR}px Arial`) => {
    // No changes needed within wrapText itself, font/lineHeight are passed in.
    if (!ctx) return y;
    ctx.fillStyle = color;
    ctx.font = font;
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight; // Return Y pos after last line
}, [ctx]);


  // Draw Question Screen
  const drawQuestionScreen = useCallback(() => {
    if (!ctx || !canvasRef.current || currentQuestionIndex >= assessmentData.length) return;
    const canvas = canvasRef.current;
    const cw = canvas.width;
    const ch = canvas.height;
    const question = assessmentData[currentQuestionIndex];

    ctx.fillStyle = THEME_COLORS.QUESTION_BG;
    ctx.fillRect(0, 0, cw, ch);

    const boxMargin = cw * 0.1;
    const boxWidth = cw - 2 * boxMargin;
    const boxY = ch * 0.15;
    const contentX = boxMargin + 30; // Increased margin slightly
    const contentWidth = boxWidth - 60; // Adjust content width
    const baseLineHeight = 24 * SCALE_FACTOR; // Increased base line height

    let currentY = boxY + 40; // Adjusted starting Y

    // Draw Round Number
    ctx.fillStyle = THEME_COLORS.TEXT;
    ctx.font = `bold ${20 * SCALE_FACTOR}px Arial`; // Increased size
    ctx.textAlign = "center";
    ctx.fillText(`Round ${question.round} / ${assessmentData.length}`, cw / 2, currentY);
    currentY += baseLineHeight * 2; // Use adjusted line height

    // Draw Question Text
    ctx.textAlign = "left";
    currentY = wrapText(question.question, contentX, currentY, contentWidth, baseLineHeight, THEME_COLORS.TEXT, `bold ${22 * SCALE_FACTOR}px Arial`); // Increased size
    currentY += baseLineHeight * 0.75; // Adjusted space after question

    // Draw Options
    const optionFontSize = `${20 * SCALE_FACTOR}px Arial`; // Increased size
    ctx.font = optionFontSize;
    question.options.forEach((option, index) => {
        currentY = wrapText(`${index + 1}. ${option}`, contentX + 15, currentY, contentWidth - 30, baseLineHeight, THEME_COLORS.TEXT, optionFontSize); // Pass font explicitly
        currentY += baseLineHeight * 0.25; // Adjusted space between options
    });
    currentY += baseLineHeight; // Space before button

    // Draw "Next" Button
    ctx.fillStyle = THEME_COLORS.BUTTON;
    const buttonWidth = 180 * SCALE_FACTOR; // Slightly wider button
    const buttonHeight = 45 * SCALE_FACTOR; // Slightly taller button
    const buttonX = cw / 2 - buttonWidth / 2;
    const buttonY = currentY;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.fillStyle = THEME_COLORS.BUTTON_TEXT;
    ctx.font = `bold ${18 * SCALE_FACTOR}px Arial`; // Increased button text size
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Start Round", cw / 2, buttonY + buttonHeight / 2);
    ctx.textBaseline = "alphabetic"; // Reset baseline

    clickableAreasRef.current = {
      nextButton: { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight, action: 'start_round' }
    };

}, [ctx, currentQuestionIndex, wrapText]); // Added wrapText dependency

  // Draw Explanation Screen
  const drawExplanationScreen = useCallback(() => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.fillStyle = THEME_COLORS.QUESTION_BG;
    ctx.fillRect(0, 0, cw, ch);

    const boxMargin = cw * 0.1;
    const boxWidth = cw - 2 * boxMargin;
    const boxY = ch * 0.2;
    const contentX = boxMargin + 30;
    const contentWidth = boxWidth - 60;
    const baseLineHeight = 24 * SCALE_FACTOR; // Increased base line height

    let currentY = boxY + 50; // Adjusted Y

    // Draw Title
    ctx.fillStyle = THEME_COLORS.TEXT;
    ctx.font = `bold ${24 * SCALE_FACTOR}px Arial`; // Increased size
    ctx.textAlign = "center";
    ctx.fillText("Round Over - Explanation", cw / 2, currentY);
    currentY += baseLineHeight * 2.5; // Use adjusted line height

    // Draw Explanation Text
    ctx.textAlign = "left";
    currentY = wrapText(explanationText, contentX, currentY, contentWidth, baseLineHeight, THEME_COLORS.TEXT, `${20 * SCALE_FACTOR}px Arial`); // Increased size
    currentY += baseLineHeight * 1.5; // Use adjusted line height

    // Draw "Next Question" / "Finish" Button
    const isLastQuestion = currentQuestionIndex >= assessmentData.length - 1;
    const buttonText = isLastQuestion ? "Finish Game" : "Next Question";
    ctx.fillStyle = THEME_COLORS.BUTTON;
    const buttonWidth = 200 * SCALE_FACTOR; // Wider button
    const buttonHeight = 45 * SCALE_FACTOR; // Taller button
    const buttonX = cw / 2 - buttonWidth / 2;
    const buttonY = currentY;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.fillStyle = THEME_COLORS.BUTTON_TEXT;
    ctx.font = `bold ${18 * SCALE_FACTOR}px Arial`; // Increased button text size
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(buttonText, cw / 2, buttonY + buttonHeight / 2);
    ctx.textBaseline = "alphabetic"; // Reset

    clickableAreasRef.current = {
      nextButton: { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight, action: isLastQuestion ? 'finish_game' : 'next_question' }
    };

}, [ctx, explanationText, currentQuestionIndex, wrapText]); // Added wrapText dependency


  // Draw Game Over Screen
  const drawGameOverScreen = useCallback(() => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.fillStyle = THEME_COLORS.QUESTION_BG;
    ctx.fillRect(0, 0, cw, ch);

    const boxMargin = cw * 0.1;
    const boxWidth = cw - 2 * boxMargin;
    const boxY = ch * 0.2;
    // const contentX = boxMargin + 20;
    // const contentWidth = boxWidth - 40;
    const baseLineHeight = 30 * SCALE_FACTOR; // Increased base line height
    let currentY = boxY + 60; // Adjusted Y

    // Draw Title
    ctx.fillStyle = THEME_COLORS.TEXT;
    ctx.font = `bold ${34 * SCALE_FACTOR}px Arial`; // Increased size
    ctx.textAlign = "center";
    ctx.fillText("Assessment Complete!", cw / 2, currentY);
    currentY += baseLineHeight * 2.5; // Use adjusted line height

    // Draw Final Scores
    ctx.font = `bold ${24 * SCALE_FACTOR}px Arial`; // Increased size
    ctx.fillText(`Player Score: ${playerScore}`, cw / 2, currentY);
    currentY += baseLineHeight * 1.5; // Use adjusted line height
    ctx.fillText(`Enemy Score: ${enemyScore}`, cw / 2, currentY);
    currentY += baseLineHeight * 2; // Use adjusted line height

    // Draw "Restart" Button
    ctx.fillStyle = THEME_COLORS.BUTTON;
    const buttonWidth = 180 * SCALE_FACTOR; // Wider button
    const buttonHeight = 45 * SCALE_FACTOR; // Taller button
    const buttonX = cw / 2 - buttonWidth / 2;
    const buttonY = currentY;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.fillStyle = THEME_COLORS.BUTTON_TEXT;
    ctx.font = `bold ${18 * SCALE_FACTOR}px Arial`; // Increased button text size
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Restart Game", cw / 2, buttonY + buttonHeight / 2);
    ctx.textBaseline = "alphabetic"; // Reset

    clickableAreasRef.current = {
        restartButton: { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight, action: 'restart_game' }
    };

}, [ctx, playerScore, enemyScore]);


  const drawArrow = useCallback(/* ... (keep existing code) ... */
    (x, y, angle) => {
      if (!ctx) return;
      const arrowLength = 25 * SCALE_FACTOR; const shaftWidth = 2 * SCALE_FACTOR;
      const headLength = 6 * SCALE_FACTOR; const headWidth = 5 * SCALE_FACTOR;
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
      ctx.fillStyle = THEME_COLORS.ARROW;
      ctx.fillRect(-arrowLength * 0.7, -shaftWidth / 2, arrowLength, shaftWidth);
      ctx.fillStyle = THEME_COLORS.ARROW_HEAD; const headBaseX = arrowLength * 0.3;
      ctx.beginPath(); ctx.moveTo(headBaseX, -headWidth / 2); ctx.lineTo(headBaseX + headLength, 0);
      ctx.lineTo(headBaseX, headWidth / 2); ctx.closePath(); ctx.fill();
      ctx.restore();
    }, [ctx]
  );

  const drawPlayerArcher = useCallback(/* ... (keep existing code) ... */
    (x, y, angleDeg, powerPercent) => {
        if (!ctx) return; ctx.save();
        const bodyColor = THEME_COLORS.PLAYER_SILHOUETTE; ctx.fillStyle = bodyColor;
        ctx.strokeStyle = bodyColor; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const headRadius = 9 * SCALE_FACTOR; const bodyHeight = 45 * SCALE_FACTOR; const legLength = 35 * SCALE_FACTOR;
        const armLength = 25 * SCALE_FACTOR; const limbThickness = 8 * SCALE_FACTOR; const bowThickness = 6 * SCALE_FACTOR;
        const legSpread = 15 * SCALE_FACTOR; const groundY = y + CHARACTER_FOOT_OFFSET;
        const bodyBottomY = groundY - legLength; const bodyTopY = bodyBottomY - bodyHeight;
        const headCenterY = bodyTopY - headRadius * 0.7; const angleRad = (-angleDeg * Math.PI) / 180;
        ctx.lineWidth = limbThickness; ctx.strokeStyle = bodyColor;
        ctx.beginPath(); const leftKneeX = x - legSpread * 0.8; const leftKneeY = bodyBottomY + legLength * 0.5;
        ctx.moveTo(x, bodyBottomY); ctx.quadraticCurveTo(leftKneeX, leftKneeY, x - legSpread, groundY);
        const rightKneeX = x + legSpread * 0.2; const rightKneeY = bodyBottomY + legLength * 0.6;
        ctx.moveTo(x, bodyBottomY); ctx.quadraticCurveTo(rightKneeX, rightKneeY, x + legSpread, groundY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, bodyBottomY); ctx.lineTo(x, bodyTopY); ctx.stroke();
        ctx.fillStyle = bodyColor; ctx.beginPath(); ctx.arc(x, headCenterY, headRadius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = bodyColor; ctx.lineWidth = limbThickness;
        const shoulderX = x; const shoulderY = bodyTopY + 5 * SCALE_FACTOR;
        const elbowAngle = Math.PI * 1.1; const elbowDist = armLength * 0.6;
        const backElbowX = shoulderX + elbowDist * Math.cos(elbowAngle); const backElbowY = shoulderY + elbowDist * Math.sin(elbowAngle);
        const pullBackDist = (powerPercent / 100) * (armLength * 0.5);
        const bowCenterApproxX = shoulderX + armLength * Math.cos(angleRad) * 0.8; const bowCenterApproxY = shoulderY + armLength * Math.sin(angleRad) * 0.8;
        const backHandX = bowCenterApproxX - pullBackDist * Math.cos(angleRad + Math.PI * 0.1); const backHandY = bowCenterApproxY - pullBackDist * Math.sin(angleRad + Math.PI * 0.1);
        ctx.beginPath(); ctx.moveTo(shoulderX, shoulderY); ctx.quadraticCurveTo(backElbowX, backElbowY, backHandX, backHandY); ctx.stroke();
        const frontHandX = shoulderX + armLength * Math.cos(angleRad); const frontHandY = shoulderY + armLength * Math.sin(angleRad);
        ctx.beginPath(); ctx.moveTo(shoulderX, shoulderY); ctx.lineTo(frontHandX, frontHandY); ctx.stroke();
        ctx.save(); ctx.translate(frontHandX, frontHandY); ctx.rotate(angleRad);
        ctx.strokeStyle = bodyColor; ctx.lineWidth = bowThickness; ctx.beginPath();
        const bowRadius = armLength * 1.3; const bowStartAngle = Math.PI * 0.4; const bowEndAngle = -Math.PI * 0.4;
        ctx.arc(0, 0, bowRadius, bowStartAngle, bowEndAngle, true); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.strokeStyle = THEME_COLORS.BOW_STRING; ctx.lineWidth = 1 * SCALE_FACTOR; ctx.beginPath();
        const tipDist = bowRadius; const topTipX = frontHandX + tipDist * Math.cos(angleRad + bowStartAngle); const topTipY = frontHandY + tipDist * Math.sin(angleRad + bowStartAngle);
        const bottomTipX = frontHandX + tipDist * Math.cos(angleRad + bowEndAngle); const bottomTipY = frontHandY + tipDist * Math.sin(angleRad + bowEndAngle);
        ctx.moveTo(topTipX, topTipY); ctx.lineTo(backHandX, backHandY); ctx.lineTo(bottomTipX, bottomTipY); ctx.stroke(); ctx.restore();
        ctx.save(); const arrowLengthDraw = armLength * 1.5; const arrowAngle = angleRad;
        const arrowStartX = backHandX; const arrowStartY = backHandY;
        const arrowEndX = arrowStartX + arrowLengthDraw * Math.cos(arrowAngle); const arrowEndY = arrowStartY + arrowLengthDraw * Math.sin(arrowAngle);
        ctx.strokeStyle = THEME_COLORS.NOCKED_ARROW_SHAFT; ctx.lineWidth = 2.5 * SCALE_FACTOR; ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY); ctx.lineTo(arrowEndX, arrowEndY); ctx.stroke();
        ctx.fillStyle = THEME_COLORS.NOCKED_ARROW_HEAD; const headLengthDraw = 10 * SCALE_FACTOR; const headWidthDraw = 5 * SCALE_FACTOR;
        ctx.beginPath(); ctx.moveTo(arrowEndX + headLengthDraw * Math.cos(arrowAngle), arrowEndY + headLengthDraw * Math.sin(arrowAngle));
        ctx.lineTo(arrowEndX + headWidthDraw * Math.cos(arrowAngle + Math.PI / 2), arrowEndY + headWidthDraw * Math.sin(arrowAngle + Math.PI / 2));
        ctx.lineTo(arrowEndX + headWidthDraw * Math.cos(arrowAngle - Math.PI / 2), arrowEndY + headWidthDraw * Math.sin(arrowAngle - Math.PI / 2));
        ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.restore();
    }, [ctx, CHARACTER_FOOT_OFFSET, THEME_COLORS]
  );

  const drawEnemyArcher = useCallback(
    (x, y, name, bowDraw = 0) => {
      if (!ctx) return;
      // ... (keep existing drawing code for body, limbs, bow etc.) ...
        const bodyColor = THEME_COLORS.ENEMY; const accentColor = THEME_COLORS.ENEMY_ACCENT;
        ctx.strokeStyle = bodyColor; ctx.fillStyle = bodyColor; ctx.lineWidth = 3 * SCALE_FACTOR;
        const headRadius = 8 * SCALE_FACTOR; const bodyHeight = 45 * SCALE_FACTOR; const legLength = 30 * SCALE_FACTOR;
        const armLength = 20 * SCALE_FACTOR; const bowRadiusDraw = 18 * SCALE_FACTOR; const legSpread = 10 * SCALE_FACTOR;
        const groundY = y + CHARACTER_FOOT_OFFSET; const bodyBottomY = groundY - legLength; const bodyTopY = bodyBottomY - bodyHeight; const headCenterY = bodyTopY - headRadius;
        ctx.beginPath(); ctx.moveTo(x, bodyBottomY); ctx.lineTo(x - legSpread, groundY); ctx.moveTo(x, bodyBottomY); ctx.lineTo(x + legSpread, groundY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, bodyBottomY); ctx.lineTo(x, bodyTopY); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, headCenterY, headRadius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = accentColor; const eyeRadius = 1.8 * SCALE_FACTOR; const eyeX = x - headRadius * 0.4; const eyeY = headCenterY - headRadius * 0.1;
        ctx.beginPath(); ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2); ctx.fill();
        const shoulderX = x; const shoulderY = bodyTopY + 5 * SCALE_FACTOR;
        ctx.beginPath(); ctx.moveTo(shoulderX, shoulderY); ctx.lineTo(shoulderX + 10 * SCALE_FACTOR, shoulderY + 15 * SCALE_FACTOR); ctx.stroke();
        const handX = shoulderX - armLength; const handY = shoulderY; ctx.beginPath(); ctx.moveTo(shoulderX, shoulderY); ctx.lineTo(handX, handY); ctx.stroke();
        ctx.save(); ctx.translate(handX, handY); ctx.strokeStyle = THEME_COLORS.BOW; ctx.lineWidth = 2.5 * SCALE_FACTOR; ctx.beginPath();
        ctx.arc(0, 0, bowRadiusDraw, Math.PI / 2, -Math.PI / 2, false); ctx.stroke();
        ctx.strokeStyle = THEME_COLORS.BOW_STRING; ctx.lineWidth = 1 * SCALE_FACTOR; ctx.beginPath();
        const topTipX = 0; const topTipY = bowRadiusDraw; const bottomTipX = 0; const bottomTipY = -bowRadiusDraw;
        const maxPull = 15 * SCALE_FACTOR; const pullX = maxPull * bowDraw; const pullY = 0;
        ctx.moveTo(topTipX, topTipY); ctx.lineTo(pullX, pullY); ctx.lineTo(bottomTipX, bottomTipY); ctx.stroke();
        ctx.restore(); // Restore bow context

      // --- Draw Enemy Name - UPDATED ---
      ctx.save();
      ctx.fillStyle = THEME_COLORS.TEXT;
      ctx.font = `${14 * SCALE_FACTOR}px Arial`; // Increased size (was 11)
      ctx.textAlign = "center";
      const textY = headCenterY - headRadius - 7 * SCALE_FACTOR; // Adjust Y pos slightly if needed
      ctx.fillText(name, x, textY);
      ctx.restore();

      ctx.restore(); // Restore main enemy context
    },
    [ctx, CHARACTER_FOOT_OFFSET, THEME_COLORS] // Dependencies remain the same
);



  // --- NEW: Calculate Trajectory Points ---
  const calculateTrajectoryPoints = useCallback((startX, startY, initialVx, initialVy, steps = 5, timeStep = 2) => {
    const points = [];
    let currentX = startX;
    let currentY = startY;
    let currentVx = initialVx;
    let currentVy = initialVy;
    const canvas = canvasRef.current;
    const lavaLevel = canvas ? canvas.height - 30 * SCALE_FACTOR : Infinity; // Get lava level

    for (let i = 0; i < steps; i++) {
        // Apply gravity over the timeStep
        currentVy += GRAVITY * timeStep;
        // Update position based on velocity over the timeStep
        currentX += currentVx * timeStep;
        currentY += currentVy * timeStep;

        // Stop if it hits the ground/lava or goes way off screen
        if (currentY > lavaLevel || currentX < -50 || currentX > (canvas?.width ?? Infinity) + 50) {
            break;
        }

        points.push({ x: currentX, y: currentY });
    }
    return points;
}, [GRAVITY, SCALE_FACTOR]); // Add dependencies GRAVITY, SCALE_FACTOR

// --- NEW: Draw Trajectory Preview ---
const drawTrajectoryPreview = useCallback((points) => {
    if (!ctx || points.length === 0) return;

    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)"; // Faint white dots
    // Or use dashed lines:
    // ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    // ctx.lineWidth = 1;
    // ctx.setLineDash([3, 5]); // Short dashes with gaps
    // ctx.beginPath();
    // ctx.moveTo(points[0].x, points[0].y);

    points.forEach((point, index) => {
        // Draw dots
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.5 * SCALE_FACTOR, 0, Math.PI * 2);
        ctx.fill();

        // Or draw lines
        // if (index > 0) {
        //    ctx.lineTo(point.x, point.y);
        // }
    });

    // ctx.stroke(); // For dashed line
    // ctx.setLineDash([]); // Reset line dash
    ctx.restore();
}, [ctx, SCALE_FACTOR]); // Add ctx dependency


  // Draw the main game scene (when gameState === 'playing')
  const drawGameScene = useCallback(() => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const cw = canvas.width;
    const ch = canvas.height;

    // 1. Background, Moon, Mountains, Lava (same as before)
    ctx.fillStyle = THEME_COLORS.BACKGROUND; ctx.fillRect(0, 0, cw, ch);
    const moonRadius = Math.min(cw, ch) * 0.2; const moonX = cw * 0.75; const moonY = ch * 0.2;
    ctx.fillStyle = THEME_COLORS.MOON; ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = THEME_COLORS.MOON_CRATER;
    for (let i = 0; i < 5; i++) {
        const craterR = Math.random() * moonRadius * 0.2 + moonRadius * 0.05; const angle_ = Math.random() * Math.PI * 2; // Renamed angle to angle_
        const dist = Math.random() * (moonRadius - craterR * 0.8); const craterX = moonX + Math.cos(angle_) * dist; const craterY = moonY + Math.sin(angle_) * dist; // Use angle_
        ctx.beginPath(); ctx.arc(craterX, craterY, craterR, 0, Math.PI * 2); ctx.fill();
    }
    const mountainStartY = ch * 0.55; ctx.fillStyle = THEME_COLORS.MOUNTAIN; ctx.beginPath(); ctx.moveTo(0, mountainStartY);
    ctx.lineTo(cw * 0.15, mountainStartY + 40 * SCALE_FACTOR); ctx.lineTo(cw * 0.3, mountainStartY - 15 * SCALE_FACTOR);
    ctx.lineTo(cw * 0.5, mountainStartY + 60 * SCALE_FACTOR); ctx.lineTo(cw * 0.7, mountainStartY - 25 * SCALE_FACTOR);
    ctx.lineTo(cw * 0.85, mountainStartY + 35 * SCALE_FACTOR); ctx.lineTo(cw, mountainStartY - 5 * SCALE_FACTOR);
    ctx.lineTo(cw, ch); ctx.lineTo(0, ch); ctx.closePath(); ctx.fill();
    const lavaHeight = 30 * SCALE_FACTOR; ctx.fillStyle = THEME_COLORS.LAVA; ctx.fillRect(0, ch - lavaHeight, cw, lavaHeight);
    ctx.fillStyle = THEME_COLORS.LAVA_SPARK;
    for (let i = 0; i < 25; i++) {
        ctx.beginPath(); ctx.arc(Math.random() * cw, ch - Math.random() * lavaHeight * 0.9, Math.random() * 2.5 + 1, 0, Math.PI * 2); ctx.fill();
    }


    // 5. Platforms & Health Bars (same as before)
    const healthBarThickness = 4 * SCALE_FACTOR;
    if (positions.player.x > 0) {
        const platformX = positions.player.x - PLATFORM_WIDTH / 2; const platformY = positions.player.platformY;
        ctx.fillStyle = THEME_COLORS.PLATFORM; ctx.fillRect(platformX, platformY, PLATFORM_WIDTH, PLATFORM_HEIGHT);
        ctx.fillStyle = THEME_COLORS.PLAYER_HEALTH_BAR; ctx.fillRect(platformX, platformY, PLATFORM_WIDTH, healthBarThickness);
    }
    positions.enemies.forEach((enemy) => {
        const platformX = enemy.x - PLATFORM_WIDTH / 2; const platformY = enemy.platformY;
        ctx.fillStyle = THEME_COLORS.PLATFORM; ctx.fillRect(platformX, platformY, PLATFORM_WIDTH, PLATFORM_HEIGHT);
        ctx.fillStyle = THEME_COLORS.ENEMY_HEALTH_BAR; ctx.fillRect(platformX, platformY, PLATFORM_WIDTH, healthBarThickness);
    });

    if (gameState === 'playing' && !playerArrow && positions.player.x > 0) {
      // Calculate initial conditions (MUST match firePlayerArrow)
      const angleRad = (-angle * Math.PI) / 180;
      const armLength = 20 * SCALE_FACTOR;
      const bodyTopOffsetY = -60 * SCALE_FACTOR + 5 * SCALE_FACTOR;
      const shoulderY = positions.player.y + bodyTopOffsetY;
      const handX = positions.player.x + armLength * Math.cos(angleRad);
      const handY = shoulderY + armLength * Math.sin(angleRad);
      const bowRadius = 18 * SCALE_FACTOR;
      const arrowStartX = handX - bowRadius * 0.5 * Math.cos(angleRad);
      const arrowStartY = handY - bowRadius * 0.5 * Math.sin(angleRad);
      const baseSpeed = 9 * Math.sqrt(SCALE_FACTOR);
      const powerMultiplier = 18 * Math.sqrt(SCALE_FACTOR);
      const speed = baseSpeed + (power / 100) * powerMultiplier;
      const initialVx = speed * Math.cos(angleRad);
      const initialVy = speed * Math.sin(angleRad);

      // Calculate points
      const trajectoryPoints = calculateTrajectoryPoints(arrowStartX, arrowStartY, initialVx, initialVy);

      // Draw the preview
      drawTrajectoryPreview(trajectoryPoints);
  }

    // 6. Draw Characters
    if (positions.player.x > 0) {
      drawPlayerArcher(positions.player.x, positions.player.y, angle, power);
    }
    positions.enemies.forEach((enemy) => {
      const aiState = enemyAiRef.current[enemy.id];
      const drawProgress = aiState?.isDrawingBow ? aiState.drawProgress : 0;
      drawEnemyArcher(enemy.x, enemy.y, enemy.name, drawProgress);
    });

    // 7. Draw Arrows
    if (playerArrow) {
      const currentAngle = Math.atan2(playerArrow.vy, playerArrow.vx);
      drawArrow(playerArrow.x, playerArrow.y, currentAngle);
    }
    enemyArrows.forEach((arrow) => {
      const currentAngle = Math.atan2(arrow.vy, arrow.vx);
      drawArrow(arrow.x, arrow.y, currentAngle);
    });

  }, [ ctx, positions, angle, power, playerArrow, enemyArrows, drawPlayerArcher, drawEnemyArcher, drawArrow, PLATFORM_WIDTH, PLATFORM_HEIGHT,gameState,calculateTrajectoryPoints, drawTrajectoryPreview,THEME_COLORS, SCALE_FACTOR]);

  // Fire the player's arrow
  const firePlayerArrow = useCallback(() => {
    if (gameState !== 'playing' || playerArrow || positions.player.x <= 0) return; // Check gameState
    setPlayerShots((prev) => prev + 1);

    const angleRad = (-angle * Math.PI) / 180;
    const armLength = 20 * SCALE_FACTOR;
    const bodyTopOffsetY = -60 * SCALE_FACTOR + 5 * SCALE_FACTOR;
    const shoulderY = positions.player.y + bodyTopOffsetY;
    const handX = positions.player.x + armLength * Math.cos(angleRad);
    const handY = shoulderY + armLength * Math.sin(angleRad);
    const bowRadius = 18 * SCALE_FACTOR;
    const arrowStartX = handX - bowRadius * 0.5 * Math.cos(angleRad);
    const arrowStartY = handY - bowRadius * 0.5 * Math.sin(angleRad);
    const baseSpeed = 9 * Math.sqrt(SCALE_FACTOR);
    const powerMultiplier = 18 * Math.sqrt(SCALE_FACTOR);
    const speed = baseSpeed + (power / 100) * powerMultiplier;

    setPlayerArrow({
      x: arrowStartX, y: arrowStartY,
      vx: speed * Math.cos(angleRad), vy: speed * Math.sin(angleRad),
      id: Date.now(),
    });
  }, [gameState, playerArrow, positions, angle, power]); // Add gameState


  // --- Effects ---

  // Effect 1: Initialize context & Start First Question
  useEffect(() => {
    console.log("Game component mounted");
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas ref not found on mount");
      return;
    }
    canvas.width = 1000;
    canvas.height = 600;
    const context = canvas.getContext("2d");
    setCtx(context);
    console.log(`Canvas size set to: ${canvas.width}x${canvas.height}`);

    // Initial game state setup
    setGameState('showing_question'); // Start by showing the first question
    setCurrentQuestionIndex(0);
    setPlayerScore(0);
    setEnemyScore(0);

    return () => {
      console.log("Game component unmounting");
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


  // Effect: Keep enemyArrowsRef in sync
  useEffect(() => {
    enemyArrowsRef.current = enemyArrows;
  }, [enemyArrows]);

  // Effect 3: Canvas Click Handler
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !ctx) return;

      const handleClick = (event) => {
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;    // relationship bitmap vs. element for X
          const scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

          const canvasX = (event.clientX - rect.left) * scaleX;
          const canvasY = (event.clientY - rect.top) * scaleY;


          const areas = clickableAreasRef.current;
          // console.log(`Click at (${canvasX.toFixed(0)}, ${canvasY.toFixed(0)}) - GameState: ${gameState}`); // Debug click

          for (const key in areas) {
              const area = areas[key];
              if (
                  canvasX >= area.x &&
                  canvasX <= area.x + area.width &&
                  canvasY >= area.y &&
                  canvasY <= area.y + area.height
              ) {
                   console.log(`Clicked on area: ${key}, action: ${area.action}`); // Debug hit

                  // Handle actions based on gameState and button clicked
                  if (gameState === 'showing_question' && area.action === 'start_round') {
                       clickableAreasRef.current = {}; // Clear areas before state change
                       startArcheryRound();
                       return; // Action handled
                  }
                   if (gameState === 'showing_explanation') {
                       if (area.action === 'next_question') {
                           clickableAreasRef.current = {};
                           setCurrentQuestionIndex(prev => prev + 1);
                           setGameState('showing_question');
                           return;
                       } else if (area.action === 'finish_game') {
                           clickableAreasRef.current = {};
                           setGameState('game_over');
                           return;
                       }
                   }
                  if (gameState === 'game_over' && area.action === 'restart_game') {
                       clickableAreasRef.current = {};
                       // Reset scores, question index, and go to first question
                       setPlayerScore(0);
                       setEnemyScore(0);
                       setCurrentQuestionIndex(0);
                       setGameState('showing_question');
                       return;
                  }
              }
          }
      };

      canvas.addEventListener('click', handleClick);
      return () => canvas.removeEventListener('click', handleClick);

  }, [ctx, gameState, startArcheryRound]); // Add dependencies


  // Effect 4: Main game loop (Animation, Physics, AI based on gameState)
  useEffect(() => {
    if (!ctx) return;

    let lastTimestamp = 0;
    let isActive = true;

    const animate = (timestamp) => {
      if (!isActive || !ctx || !canvasRef.current) return; // Add canvas check

      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
       clickableAreasRef.current = {}; // Clear clickable areas at start of frame


      // --- Clear Canvas (or draw background) ---
       // Always clear or draw background first
        ctx.fillStyle = THEME_COLORS.BACKGROUND; // Or whatever your base is
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);


      // --- State-Based Logic and Drawing ---
      switch (gameState) {
        case 'showing_question':
          drawQuestionScreen(); // Draws the question UI, sets clickable areas
          break;

        case 'showing_explanation':
          drawExplanationScreen(); // Draws explanation UI, sets clickable areas
          break;

        case 'game_over':
           drawGameOverScreen(); // Draws final score UI, sets clickable areas
          break;

        case 'playing':
          // Only run physics and game drawing when playing
          if (deltaTime > 0) {
             // --- Enemy Shooting Logic (Bow Draw Animation & Firing) ---
            if (enemyCanFire && enemyAiRef.current.length === NUM_ENEMIES) {
              enemyAiRef.current.forEach((aiState, index) => {
                if (!aiState.isDrawingBow) {
                  aiState.nextShotDelay -= deltaTime;
                  if (aiState.nextShotDelay <= 0) {
                    aiState.isDrawingBow = true;
                    aiState.drawProgress = 0;
                    aiState.firePending = true;
                  }
                } else {
                  aiState.drawProgress += deltaTime / aiState.drawDuration;
                  if (aiState.drawProgress >= 1) {
                     aiState.drawProgress = 1; // Cap progress
                     if (aiState.firePending) {
                       aiState.isDrawingBow = false;
                       aiState.firePending = false;
                       aiState.drawProgress = 0; // Reset for visual clarity
                       fireEnemyArrow(index); // Fire the arrow
                       aiState.nextShotDelay = Math.random() * 2000 + 1500; // Reset timer
                     }
                  }
                }
              });
            }

            // --- Physics Updates ---
             const canvas = canvasRef.current;
             const lavaLevel = canvas.height - 30 * SCALE_FACTOR;
             const outOfBoundsMargin = 100 * SCALE_FACTOR;

             // --- Player Arrow Physics ---
             if (playerArrow) {
               const newVx = playerArrow.vx;
               const newVy = playerArrow.vy + GRAVITY;
               const newX = playerArrow.x + newVx;
               const newY = playerArrow.y + newVy;
               let hitDetected = false;

               if (newX < -outOfBoundsMargin || newX > canvas.width + outOfBoundsMargin || newY > lavaLevel + 10) {
                 setPlayerArrow(null);
                 hitDetected = true;
               } else {
                 for (let i = 0; i < positions.enemies.length; i++) {
                   const enemy = positions.enemies[i];
                   const enemyCenterX = enemy.x;
                   const enemyCenterY = enemy.y - 30 * SCALE_FACTOR;
                   const dx = newX - enemyCenterX;
                   const dy = newY - enemyCenterY;
                   if (Math.sqrt(dx * dx + dy * dy) < ENEMY_HIT_RADIUS) {
                     const enemyId = enemy.id;
                     const enemyPowerVal = enemyAiRef.current[enemyId]?.power; // Use ? for safety
                     if (enemyPowerVal === 1) {
                       handleHit("Player", { enemyIndex: i });
                     } else {
                       console.log("Player hit non-critical enemy", i);
                       // Optionally add visual feedback for non-critical hit here
                     }
                     setPlayerArrow(null); // Remove arrow on any hit
                     hitDetected = true;
                     break;
                   }
                 }
               }
               if (!hitDetected) {
                 setPlayerArrow((prev) => ({ ...prev, x: newX, y: newY, vx: newVx, vy: newVy }));
               }
             }

             // --- Enemy Arrows Physics ---
             if (enemyArrows.length > 0) {
               const nextEnemyArrows = [];
               let updateState = false;

               for (const arrow of enemyArrows) {
                 const newVx = arrow.vx;
                 const newVy = arrow.vy + GRAVITY;
                 const newX = arrow.x + newVx;
                 const newY = arrow.y + newVy;
                 let arrowRemoved = false;

                 if (newX < -outOfBoundsMargin || newX > canvas.width + outOfBoundsMargin || newY > lavaLevel + 10) {
                   if (enemyAiRef.current[arrow.enemyIndex]) {
                     learnFromMiss(arrow.enemyIndex, arrow.minMissDistance);
                   }
                   arrowRemoved = true;
                   updateState = true;
                 } else {
                   const playerCenterX = positions.player.x;
                   const playerCenterY = positions.player.y - 30 * SCALE_FACTOR;
                   const dxPlayer = newX - playerCenterX;
                   const dyPlayer = newY - playerCenterY;
                   const distPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer);
                   const currentMinMiss = Math.min(arrow.minMissDistance, distPlayer);

                   if (distPlayer < PLAYER_HIT_RADIUS) {
                     if (arrow.power === 1) {
                       handleHit("Enemy", { enemyIndex: arrow.enemyIndex, arrowId: arrow.id });
                     } else {
                       console.log(`Non-critical hit by enemy ${arrow.enemyIndex}`);
                       // Optional: visual feedback for non-critical hit
                     }
                     if (enemyAiRef.current[arrow.enemyIndex]) {
                       learnFromMiss(arrow.enemyIndex, distPlayer);
                     }
                     arrowRemoved = true;
                     updateState = true;
                     // If handleHit was called, the loop might continue briefly,
                     // but subsequent calls in the same frame won't re-trigger handleHit due to gameState change.
                   } else {
                     // Keep arrow if no hit and not removed
                     nextEnemyArrows.push({ ...arrow, x: newX, y: newY, vx: newVx, vy: newVy, minMissDistance: currentMinMiss });
                     if (Math.abs(newX - arrow.x) > 0.1 || Math.abs(newY - arrow.y) > 0.1) {
                       updateState = true;
                     }
                   }
                 }
               }
               if (updateState) {
                 setEnemyArrows(nextEnemyArrows); // Update state with remaining/moved arrows
               }
             }
          } // End if (deltaTime > 0)

          // --- Draw the Game Scene ---
          drawGameScene();
          break; // End case 'playing'

        default: // 'loading' or other states
            // Optionally draw a loading indicator
            if (gameState === 'loading' && ctx) {
                ctx.fillStyle = THEME_COLORS.TEXT;
                ctx.font = "20px Arial";
                ctx.textAlign = "center";
                ctx.fillText("Loading...", canvasRef.current.width / 2, canvasRef.current.height / 2);
            }
      } // End switch (gameState)


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
    // Dependencies for the main loop:
    ctx, gameState, enemyCanFire, playerArrow, enemyArrows, positions, // State values used directly
    // Functions called based on state:
    drawQuestionScreen, drawExplanationScreen, drawGameOverScreen, drawGameScene, // Drawing
    fireEnemyArrow, learnFromMiss, handleHit, // Game logic functions
  ]);


  // --- Render JSX ---
  return (
    <div className="archery-game-container">
      {/* Scoreboards - Always Visible */}
      <div className="scoreboard scoreboard-top-left">
        <h3>Player</h3>
        <p>Score: {playerScore}</p>
         {/* Show shots only during play? Or keep total? Let's keep total for now. */}
        {/* <p>Shots This Round: {playerShots}</p> */}
      </div>
      <div className="scoreboard scoreboard-top-right">
        <h3>Enemies</h3>
        <p>Score: {enemyScore}</p>
         {/* <p>Shots This Round: {enemyTotalShots}</p> */}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="game-canvas"
        // Style is handled by CSS or drawing now
      />

          {/* Controls Area - Only visible when playing */}
          <div className="controls-area">
        {gameState === 'playing' && positions.player.x !== 0 && (
          <div className="bottom-controls">

            {/* Angle Control Group */}
            <div className="control-set angle-control">
              <label htmlFor="angle-slider">Angle</label>
              <div className="slider-container">
                 <button
                   className="fine-tune-button minus-button"
                   onClick={() => setAngle(a => Math.max(0, a - 1))} // Decrement angle, min 0
                   disabled={!!playerArrow}
                   aria-label="Decrease Angle"
                 >-</button>
                 <input
                    id="angle-slider"
                    type="range" min="0" max="90" value={angle}
                    onChange={(e) => setAngle(parseInt(e.target.value))}
                    disabled={!!playerArrow}
                    className="control-slider"
                 />
                 <button
                    className="fine-tune-button plus-button"
                    onClick={() => setAngle(a => Math.min(90, a + 1))} // Increment angle, max 90
                    disabled={!!playerArrow}
                    aria-label="Increase Angle"
                 >+</button>
              </div>
              <span className="value-display">{angle}°</span>
            </div>

            {/* Power Control Group */}
            <div className="control-set power-control">
               <label htmlFor="power-slider">Power</label>
               <div className="slider-container">
                 <button
                   className="fine-tune-button minus-button"
                   onClick={() => setPower(p => Math.max(10, p - 1))} // Decrement power, min 10
                   disabled={!!playerArrow}
                   aria-label="Decrease Power"
                 >-</button>
                 <input
                    id="power-slider"
                    type="range" min="10" max="100" value={power}
                    onChange={(e) => setPower(parseInt(e.target.value))}
                    disabled={!!playerArrow}
                    className="control-slider"
                 />
                  <button
                    className="fine-tune-button plus-button"
                    onClick={() => setPower(p => Math.min(100, p + 1))} // Increment power, max 100
                    disabled={!!playerArrow}
                    aria-label="Increase Power"
                  >+</button>
               </div>
               <span className="value-display">{power}</span>
            </div>

            {/* Fire Button */}
            <button
              className="fire-button"
              onClick={firePlayerArrow}
              disabled={!!playerArrow}
            >
              FIRE! {/* Maybe make text more impactful */}
            </button>

          </div>
        )}
         {/* Display messages based on state if needed outside canvas */}
         {gameState === 'loading' && <div className="loading-message">Loading Game...</div>}
      </div>
    </div>
  );
};

export default ArcheryGame;