import React from 'react'
import { Link as GatsbyLink } from 'gatsby'
import styled from 'styled-components'

const Sidebar = ({ links }) => (
  <Wrapper>
    <Sticky>
      <SidebarTitle>
        <SidebarTitleIcon />
        <span>CLI Docs</span>
      </SidebarTitle>

      <GroupTitle><Faded>$</Faded> prisma init</GroupTitle>
      <GroupLinks>{ links['init'].map(link => <GroupLink link={link} />) }</GroupLinks>

      <Divider />

      <GroupTitle><Faded>$</Faded> prisma dev</GroupTitle>
      <GroupLinks>{ links['dev'].map(link => <GroupLink link={link} />) }</GroupLinks>

      <Divider />

      <GroupTitle><Faded>$</Faded> prisma help</GroupTitle>
      <GroupLinks>{ links['help'].map(link => <GroupLink link={link} />) }</GroupLinks>
    </Sticky>
  </Wrapper>
)

const SidebarTitleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <rect width="24" height="24" rx="4" fill="currentColor"/>
  <path d="M7 7L10.9802 10.9802L7 14.9604M11.5 16.5H16.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
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
  &.isActive { color: ${p => p.theme.purple500}; }
`

export default Sidebar