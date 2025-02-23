import React, { createContext, ReactNode, useContext, useState } from 'react'

interface NavigationContextType {
  isNavVisible: boolean
  setNavVisible: (visible: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
)

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isNavVisible, setNavVisible] = useState(true)

  return (
    <NavigationContext.Provider value={{ isNavVisible, setNavVisible }}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
