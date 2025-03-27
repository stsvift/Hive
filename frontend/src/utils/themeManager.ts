import { STORAGE_KEYS } from '../config/constants'
import { getCurrentTheme } from './settingsManager'

/**
 * Применяет тему на основе сохраненных настроек
 */
export const applyTheme = (): void => {
  const currentTheme = getCurrentTheme()

  // Применяем тему к корневому элементу документа
  document.documentElement.classList.toggle('dark', currentTheme === 'dark')

  // Применяем тему к элементам с классами app и desktop
  const appElements = document.querySelectorAll('.app, .desktop')
  appElements.forEach(element => {
    if (currentTheme === 'dark') {
      element.classList.add('dark')
      element.classList.remove('light') // Удаляем class light, если он есть
    } else {
      element.classList.remove('dark')
      // Не добавляем класс light, используем отсутствие dark как светлую тему
    }
  })
}

/**
 * Инициализирует и применяет тему при загрузке системы
 */
export const initializeTheme = (): void => {
  // Применяем тему при загрузке
  applyTheme()

  // Добавляем слушатель для изменения темы
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEYS.SETTINGS) {
      applyTheme()
    }
  })
}
