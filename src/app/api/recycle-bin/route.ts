// 回收站功能 API - 受 JWT 认证保护
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

// 获取回收站内容
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
    const recycleBinItems = await sanityClient.fetch(`
      *[_type == "post" && deleted == true] | order(_updatedAt desc) {
        _id,
        title,
        excerpt,
        publishedAt,
        deletedAt,
        _updatedAt
      }
    `);

    return NextResponse.json({
      success: true,
      items: recycleBinItems,
      count: recycleBinItems.length
    });
  } catch (error) {
    console.error('获取回收站失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取回收站内容失败'
    }, { status: 500 });
  }
}

// 软删除文章（移动到回收站）
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
    const { postId, action } = await request.json();

    if (action === 'soft_delete') {
      // 软删除：标记为已删除，不真正删除
      await sanityClient
        .patch(postId)
        .set({
          deleted: true,
          deletedAt: new Date().toISOString()
        })
        .commit();

      return NextResponse.json({
        success: true,
        message: '文章已移动到回收站'
      });

    } else if (action === 'restore') {
      // 恢复文章：移除删除标记
      await sanityClient
        .patch(postId)
        .unset(['deleted', 'deletedAt'])
        .commit();

      return NextResponse.json({
        success: true,
        message: '文章已恢复'
      });

    } else if (action === 'permanent_delete') {
      // 永久删除：真正删除文档
      await sanityClient.delete(postId);

      return NextResponse.json({
        success: true,
        message: '文章已永久删除'
      });

    } else {
      return NextResponse.json({
        success: false,
        error: '无效的操作'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('回收站操作失败:', error);
    return NextResponse.json({
      success: false,
      error: '操作失败'
    }, { status: 500 });
  }
}

// 清空回收站
export async function DELETE(request: NextRequest) {
  // 🔒 验证 JWT 认证
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 401 }
    );
  }

  try {
    // 获取所有已删除的文章
    const deletedPosts = await sanityClient.fetch(`*[_type == "post" && deleted == true] {_id}`);

    // 永久删除所有回收站中的文章
    for (const post of deletedPosts) {
      await sanityClient.delete(post._id);
    }

    return NextResponse.json({
      success: true,
      message: `已永久删除 ${deletedPosts.length} 篇文章`
    });
  } catch (error) {
    console.error('清空回收站失败:', error);
    return NextResponse.json({
      success: false,
      error: '清空回收站失败'
    }, { status: 500 });
  }
}