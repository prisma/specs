import React from 'react'
import figures from 'figures'
import colors from '../../colors'

// Text Input
export default ({
  label,
  placeholder,
  value,
  isSelected = false,
  ...props
}) => {

  return (
    <a style={buttonStyles} {...props}>
      <div style={iconStyles(isSelected)}>{isSelected && figures.pointer}</div>
      <div style={labelStyles(isSelected)}>{label}:</div>
      {
        value
          ? <div style={valueStyles}>{value}</div>
          : placeholder
            ? <div style={placeholderStyles}>{placeholder}</div>
            : null
      }
    </a>
  )
}

// Styles
const buttonStyles = {
  display: 'flex',
  alignItems: 'center',
}

const labelStyles = (isSelected) => {
  const labelColor = isSelected ? colors.cyanBright : colors.whiteBright
  return {
    color: labelColor,
    fontWeight: 'bold',
    marginRight: 8
  }
}

const iconStyles = (isSelected) => {
  const iconColor = isSelected ? colors.cyan : colors.blackBright
  return {
    color: iconColor,
    width: 16
  }
}

const valueStyles = {
  color: colors.whiteBright
}

const placeholderStyles = {
  color: colors.blackBright
}