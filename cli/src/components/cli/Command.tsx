import React from 'react'
import colors from '../../colors'

// Command
export default ({ label, description, labelWidth = 'auto', noPrefix = false  }) => (
  <div style={commandStyles}>
    {!noPrefix && <span>$&nbsp;</span>}
    <div style={labelStyles(labelWidth)}>{label}</div>
    <div style={descriptionStyles}>{description}</div>
  </div>
)

// Styles
const commandStyles = {
  display: 'flex',
  alignItems: 'center'
}

const labelStyles = labelWidth => {
  return {
    color: colors.whiteBright,
    width: labelWidth
  }
}

const descriptionStyles = {
  color: colors.blackBright,
  marginLeft: 8
}