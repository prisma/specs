import React, { useState } from 'react'
import { Link as GatsbyLink, graphql, useStaticQuery } from 'gatsby'
import styled from 'styled-components'
import * as themes from '../../utils/themes'
import GithubIcon from '../../vectors/GithubIcon'
import SidebarIcon from '../../vectors/SidebarIcon'
import { useActiveThemeKey } from '../../utils/hooks'
import { useStateValue } from './Layout'

export const useGitHubURL = (path: string) => {
  const data = useStaticQuery(
    graphql`
      query {
        allSitePage {
          nodes {
            componentPath
            path
          }
        }
        site {
          pathPrefix
          siteMetadata {
            directory
          }
        }
      }
    `
  )
  const { componentPath } = data.allSitePage.nodes.find(n => n.path === path)
  const pagesPath = data.site.siteMetadata.directory
  const relativePath = componentPath.slice(pagesPath.length)
  const githubUrl =
    'https://github.com/prisma/specs/edit/master/cli' + relativePath
  return githubUrl
}

const Sidebar = ({ links, pageContext }) => {
  const [useActiveThemeKeyState] = useStateValue()
  const [themeKey, setThemeKey] = useActiveThemeKey(useActiveThemeKeyState)
  return <code><pre>{JSON.stringify(links, null, 2)}</pre></code>
  // return (
  //   <Wrapper>
  //     <Sticky>
  //       {console.log({links})}
  //       <SidebarTitle to="/">
  //         <SidebarIcon />
  //         <span>CLI Docs</span>
  //       </SidebarTitle>

  //       {/* <GroupTitle>
  //         <Faded>$</Faded> prisma init
  //       </GroupTitle>
  //       <GroupLinks>
  //         {links['init'].map(link => (
  //           <GroupLink link={link} key={link.url} />
  //         ))}
  //       </GroupLinks>

  //       <Divider />

  //       <GroupTitle>
  //         <Faded>$</Faded> prisma dev
  //       </GroupTitle>
  //       <GroupLinks>
  //         {links['dev'].map(link => (
  //           <GroupLink link={link} key={link.url} />
  //         ))}
  //       </GroupLinks>

  //       <Divider />

  //       <GroupTitle>
  //         <Faded>$</Faded> prisma help
  //       </GroupTitle>
  //       <GroupLinks>
  //         {links['help'].map(link => (
  //           <GroupLink link={link} key={link.url} />
  //         ))}
  //       </GroupLinks> */}

  //       <Divider />

  //       <GithubLink href={useGitHubURL(pageContext.pagePath)} target="_blank">
  //         <GithubIcon />
  //         <span>Edit on Github</span>
  //       </GithubLink>
  //       <select
  //         onChange={e => setThemeKey(e.target.value)}
  //         defaultValue={themeKey}
  //       >
  //         {Object.keys(themes).map(themeKey => (
  //           <option key={themeKey} value={themeKey}>
  //             {themes[themeKey].name}
  //           </option>
  //         ))}
  //       </select>
  //     </Sticky>
  //   </Wrapper>
  // )
}

const GroupLink = ({ link }: { link: { url: string; label: string } }) => (
  <Link to={link.url} activeClassName="isActive">
    {link.label}
  </Link>
)

const Wrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 200px;
  background: ${p => p.theme.gray200};
  padding: 0 24px;
`

const Sticky = styled.div`
  position: sticky;
  top: 0;
  padding: 24px 0;
`

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: ${p => p.theme.gray400};
  margin: 24px 0;
`

const SidebarTitle = styled(GatsbyLink)`
  color: ${p => p.theme.gray800};
  font-weight: 700;
  display: flex;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid ${p => p.theme.gray400};
  margin-bottom: 24px;

  svg {
    display: block;
    margin-right: 8px;
  }
`

const Faded = styled.span`
  opacity: 0.5;
`

const GroupTitle = styled.div`
  display: inline-block;
  padding: 2px 6px;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  background: ${p => p.theme.gray800};
  border-radius: 4px;
  color: #fff;
  font-weight: bold;
  font-family: 'Roboto Mono';
  font-size: 13px;
  text-transform: uppercase;
`

const GroupLinks = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const Link = styled(GatsbyLink)`
  font-weight: 600;
  color: ${p => p.theme.gray800};

  &:hover,
  &.isActive {
    color: ${p => p.theme.purple500};
  }
`

const GithubLink = styled.a`
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  color: ${p => p.theme.gray500};

  &:hover,
  &.isActive {
    color: ${p => p.theme.purple500};
  }

  svg {
    height: 20px;
    width: auto;
    margin-right: 8px;
  }
`

export default Sidebar

export const query = graphql`
  query {
    sitePage(path: { eq: "/" }) {
      componentPath
    }
    site {
      pathPrefix
      siteMetadata {
        directory
      }
    }
  }
`
