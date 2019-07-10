import React from 'react'
import '../globalStyles.css'

export default ({ children }) => (
  <div style={layoutStyles}>{children}</div>
)

const layoutStyles = {
  maxWidth: 900,
  margin: '0 auto',
}