// Telegram网盘转存管理API
import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { spawn } from 'child_process';
import path from 'path';

// 数据库连接
const DB_PATH = path.join(process.cwd(), 'data', 'netdisk_links.db');

interface NetdiskLink {
  id: number;
  platform: string;
  url: string;
  password: string;
  title: string;
  chat_id: number;
  message_id: number;
  user_id: number;
  username: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

// 获取网盘链接列表
async function getLinks(
  status?: string,
  platform?: string,
  limit: number = 50,
  offset: number = 0
): Promise<NetdiskLink[]> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    let query = `
      SELECT * FROM netdisk_links
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (platform) {
      query += ` AND platform = ?`;
      params.push(platform);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
      db.close();
      if (err) {
        reject(err);
      } else {
        resolve(rows as NetdiskLink[]);
      }
    });
  });
}

// 获取统计信息
async function getStats(): Promise<any> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    const queries = [
      `SELECT COUNT(*) as total FROM netdisk_links`,
      `SELECT COUNT(*) as pending FROM netdisk_links WHERE status = 'pending'`,
      `SELECT COUNT(*) as completed FROM netdisk_links WHERE status = 'completed'`,
      `SELECT COUNT(*) as failed FROM netdisk_links WHERE status = 'failed'`,
      `SELECT platform, COUNT(*) as count FROM netdisk_links GROUP BY platform`,
    ];

    const results: any = {};

    Promise.all(
      queries.map((query, index) => {
        return new Promise((resolve, reject) => {
          if (index < 4) {
            db.get(query, (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          } else {
            db.all(query, (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          }
        });
      })
    ).then((queryResults) => {
      results.total = (queryResults[0] as any).total;
      results.pending = (queryResults[1] as any).pending;
      results.completed = (queryResults[2] as any).completed;
      results.failed = (queryResults[3] as any).failed;
      results.platforms = queryResults[4];

      db.close();
      resolve(results);
    }).catch(reject);
  });
}

// 执行转存任务
async function startTransfer(maxCount: number = 5): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'scripts', 'quark_transfer.py');

    const child = spawn('python', [pythonScript], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          // 解析Python脚本的输出结果
          const lines = output.split('\n');
          const resultLine = lines.find(line => line.includes('转存结果:'));

          if (resultLine) {
            const result = JSON.parse(resultLine.split('转存结果:')[1].trim());
            resolve(result);
          } else {
            resolve({ success: 0, failed: 0, total: 0, message: '未找到转存结果' });
          }
        } catch (e) {
          resolve({ success: 0, failed: 0, total: 0, message: '解析结果失败', output });
        }
      } else {
        reject(new Error(`Python script failed: ${error}`));
      }
    });
  });
}

// 更新链接状态
async function updateLinkStatus(id: number, status: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    db.run(
      `UPDATE netdisk_links SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, id],
      function(err) {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      }
    );
  });
}

// 获取系统状态
async function getSystemStatus(): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'scripts', 'system_status.py');

    const child = spawn('python', [pythonScript, 'json'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          resolve({
            timestamp: new Date().toISOString(),
            status: 'error',
            message: '无法解析系统状态',
            raw_output: output
          });
        }
      } else {
        resolve({
          timestamp: new Date().toISOString(),
          status: 'error',
          message: '获取系统状态失败',
          error: error
        });
      }
    });
  });
}

// API路由处理
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  try {
    switch (action) {
      case 'stats':
        const stats = await getStats();
        return NextResponse.json({ success: true, data: stats });

      case 'links':
        const status = url.searchParams.get('status') || undefined;
        const platform = url.searchParams.get('platform') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const links = await getLinks(status, platform, limit, offset);
        return NextResponse.json({ success: true, data: links });

      case 'system_status':
        const systemStatus = await getSystemStatus();
        return NextResponse.json({ success: true, data: systemStatus });

      default:
        return NextResponse.json({
          success: false,
          error: '无效的action参数'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'transfer':
        const maxCount = body.maxCount || 5;
        const result = await startTransfer(maxCount);
        return NextResponse.json({ success: true, data: result });

      case 'update_status':
        const { id, status } = body;
        const updated = await updateLinkStatus(id, status);
        return NextResponse.json({ success: updated });

      default:
        return NextResponse.json({
          success: false,
          error: '无效的action参数'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}