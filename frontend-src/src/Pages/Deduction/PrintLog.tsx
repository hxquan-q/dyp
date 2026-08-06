// @ts-nocheck
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Loader2, PackageOpen } from 'lucide-react';
import { TemplateSelect, PrinterSelect } from '@/components/ui/selectors';
import {
  Xr,
  Co,
  gl,
  Et,
  m,
  s,
  at,
  zt,
  yn,
  cm,
  o2,
  CM,
  za,
  jv,
  oY,
  rY,
  aY,
  mv,
  s2,
  eY,
  tY,
  CG,
  EG,
  ii,
  Bm,
  jW,
  Em,
  cnService as cn,
  nc,
  vi,
  bG,
  fq,
  RR,
  Un,
  $n,
  EC,
  Jp,
  Fp,
  ap,
  yv,
  Gp,
  dG,
  dn,
  un,
  Hp,
  xM,
  UC,
  vM,
  xG,
  Aq,
  NO,
  qC,
  cf,
  l0,
  sG,
  bW,
  wW,
  SW,
  NW,
  MC,
  qd,
  rp,
  xW,
  uM,
  nw,
  Fm,
  AG,
  jG,
} from '@/lib/reverse-runtime';
import { Sf } from '@/lib/reverse-runtime';

// 页面: Deduction/PrintLog
// 模块: kG -> 组件函数: NM
function NM() {
  const { showError: e, ErrorToastRenderer: t } = gl(),
    [a, o] = m.useState([]),
    [l, u] = m.useState([]),
    [d, f] = m.useState(0),
    [p, g] = m.useState(1),
    [x, v] = m.useState(CG),
    [_, S] = m.useState(false),
    [j, N] = m.useState([]),
    w = (be) => {
      N(be ? l.map((qe) => qe.id) : []);
    },
    E = (be, qe) => {
      N(qe ? [...j, be] : j.filter((mt) => mt !== be));
    },
    [A, R] = m.useState(() => {
      const be = yn();
      return {
        shopId: 0,
        timeType: 'print',
        startTime: be.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        endTime: be.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        nickname: '',
      };
    }),
    D = m.useMemo(() => {
      const be = {};
      return (
        a.forEach((qe) => {
          be[qe.id] = qe;
        }),
        be
      );
    }, [a]);
  m.useEffect(() => {
    (async () => (
      U({
        page: 1,
      }),
      V(),
      await Pe(),
      W(false)
    ))();
  }, []);
  function V() {
    zt.get('/shops/list', {
      showLoading: false,
    }).then((be) => {
      const qe = be.data.data || {};
      o((qe.shops || []).filter((mt) => EG.has(mt?.auth_subject || 'shop')));
    });
  }
  const U = async (be = {}, qe = A) => {
      S(true);
      const mt = {
        ...qe,
        page: 1,
        size: x,
        shopId: qe.shopId === 0 ? '' : qe.shopId,
        ...be,
      };
      try {
        const Pt = await zt.get('/print-log/list', {
            params: mt,
          }),
          { list: yt = [], total: Xt = 0 } = Pt.data.data || {};
        (u(yt), f(Xt), N([]));
      } catch (Pt) {
        e(Pt?.response?.data?.message || '获取打印日志失败');
      } finally {
        (S(false), g(mt.page || 1));
      }
    },
    I = () => {
      const be = yn(),
        qe = {
          shopId: 0,
          timeType: 'print',
          startTime: be.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          endTime: be.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
          nickname: '',
        };
      (R(qe),
        U(
          {
            page: 1,
          },
          qe,
        ));
    },
    B = (be, qe) => {
      R((mt) => ({
        ...mt,
        [be]: qe,
      }));
    },
    J = (be) => {
      const qe = Number(be);
      (v(qe),
        U({
          page: 1,
          size: qe,
        }));
    },
    { state: ie, open: de } = vi(),
    Q = ie === 'collapsed' || !de ? '0px' : '195px',
    Z = Math.max(1, Math.ceil(d / x)),
    ne = {
      trigger: Un($n.toolbar, 'template-trigger'),
      content: Un($n.toolbar, 'template-content'),
      getItemAttrs: (be, qe) => Un($n.toolbar, 'template-item', `template-${be?.id ?? qe}`),
      helpItem: Un($n.toolbar, 'template-help-item', 'create'),
    },
    P = {
      trigger: Un($n.toolbar, 'printer-trigger'),
      content: Un($n.toolbar, 'printer-content'),
      getItemAttrs: (be, qe) => Un($n.toolbar, 'printer-item', `printer-${qe}`),
      helpItem: Un($n.toolbar, 'printer-help-item', 'help'),
    },
    [q, M] = m.useState([]),
    [G, fe] = m.useState([]),
    [z, $] = m.useState(false),
    re = m.useRef(null),
    oe = 2,
    ge = {
      templateId: void 0,
      selectPrinter: '',
    },
    { data: _e, setData: X, reset: we, processing: Re, errors: Me } = Co(ge);
  async function Pe() {
    await zt
      .get('/tag-templates/list', {
        showLoading: false,
      })
      .then((be) => {
        if ((M(be.data.data), be.data.data?.length)) {
          let qe = be.data.data.find((mt) => mt.is_default);
          (qe || (qe = be.data.data[0]), X('templateId', qe.id), (re.current = qe));
        }
      });
  }
  async function W(be = false, qe = false) {
    qe && $(true);
    try {
      await cn.loadPrinters(oe, {
        showGuideOnError: be,
        onPrinters: (mt) => {
          if ((fe([...mt]), re.current?.id)) {
            const Pt = ap(re.current, mt);
            Pt && X('selectPrinter', Pt);
          }
        },
      });
    } catch (mt) {
      console.error(mt);
    } finally {
      qe && $(false);
    }
  }
  m.useEffect(() => {
    const be = () => {
      (fe([]), X('selectPrinter', ''), W(false, false));
    };
    return (window.addEventListener(nc, be), () => window.removeEventListener(nc, be));
  }, []);
  async function et() {
    if (cn.isConnected(oe)) return true;
    try {
      return (await W(false, false), cn.isConnected(oe));
    } catch (be) {
      return (console.warn('[print-log] silent printer reconnect failed', be), false);
    }
  }
  function Ue(be, qe) {
    if (be === 'selectPrinter' && qe === 0) {
      W(true, true);
      return;
    }
    if ((X(be, qe), be === 'selectPrinter' && uM(qe), be === 'templateId')) {
      const mt = q.find((yt) => yt.id === qe);
      re.current = mt;
      const Pt = ap(mt, G);
      Pt && X('selectPrinter', Pt);
    }
  }
  async function nt() {
    if (!(await et())) {
      cn.isElectronProvider() || cn.showPrinterGuide(oe, () => W(true, true));
      return;
    }
    if (!j?.length) return e('请选择需要打印的记录');
    if (!_e.templateId) return e('请选择打印模板');
    if (!_e.selectPrinter) return e('请选择打印机');
    const be = {
      templateId: _e.templateId,
      printLogIds: j,
    };
    (console.log('需要打印的数据为:', be), S(true));
    const mt = (await zt.post('/danmu/rePrint', be)).data.data,
      Pt = q.find((yt) => yt.id === _e.templateId);
    try {
      const yt = await nw(mt, Pt);
      await cn.printForTag(oe, _e.selectPrinter, yt, 1, mt.length, Pt);
    } catch (yt) {
      (console.log('标签打印失败', yt), e(Fm(yt)));
    } finally {
      (S(false),
        U({
          page: 1,
        }),
        N([]));
    }
  }
  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4 border w-full rounded-lg p-4 bg-white">
          <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-700 whitespace-nowrap">店铺：</Label>
              <Select value={A.shopId} onValueChange={(be) => B('shopId', be)}>
                <SelectTrigger
                  className="h-9 text-sm w-[200px]"
                  {...Un($n.filters, 'shop-filter-trigger')}
                >
                  <SelectValue placeholder="全部店铺" />
                </SelectTrigger>
                <SelectContent {...Un($n.filters, 'shop-filter-content')}>
                  <SelectItem value={0} {...Un($n.filters, 'shop-filter-item', 'all')}>
                    全部店铺
                  </SelectItem>
                  {a.map((be, qe) => {
                    const mt = za(be.platform_code);
                    return (
                      <SelectItem
                        value={be.id}
                        {...Un($n.filters, 'shop-filter-item', `shop-${be.id ?? qe}`)}
                      >
                        <div className="flex items-center gap-2">
                          {mt && (
                            <img
                              src={mt}
                              alt={be.platform_name ?? 'shop icon'}
                              className="w-4 h-4 object-cover"
                            />
                          )}
                          <span>{be.shop_name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-0">
                <Select value={A.timeType} onValueChange={(be) => B('timeType', be)}>
                  <SelectTrigger
                    className="w-[100px] text-[13px] font-medium rounded-r-none border-r-0"
                    {...Un($n.filters, 'time-type-trigger')}
                  >
                    <SelectValue placeholder="打印时间" />
                  </SelectTrigger>
                  <SelectContent {...Un($n.filters, 'time-type-content')}>
                    <SelectItem value="print" {...Un($n.filters, 'time-type-item', 'print')}>
                      打印时间
                    </SelectItem>
                    <SelectItem value="comment" {...Un($n.filters, 'time-type-item', 'comment')}>
                      评论时间
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="datetime-local"
                  value={A.startTime ? yn(A.startTime).format('YYYY-MM-DD HH:mm') : ''}
                  onChange={(be) =>
                    B(
                      'startTime',
                      be.target.value ? yn(be.target.value).format('YYYY-MM-DD HH:mm:ss') : '',
                    )
                  }
                  className="w-[180px] rounded-none border-l-0 -ml-px"
                  {...Un($n.filters, 'start-time-input')}
                />
                <span className="px-3 h-[36px] flex items-center justify-center text-gray-500 border border-l-0 border-r-0 border-gray-200 -ml-px -mr-px rounded-none bg-white">
                  →
                </span>
                <Input
                  type="datetime-local"
                  value={A.endTime ? yn(A.endTime).format('YYYY-MM-DD HH:mm') : ''}
                  onChange={(be) =>
                    B(
                      'endTime',
                      be.target.value ? yn(be.target.value).format('YYYY-MM-DD HH:mm:ss') : '',
                    )
                  }
                  className="w-[180px] rounded-l-none border-l-0 -ml-px"
                  {...Un($n.filters, 'end-time-input')}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-700 whitespace-nowrap">昵称：</Label>
              <Input
                className="w-[200px]"
                placeholder="请输入昵称"
                value={A.nickname}
                onChange={(be) => B('nickname', be.target.value)}
                {...Un($n.filters, 'nickname-filter-input')}
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                className="w-[90px] bg-blue-500 hover:bg-blue-600"
                onClick={() =>
                  U(
                    {
                      page: 1,
                    },
                    A,
                  )
                }
                disabled={_}
                {...Un($n.filters, 'query-button')}
              >
                {_ ? <Loader2 className="w-4 h-4 animate-spin" /> : '查询'}
              </Button>
              <Button
                variant="outline"
                className="w-[90px]"
                onClick={I}
                disabled={_}
                {...Un($n.filters, 'reset-button')}
              >
                重置
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border mb-20 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]" />
                <TableHead>批次号</TableHead>
                <TableHead>序号</TableHead>
                <TableHead>打印时间</TableHead>
                <TableHead>用户昵称</TableHead>
                <TableHead>直播店铺</TableHead>
                <TableHead>公屏内容</TableHead>
                <TableHead>匹配内容</TableHead>
                <TableHead>对货编码</TableHead>
                <TableHead>评论时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!_ && l.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <PackageOpen className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">暂无数据</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!_ &&
                l.map((be, qe) => (
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={j.includes(be.id)}
                          onCheckedChange={(mt) => E(be.id, mt)}
                          {...Un($n.table, 'row-select', `row-${be.id ?? qe}`)}
                        />
                        {AG(be.lucky_bag_won || be.luckyBagWon)}
                      </div>
                    </TableCell>
                    <TableCell>{be.batch_no}</TableCell>
                    <TableCell>{be.num_index}</TableCell>
                    <TableCell>{be.created_at}</TableCell>
                    <TableCell>{be.nickname || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {D[be.shop_id] && (
                          <img
                            src={za(D[be.shop_id]?.platform_code)}
                            className="w-4 h-4 object-cover"
                          />
                        )}
                        <span>{D[be.shop_id]?.shop_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{be.content || '-'}</TableCell>
                    <TableCell>{be.matched_content || '-'}</TableCell>
                    <TableCell>{be.item_code || '-'}</TableCell>
                    <TableCell>{be.comment_time}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          width: `calc(100% - ${Q})`,
          marginLeft: '-16px',
        }}
        className="sticky bottom-4 bg-white border  p-4 pl-6 flex flex-col gap-4 md:flex-row md:items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20"
      >
        <div className="flex items-center flex-wrap gap-3 w-[100%]">
          <Checkbox
            disabled={!l.length}
            checked={l.length > 0 && j.length === l.length}
            onCheckedChange={w}
            {...Un($n.table, 'row-select-all')}
          />
          <span className="text-[14px]">全选</span>
          <div className="flex items-center ml-4">
            <TemplateSelect
              value={_e.templateId}
              onValueChange={(be) => Ue('templateId', be)}
              templateList={q}
              width="200px"
              fullScale={ne}
            />
          </div>
          <div className="flex items-center ml-4">
            <PrinterSelect
              value={_e.selectPrinter}
              onValueChange={(be) => Ue('selectPrinter', be)}
              printerList={G}
              width="200px"
              refreshing={z}
              onRefresh={() => W(true, true)}
              fullScale={P}
            />
          </div>
          <Button
            className="bg-blue-500 hover:bg-blue-600 ml-4"
            loading={_}
            loadingText="打印中..."
            onClick={() => nt()}
            {...Un($n.toolbar, 'reprint-button')}
          >
            批量打印
          </Button>
          <div className="flex ml-auto items-center">
            <span className="text-sm text-gray-500">
              共 {d} 条，每页 {x} 条
            </span>
            {d > 0 && (
              <div className="flex items-center gap-2 ml-4">
                <Select value={String(x)} onValueChange={J}>
                  <SelectTrigger
                    className="h-8 w-[110px] text-sm"
                    {...Un($n.table, 'page-size-trigger')}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent {...Un($n.table, 'page-size-content')}>
                    {jG.map((be) => (
                      <SelectItem
                        value={String(be)}
                        {...Un($n.table, 'page-size-item', String(be))}
                      >
                        {be} 条/页
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(p || 1) <= 1}
                  onClick={() =>
                    U({
                      page: Math.max(1, (p || 1) - 1),
                    })
                  }
                >
                  上一页
                </Button>
                <span className="text-sm text-gray-700">
                  {p || 1} / {Z}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(p || 1) >= Z}
                  onClick={() =>
                    U({
                      page: Math.min(Z, (p || 1) + 1),
                    })
                  }
                >
                  下一页
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <t />
    </div>
  );
}

export default NM;
