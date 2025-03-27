// API Configuration
// Updated to match the actual backend URL
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Other constants
export const APP_NAME = 'HiveOS'
export const DEFAULT_THEME = 'light'
export const DEFAULT_WALLPAPER = 'modern'

// Theme constants
export const COLORS = {
  // Основная палитра
  PRIMARY: '#FF9800', // Оранжевый/медовый оттенок
  PRIMARY_LIGHT: '#FFB74D', // Светлый оранжевый
  PRIMARY_DARK: '#F57C00', // Темный оранжевый
  SECONDARY: '#5C6BC0', // Индиго
  ACCENT: '#00BCD4', // Бирюзовый

  // Нейтральные цвета
  DARK: '#263238', // Глубокий темно-синий
  GRAY_DARK: '#455A64', // Темно-серый
  GRAY: '#78909C', // Средне-серый
  GRAY_LIGHT: '#CFD8DC', // Светло-серый
  LIGHT: '#ECEFF1', // Почти белый

  // Функциональные цвета
  SUCCESS: '#4CAF50', // Зеленый
  WARNING: '#FFC107', // Желтый
  DANGER: '#F44336', // Красный
  INFO: '#2196F3', // Синий

  // Фоны
  BG_LIGHT: '#F5F7FA', // Светлый фон
  BG_DARK: '#121212', // Темный фон

  // Градиенты
  GRADIENT_PRIMARY: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
  GRADIENT_SECONDARY: 'linear-gradient(135deg, #5C6BC0 0%, #3F51B5 100%)',
  GRADIENT_ACCENT: 'linear-gradient(135deg, #00BCD4 0%, #26C6DA 100%)',
  GRADIENT_DARK: 'linear-gradient(135deg, #263238 0%, #455A64 100%)',

  // Медовые оттенки (для шестиугольников)
  HONEY_YELLOW: '#FFC107',
  HONEY_LIGHT: '#FFECB3',
  HONEY_DARK: '#FFA000',
  HONEY_ACCENT: '#FF6F00',
  BEE_BLACK: '#212121',
  BEE_YELLOW: '#FFEB3B',

  // Градиенты для сот
  HONEY_GRADIENT: 'linear-gradient(135deg, #FF9800 0%, #FFC107 100%)',
  HONEY_DARK_GRADIENT: 'linear-gradient(135deg, #FF6F00 0%, #FF9800 100%)',
  ROYAL_JELLY_GRADIENT: 'linear-gradient(135deg, #FFD54F 0%, #FFCA28 100%)',
}

// Layout constants
export const LAYOUT = {
  CELL_SIZE: 180, // Размер ячейки
  CELL_SPACING: 16, // Отступ между ячейками
  HEADER_HEIGHT: 64, // Высота заголовка
  DOCK_HEIGHT: 60, // Высота дока
  WINDOW_MIN_WIDTH: 400, // Минимальная ширина окна
  WINDOW_MIN_HEIGHT: 300, // Минимальная высота окна
  BORDER_RADIUS: '10px', // Скругление углов
  BORDER_RADIUS_LG: '16px', // Большое скругление углов
  BORDER_RADIUS_SM: '6px', // Малое скругление углов
}

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  SETTINGS: 'appSettings',
  WINDOW_STATES: 'windowStates',
  DESKTOP_LAYOUT: 'desktopLayout',
  NOTES: 'notes', // Storage key for notes data
  CUSTOM_FAVICON: 'hive_custom_favicon',
}

// Auth related constants
export const AUTH_CONFIG = {
  TOKEN_EXPIRY_DAYS: 7,
}
