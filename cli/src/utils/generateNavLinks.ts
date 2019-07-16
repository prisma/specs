const generateNavLinks = pagesData => {
  const navLinks = pagesData.reduce((links, page) => {
    if (
      page.node.context &&
      page.node.context.frontmatter &&
      page.node.context.frontmatter.navLabel
    ) {
      const link = {
        url: page.node.path,
        category: page.node.context.frontmatter.navGroup,
        label: page.node.context.frontmatter.navLabel,
        order: page.node.context.frontmatter.navOrder,
      }
      links[link.category] = links[link.category] || []
      links[link.category].push(link)
    }
    return links
  }, Object.create(null))

  return navLinks
}

export default generateNavLinks
