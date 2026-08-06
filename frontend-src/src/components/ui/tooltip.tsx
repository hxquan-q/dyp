import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * 宽松版 Tooltip：反向重建的页面会在 Tooltip 未包裹时使用 Trigger/Content，
 * 因此不依赖 Radix 严格上下文，避免 `TooltipTrigger must be used within Tooltip` 报错。
 */
const TooltipProvider = ({ children }: any) => React.createElement(React.Fragment, null, children);
const Tooltip = ({ children, ..._props }: any) =>
  React.createElement(React.Fragment, null, children);

const TooltipTrigger = React.forwardRef<any, any>(({ asChild, children, ..._props }, _ref) =>
  asChild ? children : React.createElement('span', _props, children),
);
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef<any, any>(({ className, children, ..._props }, _ref) =>
  React.createElement(
    'div',
    {
      className: cn(
        'z-50 rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-md',
        className,
      ),
      ..._props,
    },
    children,
  ),
);
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
