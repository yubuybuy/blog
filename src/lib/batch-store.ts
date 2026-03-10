/**
 * 批量任务存储模块 - 使用 Sanity 作为后端存储
 * 解决 Vercel serverless 中不同 API 路由无法共享文件系统的问题
 */

import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
});

const JOB_DOC_ID = 'batchJob.current';

export interface BatchItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  downloadLink?: string;
  files: string[];
  tags: string[];
  status: 'pending' | 'generating' | 'completed' | 'skipped' | 'error';
  result?: unknown;
  error?: string;
  skippedReason?: string;
}

export interface BatchJob {
  token: string;
  stopped: boolean;
  processing: boolean;
  createdAt: string;
  settings: {
    generateOnly?: boolean;
    contentTemplate?: string;
    autoPublishDelay?: number;
  };
  resources: BatchItem[];
}

export async function readJob(): Promise<BatchJob | null> {
  try {
    const doc = await sanityClient.fetch(
      `*[_id == $id][0]`,
      { id: JOB_DOC_ID }
    );
    if (!doc) return null;
    return {
      token: doc.token || '',
      stopped: doc.stopped || false,
      processing: doc.processing || false,
      createdAt: doc.createdAt || '',
      settings: doc.settings || {},
      resources: doc.resources || [],
    };
  } catch (error) {
    console.error('[batch-store] readJob error:', error);
    return null;
  }
}

export async function writeJob(job: BatchJob): Promise<void> {
  try {
    await sanityClient.createOrReplace({
      _id: JOB_DOC_ID,
      _type: 'batchJob',
      token: job.token,
      stopped: job.stopped,
      processing: job.processing,
      createdAt: job.createdAt,
      settings: job.settings,
      resources: job.resources,
    });
  } catch (error) {
    console.error('[batch-store] writeJob error:', error);
    throw error;
  }
}

export async function deleteJob(): Promise<void> {
  try {
    await sanityClient.delete(JOB_DOC_ID);
  } catch (error) {
    console.error('[batch-store] deleteJob error:', error);
  }
}

export function getProgress(job: BatchJob) {
  const resources = job.resources || [];
  return {
    total: resources.length,
    pending: resources.filter(r => r.status === 'pending').length,
    generating: resources.filter(r => r.status === 'generating').length,
    completed: resources.filter(r => r.status === 'completed').length,
    skipped: resources.filter(r => r.status === 'skipped').length,
    error: resources.filter(r => r.status === 'error').length,
  };
}
