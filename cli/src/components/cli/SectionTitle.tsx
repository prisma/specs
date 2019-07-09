import React from 'react'
import colors from '../../colors'

// Section Title
export default ({ children }) => (
  <div style={sectionTitleStyles}>
    {children}
  </div>
)

// Styles
const sectionTitleStyles = {
  color: colors.whiteBright,
  fontWeight: 'bold',
  borderBottom: `1px solid ${colors.blackBright}`,
  paddingBottom: 8,
}