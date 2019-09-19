import React, { useContext, useReducer } from 'react'
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components'
import { StaticQuery, graphql } from 'gatsby'
import Sidebar from './Sidebar'
import generateNavLinks from '../../utils/generateNavLinks'
import theme from '../../utils/theme'
import createPersistedState from 'use-persisted-state'

const StateContext = React.createContext(null)
const StateProvider = ({ reducer, initialState, children }) => (
  <StateContext.Provider value={useReducer(reducer, initialState)}>
    {children}
  </StateContext.Provider>
)
export const useStateValue: any = () => useContext(StateContext)

const storageKey = 'selectedTheme'
const localStorageFallback = {
  getItem: () => null,
  setItem: () => {},
}
const localStorage =
  typeof window !== 'undefined' ? window.localStorage : localStorageFallback

const Layout = ({ children, location, pageContext }) => (
  <StaticQuery
    query={query}
    render={data => {
      const pagesData = data.allSitePage.edges
      const pagesPath = data.site.siteMetadata.directory
      const navLinks = generateNavLinks(pagesPath, pagesData)

      const useActiveThemeKeyState = createPersistedState(
        storageKey,
        localStorage
      )

      return (
        <StateProvider initialState={useActiveThemeKeyState} reducer={() => {}}>
          <ThemeProvider theme={theme}>
            <Wrapper>
              <GlobalStyles />
              <Sidebar nav={navLinks} pageContext={pageContext} />
              <Main>{children}</Main>
            </Wrapper>
          </ThemeProvider>
        </StateProvider>
      )
    }}
  />
)

// Query
const query = graphql`
  query NavigationQuery {
    allSitePage {
      edges {
        node {
          path
          componentPath
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
    site {
      siteMetadata {
        directory
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
    --code-font: 'Roboto Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, Courier, monospace;
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

  code {
    font-family: var(--code-font);
    font-size: 14px;
    background-color: ${p => p.theme.gray200};
    border-radius: 6px;
    padding: 0 4px;
  }

  pre {
    background-color: ${p => p.theme.gray200};
    padding: 8px 12px;
    border-radius: 6px;

    code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
    }
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

  a {
    color: ${p => p.theme.purple500};
    text-decoration: underline;
  }
`

export default Layout
