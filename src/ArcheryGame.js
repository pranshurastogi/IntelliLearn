import React, { useEffect, useRef, useState, useCallback } from "react";
import "./ArcheryGame.css"; // Make sure you have a corresponding CSS file

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

  // Arrow objects (x, y, vx, vy)
  const [playerArrow, setPlayerArrow] = useState(null);
  const [enemyArrow, setEnemyArrow] = useState(null);

  // Enemy AI memory
  const enemyAimRef = useRef({
    lastAngle: 0, // Angle offset adjustment (radians)
    lastSpeed: 15,
    missDistance: 0,
    improvementFactor: 0.3,
  });

  // Positions - Initialize with 0,0 to detect when they are first set
  const [positions, setPositions] = useState({
    player: { x: 0, y: 0 },
    enemy: { x: 0, y: 0 },
  });

  // --- Memoized Functions ---

  const generateRandomPositions = useCallback((canvas) => {
    if (!canvas) return { player: { x: 0, y: 0 }, enemy: { x: 0, y: 0 } }; // Safety check
    const playerX = Math.random() * (canvas.width * 0.15) + canvas.width * 0.05;
    const enemyX = Math.random() * (canvas.width * 0.25) + canvas.width * 0.7;
    const minY = canvas.height - 200;
    const maxY = canvas.height - 50;
    const playerY = Math.random() * (maxY - minY) + minY;
    const enemyY = Math.random() * (maxY - minY) + minY;
    return { player: { x: playerX, y: playerY }, enemy: { x: enemyX, y: enemyY } };
  }, []);

  // Define fireEnemyArrow before setupEnemyShooting
  const fireEnemyArrow = useCallback(() => {
     // Added guard for invalid positions early on
    if (roundOver || enemyArrow || positions.enemy.x <= 0) {
         if(positions.enemy.x <= 0) console.warn("Enemy positions invalid, skipping shot");
         return;
    }
    setEnemyShots((prev) => prev + 1);

    // --- Calculate Arrow Start Position ---
    const bowAnchorX = positions.enemy.x - 25; // Matches frontArmX in drawEnemyArcher
    const bowAnchorY = positions.enemy.y - 105; // Matches frontArmY in drawEnemyArcher

    const targetX = positions.player.x;
    const targetY = positions.player.y - 100;
    const dx = targetX - bowAnchorX;
    const dy = targetY - bowAnchorY;
    const baseAngleRad = Math.atan2(dy, dx);

    const launchAngleRad = baseAngleRad + enemyAimRef.current.lastAngle;
    const launchSpeed = enemyAimRef.current.lastSpeed;

    // Start exactly at the anchor point for debugging alignment
    const startX = bowAnchorX;
    const startY = bowAnchorY;

    console.log(`Enemy Firing: Anchor=(${bowAnchorX.toFixed(1)}, ${bowAnchorY.toFixed(1)}), Start=(${startX.toFixed(1)}, ${startY.toFixed(1)}), TargetAngle=${baseAngleRad.toFixed(2)}, Final Angle=${launchAngleRad.toFixed(2)}, Speed=${launchSpeed.toFixed(2)}`);

    setEnemyArrow({ x: startX, y: startY, vx: launchSpeed * Math.cos(launchAngleRad), vy: launchSpeed * Math.sin(launchAngleRad) });
    enemyAimRef.current.missDistance = 0; // Reset miss distance for the new shot
  }, [roundOver, enemyArrow, positions]); // Dependencies


  // Setup enemy shooting interval
  const setupEnemyShooting = useCallback(() => {
    console.log("Setting up enemy shooting interval...");
    if (enemyIntervalRef.current) {
        console.log("Clearing previous enemy interval");
        clearInterval(enemyIntervalRef.current);
    }

    const intervalId = setInterval(() => {
        if (!roundOver && !enemyArrow && positions.enemy.x > 0) { // Check valid position
            console.log("Enemy interval: Firing check passed.");
            fireEnemyArrow();
        } else {
             console.log(`Enemy interval: Firing check skipped (roundOver=${roundOver}, enemyArrow=${!!enemyArrow}, enemyX=${positions.enemy.x})`);
        }
    }, Math.random() * (2500 - 1500) + 1500); // Random interval between 1.5s and 2.5s

    enemyIntervalRef.current = intervalId;

    // Return a cleanup function
    return () => {
        console.log("Running cleanup for enemy shooting interval");
        clearInterval(intervalId);
        enemyIntervalRef.current = null;
    };
  }, [fireEnemyArrow, roundOver, enemyArrow, positions.enemy.x]); // Dependency on positions.enemy.x ensures it restarts if pos change relevantly? (Check this) Better trigger is parent effect.


  // Start a new round (primarily resets state and positions)
  const startNewRound = useCallback(() => {
    console.log("startNewRound called: Resetting state for new round.");
    setRoundOver(false);
    setPlayerShots(0);
    setEnemyShots(0);
    setPlayerArrow(null);
    setEnemyArrow(null);

    // Regenerate positions for the new round
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        const newPositions = generateRandomPositions(canvas);
        setPositions(newPositions); // Set new positions
        // The useEffect depending on 'positions' and 'roundOver' handles starting AI
    } else {
        console.warn("Canvas ref not available in startNewRound");
    }
  }, [generateRandomPositions]); // No longer depends on setupEnemyShooting


  // Enemy learns from misses
  const learnFromMiss = useCallback((missDistance) => {
    if (roundOver) return;
    const factor = enemyAimRef.current.improvementFactor;
    let angleChange = 0;
    let speedChange = 0;

    if (missDistance > 100) {
        angleChange = (Math.random() - 0.5) * 0.2 * factor * 5;
        speedChange = (Math.random() - 0.5) * 4 * factor;
    } else {
        angleChange = (Math.random() - 0.5) * 0.1 * factor * 3;
        speedChange = (Math.random() - 0.5) * 2 * factor;
    }

    enemyAimRef.current.lastAngle += angleChange;
    enemyAimRef.current.lastSpeed += speedChange;
    enemyAimRef.current.lastSpeed = Math.max(10, Math.min(30, enemyAimRef.current.lastSpeed));

    console.log(`Enemy learned: MissDist=${missDistance.toFixed(0)}, AngleAdj=${angleChange.toFixed(3)}, SpeedAdj=${speedChange.toFixed(2)} => New AngleOffset=${enemyAimRef.current.lastAngle.toFixed(3)}, New Speed=${enemyAimRef.current.lastSpeed.toFixed(2)}`);
  }, [roundOver]);


  // Handle a hit event
  const handleHit = useCallback((winner) => {
    if (roundOver) return;
    console.log(`${winner} HIT! Round over.`);
    setRoundOver(true); // This will trigger cleanup in the AI effect
    setPlayerArrow(null);
    setEnemyArrow(null);

    // Explicitly clear interval just in case (though effect cleanup should handle it)
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
      startNewRound(); // Prepare for the next round
    }, 500);
  }, [roundOver, startNewRound]);


  // Draw the arrow graphic
  const drawArrow = useCallback((x, y, angle) => {
    if (!ctx) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "#8B4513"; // SaddleBrown shaft
    ctx.fillRect(-20, -1.5, 30, 3);
    ctx.fillStyle = "#A9A9A9"; // DarkGray head
    ctx.beginPath();
    ctx.moveTo(10, -4); ctx.lineTo(18, 0); ctx.lineTo(10, 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#F5F5DC"; // Beige fletching
    ctx.beginPath(); ctx.moveTo(-15, -1.5); ctx.lineTo(-25, -5); ctx.lineTo(-20, -1.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-15, 1.5); ctx.lineTo(-25, 5); ctx.lineTo(-20, 1.5); ctx.fill();
    ctx.restore();
  }, [ctx]);


  // Draw the player archer
  const drawPlayerArcher = useCallback((x, y, angleDeg, powerPercent) => {
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = "blue"; ctx.strokeStyle = "blue"; ctx.lineWidth = 4;
    const headRadius = 12; const headY = y - 120; const bodyTopY = y - 100;
    const bodyBottomY = y - 60; const groundY = y; const armLength = 25; const bowRadius = 20;

    ctx.beginPath(); ctx.moveTo(x, bodyBottomY); ctx.lineTo(x, bodyTopY); ctx.stroke(); // Body
    ctx.beginPath(); ctx.arc(x, headY, headRadius, 0, Math.PI * 2); ctx.fill(); // Head
    ctx.beginPath(); ctx.moveTo(x, bodyBottomY); ctx.lineTo(x - 10, groundY); ctx.stroke(); // Leg 1
    ctx.beginPath(); ctx.moveTo(x, bodyBottomY); ctx.lineTo(x + 10, groundY); ctx.stroke(); // Leg 2
    ctx.beginPath(); ctx.moveTo(x, bodyTopY); ctx.lineTo(x - 15, bodyTopY - 10); ctx.stroke(); // Back Arm

    const angleRad = (-angleDeg * Math.PI) / 180;
    const armEndX = x + armLength * Math.cos(angleRad);
    const armEndY = bodyTopY + armLength * Math.sin(angleRad);
    ctx.beginPath(); ctx.moveTo(x, bodyTopY); ctx.lineTo(armEndX, armEndY); ctx.stroke(); // Front Arm

    ctx.translate(armEndX, armEndY); ctx.rotate(angleRad); // Move to arm end for bow

    ctx.lineWidth = 3; ctx.strokeStyle = "#8B4513"; // Brown bow
    ctx.beginPath(); ctx.arc(0, 0, bowRadius, Math.PI / 2, -Math.PI / 2, true); ctx.stroke();

    const pullBack = (powerPercent / 100) * 15;
    ctx.lineWidth = 1; ctx.strokeStyle = "#A9A9A9"; // Grey string
    ctx.beginPath(); ctx.moveTo(0, -bowRadius); ctx.lineTo(-pullBack, 0); ctx.lineTo(0, bowRadius); ctx.stroke();

    // Nocked Arrow Visual
    const arrowLength = 30; const arrowYOffset = -1.5;
    ctx.fillStyle = "#D2691E"; ctx.fillRect(-pullBack - arrowLength, arrowYOffset, arrowLength, 3);
    ctx.fillStyle = "#696969"; ctx.beginPath();
    ctx.moveTo(-pullBack - arrowLength, arrowYOffset - 2); ctx.lineTo(-pullBack - arrowLength - 8, arrowYOffset + 1.5); ctx.lineTo(-pullBack - arrowLength, arrowYOffset + 5);
    ctx.fill();

    ctx.restore(); // Restore context translation/rotation
  }, [ctx]); // Only depends on ctx


  // Draw the enemy archer
  const drawEnemyArcher = useCallback((x, y) => {
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = "red"; ctx.strokeStyle = "red"; ctx.lineWidth = 4;
    const headRadius = 12; const headY = y - 120; const bodyTopY = y - 100;
    const bodyBottomY = y - 60; const groundY = y; const armLength = 25; const bowRadius = 20;

    ctx.beginPath(); ctx.moveTo(x, bodyBottomY); ctx.lineTo(x, bodyTopY); ctx.stroke(); // Body
    ctx.beginPath(); ctx.arc(x, headY, headRadius, 0, Math.PI * 2); ctx.fill(); // Head
    ctx.beginPath(); ctx.moveTo(x, bodyBottomY); ctx.lineTo(x - 10, groundY); ctx.stroke(); // Leg 1
    ctx.beginPath(); ctx.moveTo(x, bodyBottomY); ctx.lineTo(x + 10, groundY); ctx.stroke(); // Leg 2

    const frontArmX = x - armLength; // Arm reaching left towards player
    const frontArmY = bodyTopY - 5; // (y - 105) - This is the bow anchor point
    ctx.beginPath(); ctx.moveTo(x, bodyTopY); ctx.lineTo(frontArmX, frontArmY); ctx.stroke(); // Front arm
    ctx.beginPath(); ctx.moveTo(x, bodyTopY); ctx.lineTo(x + 15, bodyTopY - 10); ctx.stroke(); // Back arm (static)

    // Draw Static Bow relative to front arm end
    ctx.save();
    ctx.translate(frontArmX, frontArmY); // Move to bow anchor point
    ctx.lineWidth = 3; ctx.strokeStyle = "#8B4513"; // Brown bow
    ctx.beginPath(); ctx.arc(0, 0, bowRadius, Math.PI / 2, -Math.PI / 2, false); ctx.stroke(); // Semicircle facing player
    ctx.lineWidth = 1; ctx.strokeStyle = "#A9A9A9"; // Grey string
    ctx.beginPath(); ctx.moveTo(0, -bowRadius); ctx.lineTo(0, bowRadius); ctx.stroke(); // Straight string
    ctx.restore(); // Restore bow translation

    // --- DEBUG: Draw a small circle at the calculated bow anchor ---
    ctx.fillStyle = "lime"; // Bright green color
    ctx.beginPath();
    ctx.arc(frontArmX, frontArmY, 3, 0, Math.PI * 2); // Draw circle at bow anchor
    ctx.fill();
    // --- END DEBUG ---

    ctx.restore(); // Restore main context state
  }, [ctx]); // Only depends on ctx


  // Draw the entire game scene
  const drawGame = useCallback(() => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    ctx.fillStyle = "#87CEEB"; ctx.fillRect(0, 0, canvas.width, canvas.height); // Sky
    ctx.fillStyle = "#228B22"; ctx.fillRect(0, canvas.height - 50, canvas.width, 50); // Ground

    drawPlayerArcher(positions.player.x, positions.player.y, angle, power);
    drawEnemyArcher(positions.enemy.x, positions.enemy.y);

    if (playerArrow) {
       const currentAngle = Math.atan2(playerArrow.vy, playerArrow.vx);
       drawArrow(playerArrow.x, playerArrow.y, currentAngle);
    }
    if (enemyArrow) {
       const currentAngle = Math.atan2(enemyArrow.vy, enemyArrow.vx);
       drawArrow(enemyArrow.x, enemyArrow.y, currentAngle);
    }
  }, [ ctx, positions, angle, power, playerArrow, enemyArrow,
       drawPlayerArcher, drawEnemyArcher, drawArrow ]);


  // Fire the player's arrow
  const firePlayerArrow = useCallback(() => {
    if (roundOver || playerArrow) return;
    setPlayerShots((prev) => prev + 1);

    const angleRad = (-angle * Math.PI) / 180;
    const armLength = 25; const bodyTopY = positions.player.y - 100;
    const armEndX = positions.player.x + armLength * Math.cos(angleRad);
    const armEndY = bodyTopY + armLength * Math.sin(angleRad);
    const arrowOffset = 10; // Start slightly in front of hand
    const startX = armEndX + arrowOffset * Math.cos(angleRad);
    const startY = armEndY + arrowOffset * Math.sin(angleRad);
    const speed = 10 + (power / 100) * 20;

    setPlayerArrow({ x: startX, y: startY, vx: speed * Math.cos(angleRad), vy: speed * Math.sin(angleRad) });
  }, [roundOver, playerArrow, positions, angle, power]);


  // --- Effects ---

  // Effect 1: Initialize context (Runs once on mount)
  useEffect(() => {
    console.log("Game component mounted");
    const canvas = canvasRef.current;
    if (!canvas) { console.error("Canvas ref not found on mount"); return; };
    const context = canvas.getContext("2d");
    setCtx(context);
    console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
    return () => { console.log("Game component unmounting"); };
  }, []); // Empty dependency array ensures this runs only once


  // Effect 2: Set initial positions *after* ctx is ready and only if positions are still 0,0
  useEffect(() => {
    if (ctx && positions.player.x === 0 && positions.enemy.x === 0) {
         console.log("Context ready, setting initial positions...");
         const canvas = canvasRef.current;
         if(canvas){
             const newPositions = generateRandomPositions(canvas);
             setPositions(newPositions); // Set initial positions
         }
    }
  }, [ctx, generateRandomPositions, positions.player.x, positions.enemy.x]); // Runs when ctx is set


  // Effect 3: START THE ROUND LOGIC (including enemy AI) *after* positions are initialized and round is active
  useEffect(() => {
      // Only run if ctx is ready AND positions ARE initialized (non-zero) AND round is NOT over
      if (ctx && positions.player.x !== 0 && positions.enemy.x !== 0 && !roundOver) {
          console.log("Positions initialized & round active, starting enemy shooting...");

          // Reset AI memory at the beginning of the round's active phase
          enemyAimRef.current.lastAngle = 0;
          enemyAimRef.current.lastSpeed = 15;
          enemyAimRef.current.missDistance = 0;

          const cleanupShooting = setupEnemyShooting(); // Start the interval, get cleanup

          return cleanupShooting; // Cleanup when effect re-runs (pos change, round ends) or unmount
      } else {
          console.log(`Skipping AI start (ctx=${!!ctx}, px=${positions.player.x}, ex=${positions.enemy.x}, roundOver=${roundOver})`);
          // Ensure cleanup if effect re-runs due to roundOver becoming true
          if (enemyIntervalRef.current) {
               console.log("Clearing enemy interval because round ended or positions reset.");
               clearInterval(enemyIntervalRef.current);
               enemyIntervalRef.current = null;
          }
      }
  }, [ctx, positions, roundOver, setupEnemyShooting]); // Runs when these change


  // Effect 4: Main game loop (Animation and Physics)
  useEffect(() => {
    if (!ctx || roundOver) { // Stop loop if no context or round is done
        if (requestRef.current) { cancelAnimationFrame(requestRef.current); requestRef.current = null; }
        return;
    };

    let isActive = true; // Prevent updates after cleanup

    const animate = (timestamp) => {
      if (!isActive || !ctx || roundOver) return; // Re-check state inside loop

      // --- Physics Updates (Immutable) ---
      let nextPlayerArrow = playerArrow;
      if (playerArrow) {
          const newVx = playerArrow.vx; const newVy = playerArrow.vy + 0.4;
          const newX = playerArrow.x + newVx; const newY = playerArrow.y + newVy;
          nextPlayerArrow = { x: newX, y: newY, vx: newVx, vy: newVy };

          const canvas = canvasRef.current; // Check bounds
          if (!canvas || newX < -50 || newX > canvas.width + 50 || newY > canvas.height + 50) {
               nextPlayerArrow = null;
          } else { // Check collision
              const dx = newX - positions.enemy.x;
              const dy = newY - (positions.enemy.y - 100);
              if (Math.sqrt(dx * dx + dy * dy) < 35) {
                  handleHit("Player"); nextPlayerArrow = null;
              }
          }
          if (nextPlayerArrow !== playerArrow) { setPlayerArrow(nextPlayerArrow); }
      }

      let nextEnemyArrow = enemyArrow;
      if (enemyArrow) {
          const newVx = enemyArrow.vx; const newVy = enemyArrow.vy + 0.4;
          const newX = enemyArrow.x + newVx; const newY = enemyArrow.y + newVy;
          nextEnemyArrow = { x: newX, y: newY, vx: newVx, vy: newVy };

          const canvas = canvasRef.current; // Check bounds
          if (!canvas || newX < -50 || newX > canvas.width + 50 || newY > canvas.height + 50) {
                if(!roundOver && enemyAimRef.current.missDistance > 0){ // Learn only if round active
                    learnFromMiss(enemyAimRef.current.missDistance);
                }
               nextEnemyArrow = null;
          } else { // Check collision
              const dx = newX - positions.player.x;
              const dy = newY - (positions.player.y - 100);
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (!roundOver) { // Track miss distance only if round active
                   if (enemyAimRef.current.missDistance === 0 || dist < enemyAimRef.current.missDistance) {
                      enemyAimRef.current.missDistance = dist;
                   }
              }
              if (dist < 35) {
                  handleHit("Enemy"); nextEnemyArrow = null;
              }
          }
          if(nextEnemyArrow !== enemyArrow) { setEnemyArrow(nextEnemyArrow); }
      }

      // --- Drawing ---
      drawGame(); // Draw the current state

      requestRef.current = requestAnimationFrame(animate); // Request next frame
    };

    // Start the animation loop
    console.log("Starting animation loop");
    requestRef.current = requestAnimationFrame(animate);

    // Cleanup function for the animation loop
    return () => {
      console.log("Cleaning up animation loop effect");
      isActive = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [ ctx, roundOver, playerArrow, enemyArrow, positions, handleHit, learnFromMiss, drawGame ]);


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
        <h3>Enemy</h3>
        <p>Score: {enemyScore}</p>
        <p>Shots: {enemyShots}</p>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="game-canvas"
        style={{ border: "1px solid black", background: '#f0f0f0' }}
      />

      {/* Controls Area */}
      <div className="controls-area">
          {!roundOver && ctx && positions.player.x !== 0 && ( // Show controls only when round active and initialized
              <div className="bottom-controls">
                <div className="slider-group">
                  <label>Angle: <span>{angle}°</span></label>
                  <input type="range" min="0" max="90" value={angle} onChange={(e) => setAngle(parseInt(e.target.value))} disabled={!!playerArrow}/>
                </div>
                <div className="slider-group">
                  <label>Power: <span>{power}</span></label>
                  <input type="range" min="10" max="100" value={power} onChange={(e) => setPower(parseInt(e.target.value))} disabled={!!playerArrow}/>
                </div>
                <button className="fire-button" onClick={firePlayerArrow} disabled={!!playerArrow}>
                  Fire!
                </button>
              </div>
          )}
          {roundOver && ( // Show message when round over
                <div className="round-over-message">Round Over! Starting next round soon...</div>
          )}
           {!ctx && ( // Show loading message until context is ready
                <div className="loading-message">Loading Game...</div>
          )}
      </div>
    </div>
  );
};

export default ArcheryGame;