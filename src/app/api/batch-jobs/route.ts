/**
 * 批量任务持久化 API
 * 使用 Sanity 存储，确保在 Vercel serverless 环境下跨函数共享状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { readJob, writeJob, deleteJob } from '@/lib/batch-store';

// GET - 读取当前批量任务状态
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const job = await readJob();
  if (!job) {
    return NextResponse.json({ exists: false });
  }

  const resources = job.resources || [];
  return NextResponse.json({
    exists: true,
    job: {
      id: 'current',
      createdAt: job.createdAt,
      settings: job.settings,
      stopped: job.stopped || false,
      processing: job.processing || false,
      total: resources.length,
      pending: resources.filter(r => r.status === 'pending').length,
      completed: resources.filter(r => r.status === 'completed').length,
      error: resources.filter(r => r.status === 'error').length,
      skipped: resources.filter(r => r.status === 'skipped').length,
    },
    resources,
  });
}

// POST - 创建或更新批量任务
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === 'create') {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    await writeJob({
      token,
      stopped: false,
      processing: false,
      createdAt: new Date().toISOString(),
      settings: body.settings || {},
      resources: body.resources || [],
    });
    return NextResponse.json({ success: true, id: 'current' });
  }

  if (action === 'update-item') {
    const job = await readJob();
    if (!job) {
      return NextResponse.json({ error: '无活跃任务' }, { status: 404 });
    }
    const { itemId, status, result, error, skippedReason } = body;
    const idx = job.resources.findIndex(r => r.id === itemId);
    if (idx === -1) {
      return NextResponse.json({ error: '资源不存在' }, { status: 404 });
    }
    job.resources[idx].status = status;
    if (result) job.resources[idx].result = result;
    if (error) job.resources[idx].error = error;
    if (skippedReason) job.resources[idx].skippedReason = skippedReason;
    await writeJob(job);
    return NextResponse.json({ success: true });
  }

  if (action === 'stop') {
    const job = await readJob();
    if (!job) {
      return NextResponse.json({ error: '无活跃任务' }, { status: 404 });
    }
    job.stopped = true;
    job.processing = false;
    await writeJob(job);
    return NextResponse.json({ success: true, message: '已发送停止信号' });
  }

  if (action === 'resume') {
    const job = await readJob();
    if (!job) {
      return NextResponse.json({ error: '无活跃任务' }, { status: 404 });
    }
    const authHeader = request.headers.get('authorization') || '';
    job.token = authHeader.replace('Bearer ', '');
    job.stopped = false;
    for (const r of job.resources) {
      if (r.status === 'generating') r.status = 'pending';
    }
    await writeJob(job);
    return NextResponse.json({ success: true });
  }

  if (action === 'retry-errors') {
    const job = await readJob();
    if (!job) {
      return NextResponse.json({ error: '无活跃任务' }, { status: 404 });
    }
    let count = 0;
    for (const r of job.resources) {
      if (r.status === 'error') {
        r.status = 'pending';
        r.error = undefined;
        count++;
      }
    }
    job.stopped = false;
    await writeJob(job);
    return NextResponse.json({ success: true, resetCount: count });
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 });
}

// DELETE - 清除批量任务
export async function DELETE(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  await deleteJob();
  return NextResponse.json({ success: true });
}
