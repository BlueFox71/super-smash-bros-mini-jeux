import { createContext, useContext, useState } from 'react'

const HideHeaderContext = createContext([false, () => {}])

export function HideHeaderProvider({ children }) {
  const [hide, setHide] = useState(false)
  return (
    <HideHeaderContext.Provider value={[hide, setHide]}>
      {children}
    </HideHeaderContext.Provider>
  )
}

export function useHideHeader() {
  const value = useContext(HideHeaderContext)
  if (!value) throw new Error('useHideHeader must be used within HideHeaderProvider')
  return value
}
