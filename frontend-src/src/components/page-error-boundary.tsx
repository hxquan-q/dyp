import * as React from 'react';

/**
 * 页面级错误边界
 * ------------------------------------------------------------------
 * 反转版页面布局已与官方一致，但个别复杂页面（如模板编辑器）运行时
 * 依赖官方深层辅助函数。出错时保留应用外壳并显示提示，而非白屏。
 */
export class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error: Error) {
    console.error('[page-error]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="text-base font-semibold text-red-800">页面加载出错</h2>
            <p className="mt-2 text-sm text-red-700">
              该页面功能依赖桌面客户端运行环境，浏览器预览下部分交互不可用。
            </p>
            <p className="mt-1 font-mono text-xs text-red-500">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
