import React, { useState } from 'react'
import { Link as GatsbyLink, graphql, useStaticQuery } from 'gatsby'
import styled from 'styled-components'
import * as themes from '../../utils/themes'
import GithubIcon from '../../vectors/GithubIcon'
import SidebarIcon from '../../vectors/SidebarIcon'
import NavArrowIcon from '../../vectors/NavArrow'
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

const CategoryGroup = ({name, links, categories}) => {
  const [isExpanded, setExpanded] = useState(true)

  return <>
    <CategoryLink onClick={() => setExpanded(!isExpanded)}>
      <CategoryLinkIcon isExpanded={isExpanded}><NavArrowIcon/></CategoryLinkIcon>
      <CategoryLinkName>{name}</CategoryLinkName>
    </CategoryLink>
    { isExpanded &&
      <CategoryLinks>
        { (Object.entries(categories).length !== 0) &&
          Object.keys(categories).map(categoryName =>
            <CategoryGroup
              name={categoryName}
              categories={categories[categoryName].categories}
              links={categories[categoryName].links} />
        )}
        { links.map(link => <Link to={link.url} activeClassName="isActive">{link.label}</Link> )}
      </CategoryLinks>
    }
  </>
}

const Sidebar = ({ nav, pageContext }) => {
  const [useActiveThemeKeyState] = useStateValue()
  const [themeKey, setThemeKey] = useActiveThemeKey(useActiveThemeKeyState)
  return (
    <Wrapper>
      <Sticky>
        <SidebarTitle to="/">
          <SidebarIcon /><span>CLI Docs</span>
        </SidebarTitle>

        <GroupLinks>
          { Object.keys(nav.categories).map(categoryName => {
            return <>
              <CategoryGroup
                name={categoryName}
                categories={nav.categories[categoryName].categories}
                links={nav.categories[categoryName].links} />
            </>
          })}
          { nav.links.map(link => <Link to={link.url} activeClassName="isActive">{link.label}</Link> )}
        </GroupLinks>

        <Divider />

        <GithubLink href={useGitHubURL(pageContext.pagePath)} target="_blank">
          <GithubIcon />
          <span>Edit on Github</span>
        </GithubLink>
        <select
          onChange={e => setThemeKey(e.target.value)}
          defaultValue={themeKey}
        >
          {Object.keys(themes).map(themeKey => (
            <option key={themeKey} value={themeKey}>
              {themes[themeKey].name}
            </option>
          ))}
        </select>
      </Sticky>
    </Wrapper>
  )
}

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

const CategoryLinks = styled.div`
  padding-left: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const CategoryLinkName = styled.div`
  font-weight: 600;
`

const CategoryLinkIcon = styled.div<{ isExpanded: boolean }>`
  transform: rotate(${p => p.isExpanded ? '90deg' : '0deg'});
  opacity: ${p => p.isExpanded ? '1' : '0.35'};
  position: absolute;
  left: -12px;
  top: 8px;
  width: 6px;

  svg {
    display: block;
    width: 100%;
    height: auto;
  }
`

const CategoryLink = styled.div`
  position: relative;
  color: ${p => p.theme.gray800};

  &:hover {
    ${CategoryLinkIcon} { opacity: 1; }
    color: ${p => p.theme.purple500};
    cursor: pointer;
  }
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
