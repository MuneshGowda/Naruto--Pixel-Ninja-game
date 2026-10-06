/**
 * Intelligent AI Opponent Controller for Naruto 2D Fighting Game
 * Supports Easy (Genin), Medium (Chunin), Hard (Jonin), and Nightmare (Kage).
 */

export const AI_DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: 'Easy (Genin)',
    title: 'Academy Genin',
    badgeColor: '#22c55e', // Green
    reactionFrames: 36,
    blockChance: 0.15,
    specialAggression: 0.3,
    chargeIntelligence: 0.25,
    counterWhiff: false
  },
  medium: {
    id: 'medium',
    name: 'Medium (Chunin)',
    title: 'Chunin Shinobi',
    badgeColor: '#eab308', // Gold
    reactionFrames: 18,
    blockChance: 0.50,
    specialAggression: 0.65,
    chargeIntelligence: 0.60,
    counterWhiff: true
  },
  hard: {
    id: 'hard',
    name: 'Hard (Jonin)',
    title: 'Elite Jonin',
    badgeColor: '#f97316', // Orange
    reactionFrames: 7,
    blockChance: 0.85,
    specialAggression: 0.90,
    chargeIntelligence: 0.85,
    counterWhiff: true
  },
  nightmare: {
    id: 'nightmare',
    name: 'Nightmare (Kage)',
    title: 'Legendary Kage',
    badgeColor: '#dc2626', // Red
    reactionFrames: 3,
    blockChance: 0.96,
    specialAggression: 0.98,
    chargeIntelligence: 0.95,
    counterWhiff: true
  }
};

export class AIController {
  constructor(difficultyKey = 'medium') {
    this.difficultyKey = difficultyKey;
    this.config = AI_DIFFICULTIES[difficultyKey] || AI_DIFFICULTIES.medium;

    this.decisionTimer = 0;
    this.currentAction = 'idle'; // 'idle' | 'approach' | 'retreat' | 'charge' | 'attack' | 'special' | 'block'
    this.actionDuration = 0;

    // Tactical memory
    this.opponentWasAttacking = false;
  }

  setDifficulty(difficultyKey) {
    this.difficultyKey = difficultyKey;
    this.config = AI_DIFFICULTIES[difficultyKey] || AI_DIFFICULTIES.medium;
    this.decisionTimer = 0;
    this.currentAction = 'idle';
  }

  update(aiPlayer, opponent, groundY, bounds) {
    if (aiPlayer.isDead || aiPlayer.hitstun > 0 || aiPlayer.isAttacking) {
      aiPlayer.isBlocking = false;
      aiPlayer.isCharging = false;
      return;
    }

    const dx = (opponent.x + opponent.width / 2) - (aiPlayer.x + aiPlayer.width / 2);
    const dist = Math.abs(dx);
    const dirToOpponent = dx > 0 ? 1 : -1;

    // Always face opponent unless executing active retreat
    if (this.currentAction !== 'retreat') {
      aiPlayer.facing = dirToOpponent;
    }

    // 1. REAL-TIME DEFENSIVE REACTION (FRAME CHECK)
    const opponentIsAttacking = opponent.isAttacking && opponent.getActiveHitbox() !== null;
    const opponentWhiffed = this.opponentWasAttacking && !opponent.isAttacking && !opponent.hasHitTarget;
    this.opponentWasAttacking = opponent.isAttacking;

    if (opponentIsAttacking && dist < 130) {
      // Roll for reactive defense based on difficulty
      if (Math.random() < this.config.blockChance) {
        aiPlayer.isBlocking = true;
        aiPlayer.state = 'block';
        aiPlayer.vx *= 0.3;
        aiPlayer.isCharging = false;
        return;
      }
    } else {
      aiPlayer.isBlocking = false;
    }

    // 2. WHIFF PUNISHMENT (Elite reaction on missed attack)
    if (this.config.counterWhiff && opponentWhiffed && dist < 120 && aiPlayer.attackCooldown <= 0) {
      if (aiPlayer.cp >= 30 && Math.random() < this.config.specialAggression) {
        aiPlayer.startAttack('special');
        return;
      } else {
        aiPlayer.startAttack('light');
        return;
      }
    }

    // 3. TACTICAL RE-EVALUATION TIMER
    if (this.decisionTimer <= 0) {
      this.decisionTimer = this.config.reactionFrames + Math.floor(Math.random() * 5);
      this.decideNextAction(aiPlayer, opponent, dist, dirToOpponent, bounds);
    } else {
      this.decisionTimer--;
    }

    // 4. EXECUTE CURRENT TACTICAL ACTION
    this.executeAction(aiPlayer, opponent, dist, dirToOpponent, bounds);
  }

  decideNextAction(aiPlayer, opponent, dist, dirToOpponent, bounds) {
    const isCornered =
      (dirToOpponent === 1 && aiPlayer.x < bounds.minX + 70) ||
      (dirToOpponent === -1 && aiPlayer.x > bounds.maxX - 140);

    // Corner escape behavior
    if (isCornered && dist < 140 && aiPlayer.isGrounded) {
      if (Math.random() < 0.7) {
        this.currentAction = 'jump_escape';
        this.actionDuration = 22;
        return;
      }
    }

    // CLOSE RANGE (< 75px): Attack, Combo, or Defend
    if (dist <= 75) {
      if (aiPlayer.attackCooldown <= 0) {
        if (aiPlayer.cp >= 30 && Math.random() < this.config.specialAggression) {
          this.currentAction = 'special';
        } else {
          this.currentAction = 'attack';
        }
      } else {
        // Back step or crouch during cooldown
        this.currentAction = Math.random() < 0.5 ? 'retreat' : 'crouch';
        this.actionDuration = 12;
      }
      return;
    }

    // MID RANGE (75px - 220px): Dash Jutsu, Approach, or Tactical Charge
    if (dist <= 220) {
      if (aiPlayer.cp >= 30 && Math.random() < this.config.specialAggression) {
        this.currentAction = 'special';
        return;
      }

      if (aiPlayer.cp < 25 && Math.random() < this.config.chargeIntelligence) {
        this.currentAction = 'retreat_and_charge';
        this.actionDuration = 35;
        return;
      }

      // Close the distance
      this.currentAction = 'approach';
      // Jump approach mixup
      if (aiPlayer.isGrounded && Math.random() < 0.3) {
        this.currentAction = 'jump_approach';
      }
      this.actionDuration = 20;
      return;
    }

    // LONG RANGE (> 220px): Charge Chakra or Close In
    if (aiPlayer.cp < 80 && Math.random() < this.config.chargeIntelligence) {
      this.currentAction = 'charge';
      this.actionDuration = 45;
    } else {
      this.currentAction = 'approach';
      this.actionDuration = 30;
    }
  }

  executeAction(aiPlayer, opponent, dist, dirToOpponent, bounds) {
    switch (this.currentAction) {
      case 'attack':
        aiPlayer.startAttack('light');
        this.currentAction = 'idle';
        break;

      case 'special':
        if (aiPlayer.cp >= 30) {
          aiPlayer.startAttack('special');
        } else {
          aiPlayer.startAttack('light');
        }
        this.currentAction = 'idle';
        break;

      case 'approach':
        aiPlayer.vx = aiPlayer.speed * dirToOpponent;
        aiPlayer.facing = dirToOpponent;
        aiPlayer.state = 'run';
        aiPlayer.isCharging = false;
        break;

      case 'jump_approach':
        if (aiPlayer.isGrounded) {
          aiPlayer.vy = aiPlayer.jumpPower;
          aiPlayer.isGrounded = false;
        }
        aiPlayer.vx = (aiPlayer.speed * 0.9) * dirToOpponent;
        aiPlayer.state = 'jump';
        aiPlayer.isCharging = false;
        break;

      case 'retreat':
        aiPlayer.vx = -aiPlayer.speed * 0.8 * dirToOpponent;
        aiPlayer.state = 'run';
        aiPlayer.isCharging = false;
        break;

      case 'retreat_and_charge':
        if (dist < 160) {
          aiPlayer.vx = -aiPlayer.speed * 0.8 * dirToOpponent;
          aiPlayer.state = 'run';
          aiPlayer.isCharging = false;
        } else if (aiPlayer.isGrounded) {
          aiPlayer.vx = 0;
          aiPlayer.state = 'charge';
          aiPlayer.isCharging = true;
          aiPlayer.cp = Math.min(aiPlayer.maxCp, aiPlayer.cp + 0.45);
        }
        break;

      case 'charge':
        if (aiPlayer.isGrounded && dist > 140) {
          aiPlayer.vx = 0;
          aiPlayer.state = 'charge';
          aiPlayer.isCharging = true;
          aiPlayer.cp = Math.min(aiPlayer.maxCp, aiPlayer.cp + 0.45);
        } else {
          // Opponent too close to charge safely
          aiPlayer.isCharging = false;
          this.currentAction = 'approach';
        }
        break;

      case 'crouch':
        if (aiPlayer.isGrounded) {
          aiPlayer.state = 'crouch';
          aiPlayer.vx *= 0.4;
          aiPlayer.isCharging = false;
        }
        break;

      case 'jump_escape':
        if (aiPlayer.isGrounded) {
          aiPlayer.vy = aiPlayer.jumpPower;
          aiPlayer.isGrounded = false;
        }
        // Leap forward over opponent
        aiPlayer.vx = (aiPlayer.speed * 1.1) * dirToOpponent;
        aiPlayer.state = 'jump';
        aiPlayer.isCharging = false;
        break;

      case 'idle':
      default:
        aiPlayer.vx *= 0.8;
        if (aiPlayer.isGrounded) {
          aiPlayer.state = 'idle';
        }
        aiPlayer.isCharging = false;
        break;
    }
  }
}
