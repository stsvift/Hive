import React, { createContext, useContext, useEffect, useState } from 'react'
import { COLORS } from '../config/constants'
import {
  getCurrentTheme,
  getSetting,
  saveSetting,
  saveTheme,
} from '../utils/settingsManager'

interface ThemeContextType {
  theme: 'light' | 'dark'
  accentColor: string
  setTheme: (theme: 'light' | 'dark') => void
  setAccentColor: (color: string) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  accentColor: 'orange',
  setTheme: () => {},
  setAccentColor: () => {},
})

export const useTheme = () => useContext(ThemeContext)

const accentColorMap = {
  orange: {
    color: COLORS.PRIMARY,
    lightColor: COLORS.PRIMARY_LIGHT,
    darkColor: COLORS.PRIMARY_DARK,
  },
  blue: {
    color: COLORS.SECONDARY,
    lightColor: '#7986CB',
    darkColor: '#3949AB',
  },
  teal: { color: COLORS.ACCENT, lightColor: '#4DD0E1', darkColor: '#0097A7' },
  green: { color: COLORS.SUCCESS, lightColor: '#81C784', darkColor: '#388E3C' },
  purple: { color: '#9C27B0', lightColor: '#BA68C8', darkColor: '#7B1FA2' },
  red: { color: COLORS.DANGER, lightColor: '#E57373', darkColor: '#D32F2F' },
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(getCurrentTheme())
  const [accentColor, setAccentColorState] = useState<string>(
    getSetting('appearance.accent', 'orange')
  )

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme)
    saveTheme(newTheme)
  }

  const setAccentColor = (color: string) => {
    setAccentColorState(color)
    saveSetting('appearance.accent', color)

    const selectedColor =
      accentColorMap[color as keyof typeof accentColorMap] ||
      accentColorMap.orange

    document.documentElement.style.setProperty(
      '--color-primary',
      selectedColor.color
    )
    document.documentElement.style.setProperty(
      '--color-primary-light',
      selectedColor.lightColor
    )
    document.documentElement.style.setProperty(
      '--color-primary-dark',
      selectedColor.darkColor
    )
  }

  // Apply theme and accent color on initial load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)

    const selectedColor =
      accentColorMap[accentColor as keyof typeof accentColorMap] ||
      accentColorMap.orange

    document.documentElement.style.setProperty(
      '--color-primary',
      selectedColor.color
    )
    document.documentElement.style.setProperty(
      '--color-primary-light',
      selectedColor.lightColor
    )
    document.documentElement.style.setProperty(
      '--color-primary-dark',
      selectedColor.darkColor
    )
  }, [])

  return (
    <ThemeContext.Provider
      value={{ theme, accentColor, setTheme, setAccentColor }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
