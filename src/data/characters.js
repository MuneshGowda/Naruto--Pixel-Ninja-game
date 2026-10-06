export const CHARACTERS = {
  naruto: {
    id: 'naruto',
    name: 'Naruto Uzumaki',
    title: 'Leaf Village Shinobi',
    avatar: '/assets/naruto-avatar.jpg',
    themeColor: '#f97316', // Orange
    chakraColor: '#38bdf8', // Rasengan Sky Blue
    auraColor: 'rgba(249, 115, 22, 0.6)',
    maxHp: 100,
    maxCp: 100,
    speed: 5.8,
    jumpPower: -15.5,
    attacks: {
      light: {
        id: 'light',
        name: 'Leaf Gale Combo',
        type: 'melee',
        damage: 8,
        cpCost: 0,
        width: 58,
        height: 35,
        offsetY: 45,
        duration: 20, // total frames
        hitFrameStart: 5,
        hitFrameEnd: 13,
        knockbackX: 5.5,
        knockbackY: -3,
        hitstun: 15,
        cooldown: 8
      },
      special: {
        id: 'special',
        name: 'Rasengan',
        type: 'dash_jutsu',
        damage: 28,
        cpCost: 30,
        dashSpeed: 14,
        width: 75,
        height: 55,
        offsetY: 40,
        duration: 34,
        hitFrameStart: 6,
        hitFrameEnd: 24,
        knockbackX: 13,
        knockbackY: -6,
        hitstun: 28,
        screenShake: 14,
        cooldown: 35
      }
    }
  },
  sasuke: {
    id: 'sasuke',
    name: 'Sasuke Uchiha',
    title: 'Shadow Shinobi',
    avatar: '/assets/sasuke-avatar.jpg',
    themeColor: '#3b82f6', // Dark Blue
    chakraColor: '#a855f7', // Lightning Violet
    auraColor: 'rgba(168, 85, 247, 0.6)',
    maxHp: 100,
    maxCp: 100,
    speed: 6.2,
    jumpPower: -15.5,
    attacks: {
      light: {
        id: 'light',
        name: 'Uchiha Strike',
        type: 'melee',
        damage: 8,
        cpCost: 0,
        width: 60,
        height: 35,
        offsetY: 45,
        duration: 20,
        hitFrameStart: 5,
        hitFrameEnd: 13,
        knockbackX: 5.5,
        knockbackY: -3,
        hitstun: 15,
        cooldown: 8
      },
      special: {
        id: 'special',
        name: 'Chidori',
        type: 'dash_jutsu',
        damage: 30,
        cpCost: 30,
        dashSpeed: 15.5,
        width: 78,
        height: 50,
        offsetY: 40,
        duration: 32,
        hitFrameStart: 6,
        hitFrameEnd: 22,
        knockbackX: 14,
        knockbackY: -6.5,
        hitstun: 30,
        screenShake: 16,
        cooldown: 35
      }
    }
  }
};

export const STAGES = [
  {
    id: 'valley',
    name: 'Valley of the End',
    bg: '/assets/valley-of-end.jpg',
    groundY: 470,
    atmosphere: 'storm'
  },
  {
    id: 'forest',
    name: 'Leaf Training Grounds',
    bg: '/assets/konoha-forest.jpg',
    groundY: 470,
    atmosphere: 'leaves'
  }
];

export const DEFAULT_KEYBINDINGS = {
  p1: {
    left: ['KeyA', 'a', 'A'],
    right: ['KeyD', 'd', 'D'],
    jump: ['KeyW', 'w', 'W'],
    crouch: ['KeyS', 's', 'S'],
    attack: ['KeyF', 'f', 'F'],
    special: ['KeyG', 'g', 'G'],
    charge: ['KeyH', 'h', 'H']
  },
  p2: {
    left: ['ArrowLeft'],
    right: ['ArrowRight'],
    jump: ['ArrowUp'],
    crouch: ['ArrowDown'],
    attack: ['Numpad1', 'KeyK', 'k', 'K', '1'],
    special: ['Numpad2', 'KeyL', 'l', 'L', '2'],
    charge: ['Numpad3', 'Semicolon', ';', '3']
  }
};
