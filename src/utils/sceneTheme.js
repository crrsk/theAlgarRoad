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
    fog: '#111827',
    keyLight: 0.72,
    sky: '#111827',
    street: 0x242832,
    sunColor: 0xbcd7ff,
    type: 'night',
  },
};

function getSpainHour() {
  return Number(new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hour12: false,
    timeZone: SPAIN_TIME_ZONE,
  }).format(new Date()));
}

function getThemeName(hour) {
  switch (true) {
    case hour >= 21 || hour < 7:
      return 'night';

    case hour >= 19 || hour < 9:
      return 'golden';

    default:
      return 'day';
  }
}

export function getSpainSceneTheme() {
  return SCENE_THEMES[getThemeName(getSpainHour())];
}
