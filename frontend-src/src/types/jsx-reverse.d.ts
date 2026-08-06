import * as React from 'react';

/**
 * 反转版 JSX 的全局 JSX 类型声明
 * ------------------------------------------------------------------
 * 由官方 bundle 反转的页面使用压缩变量名（如 ErrorToastRenderer: ie），
 * 反转后 `<ie />` 因小写被 JSX 视为内置元素，这里声明为合法组件类型。
 * 运行时由 reverse-runtime 的 gl() 返回 ErrorToastRenderer 实现。
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ie: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};
