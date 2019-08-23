import React from 'react'
import { Terminal as XTerminal } from 'xterm'
import 'xterm/dist/xterm.css'
import TerminalWindow from './TerminalWindow'
import TerminalWrapper from './TerminalWrapper'
import renderToString from '../../utils/renderToString'
import { useStateValue } from '../Layout/Layout'
import { useActiveTheme } from '../../utils/hooks'
import { Theme } from '../../types'

// Terminal
class Terminal extends React.Component<{ theme: Theme }> {
  state = { output: '' }
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
      <TerminalWindow theme={this.props.theme}>
        <TerminalWrapper
          getTerminal={this.setTerminal}
          theme={this.props.theme}
        >
          {this.state.output}
        </TerminalWrapper>
      </TerminalWindow>
    )
  }
}

const Wrapper = data => {
  const { children } = data
  const [useActiveThemeKeyState] = useStateValue()
  const [theme] = useActiveTheme(useActiveThemeKeyState)
  return <Terminal theme={theme}>{children}</Terminal>
}

export default Wrapper
// export default Terminal
