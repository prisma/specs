import React from 'react'
import { Terminal as XTerminal } from 'xterm'
// NOTE special path needed for gatsby to build because of `window`
import { FitAddon } from 'xterm-addon-fit/out/FitAddon'
import ansiEscapes from 'ansi-escapes'
import { getActiveTheme } from '../../utils/themeStore'

// Terminal Wrapper
export default class TerminalWrapper extends React.Component<{
  style?: React.CSSProperties
  getTerminal?: (terminal: XTerminal) => void
}> {
  ref: any
  terminal?: XTerminal

  setRef = (ref: any) => {
    this.ref = ref
  }

  componentDidMount() {
    if (this.ref) {
      this.terminal = new XTerminal({
        theme: getActiveTheme().theme,
      })

      this.terminal.focus()
      this.terminal.loadAddon(new FitAddon())
      this.terminal.open(this.ref)
      this.write()
      this.props.getTerminal && this.props.getTerminal(this.terminal)
    }
  }

  write() {
    if (this.props.children) {
      if (this.props.children) {
        this.terminal!.write(ansiEscapes.cursorTo(0, 0))
        this.terminal!.writeln(this.props.children.toString())
      }
    }
  }

  componentDidUpdate() {
    if (this.terminal) {
      this.write()
    }
  }

  render() {
    return <div style={this.props.style} ref={this.setRef} />
  }
}
