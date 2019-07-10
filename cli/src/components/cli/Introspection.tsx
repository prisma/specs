import React from 'react'
import figures from 'figures'
import colors from '../../colors'

// Introspection
export default ({ children, progress=45.12 }) => (
  <div style={introspectionStyles}>
    <div>{children}</div>
    <div style={progressStyles}>
      [<div style={progressBarContainerStyles}>
        <div style={progressBarStyles(progress)} />
      </div>]
      <div style={progressNumberStyles}>{progress} %</div>
    </div>
  </div>
)

// Styles
const introspectionStyles = {
  color: colors.greenBright,
  display: 'flex'
}

const progressStyles = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  marginLeft: 8
}

const progressBarContainerStyles = {
  flex: 1
}

const progressBarStyles = progress => {
  return {
    width: `${progress}%`,
    height: 8,
    background: colors.greenBright
  }
}

const progressNumberStyles = {
  marginLeft: 8
}