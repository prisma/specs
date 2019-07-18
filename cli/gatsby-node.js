exports.onCreatePage = ({ page, actions }) => {
  const { createPage, deletePage } = actions

  console.log(page)

  deletePage(page)
  // You can access the variable "house" in your page queries now
  createPage({
    ...page,
    context: {
      ...page.context,
      pagePath: page.path,
    },
  })
}
