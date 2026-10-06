import { audioManager } from './Audio.js';

export class Player {
  constructor(config, x, y, facing = 1, controls = {}) {
    this.config = config; // from CHARACTERS data
    this.x = x;
    this.y = y;
    this.width = 72;
    this.height = 100;
    this.facing = facing; // 1: facing right, -1: facing left
    this.controls = controls;

    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = config.speed || 6;
    this.jumpPower = config.jumpPower || -16;
    this.gravity = 0.85;
    this.friction = 0.82;
    this.isGrounded = false;

    // Combat Stats
    this.maxHp = config.maxHp || 100;
    this.hp = this.maxHp;
    this.maxCp = config.maxCp || 100;
    this.cp = 40; // start with some chakra for immediate jutsu test
    this.isDead = false;
    this.isInvincible = false;
    this.invincibilityTimer = 0;

    // State machine: 'idle' | 'run' | 'jump' | 'fall' | 'crouch' | 'attack' | 'special' | 'charge' | 'hitstun' | 'dead'
    this.state = 'idle';
    this.animTimer = 0;
    this.frameIndex = 0;

    // Attack State
    this.isAttacking = false;
    this.currentAttackData = null;
    this.attackFrame = 0;
    this.hasHitTarget = false;
    this.attackCooldown = 0;

    // Hitstun
    this.hitstun = 0;
    this.flashHit = 0;

    // Chakra charge state
    this.isCharging = false;

    // Defense & Guard state
    this.isBlocking = false;
  }

  // Check if given key is currently pressed
  isActionActive(actionName, inputState) {
    const bind = this.controls[actionName];
    if (!bind) return false;
    if (Array.isArray(bind)) {
      return bind.some(k => inputState[k]);
    }
    return !!inputState[bind];
  }

  // Handle Input per frame
  handleInput(inputState, opponent) {
    if (this.isDead || this.hitstun > 0) return;

    // Cannot change actions during active attack execution
    if (this.isAttacking) return;

    // 1. Chakra Charging
    if (this.isActionActive('charge', inputState) && this.isGrounded) {
      this.state = 'charge';
      this.isCharging = true;
      this.vx = 0;
      this.cp = Math.min(this.maxCp, this.cp + 0.45); // Charge rate
      return;
    } else {
      this.isCharging = false;
    }

    // 2. Special Jutsu
    if (this.isActionActive('special', inputState) && this.attackCooldown <= 0) {
      if (this.cp >= this.config.attacks.special.cpCost) {
        this.startAttack('special');
        return;
      }
    }

    // 3. Light Attack Combo
    if (this.isActionActive('attack', inputState) && this.attackCooldown <= 0) {
      this.startAttack('light');
      return;
    }

    // 4. Proximity Defense & Crouch
    const opponentIsAttacking = opponent && opponent.isAttacking;
    const movingAway = opponent && (
      (this.x < opponent.x && this.isActionActive('left', inputState)) ||
      (this.x > opponent.x && this.isActionActive('right', inputState))
    );

    if (this.isActionActive('crouch', inputState) && this.isGrounded) {
      this.state = 'crouch';
      this.vx *= 0.5;
      this.isBlocking = !!opponentIsAttacking;
      return;
    }

    if (opponentIsAttacking && movingAway && this.isGrounded) {
      this.isBlocking = true;
      this.state = 'block';
      this.vx *= 0.3;
      return;
    } else {
      this.isBlocking = false;
    }

    // 5. Jump
    if (this.isActionActive('jump', inputState) && this.isGrounded) {
      this.vy = this.jumpPower;
      this.isGrounded = false;
      this.state = 'jump';
      audioManager.playJump();
    }

    // 6. Horizontal Movement
    let moving = false;
    if (this.isActionActive('left', inputState)) {
      this.vx = -this.speed;
      this.facing = -1;
      moving = true;
    } else if (this.isActionActive('right', inputState)) {
      this.vx = this.speed;
      this.facing = 1;
      moving = true;
    } else {
      this.vx *= this.friction;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // Set state based on physics
    if (!this.isGrounded) {
      this.state = this.vy < 0 ? 'jump' : 'fall';
    } else if (moving) {
      this.state = 'run';
    } else {
      this.state = 'idle';
      // Auto-face opponent when idle on ground
      if (opponent && !this.isAttacking) {
        this.facing = opponent.x > this.x ? 1 : -1;
      }
    }
  }

  startAttack(attackKey) {
    const attackData = this.config.attacks[attackKey];
    if (!attackData) return;

    this.isAttacking = true;
    this.currentAttackData = attackData;
    this.attackFrame = 0;
    this.hasHitTarget = false;
    this.state = attackKey; // 'light' or 'special'

    // Deduct Chakra if Jutsu
    if (attackData.cpCost > 0) {
      this.cp = Math.max(0, this.cp - attackData.cpCost);
    }

    // Special dash forward motion
    if (attackData.dashSpeed) {
      this.vx = attackData.dashSpeed * this.facing;
    }

    // Play SFX
    if (attackKey === 'special') {
      if (this.config.id === 'naruto') {
        audioManager.playRasengan();
      } else {
        audioManager.playChidori();
      }
    } else {
      audioManager.playWhoosh();
    }
  }

  // Update physics, timers, state per tick
  update(groundY, bounds, particles) {
    this.animTimer++;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.flashHit > 0) this.flashHit--;
    if (this.invincibilityTimer > 0) this.invincibilityTimer--;

    // Passive Chakra regeneration
    if (!this.isDead && this.cp < this.maxCp) {
      this.cp = Math.min(this.maxCp, this.cp + 0.05);
    }

    // Hitstun Handling
    if (this.hitstun > 0) {
      this.hitstun--;
      this.state = 'hitstun';
      this.isAttacking = false;
      this.isCharging = false;
    }

    // Attack Progress
    if (this.isAttacking && this.currentAttackData) {
      this.attackFrame++;

      // Emit Jutsu particles during active special dash
      if (this.state === 'special' && particles) {
        const handX = this.facing === 1 ? this.x + this.width + 10 : this.x - 10;
        const handY = this.y + 48;
        if (this.config.id === 'naruto') {
          particles.createRasenganParticles(handX, handY);
        } else {
          particles.createChidoriLightning(handX, handY);
        }
      }

      if (this.attackFrame >= this.currentAttackData.duration) {
        this.isAttacking = false;
        this.attackCooldown = this.currentAttackData.cooldown || 10;
        this.currentAttackData = null;
        this.state = this.isGrounded ? 'idle' : 'fall';
      }
    }

    // Chakra aura particle emission
    if (this.isCharging && particles) {
      particles.createChakraAura(this.x + 10, this.y + 20, this.width - 20, this.config.themeColor);
    }

    // Gravity & Velocity
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    // Ground Collision
    const playerFeetY = this.y + this.height;
    if (playerFeetY >= groundY) {
      this.y = groundY - this.height;
      if (!this.isGrounded && this.vy > 5 && particles) {
        particles.createDust(this.x + this.width / 2, groundY);
      }
      this.vy = 0;
      this.isGrounded = true;
      if (this.state === 'fall') {
        this.state = 'idle';
      }
    } else {
      this.isGrounded = false;
    }

    // Boundary Collisions
    if (this.x < bounds.minX) {
      this.x = bounds.minX;
      this.vx = 0;
    } else if (this.x + this.width > bounds.maxX) {
      this.x = bounds.maxX - this.width;
      this.vx = 0;
    }
  }

  // Take Damage & Apply Knockback
  takeDamage(hitInfo) {
    if (this.isDead) return { blocked: false, damage: 0 };

    if (this.isBlocking) {
      const blockedDamage = Math.max(1, Math.round(hitInfo.damage * 0.2));
      this.hp = Math.max(0, this.hp - blockedDamage);
      this.hitstun = 6;
      this.flashHit = 6;
      this.isAttacking = false;
      this.isCharging = false;
      this.vx = hitInfo.knockbackX * 0.35;
      this.vy = 0;
      audioManager.playGuard();
      if (this.hp <= 0) {
        this.isDead = true;
        this.state = 'dead';
        this.hp = 0;
        audioManager.playKO();
      }
      return { blocked: true, damage: blockedDamage };
    }

    this.hp = Math.max(0, this.hp - hitInfo.damage);
    this.hitstun = hitInfo.hitstun;
    this.flashHit = 12;
    this.isAttacking = false;
    this.isCharging = false;
    this.vx = hitInfo.knockbackX;
    this.vy = hitInfo.knockbackY;
    this.isGrounded = false;

    if (this.hp <= 0) {
      this.isDead = true;
      this.state = 'dead';
      this.hp = 0;
      audioManager.playKO();
    } else {
      audioManager.playHit(hitInfo.damage > 15);
    }
    return { blocked: false, damage: hitInfo.damage };
  }

  // Get current active Hitbox (null if not in active damage frame)
  getActiveHitbox() {
    if (!this.isAttacking || !this.currentAttackData) return null;
    const { hitFrameStart, hitFrameEnd, width, height, offsetY } = this.currentAttackData;

    if (this.attackFrame >= hitFrameStart && this.attackFrame <= hitFrameEnd) {
      const boxX = this.facing === 1 ? this.x + this.width - 10 : this.x - width + 10;
      return {
        x: boxX,
        y: this.y + offsetY,
        width,
        height
      };
    }
    return null;
  }

  // Get current Hurtbox (character's vulnerable body)
  getHurtbox() {
    if (this.isDead) return null;

    if (this.state === 'crouch') {
      return {
        x: this.x + 10,
        y: this.y + 40,
        width: this.width - 20,
        height: this.height - 40
      };
    }

    return {
      x: this.x + 12,
      y: this.y + 8,
      width: this.width - 24,
      height: this.height - 8
    };
  }

  // Render Character on Canvas
  render(ctx, showBoxes = false) {
    ctx.save();

    // Flash white on hit
    if (this.flashHit > 0 && Math.floor(this.flashHit / 2) % 2 === 0) {
      ctx.filter = 'brightness(2.5)';
    }

    // Render Chakra Guard Barrier when blocking
    if (this.isBlocking && !this.isDead) {
      ctx.save();
      const shieldX = this.facing === 1 ? this.x + this.width + 6 : this.x - 6;
      const shieldY = this.y + this.height / 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.beginPath();
      ctx.arc(
        shieldX,
        shieldY,
        36,
        this.facing === 1 ? -Math.PI / 2.3 : Math.PI / 2.3,
        this.facing === 1 ? Math.PI / 2.3 : -Math.PI / 2.3
      );
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Draw Hitbox & Hurtbox when debug mode is enabled
    if (showBoxes) {
      // Hurtbox: Green
      const hb = this.getHurtbox();
      if (hb) {
        ctx.strokeStyle = '#22c55e';
        ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
        ctx.lineWidth = 2;
        ctx.fillRect(hb.x, hb.y, hb.width, hb.height);
        ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
      }

      // Hitbox: Red
      const atkB = this.getActiveHitbox();
      if (atkB) {
        ctx.strokeStyle = '#ef4444';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 2;
        ctx.fillRect(atkB.x, atkB.y, atkB.width, atkB.height);
        ctx.strokeRect(atkB.x, atkB.y, atkB.width, atkB.height);
      }
    }

    // Draw Character Silhouette & Graphic
    this.drawCharacterGraphic(ctx);

    ctx.restore();
  }

  // Detailed stylized Canvas vector sprite rendering
  drawCharacterGraphic(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height);

    // Flip horizontally when facing left
    ctx.scale(this.facing, 1);

    const isNaruto = this.config.id === 'naruto';
    const time = this.animTimer * 0.1;
    const idleBob = this.state === 'idle' ? Math.sin(time) * 2 : 0;
    const isCrouch = this.state === 'crouch';
    const isSpecial = this.state === 'special';
    const isLightAtk = this.state === 'light';
    const isHitstun = this.state === 'hitstun';
    const isDead = this.state === 'dead';

    if (isDead) {
      // Fallen posture
      ctx.rotate(-Math.PI / 2.2);
      ctx.translate(-50, -20);
    } else if (isHitstun) {
      ctx.rotate(-0.15);
    } else if (this.state === 'run') {
      ctx.rotate(0.18); // Lean forward ninja sprint
    }

    // Shadow on ground
    if (this.isGrounded && !isDead) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Character vertical offset
    const yOff = isCrouch ? 30 : idleBob;

    // 1. LEGS & FEET
    ctx.fillStyle = isNaruto ? '#ea580c' : '#1e3a8a'; // Pants
    if (isCrouch) {
      // Bent crouch legs
      ctx.fillRect(-18, -35 + yOff, 14, 25);
      ctx.fillRect(4, -35 + yOff, 14, 25);
    } else if (this.state === 'run') {
      const legSwing = Math.sin(time * 2) * 15;
      ctx.fillRect(-14 + legSwing, -45, 12, 45);
      ctx.fillRect(2 - legSwing, -45, 12, 45);
    } else if (isLightAtk && this.attackFrame > 6) {
      // High kick leg thrust
      ctx.fillRect(-12, -45, 12, 45);
      // Kicking leg forward
      ctx.save();
      ctx.translate(5, -40);
      ctx.rotate(-0.7);
      ctx.fillRect(0, 0, 45, 14);
      // Foot/sandal
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(38, -2, 12, 18);
      ctx.restore();
    } else {
      // Standing legs
      ctx.fillRect(-15, -45 + yOff, 12, 45);
      ctx.fillRect(3, -45 + yOff, 12, 45);
    }

    // Leg bandages (Naruto right leg)
    if (isNaruto && !isCrouch) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(3, -32 + yOff, 12, 12);
      // Weapon pouch
      ctx.fillStyle = '#334155';
      ctx.fillRect(11, -30 + yOff, 5, 8);
    }

    // Sandals
    ctx.fillStyle = '#0f172a';
    if (!isLightAtk || this.attackFrame <= 6) {
      ctx.fillRect(-17, -5 + yOff, 15, 6);
      ctx.fillRect(2, -5 + yOff, 15, 6);
    }

    // 2. TORSO & JACKET
    const torsoY = -82 + yOff;
    ctx.fillStyle = isNaruto ? '#ea580c' : '#1e293b'; // Main jacket
    ctx.beginPath();
    ctx.roundRect(-20, torsoY, 40, 42, 6);
    ctx.fill();

    // Naruto Shoulder Blue / Black accents & Collar
    if (isNaruto) {
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-20, torsoY, 40, 12);
      // White fur/ribbed collar
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(-16, torsoY - 6, 32, 10, 4);
      ctx.fill();
      // Swirl crest on back/chest
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, torsoY + 22, 6, 0, Math.PI * 1.6);
      ctx.stroke();
    } else {
      // Sasuke high collar
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-16, torsoY - 14);
      ctx.lineTo(-20, torsoY + 4);
      ctx.lineTo(20, torsoY + 4);
      ctx.lineTo(16, torsoY - 14);
      ctx.closePath();
      ctx.fill();
      // Sasuke Uchiha Fan crest
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, torsoY + 16, 7, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, torsoY + 16, 7, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, torsoY + 22, 4, 6);
    }

    // 3. ARMS & ATTACK POSES
    if (isSpecial) {
      // Jutsu Dash Pose: Arm outstretched with glowing power!
      ctx.fillStyle = isNaruto ? '#ea580c' : '#1e293b';
      // Rear arm
      ctx.fillRect(-26, torsoY + 12, 14, 24);
      // Forward thrust arm
      ctx.save();
      ctx.translate(12, torsoY + 14);
      ctx.rotate(0.2);
      ctx.fillRect(0, -6, 34, 13);
      // Hand
      ctx.fillStyle = '#ffedd5';
      ctx.beginPath();
      ctx.arc(36, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      // Render Rasengan or Chidori in hand!
      if (isNaruto) {
        // Glowing cyan Rasengan
        ctx.save();
        ctx.translate(42, 0);
        const rasGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
        rasGrad.addColorStop(0, '#ffffff');
        rasGrad.addColorStop(0.3, '#38bdf8');
        rasGrad.addColorStop(0.8, '#0284c7');
        rasGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
        ctx.fillStyle = rasGrad;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Spiral rings
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.rotate(time * 6);
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 7, 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 5, -0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        // Crackling Chidori
        ctx.save();
        ctx.translate(42, 0);
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Radiating jagged lightning bolts
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 4; i++) {
          const lAngle = (i * Math.PI) / 2 + (Math.random() - 0.5) * 0.4;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(lAngle) * 18, Math.sin(lAngle) * 18);
          ctx.lineTo(Math.cos(lAngle) * 32 + (Math.random() - 0.5) * 12, Math.sin(lAngle) * 32);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    } else if (isLightAtk && this.attackFrame <= 6) {
      // Punch thrust arm
      ctx.fillStyle = isNaruto ? '#ea580c' : '#1e293b';
      ctx.fillRect(-22, torsoY + 12, 12, 22);
      ctx.fillRect(8, torsoY + 8, 30, 12);
      ctx.fillStyle = '#ffedd5';
      ctx.fillRect(36, torsoY + 7, 10, 14);
    } else {
      // Normal Arms (idle / run / charge)
      ctx.fillStyle = isNaruto ? '#ea580c' : '#1e293b';
      if (this.state === 'run') {
        // Ninja sprint: arms trailing back
        ctx.fillRect(-28, torsoY + 4, 24, 10);
      } else if (this.isCharging) {
        // Hand seals in front of chest
        ctx.fillRect(-18, torsoY + 10, 16, 12);
        ctx.fillRect(2, torsoY + 10, 16, 12);
        ctx.fillStyle = '#ffedd5';
        ctx.fillRect(-4, torsoY + 8, 8, 14);
      } else if (this.isBlocking || this.state === 'block') {
        // Defensive crossed guard arms
        ctx.fillRect(-12, torsoY + 8, 24, 12);
        ctx.fillRect(2, torsoY + 4, 18, 14);
        ctx.fillStyle = '#ffedd5';
        ctx.fillRect(10, torsoY + 6, 8, 12);
      } else {
        // Ready fighting fists
        ctx.fillRect(-24, torsoY + 10, 10, 24);
        ctx.fillRect(14, torsoY + 6, 10, 22);
        ctx.fillStyle = '#ffedd5';
        ctx.fillRect(14, torsoY + 2, 10, 8);
      }
    }

    // 4. HEAD & FACE
    const headY = torsoY - 26;
    // Neck
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-6, headY + 18, 12, 8);

    // Face
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.roundRect(-15, headY, 30, 24, 6);
    ctx.fill();

    // Whiskers (Naruto)
    if (isNaruto) {
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(3, headY + 14 + i * 3);
        ctx.lineTo(12, headY + 13 + i * 3);
        ctx.stroke();
      }
    }

    // Eyes
    if (!isNaruto && isSpecial) {
      // Sasuke Sharingan Glow (Red with black pupil)
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(6, headY + 10, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(6, headY + 10, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Regular eyes
      ctx.fillStyle = isNaruto ? '#0284c7' : '#0f172a';
      ctx.beginPath();
      ctx.arc(6, headY + 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Forehead Protector (Hitai-ate)
    ctx.fillStyle = isNaruto ? '#1e3a8a' : '#0f172a'; // Blue or dark band
    ctx.fillRect(-16, headY + 1, 32, 8);
    // Silver metal plate
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-10, headY + 2, 20, 6);
    // Leaf Village spiral symbol
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, headY + 5, 2, 0, Math.PI * 1.8);
    ctx.stroke();

    // 5. HAIR
    if (isNaruto) {
      // Spiky Blonde hair
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(-16, headY + 2);
      ctx.lineTo(-24, headY - 10);
      ctx.lineTo(-14, headY - 8);
      ctx.lineTo(-10, headY - 20);
      ctx.lineTo(-2, headY - 10);
      ctx.lineTo(4, headY - 22);
      ctx.lineTo(10, headY - 10);
      ctx.lineTo(18, headY - 18);
      ctx.lineTo(16, headY - 2);
      ctx.lineTo(20, headY + 4);
      ctx.lineTo(14, headY + 3);
      ctx.closePath();
      ctx.fill();
    } else {
      // Spiky Dark Uchiha Hair with long bangs
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-18, headY + 4);
      ctx.lineTo(-26, headY - 14);
      ctx.lineTo(-16, headY - 12);
      ctx.lineTo(-12, headY - 24);
      ctx.lineTo(-4, headY - 14);
      ctx.lineTo(2, headY - 22);
      ctx.lineTo(12, headY - 16);
      ctx.lineTo(20, headY - 22);
      ctx.lineTo(18, headY + 6);
      // Parted front bangs
      ctx.lineTo(14, headY + 16);
      ctx.lineTo(8, headY + 6);
      ctx.lineTo(2, headY + 18);
      ctx.lineTo(-2, headY + 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
