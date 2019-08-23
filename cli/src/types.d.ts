import { ITheme } from 'xterm'

declare module '*.mdx' {
  let MDXComponent: (props: any) => JSX.Element
  export default MDXComponent
}

declare module 'ink-spinner'
declare module 'ink-divider'
declare module 'ink-text-input'
declare module 'ink-multi-select'
declare module 'ink-select-input'
declare module 'ink-progress-bar'
declare module 'ink-box'
declare module 'use-persisted-state'

export type Theme = {
  name: string
  theme: ITheme
}
