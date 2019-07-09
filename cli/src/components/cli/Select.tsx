import React from 'react'
import figures from 'figures'
import colors from '../../colors'

// Select
export default ({ children }) => (
  <div>{children}</div>
)

// Option
export const Option = ({ label, description, isDisabled = false, isSelected = false, ...props }) => (
  <a style={optionStyles} {...props}>
    <div style={pointerStyles(isSelected)}>{!isDisabled && figures.pointer}</div>
    <div style={labelStyles({ isSelected, isDisabled })}>{label}</div>
    <div style={descriptionStyles}>{description}</div>
  </a>
)

// Styles
const optionStyles = {
  display: 'flex',
  alignItems: 'center',
  padding: '2px 0',
}

const labelStyles = ({ isSelected, isDisabled }) => {
  const labelColor = isDisabled ? colors.white : isSelected ? colors.cyanBright : colors.whiteBright
  return {
    minWidth: 120,
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