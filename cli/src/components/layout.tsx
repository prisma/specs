import React from 'react'
import '../globalStyles.css'

export default ({ children }) => (
  <div style={layoutStyles}>{children}</div>
)

const layoutStyles = {
  maxWidth: 800,
  margin: '0 auto',
}