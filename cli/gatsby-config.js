module.exports = {
  pathPrefix: '/cli',
  siteMetadata: {
    title: 'Gatsby Default Starter',
  },
  plugins: [
    {
      resolve: 'gatsby-mdx',
      options: {
        globalScope: `
          require('typeface-roboto-mono')
          require('normalize.css')
        `,
        defaultLayouts: {
          default: require.resolve("./src/components/layout.tsx")
        },
        remarkPlugins: [require(`remark-slug`)],
      }
    },
    'gatsby-plugin-typescript'
  ],
}
