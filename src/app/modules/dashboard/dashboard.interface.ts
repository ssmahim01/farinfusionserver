export interface IOrderStats {
  PENDING: number;
  CONFIRMED: number;
  COMPLETED: number;
  CANCELLED: number;
}

export interface IStaffEarning {
  sellerId: string;
  sellerName: string;
  email: string;
  totalOrders: number;
  totalEarnings: number;
}

export interface IDashboardOverview {
  totalOrders: number;
  totalRevenue: number;

  // Only ADMIN can see below
  totalUsers?: number;
  totalProducts?: number;
  staffEarnings?: IStaffEarning[];
   totalCost: number
  totalSalary: number
  netProfit: number

  orderStats: IOrderStats;

  recentOrders: any[];

  role: string;
}