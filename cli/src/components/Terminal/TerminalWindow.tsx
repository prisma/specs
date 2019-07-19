import React from 'react'
import styled from 'styled-components'

// Terminal Window
const TerminalWindow = ({ children, theme }) => (
  <Terminal theme={theme.theme}>
    <TopBar>
      <Dot color="#EB5757" />
      <Dot color="#F2C94C" />
      <Dot color="#6FCF97" />
      <Title>bash</Title>
    </TopBar>
    <Main>{children}</Main>
  </Terminal>
)

// Styles
const Terminal = styled.div`
  background: ${props => props.theme.background};
  color: ${props => props.theme.foreground};
  border-radius: 6px;
  font-family: 'Roboto Mono', monospace;
  line-height: 1.5;
  padding: 14px;
  font-size: 13px;
  max-width: 740px;
`

const TopBar = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 14px;
`

const Dot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 12px;
  margin-right: 6px;
  background: ${p => p.color};
`

const Title = styled.div`
  flex: 1;
  color: #808080;
  text-align: center;
  line-height: 1;
`

const Main = styled.div`
  padding: 8px;
`

export default TerminalWindow
