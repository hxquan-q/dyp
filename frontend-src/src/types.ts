/** 全局类型定义 */

/** Inertia 后端响应 */
export interface InertiaResponse<T = any> {
  code: number;
  data: T;
  success?: boolean;
  message?: string;
}

/** 弹幕→商品映射配置项 */
export interface DanmuProductRelation {
  id: number;
  danmu: string;
  price: string | number | null;
  product_no: string;
  tenant_id: number;
}

/** 授权店铺 */
export interface Shop {
  id: number;
  shop_name?: string;
  platform_code?: string;
  platform_name?: string;
  auth_subject?: 'live_room' | 'order_shop' | 'legacy';
  [key: string]: any;
}

/** 店铺展示行 */
export interface ShopDisplayRow {
  id: number;
  shop_name: string;
  auth_subject: string;
  [key: string]: any;
}
