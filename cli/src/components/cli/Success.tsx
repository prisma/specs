import React from 'react'
import figures from 'figures'
import colors from '../../colors'

// Success
export default ({ message }) => (
  <div style={successStyles}>
    <div style={iconStyles}>{figures.tick}</div>
    <div>{message}</div>
  </div>
)

// Styles
const successStyles = {
  color: colors.greenBright,
  display: 'flex'
}

const iconStyles = {
  width: 16
}