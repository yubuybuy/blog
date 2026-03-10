/**
 * 批量任务持久化 API
 * 保存/读取/清除批量生成任务进度，支持断点续传
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { authenticateRequest } from '@/lib/auth';

const BATCH_FILE = path.join(process.cwd(), 'batch-job.json');

function readJob() {
  if (!fs.existsSync(BATCH_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(BATCH_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeJob(data: unknown) {
  fs.writeFileSync(BATCH_FILE, JSON.stringify(data, null, 2));
}

// GET - 读取当前批量任务状态
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const job = readJob();
  if (!job) {
    return NextResponse.json({ exists: false });
  }

  const resources = job.resources || [];
  return NextResponse.json({
    exists: true,
    job: {
      id: job.id,
      createdAt: job.createdAt,
      settings: job.settings,
      stopped: job.stopped || false,
      processing: job.processing || false,
      total: resources.length,
      pending: resources.filter((r: { status: string }) => r.status === 'pending').length,
      completed: resources.filter((r: { status: string }) => r.status === 'completed').length,
      error: resources.filter((r: { status: string }) => r.status === 'error').length,
      skipped: resources.filter((r: { status: string }) => r.status === 'skipped').length,
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
    // 从请求头获取 JWT token 并保存（用于服务端自调用）
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    const job = {
      id: `batch-${Date.now()}`,
      createdAt: new Date().toISOString(),
      token, // 存储 token 用于服务端处理链自调用
      stopped: false,
      processing: false,
      settings: body.settings || {},
      resources: body.resources || [],
    };
    writeJob(job);
    return NextResponse.json({ success: true, id: job.id });
  }

  if (action === 'update-item') {
    const job = readJob();
    if (!job) {
      return NextResponse.json({ error: '无活跃任务' }, { status: 404 });
    }
    const { itemId, status, result, error, skippedReason } = body;
    const idx = job.resources.findIndex((r: { id: string }) => r.id === itemId);
    if (idx === -1) {
      return NextResponse.json({ error: '资源不存在' }, { status: 404 });
    }
    job.resources[idx].status = status;
    if (result) job.resources[idx].result = result;
    if (error) job.resources[idx].error = error;
    if (skippedReason) job.resources[idx].skippedReason = skippedReason;
    writeJob(job);
    return NextResponse.json({ success: true });
  }

  if (action === 'stop') {
    const job = readJob();
    if (!job) {
      return NextResponse.json({ error: '无活跃任务' }, { status: 404 });
    }
    job.stopped = true;
    job.processing = false;
    writeJob(job);
    return NextResponse.json({ success: true, message: '已发送停止信号' });
  }

  if (action === 'resume') {
    const job = readJob();
    if (!job) {
      return NextResponse.json({ error: '无活跃任务' }, { status: 404 });
    }
    // 更新 token（可能已过期）
    const authHeader = request.headers.get('authorization') || '';
    job.token = authHeader.replace('Bearer ', '');
    job.stopped = false;
    // 将 generating 状态重置为 pending（之前中断的）
    for (const r of job.resources) {
      if (r.status === 'generating') r.status = 'pending';
    }
    writeJob(job);
    return NextResponse.json({ success: true });
  }

  if (action === 'retry-errors') {
    const job = readJob();
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
    writeJob(job);
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

  if (fs.existsSync(BATCH_FILE)) {
    fs.unlinkSync(BATCH_FILE);
  }
  return NextResponse.json({ success: true });
}
