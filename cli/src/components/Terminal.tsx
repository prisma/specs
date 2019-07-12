import React from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit/out/FitAddon'
import ansiEscapes from 'ansi-escapes'

export default class TerminalComponent extends React.Component<{
  style?: React.CSSProperties
  getTerminal?: (terminal: Terminal) => void
}> {
  ref: any
  terminal?: Terminal
  setRef = (ref: any) => {
    this.ref = ref
  }
  componentDidMount() {
    if (this.ref) {
      this.terminal = new Terminal()
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
