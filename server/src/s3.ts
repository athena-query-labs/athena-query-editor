import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export function parseS3Url(url: string) {
  if (!url.startsWith('s3://')) {
    throw new Error('Invalid S3 URL')
  }
  const without = url.slice(5)
  const [bucket, ...rest] = without.split('/')
  const key = rest.join('/')
  return { bucket, key }
}

export async function objectExists(client: S3Client, bucket: string, key: string) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404) {
      return false
    }
    if (err?.name === 'NotFound') {
      return false
    }
    throw err
  }
}

export async function presignGetObject(
  client: S3Client,
  bucket: string,
  key: string,
  expiresInSeconds: number,
  filename: string
) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  })
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}
