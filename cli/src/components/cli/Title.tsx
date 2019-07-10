import React from 'react'
import colors from '../../colors'

// Title
export default ({ primary, secondary }) => (
  <div>
    {primary && <span style={primaryTitleStyles}>{primary}</span>}
    {secondary && <span style={secondaryTitleStyles}>{secondary}</span>}
  </div>
)

// Styles
const primaryTitleStyles = {
  color: colors.whiteBright,
  fontWeight: 'bold',
  marginRight: 8
}

const secondaryTitleStyles = {
  color: colors.blackBright
}