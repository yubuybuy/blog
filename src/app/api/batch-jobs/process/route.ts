/**
 * 服务端批量处理 API
 * 每次调用处理一个待处理项，处理完后自动触发下一个
 * 使用 Sanity 存储状态，确保 Vercel serverless 环境下可靠运行
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { readJob, writeJob, getProgress, type BatchJob, type BatchItem } from '@/lib/batch-store';

// Vercel Pro 最大运行时间
export const maxDuration = 300;

// 带重试的 generate-content 调用
async function generateWithRetry(
  baseUrl: string,
  item: BatchItem,
  job: BatchJob,
  maxRetries = 3,
  retryDelayMs = 5000,
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/api/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${job.token}`,
          'User-Agent': 'BatchProcessor/1.0',
          'Referer': baseUrl + '/',
        },
        body: JSON.stringify({
          resource: {
            title: item.title,
            category: item.category,
            description: item.description || '',
            downloadLink: item.downloadLink || '',
            files: item.files || [],
            tags: item.tags || [],
          },
          generateOnly: job.settings.generateOnly || false,
          template: job.settings.contentTemplate || 'movieReview',
        }),
      });

      if (response.status === 503 && attempt < maxRetries) {
        console.log(`[batch] 503, retry ${attempt}/${maxRetries}: ${item.title}`);
        await new Promise(r => setTimeout(r, retryDelayMs));
        continue;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as Record<string, string>).error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data as Record<string, unknown> };
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
      console.log(`[batch] error, retry ${attempt}/${maxRetries}: ${item.title}`);
      await new Promise(r => setTimeout(r, retryDelayMs));
    }
  }
  return { success: false, error: '重试次数已用完' };
}

// POST - 开始/继续处理
export async function POST(request: NextRequest) {
  // 验证身份：JWT 或 batch token
  const batchToken = request.headers.get('x-batch-token');
  const job = await readJob();

  if (!job) {
    return NextResponse.json({ error: '没有活跃的批量任务' }, { status: 404 });
  }

  let authenticated = false;
  if (batchToken && batchToken === job.token) {
    authenticated = true;
  } else {
    const auth = authenticateRequest(request);
    if (auth.authenticated) authenticated = true;
  }

  if (!authenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  // 检查是否已停止
  if (job.stopped) {
    job.processing = false;
    await writeJob(job);
    return NextResponse.json({ status: 'stopped', progress: getProgress(job) });
  }

  // 检查是否已在处理中（防止并发）
  const generating = job.resources.find(r => r.status === 'generating');
  if (generating) {
    return NextResponse.json({ status: 'already_processing', progress: getProgress(job) });
  }

  // 找到下一个待处理项
  const nextItem = job.resources.find(r => r.status === 'pending');
  if (!nextItem) {
    job.processing = false;
    await writeJob(job);
    return NextResponse.json({ status: 'completed', progress: getProgress(job) });
  }

  // 标记为处理中
  job.processing = true;
  nextItem.status = 'generating';
  await writeJob(job);

  const baseUrl = new URL(request.url).origin;

  // 处理该项
  console.log(`[batch] processing: ${nextItem.title}`);
  const result = await generateWithRetry(baseUrl, nextItem, job);

  // 重新读取 job（可能被 stop 修改了）
  const freshJob = await readJob();
  if (!freshJob) {
    return NextResponse.json({ error: '任务已被删除' }, { status: 404 });
  }

  // 更新该项状态
  const itemIdx = freshJob.resources.findIndex(r => r.id === nextItem.id);
  if (itemIdx !== -1) {
    if (result.success && result.data) {
      if (result.data.skipped) {
        freshJob.resources[itemIdx].status = 'skipped';
        freshJob.resources[itemIdx].skippedReason = (result.data.message as string) || '已存在';
      } else {
        freshJob.resources[itemIdx].status = 'completed';
        freshJob.resources[itemIdx].result = result.data.content;
      }
    } else {
      freshJob.resources[itemIdx].status = 'error';
      freshJob.resources[itemIdx].error = result.error || '未知错误';
    }
  }
  await writeJob(freshJob);

  // 检查是否还有待处理项且未被停止
  const pendingCount = freshJob.resources.filter(r => r.status === 'pending').length;
  const shouldContinue = pendingCount > 0 && !freshJob.stopped;

  if (shouldContinue) {
    // 延迟（如果设置了）
    const delay = freshJob.settings.autoPublishDelay || 0;
    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay * 1000));
    }

    // 自触发下一个处理（fire-and-forget）
    console.log(`[batch] triggering next item (${pendingCount} remaining)`);
    fetch(`${baseUrl}/api/batch-jobs/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-batch-token': freshJob.token,
        'User-Agent': 'BatchProcessor/1.0',
      },
    }).catch(async () => {
      console.log('[batch] self-trigger failed');
      const j = await readJob();
      if (j) { j.processing = false; await writeJob(j); }
    });
  } else {
    freshJob.processing = false;
    await writeJob(freshJob);
  }

  return NextResponse.json({
    status: shouldContinue ? 'processing' : (pendingCount === 0 ? 'completed' : 'stopped'),
    processed: nextItem.title,
    progress: getProgress(freshJob),
  });
}

// GET - 查询处理状态
export async function GET(request: NextRequest) {
  const batchToken = request.headers.get('x-batch-token');
  const job = await readJob();

  if (!job) {
    return NextResponse.json({ exists: false });
  }

  let authenticated = false;
  if (batchToken && batchToken === job.token) {
    authenticated = true;
  } else {
    const auth = authenticateRequest(request);
    if (auth.authenticated) authenticated = true;
  }

  if (!authenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  return NextResponse.json({
    exists: true,
    status: job.stopped ? 'stopped' : (job.processing ? 'processing' : 'idle'),
    progress: getProgress(job),
  });
}
