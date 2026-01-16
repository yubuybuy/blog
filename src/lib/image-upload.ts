// 图片上传到Sanity的工具函数
// 文件路径: src/lib/image-upload.ts

import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN?.trim()
});

// Sanity 图片类型定义
interface SanityImageAsset {
  _type: 'image';
  asset: {
    _type: 'reference';
    _ref: string;
  };
  alt: string;
  customUrl?: string;
}

// 备选图片类型（URL方式）
interface SanityImageUrl {
  _type: 'image';
  customUrl: string;
  alt: string;
  asset?: {
    _type: 'reference';
    _ref: string;
  };
}

// 从URL下载图片并上传到Sanity
export async function uploadImageToSanity(imageUrl: string, filename: string): Promise<SanityImageAsset | null> {
  try {
    console.log('📥 开始下载图片:', imageUrl);

    // 下载图片
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    console.log('📤 开始上传到Sanity，文件大小:', buffer.length, 'bytes');

    // 上传到Sanity
    const asset = await sanityClient.assets.upload('image', buffer, {
      filename: filename,
      contentType: response.headers.get('content-type') || 'image/jpeg'
    });

    console.log('✅ 图片上传成功:', asset._id);

    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id
      },
      alt: `电影海报 - ${filename}`,
      customUrl: imageUrl // 保留原始URL作为备份
    };

  } catch (error) {
    console.error('❌ 图片上传失败:', error);
    return null;
  }
}

// 处理电影海报：优先上传到Sanity，失败时使用URL
export async function processMoviePoster(imageUrl: string, movieTitle: string): Promise<SanityImageAsset | SanityImageUrl | null> {
  if (!imageUrl) {
    return null;
  }

  const filename = `${movieTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-${Date.now()}.jpg`;

  // 尝试上传到Sanity
  const sanityImage = await uploadImageToSanity(imageUrl, filename);

  if (sanityImage) {
    console.log('✅ 使用Sanity托管的图片');
    return sanityImage;
  } else {
    console.log('⚠️ Sanity上传失败，使用URL备选方案');
    // 如果上传失败，回退到URL方式
    return {
      _type: 'image',
      customUrl: imageUrl,
      alt: `电影海报 - ${movieTitle}`
    } as SanityImageUrl;
  }
}