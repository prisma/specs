import React from 'react'
import figures from 'figures'
import colors from '../../colors'

// Checkbox
export default ({
  label,
  labelWidth = 'auto',
  description,
  isSelected = false,
  isChecked = false,
  isDisabled = false,
  icon = 'pointer',
  ...props
}) => {
  return (
    <a style={checkboxStyles} {...props}>
      <div style={iconStyles(isSelected)}>{!isDisabled && isSelected && figures[icon]}</div>
      <div style={boxIconStyles({ isSelected, isChecked })}>{isChecked ? figures.squareSmallFilled : figures.squareSmall}</div>
      <div style={labelStyles({ isSelected, isDisabled, labelWidth })}>{label}</div>
      <div style={descriptionStyles}>{description}</div>
    </a>
  )
}

// Styles
const checkboxStyles = {
  display: 'flex',
  alignItems: 'center',
  padding: '2px 0',
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

const boxIconStyles = ({ isSelected, isChecked }) => {
  const iconColor = isSelected || isChecked ? colors.cyanBright : colors.white

  return {
    width: 16,
    marginRight: 4,
    color: iconColor
  }
}