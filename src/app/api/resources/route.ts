/**
 * 资源管理API接口
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RESOURCES_FILE = path.join(process.cwd(), 'resources-database.json');

// 确保文件存在
function ensureFile() {
  if (!fs.existsSync(RESOURCES_FILE)) {
    fs.writeFileSync(RESOURCES_FILE, JSON.stringify([]));
  }
}

// 读取资源
function readResources() {
  ensureFile();
  const data = fs.readFileSync(RESOURCES_FILE, 'utf8');
  return JSON.parse(data);
}

// 写入资源
function writeResources(resources: Array<Record<string, unknown>>) {
  fs.writeFileSync(RESOURCES_FILE, JSON.stringify(resources, null, 2));
}

// GET - 获取所有资源
export async function GET() {
  try {
    const resources = readResources();
    return NextResponse.json(resources);
  } catch (error) {
    return NextResponse.json({ error: '读取失败' }, { status: 500 });
  }
}

// POST - 添加新资源
export async function POST(request: NextRequest) {
  try {
    const newResource = await request.json();
    const resources = readResources();
    resources.unshift(newResource); // 添加到开头
    writeResources(resources);
    return NextResponse.json({ success: true, resource: newResource });
  } catch (error) {
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}

// PATCH - 更新资源
export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    const resources = readResources();
    const index = resources.findIndex((r: Record<string, unknown>) => r.id === id);

    if (index === -1) {
      return NextResponse.json({ error: '资源不存在' }, { status: 404 });
    }

    resources[index] = { ...resources[index], ...updates };
    writeResources(resources);
    return NextResponse.json({ success: true, resource: resources[index] });
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE - 删除资源
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少ID参数' }, { status: 400 });
    }

    const resources = readResources();
    const filtered = resources.filter((r: Record<string, unknown>) => r.id !== id);
    writeResources(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
