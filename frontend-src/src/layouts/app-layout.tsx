import * as React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  LayoutDashboard,
  History,
  StickyNote,
  LayoutTemplate,
  Settings2,
  ShieldBan,
  Users,
  Monitor,
  HelpCircle,
  MessagesSquare,
  ChevronRight,
  PanelLeft,
  LogOut,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/toast-provider';
import { http } from '@/lib/http';

/**
 * 应用主布局（对齐官方 AppLayout / Sidebar）
 * ------------------------------------------------------------------
 * 官方 shadcn sidebar 结构：Logo 区 + 导航区 + 底部（联系客服/帮助/用户）+ 顶栏。
 * className 与官方一致，保证 UI 完全对齐。
 */

const navMain = [
  {
    groupLabel: '主要功能',
    items: [
      { title: '扣数打印', url: '/dashboard', icon: LayoutDashboard },
      { title: '打印日志', url: '/print-log', icon: History },
      { title: '订单备注', url: '/notes', icon: StickyNote },
      { title: '打印模板', url: '/template', icon: LayoutTemplate },
      { title: '弹幕配置', url: '/config', icon: Settings2 },
      { title: '黑名单', url: '/blacklists', icon: ShieldBan },
      { title: '买家管理', url: '/buyers', icon: Users },
      { title: '登录设备', url: '/settings/devices', icon: Monitor },
    ],
  },
];

function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen bg-background">{children}</div>;
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="group/sidebar-wrapper flex w-[240px] shrink-0 flex-col border-r border-border bg-sidebar">
      {children}
    </div>
  );
}

function SidebarContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('flex flex-1 flex-col gap-2 p-2', className)}>{children}</div>;
}

function SidebarGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('w-full', className)}>{children}</div>;
}

function SidebarGroupContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('w-full', className)}>{children}</div>;
}

function SidebarMenu({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn('flex w-full min-w-0 flex-col gap-1', className)}>{children}</ul>;
}

function SidebarMenuItem({
  children,
  className,
  ref,
}: {
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLLIElement>;
}) {
  return (
    <li ref={ref} className={cn('group/menu-item relative', className)}>
      {children}
    </li>
  );
}

function SidebarMenuButton({
  children,
  className,
  onClick,
  size,
  asChild,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: 'lg';
  asChild?: boolean;
}) {
  const Comp = asChild ? React.Fragment : 'button';
  const cls = cn(
    'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] focus-visible:ring-2 active:bg-accent',
    size === 'lg' && 'p-3 gap-3',
    className,
  );
  if (asChild) {
    return <span className={cls}>{children}</span>;
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function SidebarInset({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col bg-muted/50">{children}</div>;
}

function SidebarSeparator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-border', className)} />;
}

/** 用户信息 + 退出/上传日志 */
function UserPanel() {
  const page = usePage() as any;
  const { showToast } = useToast();
  const props = page.props ?? {};
  const auth = props.auth ?? {};
  const authMode = props.authMode ?? 'local';
  const user = auth.user ?? { name: '未登录' };
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLLIElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    return open
      ? (document.addEventListener('mousedown', handler),
        () => document.removeEventListener('mousedown', handler))
      : undefined;
  }, [open]);

  const handleLogout = async () => {
    try {
      await http.post('/logout');
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  const handleUploadLogs = async () => {
    try {
      await (window as any).electronAPI?.uploadLogs?.();
      showToast('日志已上传');
    } catch {
      showToast('上传失败');
    }
  };

  const initial = (user.name || '未').slice(0, 1);

  return (
    <div className="px-2 pb-2">
      <SidebarMenu>
        <SidebarMenuItem ref={menuRef}>
          <SidebarMenuButton onClick={() => setOpen(!open)} className="gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              {initial}
            </div>
            <div className="flex flex-1 flex-col leading-tight min-w-0">
              <span className="truncate text-sm font-medium text-gray-900">
                {user.name || '未登录'}
              </span>
              <span className="truncate text-xs text-gray-500">{user.phone || ''}</span>
            </div>
            <ChevronRight
              className={cn(
                'h-4 w-4 shrink-0 text-gray-400 transition-transform',
                open && 'rotate-90',
              )}
            />
          </SidebarMenuButton>
          {open && (
            <div className="absolute bottom-full left-0 right-0 z-50 mb-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="flex flex-col p-1 text-sm">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={handleUploadLogs}
                >
                  <Upload className="h-4 w-4" />
                  上传日志
                </button>
                {authMode !== 'local' && (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                )}
              </div>
            </div>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}

/** 顶栏：侧边栏开关 + 本地版标识 + 订阅到期/续费 */
function TopBar() {
  const page = usePage() as any;
  const props = page.props ?? {};
  const authMode = props.authMode ?? 'local';
  const subscription = props.subscriptionSummary ?? null;
  const isActive = Boolean(subscription?.is_active);
  const endTime = subscription?.end_time
    ? new Date(subscription.end_time).toLocaleDateString('zh-CN')
    : '';

  return (
    <div className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <button
        type="button"
        aria-label="Toggle Sidebar"
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
      >
        <PanelLeft className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-3 text-sm">
        {authMode === 'local' && (
          <span
            className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
            title="本地版：数据仅存本机，无需登录"
          >
            本地版
          </span>
        )}
        {endTime && <span className="text-gray-600">到期时间: {endTime}</span>}
        {authMode !== 'local' && (
          <Link
            href="/settings/order-subscriptions"
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50"
          >
            {isActive ? '续费' : '开通'}
          </Link>
        )}
      </div>
    </div>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  active?: string;
}

export default function AppLayout({ children, active }: AppLayoutProps) {
  const page = usePage() as any;
  const url = (page.url as string) || active || '/';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          {/* Logo */}
          <div className="p-2">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-md p-3">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg shadow-sm overflow-hidden bg-background border">
                <img src="/images/icon-128.png" alt="Logo" className="w-6 h-6 object-contain" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-base font-bold text-gray-900 tracking-tight ml-0.5">
                  扣单宝
                </span>
              </div>
            </Link>
          </div>

          {/* 导航 */}
          <div className="mt-1">
            {navMain.map((group) => (
              <SidebarGroup key={group.groupLabel}>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = url === item.url;
                      return (
                        <SidebarMenuItem key={item.url}>
                          <Link
                            href={item.url}
                            className={cn(
                              'transition-all duration-200 rounded-md px-3 py-2.5 flex items-center gap-3',
                              isActive
                                ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                : 'text-gray-700 hover:bg-gray-100',
                            )}
                          >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span className="text-base font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </div>
        </SidebarContent>

        {/* 底部：联系客服/帮助 + 用户 */}
        <div className="mt-auto">
          <SidebarMenu className="space-y-1 px-2 pb-2">
            <SidebarMenuItem>
              <a
                href="/kefu.png"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-gray-700 hover:bg-gray-100"
              >
                <MessagesSquare className="w-4 h-4 shrink-0" />
                <span className="text-base font-medium">联系客服</span>
              </a>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <a
                href="/help"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md px-3 py-2.5 text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span className="text-base font-medium">帮助中心</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              </a>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator className="my-1" />
          <UserPanel />
        </div>
      </Sidebar>

      <SidebarInset>
        <TopBar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
