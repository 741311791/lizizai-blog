/**
 * S3 兼容的 R2 客户端
 *
 * 提供与 Cloudflare R2Bucket 接口一致的方法签名，
 * 使 sync.ts 无需修改即可在 GitHub Actions（Node.js）环境中运行。
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

export class R2Client {
  private s3: S3Client;
  private bucket: string;

  constructor(config: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
  }) {
    this.s3 = new S3Client({
      endpoint: config.endpoint,
      region: 'auto',
      // R2 使用 path-style 寻址（bucket 在路径中，而非子域名）
      forcePathStyle: false,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucket = config.bucket;
  }

  async get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null> {
    try {
      const resp = await this.s3.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      if (!resp.Body) return null;
      // AWS SDK v3 Body 是 ReadableStream，转为 ArrayBuffer
      const bytes = await resp.Body.transformToByteArray();
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      return {
        arrayBuffer: async () => buffer,
      };
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async put(
    key: string,
    value: ArrayBuffer | string,
    options?: { httpMetadata?: { contentType: string } },
  ): Promise<void> {
    const body = typeof value === 'string' ? new TextEncoder().encode(value) : value;
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: options?.httpMetadata?.contentType,
    }));
  }

  async list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{
    objects: { key: string }[];
    truncated: boolean;
    cursor?: string;
  }> {
    const resp = await this.s3.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: options?.prefix,
      MaxKeys: options?.limit,
      ContinuationToken: options?.cursor,
    }));

    return {
      objects: (resp.Contents || []).map(obj => ({ key: obj.Key! })),
      truncated: resp.IsTruncated || false,
      cursor: resp.NextContinuationToken,
    };
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }
}
