import { Theme } from '../types'
import * as themes from './themes'

const storageKey = 'selected-theme'

const localStorage = typeof window !== 'undefined' && window.localStorage

export function getActiveThemeKey(): string {
  return localStorage.getItem(storageKey) || 'defaultTheme'
}

export function getActiveTheme(): Theme {
  return themes[getActiveThemeKey()]
}

export function saveActiveThemeAndReload(themeKey: string): void {
  localStorage.setItem(storageKey, themeKey)
  location.reload()
}
