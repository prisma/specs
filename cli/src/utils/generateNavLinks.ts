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
      // const order = page.node.context.frontmatter.navOrder

      // Get categories from component path
      const relativePath = page.node.componentPath.slice((pagesPath+"/src/pages/").length)
      const categories = relativePath.split('/').filter(Boolean)
      categories.pop() // Ditch the page name

      const link = {
        url,
        categories,
        label,
        // relativePath,
        // order
      }

      // if (categories.length === 0) {
      //   newLinks.push(link)
      //   newLinks.sort((a,b) => a.order - b.order)
      // } else if (categories.length === 1) {
      //   newLinks[categories[0]].push(link)
      //   newLinks[categories[0]].sort((a,b) => a.order - b.order)
      // } else if (categories.length === 2) {
      //   newLinks[categories[0].categories[1]].push(link)
      //   newLinks[categories[0].categories[1]].sort((a,b) => a.order - b.order)
      // }

      // links[link.category] = links[link.category] || []
      // links[link.category].push(link)
      // links[link.category].sort((a,b) => a.order - b.order)

      tmpLinks.push(link)
    }
    return links
  }, Object.create(null))


  tmpLinks.map(linkData => {
    const {categories, ...link} = linkData
    // const link = { label }

    // If there are no categories
    if (!categories.length) { sidebar.links.push(link)}

    // If there is one category
    if (categories.length === 1) {
      if (sidebar.categories.hasOwnProperty(categories[0])) {
        sidebar.categories[categories[0]].links = [link]
      } else {
        sidebar.categories[categories[0]] = {
          links: [link], categories: {}
        }
      }
    }

    // If there are two categories
    if (categories.length === 2) {
      if (sidebar.categories.hasOwnProperty(categories[0])) {
        if (sidebar.categories[categories[0]].categories.hasOwnProperty(categories[1])) {
          // const tmpLinks = sidebar.categories[categories[0]].categories[categories[1]].links
          sidebar.categories[categories[0]].categories[categories[1]].links.push(link)

        } else {
          sidebar.categories[categories[0]].categories[categories[1]] = {
              categories: {},
              links: [link]
          }
        }

      } else {
        sidebar.categories[categories[0]] = {
          links: [],
          categories: {}
        }

        sidebar.categories[categories[0]].categories[categories[1]] = {
          categories: {},
          links: [link]
        }
      }
    }
  })

  return tmpLinks
}

export default generateNavLinks
