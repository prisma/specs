import axios from 'axios'
// import fetch from 'node-fetch'
import { NowRequest, NowResponse } from '@now/node'

export default async (req: NowRequest, res: NowResponse) => {
  const fileKey = 'cRvu7bwRRC0zleOvtlTgmkOu'
  const nodeId = req.query.id as string
  const { data } = await axios.get(
    `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}`,
    {
      headers: {
        'X-FIGMA-TOKEN': '16589-0a2b0c5a-8d30-4fab-9c04-8ad94ce692fc',
      },
    }
  )
  const imageUrl = data['images'][nodeId]

  console.log(data)

  const image = await axios.get(imageUrl, { responseType: 'arraybuffer' })

  res.statusCode = 200
  res.setHeader('Content-Type', `image/png`)
  res.setHeader(
    'Cache-Control',
    `public, immutable, no-transform, s-maxage=30, max-age=30`
  )
  res.end(image.data)
}
