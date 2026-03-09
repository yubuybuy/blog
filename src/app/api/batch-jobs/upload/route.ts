/**
 * 文件上传解析 API
 * 支持 CSV 和 Excel (.xlsx/.xls) 文件，支持行范围选择
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

interface ParsedResource {
  id: string;
  title: string;
  category: string;
  description: string;
  downloadLink: string;
  files: string[];
  tags: string[];
  status: 'pending';
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const startRow = parseInt(formData.get('startRow') as string || '1', 10);
    const endRow = parseInt(formData.get('endRow') as string || '0', 10);

    if (!file) {
      return NextResponse.json({ error: '未上传文件' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();

    let rows: string[][] = [];

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Excel 解析（使用轻量级 read-excel-file）
      const readXlsxFile = (await import('read-excel-file/node')).default;
      const raw = await readXlsxFile(buffer);
      rows = raw.map(row => row.map(cell => String(cell ?? '').trim()));
    } else {
      // CSV 解析
      const text = buffer.toString('utf-8').replace(/^\uFEFF/, ''); // 去 BOM
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      rows = lines.map(line => parseCSVLine(line));
    }

    if (rows.length < 2) {
      return NextResponse.json({ error: '文件内容为空或只有表头' }, { status: 400 });
    }

    // 第一行是表头，检测列顺序
    const header = rows[0].map(h => h.toLowerCase().replace(/\s/g, ''));
    const colMap = detectColumns(header);

    // 数据行（跳过表头）
    let dataRows = rows.slice(1);

    // 应用行范围（基于数据行，不含表头。1=第一条数据）
    const start = Math.max(1, startRow) - 1;
    const end = endRow > 0 ? endRow : dataRows.length;
    dataRows = dataRows.slice(start, end);

    const resources: ParsedResource[] = dataRows
      .map((values, index) => {
        const title = values[colMap.title] || '';
        if (!title) return null;

        const tagsRaw = values[colMap.tags] || '';
        const tags = tagsRaw.includes('|')
          ? tagsRaw.split('|').map(t => t.trim()).filter(Boolean)
          : tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

        return {
          id: `batch-${Date.now()}-${start + index}`,
          title,
          category: values[colMap.category] || '电影',
          description: values[colMap.description] || '',
          downloadLink: values[colMap.downloadLink] || '',
          files: [] as string[],
          tags,
          status: 'pending' as const,
        };
      })
      .filter((r): r is ParsedResource => r !== null);

    return NextResponse.json({
      success: true,
      totalRows: rows.length - 1,
      selectedRange: { start: start + 1, end: Math.min(end, rows.length - 1) },
      resources,
    });
  } catch (error) {
    console.error('文件解析错误:', error);
    return NextResponse.json({
      error: '文件解析失败',
      details: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

// 检测列映射（兼容各种表头命名）
function detectColumns(header: string[]): Record<string, number> {
  const map: Record<string, number> = { title: 0, category: 1, description: 2, downloadLink: 3, tags: 4 };

  for (let i = 0; i < header.length; i++) {
    const h = header[i];
    if (h.includes('标题') || h.includes('title') || h.includes('片名') || h.includes('名称')) map.title = i;
    else if (h.includes('分类') || h.includes('category') || h.includes('类别')) map.category = i;
    else if (h.includes('描述') || h.includes('description') || h.includes('简介') || h.includes('说明')) map.description = i;
    else if (h.includes('链接') || h.includes('link') || h.includes('url') || h.includes('网盘')) map.downloadLink = i;
    else if (h.includes('标签') || h.includes('tag')) map.tags = i;
  }

  return map;
}

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else current += char;
  }
  result.push(current.trim());
  return result;
}
