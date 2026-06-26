const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Basic Stats
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  money: { type: Number, default: 1000 }, // Summoning Stones / Gold
  
  // Torn-like Resources
  energy: { 
    current: { type: Number, default: 100 },
    max: { type: Number, default: 100 },
    lastUpdate: { type: Date, default: Date.now }
  },
  nerve: {
    current: { type: Number, default: 15 },
    max: { type: Number, default: 15 },
    lastUpdate: { type: Date, default: Date.now }
  },
  happy: {
    current: { type: Number, default: 100 },
    max: { type: Number, default: 100 },
    lastUpdate: { type: Date, default: Date.now }
  },
  life: {
    current: { type: Number, default: 100 },
    max: { type: Number, default: 100 },
    lastUpdate: { type: Date, default: Date.now }
  },

  // Combat Stats
  strength: { type: Number, default: 10 },
  defense: { type: Number, default: 10 },
  speed: { type: Number, default: 10 },
  dexterity: { type: Number, default: 10 },

  // Skill Tree
  skillPoints: { type: Number, default: 0 },
  skillsUnlocked: { type: Object, default: {} },

  // World State
  currentWorld: { type: Number, default: 1 },
  posX: { type: Number, default: 10 },
  posY: { type: Number, default: 10 },
  gameTimeMinutes: { type: Number, default: 420 },
  exploredTiles: { type: [String], default: ['1:10,10'] }, // Format: "worldId:x,y"

  // Collection
  affinity: { 
    primary: { type: String, default: 'fire' },
    secondary: String,
    tertiary: String,
    learned: { type: [String], default: [] },
  },
  creatures: [{
    id: String,
    templateKey: String,
    nickname: String,
    type: String,
    elements: [String],
    level: Number,
    experience: Number,
    currentHealth: Number,
    currentMana: Number,
    maxHealth: Number,
    maxMana: Number,
    attack: Number,
    defense: Number,
    speed: Number,
    class: String,
    skills: [String],
    traits: [String],
    mutations: [String],
    affection: Number,
    isBossSummon: Boolean,
  }],
  inventory: [{
    templateKey: String,
    quantity: Number,
    modifiers: Object,
  }],
  activeQuests: { type: Array, default: [] },
  completedQuests: { type: [String], default: [] },
  turnCount: { type: Number, default: 0 },

  // Active timed activity
  activity: {
    type: {
      type: String,
      enum: ['creature_training', 'physical_training', 'rest', 'search_tracks', 'search_animals', null],
    },
    creatureId: String,
    duration: Number,
    endTime: Date,
    message: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
