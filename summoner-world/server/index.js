require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const Player = require('./models/Player');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/summoner_world';

app.use(helmet());
app.use(cors());
app.use(express.json());

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Middleware to update resources (regeneration)
const updateResources = async (player) => {
  const now = Date.now();
  const minutesPassed = Math.floor((now - player.energy.lastUpdate) / 60000);
  
  if (minutesPassed > 0) {
    // Energy: 5 per 15 mins (approx 0.33 per min)
    const energyGain = Math.floor(minutesPassed * 0.33);
    player.energy.current = Math.min(player.energy.max, player.energy.current + energyGain);
    
    // Nerve: 1 per 5 mins
    const nerveGain = Math.floor(minutesPassed * 0.2);
    player.nerve.current = Math.min(player.nerve.max, player.nerve.current + nerveGain);
    
    // Life: Regen based on medical items or slow passive
    const lifeGain = Math.floor(minutesPassed * 0.1);
    player.life.current = Math.min(player.life.max, player.life.current + lifeGain);
    
    // Update timestamps
    const lastTickTime = new Date(player.energy.lastUpdate.getTime() + minutesPassed * 60000);
    player.energy.lastUpdate = lastTickTime;
    player.nerve.lastUpdate = lastTickTime;
    player.life.lastUpdate = lastTickTime;
    
    await player.save();
  }
  return player;
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const player = new Player({ username, password });
    await player.save();
    res.json({ success: true, player });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    let player = await Player.findOne({ username: { $eq: username }, password: { $eq: password } });
    if (!player) return res.status(401).json({ error: 'Invalid credentials' });
    
    player = await updateResources(player);
    res.json({ success: true, player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/player/:id', async (req, res) => {
  try {
    let player = await Player.findById(req.params.id);
    player = await updateResources(player);
    res.json(player);
  } catch (err) {
    res.status(404).json({ error: 'Player not found' });
  }
});

app.post('/api/train', async (req, res) => {
  const { playerId, stat, energyCost } = req.body;
  try {
    let player = await Player.findById(playerId);
    if (player.energy.current < energyCost) return res.status(400).json({ error: 'Not enough energy' });
    
    player.energy.current -= energyCost;
    // Simple training formula: gain = (Happy / MaxHappy) * Multiplier
    const gain = (player.happy.current / player.happy.max) * (energyCost * 0.5);
    player[stat] += gain;
    
    await player.save();
    res.json({ success: true, player, gain });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/summon-act', async (req, res) => {
  const { playerId, actType, nerveCost } = req.body;
  try {
    let player = await Player.findById(playerId);
    if (player.nerve.current < nerveCost) return res.status(400).json({ error: 'Not enough nerve' });
    
    player.nerve.current -= nerveCost;
    
    // Random success/fail
    const success = Math.random() > 0.3;
    let reward = 0;
    let xp = 0;
    
    if (success) {
      reward = nerveCost * 100;
      xp = nerveCost * 2;
      player.money += reward;
      player.experience += xp;
      // XP Level up check
      if (player.experience >= player.level * 1000) {
        player.level += 1;
        player.experience = 0;
        player.energy.max += 10;
        player.energy.current = player.energy.max;
      }
    }
    
    await player.save();
    res.json({ success, reward, xp, player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/player/location', async (req, res) => {
  const { playerId, x, y, worldId, newExploredTile } = req.body;
  try {
    const update = {
      posX: x,
      posY: y,
      currentWorld: worldId,
      lastActive: Date.now()
    };
    
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    player.posX = x;
    player.posY = y;
    player.currentWorld = worldId;
    player.lastActive = Date.now();

    if (newExploredTile && !player.exploredTiles.includes(newExploredTile)) {
      player.exploredTiles.push(newExploredTile);
    }
    
    await player.save();
    
    // Find other players nearby (e.g., within 5 tiles)
    const nearby = await Player.find({
      _id: { $ne: playerId },
      currentWorld: worldId,
      posX: { $gte: x - 5, $lte: x + 5 },
      posY: { $gte: y - 5, $lte: y + 5 },
      lastActive: { $gte: new Date(Date.now() - 10 * 60000) } // Active in last 10 mins
    }).select('username posX posY');
    
    res.json({ success: true, nearby });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/player/sync', async (req, res) => {
  const { playerId, playerState } = req.body;
  try {
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    if (playerState) {
      player.level = playerState.level ?? player.level;
      player.experience = playerState.experience ?? player.experience;
      player.money = playerState.money ?? player.money;
      player.energy = playerState.energy ?? player.energy;
      player.nerve = playerState.nerve ?? player.nerve;
      player.happy = playerState.happy ?? player.happy;
      player.life = playerState.life ?? player.life;
      player.strength = playerState.strength ?? player.strength;
      player.defense = playerState.defense ?? player.defense;
      player.speed = playerState.speed ?? player.speed;
      player.dexterity = playerState.dexterity ?? player.dexterity;
      player.currentWorld = playerState.currentWorldId ?? player.currentWorld;
      player.posX = playerState.tileX ?? player.posX;
      player.posY = playerState.tileY ?? player.posY;
      player.gameTimeMinutes = playerState.gameTimeMinutes ?? player.gameTimeMinutes;
      player.affinity = playerState.affinity ?? player.affinity;
      player.creatures = playerState.creatures ?? player.creatures;
      player.inventory = playerState.inventory ?? player.inventory;
      player.activeQuests = playerState.activeQuests ?? player.activeQuests;
      player.completedQuests = playerState.completedQuests ?? player.completedQuests;
      player.skillPoints = playerState.skillPoints ?? player.skillPoints;
      player.skillsUnlocked = playerState.skillsUnlocked ?? player.skillsUnlocked;
      player.turnCount = playerState.turnCount ?? player.turnCount;
      
      if (playerState.exploredTiles) {
        player.exploredTiles = playerState.exploredTiles;
      }
    }

    await player.save();
    res.json({ success: true, player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
