import * as themes from './themes'

const defaultThemeKey = 'verminal'

export const useActiveThemeKey = useActiveThemeKeyState => {
  const [value, setValue] = useActiveThemeKeyState({ theme: defaultThemeKey })
  return [value.theme, (theme: string) => setValue({ theme })]
}

export const useActiveTheme = useActiveThemeKeyState => {
  const [themeKey, setThemeKey] = useActiveThemeKey(useActiveThemeKeyState)
  return [themes[themeKey], themeKey => setThemeKey(themeKey)]
}
