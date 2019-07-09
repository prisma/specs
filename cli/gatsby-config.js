module.exports = {
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
        }
      }
    },
    'gatsby-plugin-typescript'
  ],
}