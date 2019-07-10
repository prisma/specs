import React from 'react'
import colors from '../../colors'

// Command
export default ({ children }) => (
  <div>
    $ <span style={commandStyles}>{children}</span>
  </div>
)

// Styles
const commandStyles = {
  color: colors.whiteBright
}