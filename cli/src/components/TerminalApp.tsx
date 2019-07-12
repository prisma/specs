import React from 'react'
import Terminall from './cli/Terminal'
import Terminal from './Terminal'
import 'xterm/dist/xterm.css'
import renderToString from './renderToString'
import { Terminal as XTerminal } from 'xterm'

class TerminalApp extends React.Component {
  state = {
    output: '',
  }
  terminal?: XTerminal
  componentDidMount() {
    renderToString(
      this.props.children,
      { columns: 60, terminal: this.terminal },
      output => {
        this.setState({ output })
      }
    )
  }
  setTerminal = (terminal: XTerminal) => {
    this.terminal = terminal
  }
  render() {
    return (
      <Terminall>
        <Terminal getTerminal={this.setTerminal}>{this.state.output}</Terminal>
      </Terminall>
    )
  }
}

export default TerminalApp
