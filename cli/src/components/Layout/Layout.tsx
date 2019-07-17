import React from 'react'
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components'
import { StaticQuery, graphql } from 'gatsby'
import Sidebar from './Sidebar'
import generateNavLinks from '../../utils/generateNavLinks'
import theme from '../../utils/theme'

const Layout = ({ children }) => (
  <StaticQuery
    query={query}
    render={data => {
      const pagesData = data.allSitePage.edges
      const navLinks = generateNavLinks(pagesData)

      return (
        <ThemeProvider theme={theme}>
          <Wrapper>
            <GlobalStyles />
            <Sidebar links={navLinks} />
            <Main>
              {children}
            </Main>
          </Wrapper>
        </ThemeProvider>
    )}} />
)

// Query
const query = graphql`
  query NavigationQuery {
    allSitePage {
      edges {
        node {
          path
          context {
            frontmatter {
              navGroup
              navLabel
              navOrder
            }
          }
        }
      }
    }
  }
`

// Global Styles
const GlobalStyles = createGlobalStyle`
  :root {
    --system-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, Arial, 'Helvetica Neue', sans-serif, 'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';
    --headline-font: 'Montserrat', var(--system-font);
    --body-font: 'Open Sans', var(--system-font);
  }

  html {
    font-family: var(--body-font);
    line-height: 1.5;
    --webkit-text-size-adjust: 100%;
    box-sizing: border-box;
    scroll-behavior: smooth;
    background: ${p => p.theme.white};
    color: ${p => p.theme.gray800};
  }

  body {
    padding: 0;
    margin: 0;
  }

  *::before, *::after {
    box-sizing: inherit;
  }

  hr {
    border: 1px solid ${p => p.theme.gray300};
  }

  /* h1, h2, h3, h4, h5, h6 {
    margin: 0;
  } */

  h1, h2, h3 {
    font-family: var(--headline-font);
  }

  h4, h5, h6 {
    font-family: var(--body-font);
  }

  svg {
    display: inline-block;
  }

  button {
    white-space: nowrap;
  }

  a {
    color: inherit;
    text-decoration: inherit;
  }
`

// Styles
const Wrapper = styled.div`
  display: flex;
  min-height: 100vh;
`

const Main = styled.div`
  max-width: 900px;
  padding: 32px;
`

export default Layout