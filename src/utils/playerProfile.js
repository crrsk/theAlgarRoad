// playerProfile.js
// Maneja el perfil del jugador usando localStorage

const PROFILE_KEY = 'algar_road_player_profile';
const SECRET_SALT = 'algar_road_anti_cheat_salt_v1';

// Genera un ID único simple
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Genera un hash simple para el objeto
function generateChecksum(dataObj) {
  // Ignoramos el campo checksum si existe para no alterar el cálculo
  const { checksum, ...rest } = dataObj;
  const str = JSON.stringify(rest) + SECRET_SALT;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convertir a entero de 32 bits
  }
  return hash.toString(16);
}

// Guarda de forma segura
function saveProfileToStorage(profile) {
  const profileWithChecksum = { ...profile, checksum: generateChecksum(profile) };
  // Usamos btoa para ofuscar el JSON y evitar que se edite fácilmente a mano
  const encoded = btoa(encodeURIComponent(JSON.stringify(profileWithChecksum)));
  localStorage.setItem(PROFILE_KEY, encoded);
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
    let parsed;
    // Retrocompatibilidad: si el dato empieza por '{', es un JSON antiguo sin ofuscar
    if (data.startsWith('{')) {
      parsed = JSON.parse(data);
      // Lo migramos al nuevo formato seguro
      saveProfileToStorage(parsed);
      return parsed;
    } else {
      const decoded = decodeURIComponent(atob(data));
      parsed = JSON.parse(decoded);
    }
    
    // Verificación anti-trampas
    const expectedChecksum = generateChecksum(parsed);
    if (parsed.checksum !== expectedChecksum) {
      console.warn("Perfil manipulado o corrupto. Se ha bloqueado la carga.");
      // No borramos por si acaso, pero devolvemos null para forzar un perfil nuevo
      return null;
    }
    
    return parsed;
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
  
  saveProfileToStorage(profile);
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

  saveProfileToStorage(newProfile);
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
