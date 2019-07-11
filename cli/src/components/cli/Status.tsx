import React from 'react'
import figures from 'figures'
import colors from '../../colors'

// Status
export default ({ type, primary, secondary, labelWidth = 'auto' }) => (
  <div style={successStyles}>
    {icon(type)}
    {primary && <span style={primaryTextStyles({ labelWidth, type })}>{primary}</span>}
    {secondary && <span style={secondaryTextStyles}>{secondary}</span>}
  </div>
)

const icon = type => {
  switch (type) {
    case 'success':
      return <div style={{ width: 16, color: colors.greenBright }}>{figures.tick}</div>
    case 'pending':
      return <div style={{ width: 16, color: colors.yellowBright }}>⣷</div>
    case 'error':
      return <div style={{ width: 16, color: colors.redBright }}>{figures.cross}</div>
    default:
      break
  }
}

// Styles
const successStyles = {
  display: 'flex'
}

const primaryTextStyles = ({ labelWidth, type }) => {
  let color
  switch (type) {
    case 'success':
      color = colors.greenBright
      break
    case 'pending':
      color = colors.yellowBright
      break
    case 'error':
      color = colors.redBright
      break
    default:
      color = colors.white
  }

  return {
    color: color,
    fontWeight: 'bold',
    marginRight: 8,
    width: labelWidth
  }
}

const secondaryTextStyles = {
  color: colors.blackBright
}