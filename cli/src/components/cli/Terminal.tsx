import React from 'react'
import colors from '../../colors'

// Terminal
export default ({ children }) => (
  <div style={terminalStyles}>
    <TopBar />
    <div style={contentStyles}>
      {children}
    </div>
  </div>
)

// Top Bar
const TopBar = () => (
  <div style={topBarStyles}>
    <div style={{...dotStyles, background: '#EB5757'}} />
    <div style={{...dotStyles, background: '#F2C94C'}} />
    <div style={{...dotStyles, background: '#6FCF97'}} />
    <div style={topBarTitleStyles}>bash</div>
  </div>
)

// Styles
const terminalStyles = {
  background: colors.black,
  color: colors.white,
  borderRadius: 6,
  fontFamily: `'Roboto Mono', monospace`,
  padding: 14,
  fontSize: 13,
  lineHeight: 1,
  maxWidth: 700
}

const topBarStyles = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: 14,
}

const dotStyles = {
  width: 12,
  height: 12,
  borderRadius: 12,
  marginRight: 6,
}

const topBarTitleStyles = {
  flex: 1,
  color: colors.blackBright,
  textAlign: 'center',
  lineHeight: 1,
}

const contentStyles = {
  padding: 8
}