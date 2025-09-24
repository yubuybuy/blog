
// 快速修复Sanity权限问题
export function enableAdminMode() {
  // 强制启用所有管理功能
  if (typeof window !== 'undefined') {
    window.__SANITY_ADMIN_MODE__ = true;
    console.log('🔓 管理员模式已启用');
  }
}

// 在开发环境自动启用
if (process.env.NODE_ENV === 'development') {
  enableAdminMode();
}
