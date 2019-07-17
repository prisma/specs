import React from 'react'
import { Terminal as XTerminal } from 'xterm'
import 'xterm/dist/xterm.css'
import TerminalWindow from './TerminalWindow'
import TerminalWrapper from './TerminalWrapper'
import renderToString from '../../utils/renderToString'

// Terminal
class Terminal extends React.Component {
  state = { output: '' }
  terminal?: XTerminal

  componentDidMount() {
    renderToString(
      this.props.children,
      { columns: 60, terminal: this.terminal },
      output => { this.setState({ output }) }
    )
  }

  setTerminal = (terminal: XTerminal) => {
    this.terminal = terminal
  }

  render() {
    return (
      <TerminalWindow>
        <TerminalWrapper getTerminal={this.setTerminal}>
          {this.state.output}
        </TerminalWrapper>
      </TerminalWindow>
    )
  }
}

export default Terminal
