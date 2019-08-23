const generateNavLinks = (pagesPath, pagesData) => {

  const sidebar = {
    links: [],
    categories: {}
  }

  const tmpLinks = []

  const navLinks = pagesData.reduce((links, page) => {
    if (
      page.node.context !== null &&
      page.node.context.frontmatter !== null &&
      page.node.context.frontmatter.navLabel !== null
    ) {

      const url = page.node.path
      const label = page.node.context.frontmatter.navLabel
      const order = page.node.context.frontmatter.navOrder

      // Get categories from component path
      const relativePath = page.node.componentPath.slice((pagesPath+"/src/pages/").length)
      const categories = relativePath.split('/').filter(Boolean)
      categories.pop() // Ditch the page name

      const link = { url, categories, label, order }

      tmpLinks.push(link)
    }
    return links
  }, Object.create(null))


  tmpLinks.map(linkData => {
    const {categories, ...link} = linkData

    // If there are no categories
    if (!categories.length) { sidebar.links.push(link)}

    // If there is one category
    if (categories.length === 1) {
      const category = categories[0]
      if (sidebar.categories.hasOwnProperty(category)) {
        sidebar.categories[category].links.push(link)
        sidebar.categories[category].links.sort((a,b) => a.order - b.order)
      } else {
        sidebar.categories[category] = { links: [link], categories: {} }
      }
    }

    // If there are two categories
    if (categories.length === 2) {
      const [category, subCategory] = categories
      if (sidebar.categories.hasOwnProperty(category)) {
        if (sidebar.categories[category].categories.hasOwnProperty(subCategory)) {
          sidebar.categories[category].categories[subCategory].links.push(link)
          sidebar.categories[category].categories[subCategory].links.sort((a,b) => a.order - b.order)
        } else {
          sidebar.categories[category].categories[subCategory] = { categories: {}, links: [link] }
        }

      } else {
        sidebar.categories[category] = { links: [], categories: { [subCategory]: { categories: {}, links: [link] }} }
      }
    }
  })

  return sidebar
}

export default generateNavLinks
