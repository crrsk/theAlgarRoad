const SPAIN_TIME_ZONE = 'Europe/Madrid';

const SCENE_THEMES = {
  day: {
    buildingLight: 0.42,
    fog: '#a9c7df',
    keyLight: 1.35,
    sky: '#9fc9e8',
    street: 0x3e4448,
    sunColor: 0xfff4e4,
    type: 'day',
  },
  golden: {
    buildingLight: 1.05,
    fog: '#c3a18c',
    keyLight: 1.15,
    sky: '#d99f7a',
    street: 0x3e444a,
    sunColor: 0xffd2a0,
    type: 'golden',
  },
  night: {
    buildingLight: 1.6,
    fog: '#030508',
    keyLight: 0.05,
    sky: '#030508',
    street: 0x050608,
    sunColor: 0x4466aa,
    type: 'night',
  },
  retrowave: {
    buildingLight: 3.5,
    fog: '#0a001a', // very dark purple fog
    keyLight: 0.2,
    sky: '#020005', // near pitch black sky
    street: 0x0a0a1a,
    sunColor: 0x00ffff,
    type: 'retrowave',
  },
};

export function getRandomCityTheme() {
  const cityThemes = ['day', 'golden', 'night'];
  const randomName = cityThemes[Math.floor(Math.random() * cityThemes.length)];
  return SCENE_THEMES[randomName];
}

export function getThemeByName(name) {
  return SCENE_THEMES[name] || SCENE_THEMES['day'];
}
