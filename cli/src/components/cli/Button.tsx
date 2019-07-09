import React from 'react'
import figures from 'figures'
import colors from '../../colors'

// Button
export default ({ label, description, isSelected = false, ...props }) => (
  <div style={buttonStyles}>
    <div style={pointerStyles(isSelected)}>{figures.pointer}</div>
    <div style={labelStyles(isSelected)}>{label}</div>
    <div style={descriptionStyles}>{description}</div>
  </div>
)

// Styles
const buttonStyles = {
  display: 'flex',
  alignItems: 'center'
}

const labelStyles = (isSelected) => {
  const labelColor = isSelected ? colors.cyanBright : colors.whiteBright
  return {
    color: labelColor,
    fontWeight: 'bold'
  }
}

const descriptionStyles = {
  color: colors.blackBright
}

const pointerStyles = (isSelected) => {
  const pointerColor = isSelected ? colors.cyan : colors.blackBright
  return {
    color: pointerColor,
    width: 16
  }
}