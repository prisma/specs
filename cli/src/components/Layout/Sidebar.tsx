import React from 'react'
import { Link as GatsbyLink, graphql, useStaticQuery } from 'gatsby'
import styled from 'styled-components'
import GithubIcon from '../../vectors/GithubIcon'
import SidebarIcon from '../../vectors/SidebarIcon'

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
    'https://github.com/prisma/specs/blob/master/cli' + relativePath
  return githubUrl
}

const Sidebar = ({ links, pathName, pageContext }) => (
  <Wrapper>
    <Sticky>
      <SidebarTitle>
        <SidebarIcon />
        <span>CLI Docs</span>
      </SidebarTitle>

      <GroupTitle>
        <Faded>$</Faded> prisma init
      </GroupTitle>
      <GroupLinks>
        {links['init'].map(link => (
          <GroupLink link={link} key={link.url} />
        ))}
      </GroupLinks>

      <Divider />

      <GroupTitle>
        <Faded>$</Faded> prisma dev
      </GroupTitle>
      <GroupLinks>
        {links['dev'].map(link => (
          <GroupLink link={link} key={link.url} />
        ))}
      </GroupLinks>

      <Divider />

      <GroupTitle>
        <Faded>$</Faded> prisma help
      </GroupTitle>
      <GroupLinks>
        {links['help'].map(link => (
          <GroupLink link={link} key={link.url} />
        ))}
      </GroupLinks>

      <Divider />

      <GithubLink href={useGitHubURL(pageContext.pagePath)} target="_blank">
        <GithubIcon />
        <span>Edit on Github</span>
      </GithubLink>
    </Sticky>
  </Wrapper>
)

const GroupLink = ({ link }) => (
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

const SidebarTitle = styled.div`
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
