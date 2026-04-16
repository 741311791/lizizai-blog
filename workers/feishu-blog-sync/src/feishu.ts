/**
 * 飞书 API 客户端
 */

const FEISHU_BASE_URL = 'https://open.feishu.cn/open-apis';

export interface FeishuFile {
  name: string;
  token: string;
  type: string;
  created_time: string;
  modified_time: string;
}

export interface FeishuBlock {
  block_id: string;
  block_type: number;
  parent_id?: string;
  children?: string[];
  [key: string]: any;
}

export class FeishuClient {
  private appId: string;
  private appSecret: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  /**
   * 获取 tenant_access_token
   */
  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const res = await fetch(`${FEISHU_BASE_URL}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: this.appId,
        app_secret: this.appSecret,
      }),
    });

    const data = await res.json() as any;
    if (data.code !== 0) {
      throw new Error(`Failed to get token: ${data.msg}`);
    }

    this.token = data.tenant_access_token;
    this.tokenExpiry = Date.now() + (data.expire - 300) * 1000;
    return this.token;
  }

  /**
   * 列出文件夹中的所有文件
   */
  async listFiles(folderToken: string): Promise<FeishuFile[]> {
    const token = await this.getToken();
    const files: FeishuFile[] = [];
    let pageToken: string | null = null;

    do {
      const url = new URL(`${FEISHU_BASE_URL}/drive/v1/files`);
      url.searchParams.set('folder_token', folderToken);
      url.searchParams.set('page_size', '50');
      if (pageToken) url.searchParams.set('page_token', pageToken);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json() as any;
      if (data.code !== 0) {
        throw new Error(`Failed to list files: ${data.msg}`);
      }

      files.push(...(data.data?.files || []));
      pageToken = data.data?.next_page_token || null;
    } while (pageToken);

    return files;
  }

  /**
   * 获取文档的所有 blocks
   */
  async getDocumentBlocks(documentId: string): Promise<FeishuBlock[]> {
    const token = await this.getToken();
    const blocks: FeishuBlock[] = [];
    let pageToken: string | null = null;

    do {
      const url = new URL(`${FEISHU_BASE_URL}/docx/v1/documents/${documentId}/blocks`);
      url.searchParams.set('page_size', '500');
      if (pageToken) url.searchParams.set('page_token', pageToken);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json() as any;
      if (data.code !== 0) {
        throw new Error(`Failed to get blocks: ${data.msg}`);
      }

      blocks.push(...(data.data?.items || []));
      pageToken = data.data?.page_token || null;
    } while (pageToken);

    return blocks;
  }

  /**
   * 获取文档基本信息
   */
  async getDocumentInfo(documentId: string): Promise<{ title: string; created_time?: string; modified_time?: string }> {
    const token = await this.getToken();

    const res = await fetch(`${FEISHU_BASE_URL}/docx/v1/documents/${documentId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await res.json() as any;
    if (data.code !== 0) {
      throw new Error(`Failed to get document info: ${data.msg}`);
    }

    return {
      title: data.data?.document?.title || '',
    };
  }

  /**
   * 下载图片
   */
  async downloadImage(imageToken: string): Promise<ArrayBuffer> {
    const token = await this.getToken();

    const res = await fetch(`${FEISHU_BASE_URL}/drive/v1/medias/batch_get_download_url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_tokens: [imageToken],
      }),
    });

    const data = await res.json() as any;
    if (data.code !== 0 || !data.data?.download_urls?.[0]?.download_url) {
      throw new Error(`Failed to get image URL: ${data.msg}`);
    }

    const downloadUrl = data.data.download_urls[0].download_url;
    const imageRes = await fetch(downloadUrl);
    return await imageRes.arrayBuffer();
  }
}
