import React from 'react'
import colors from '../../colors'

// Actions
const Actions = ({ children }) => (
  <div style={actionsStyles}>{children}</div>
)

// Action
const Action = ({ keyStroke, label }) => (
  <div style={actionStyles}>
    <span style={keyStyles}>{keyStroke}: </span>
    <span style={labelStyles}>{label}</span>
  </div>
)

// Styles
const actionsStyles = {
  display: 'flex'
}

const actionStyles = {
  marginRight: 16
}

const keyStyles = {
  color: colors.whiteBright,
  fontWeight: 'bold'
}

const labelStyles = {
  color: colors.white
}

export { Actions, Action }