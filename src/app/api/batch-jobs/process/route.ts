/**
 * 服务端批量处理 API
 * 在时间预算内循环处理多个待处理项
 * 由客户端轮询触发或 Vercel Cron 触发，不自调用（避免 508 Loop Detected）
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { readJob, writeJob, getProgress, type BatchJob, type BatchItem } from '@/lib/batch-store';

// Vercel 最大运行时间
export const maxDuration = 300;

// 时间预算：留 10 秒余量
const TIME_BUDGET_MS = 55000;

// 带重试的 generate-content 调用
async function generateOne(
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

// POST - 处理待处理项（循环直到时间预算用完）
export async function POST(request: NextRequest) {
  // 验证身份
  const batchToken = request.headers.get('x-batch-token');
  let job = await readJob();

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

  // 已停止
  if (job.stopped) {
    return NextResponse.json({ status: 'stopped', progress: getProgress(job) });
  }

  // 防止并发：如果已有处理在进行中，跳过
  if (job.processing) {
    return NextResponse.json({ status: 'already_processing', progress: getProgress(job) });
  }

  // 没有待处理项
  const hasPending = job.resources.some(r => r.status === 'pending');
  if (!hasPending) {
    return NextResponse.json({ status: 'completed', progress: getProgress(job) });
  }

  // 标记为处理中
  job.processing = true;
  await writeJob(job);

  const baseUrl = new URL(request.url).origin;
  const startTime = Date.now();
  let processedCount = 0;

  // 循环处理，直到时间预算用完或全部完成
  while (Date.now() - startTime < TIME_BUDGET_MS) {
    // 每次迭代重新读取 job（检查 stop 信号）
    job = await readJob();
    if (!job || job.stopped) break;

    // 找下一个待处理项
    const nextItem = job.resources.find(r => r.status === 'pending');
    if (!nextItem) break;

    // 标记为生成中
    nextItem.status = 'generating';
    await writeJob(job);

    console.log(`[batch] processing (${processedCount + 1}): ${nextItem.title}`);
    const result = await generateOne(baseUrl, nextItem, job);

    // 重新读取 job 更新状态
    job = await readJob();
    if (!job) break;

    const itemIdx = job.resources.findIndex(r => r.id === nextItem.id);
    if (itemIdx !== -1) {
      if (result.success && result.data) {
        if (result.data.skipped) {
          job.resources[itemIdx].status = 'skipped';
          job.resources[itemIdx].skippedReason = (result.data.message as string) || '已存在';
        } else {
          job.resources[itemIdx].status = 'completed';
          // 不存 result 到 Sanity（太大），只标记状态
        }
      } else {
        job.resources[itemIdx].status = 'error';
        job.resources[itemIdx].error = result.error || '未知错误';
      }
    }
    await writeJob(job);
    processedCount++;

    // 发布间隔
    const delay = job.settings.autoPublishDelay || 0;
    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay * 1000));
    }
  }

  // 标记处理结束
  const finalJob = await readJob();
  if (finalJob) {
    finalJob.processing = false;
    await writeJob(finalJob);
    const progress = getProgress(finalJob);
    return NextResponse.json({
      status: progress.pending > 0 ? 'paused' : 'completed',
      processed: processedCount,
      elapsed: Date.now() - startTime,
      progress,
    });
  }

  return NextResponse.json({ status: 'completed', processed: processedCount });
}

// GET - Vercel Cron 触发入口 + 状态查询
export async function GET(request: NextRequest) {
  const job = await readJob();
  if (!job) {
    return NextResponse.json({ exists: false });
  }

  const progress = getProgress(job);

  // 检查是否是 Cron 触发（有待处理项且未在运行中）
  const isCron = request.headers.get('x-vercel-cron') === '1' ||
                 request.nextUrl.searchParams.get('cron') === '1';

  if (isCron && progress.pending > 0 && !job.stopped && !job.processing) {
    // Cron 触发：直接在当前请求中处理
    const baseUrl = new URL(request.url).origin;
    console.log(`[batch-cron] triggering processing, ${progress.pending} pending`);

    // 标记为处理中
    job.processing = true;
    await writeJob(job);

    const startTime = Date.now();
    let processedCount = 0;
    let currentJob: BatchJob | null = job;

    while (Date.now() - startTime < TIME_BUDGET_MS) {
      currentJob = await readJob();
      if (!currentJob || currentJob.stopped) break;

      const nextItem = currentJob.resources.find(r => r.status === 'pending');
      if (!nextItem) break;

      nextItem.status = 'generating';
      await writeJob(currentJob);

      const result = await generateOne(baseUrl, nextItem, currentJob);

      currentJob = await readJob();
      if (!currentJob) break;

      const idx = currentJob.resources.findIndex(r => r.id === nextItem.id);
      if (idx !== -1) {
        if (result.success && result.data) {
          if (result.data.skipped) {
            currentJob.resources[idx].status = 'skipped';
            currentJob.resources[idx].skippedReason = (result.data.message as string) || '已存在';
          } else {
            currentJob.resources[idx].status = 'completed';
          }
        } else {
          currentJob.resources[idx].status = 'error';
          currentJob.resources[idx].error = result.error || '未知错误';
        }
      }
      await writeJob(currentJob);
      processedCount++;

      const delay = currentJob.settings.autoPublishDelay || 0;
      if (delay > 0) await new Promise(r => setTimeout(r, delay * 1000));
    }

    const doneJob = await readJob();
    if (doneJob) {
      doneJob.processing = false;
      await writeJob(doneJob);
    }

    return NextResponse.json({
      cron: true,
      processed: processedCount,
      progress: doneJob ? getProgress(doneJob) : progress,
    });
  }

  // 普通状态查询
  // 验证身份
  const batchToken = request.headers.get('x-batch-token');
  let authenticated = false;
  if (batchToken && batchToken === job.token) authenticated = true;
  else {
    const auth = authenticateRequest(request);
    if (auth.authenticated) authenticated = true;
  }

  if (!authenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  return NextResponse.json({
    exists: true,
    status: job.stopped ? 'stopped' : (job.processing ? 'processing' : 'idle'),
    progress,
  });
}
