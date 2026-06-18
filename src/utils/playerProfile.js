// playerProfile.js
// Maneja el perfil del jugador usando localStorage

const PROFILE_KEY = 'algar_road_player_profile';

// Genera un ID único simple
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Calcula el nivel basado en la experiencia
export function calculateLevel(xp) {
  // Fórmula propuesta: Nivel = Math.floor(Math.sqrt(XP / 100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getXpProgress(xp) {
  const level = calculateLevel(xp);
  const currentLevelBaseXP = Math.pow(level - 1, 2) * 100;
  const nextLevelBaseXP = Math.pow(level, 2) * 100;
  const xpInLevel = xp - currentLevelBaseXP;
  const xpNeededForNext = nextLevelBaseXP - currentLevelBaseXP;
  return {
    level,
    currentXP: xp,
    xpInLevel,
    xpNeededForNext,
    nextLevelBaseXP,
    progressPercentage: (xpInLevel / xpNeededForNext) * 100
  };
}

export function getPlayerProfile() {
  const data = localStorage.getItem(PROFILE_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Error parsing player profile", e);
    return null;
  }
}

export function createPlayerProfile(name) {
  const profile = {
    id: generateId(),
    name: name || 'Jugador',
    xp: 0,
    level: 1,
    selectedCarId: 'rookie_red',
    createdAt: Date.now()
  };
  
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function updatePlayerProfile(updates) {
  const currentProfile = getPlayerProfile();
  if (!currentProfile) return null;
  
  const newProfile = { ...currentProfile, ...updates };
  
  // Recalcular nivel por si la xp cambió directamente
  if (updates.xp !== undefined) {
      newProfile.level = calculateLevel(newProfile.xp);
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
  return newProfile;
}

export function addExperience(xpToAdd) {
  const profile = getPlayerProfile();
  if (!profile) return null;
  
  const newXp = profile.xp + xpToAdd;
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > profile.level;
  
  const updatedProfile = updatePlayerProfile({ xp: newXp, level: newLevel });
  
  return { updatedProfile, leveledUp, newLevel };
}
