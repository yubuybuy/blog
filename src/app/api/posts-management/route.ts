// 文章管理API - 获取文章列表用于管理界面 - 受 JWT 认证保护
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { authenticateRequest } from '@/lib/auth';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN!
});

// 获取所有文章（包括管理所需的详细信息）
export async function GET(request: NextRequest) {
  // 🔒 验证 JWT 认证
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 401 }
    );
  }

  try {
    const posts = await sanityClient.fetch(`
      *[_type == "post" && !defined(deleted)] | order(publishedAt desc) {
        _id,
        title,
        excerpt,
        publishedAt,
        _updatedAt,
        categories[]->{
          title,
          slug
        }
      }
    `);

    return NextResponse.json({
      success: true,
      posts: posts || [],
      count: posts?.length || 0
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取文章列表失败'
    }, { status: 500 });
  }
}

// 获取文章统计信息
export async function POST(request: NextRequest) {
  // 🔒 验证 JWT 认证
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 401 }
    );
  }

  try {
    const { action } = await request.json();

    if (action === 'stats') {
      // 获取统计信息
      const [totalPosts, deletedPosts, recentPosts] = await Promise.all([
        sanityClient.fetch(`count(*[_type == "post" && !defined(deleted)])`),
        sanityClient.fetch(`count(*[_type == "post" && deleted == true])`),
        sanityClient.fetch(`count(*[_type == "post" && !defined(deleted) && publishedAt > dateTime(now()) - 86400*7])`) // 一周内
      ]);

      return NextResponse.json({
        success: true,
        stats: {
          total: totalPosts,
          deleted: deletedPosts,
          recent: recentPosts
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: '无效的操作'
    }, { status: 400 });

  } catch (error) {
    console.error('文章统计失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取统计信息失败'
    }, { status: 500 });
  }
}