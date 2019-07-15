import React from 'react'
import figures from 'figures'
import colors from '../../colors'

// Button
export default ({
  label,
  labelWidth = 'auto',
  description,
  isSelected = false,
  isDisabled = false,
  icon = 'pointer',
  ...props
}) => {
  const buttonIcon = icon === 'back' ? '❮' : figures[icon]
  return (
    <a style={buttonStyles} {...props}>
      <div style={iconStyles(isSelected)}>{!isDisabled && buttonIcon}</div>
      <div style={labelStyles({ isSelected, isDisabled, labelWidth })}>{label}</div>
      <div style={descriptionStyles}>{description}</div>
    </a>
  )
}

// Styles
const buttonStyles = {
  display: 'flex',
  alignItems: 'center',
}

const labelStyles = ({ isSelected, isDisabled, labelWidth }) => {
  const labelColor = isDisabled ? colors.white : isSelected ? colors.cyanBright : colors.whiteBright
  return {
    color: labelColor,
    fontWeight: 'bold',
    width: labelWidth
  }
}

const descriptionStyles = {
  color: colors.blackBright,
  marginLeft: 8,
}

const iconStyles = (isSelected) => {
  const iconColor = isSelected ? colors.cyan : colors.blackBright
  return {
    color: iconColor,
    width: 16
  }
}