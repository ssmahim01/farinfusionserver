import { Order } from "../order/order.model";
import { User } from "../user/user.model";
import { Product } from "../product/product.model";
import { Payment } from "../payment/payment.model";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status-codes";
import { Role } from "../user/user.interface";

const getDashboardOverview = async (
  userId: string,
  role: string,
  query: Record<string, string>,
) => {
  const queryObj: any = {};

  if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
    queryObj.createdAt = {};

    if (query["createdAt[gte]"]) {
      queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
    }

    if (query["createdAt[lte]"]) {
      queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
    }
  }

  if (query.orderStatus) {
    queryObj.orderStatus = query.orderStatus;
  }

  let matchCondition: any = {
    isDeleted: false,
    isPublished: true,
    ...queryObj,
  };

  const productCostAgg = await Order.aggregate([
    { $match: { ...matchCondition, orderStatus: "COMPLETED" } },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products.product",
        foreignField: "_id",
        as: "productData",
      },
    },
    { $unwind: "$productData" },
    {
      $group: {
        _id: null,
        totalCost: {
          $sum: {
            $multiply: [
              "$products.quantity",
              { $ifNull: ["$productData.buyingPrice", 0] },
            ],
          },
        },
      },
    },
  ]);

  const totalProductCost = productCostAgg[0]?.totalCost || 0;

  const salaryAgg = await User.aggregate([
    {
      $match: {
        role: { $in: ["ADMIN", "MANAGER", "MODERATOR", "TELLICELSS"] },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalSalary: {
          $sum: { $ifNull: ["$salary", 0] },
        },
      },
    },
  ]);

  const totalSalary = salaryAgg[0]?.totalSalary || 0;
  let mySalary = 0;

  if (role === Role.GENERALSTAFF) {
    const user = await User.findById(userId);
    mySalary = user?.salary || 0;
  }

  if (role === Role.CUSTOMER) {
    const user = await User.findById(userId);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

    matchCondition["billingDetails.email"] = user.email;
  }

  if ([Role.MODERATOR, Role.MANAGER].includes(role as Role)) {
    matchCondition.seller = new Types.ObjectId(userId);
  }

  const totalOrders = await Order.countDocuments(matchCondition);

  const orderStatsAgg = await Order.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  const orderStats = {
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  orderStatsAgg.forEach((item) => {
    orderStats[item._id as keyof typeof orderStats] = item.count;
  });

  const revenueAgg = await Order.aggregate([
    {
      $match: {
        ...matchCondition,
        orderStatus: "COMPLETED",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$total" },
      },
    },
  ]);

  const startDate = query["createdAt[gte]"]
    ? new Date(query["createdAt[gte]"])
    : new Date(new Date().setDate(1));

  const endDate = query["createdAt[lte]"]
    ? new Date(query["createdAt[lte]"])
    : new Date();

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());

  const staffUsers = await User.find({
    role: { $in: ["ADMIN", "MANAGER", "MODERATOR", "TELLICELSS"] },
    isDeleted: false,
  });

  const totalMonthlySalary = staffUsers.reduce(
    (sum, user) => sum + (user.salary || user.commissionSalary || 0),
    0,
  );

  const dailySalary = totalMonthlySalary / 30;

  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const staffSalaryForPeriod = dailySalary * totalDays;

  const totalRevenue = revenueAgg[0]?.total || 0;
  const now = new Date();
  const totalDaysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  let days = totalDaysInMonth;

  if (query["createdAt[gte]"] && query["createdAt[lte]"]) {
    const start = new Date(query["createdAt[gte]"]);
    const end = new Date(query["createdAt[lte]"]);

    days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  // const salaryUsed = (totalSalary / totalDaysInMonth) * days;
  const totalCost = totalProductCost + staffSalaryForPeriod;
  const netProfit = totalCost - totalRevenue;
  // console.log(staffSalaryForPeriod, totalProductCost, totalRevenue);

  const recentOrders = await Order.find(matchCondition)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("customer", "name email")
    .populate("seller", "name email");

  let totalUsers = undefined;
  let totalProducts = undefined;
  let staffEarnings = undefined;
  let topProducts = undefined;

  if (role === Role.ADMIN || role === Role.MANAGER) {
    totalUsers = await User.countDocuments();
    totalProducts = await Product.countDocuments({ isDeleted: false });

    if (role === Role.ADMIN) {
      staffEarnings = await Order.aggregate([
        {
          $match: {
            isDeleted: false,
            orderStatus: "COMPLETED",
            deliveryStatus: "DELIVERED",
            ...queryObj,
          },
        },
        {
          $group: {
            _id: "$seller",
            totalOrders: { $sum: 1 },
            totalEarnings: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "seller",
          },
        },
        { $unwind: "$seller" },
        {
          $project: {
            sellerId: "$seller._id",
            sellerName: "$seller.name",
            email: "$seller.email",
            totalOrders: 1,
            totalEarnings: 1,
          },
        },
      ]);
    }
  }

  topProducts = await Order.aggregate([
    {
      $match: {
        orderStatus: "COMPLETED",
        deliveryStatus: "DELIVERED",
        isDeleted: false,
        ...queryObj,
      },
    },
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products.product",
        totalSoldInPeriod: { $sum: "$products.quantity" },
        totalRevenueInPeriod: {
          $sum: "$total",
        },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalSoldInPeriod: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: false } },
    {
      $project: {
        productId: "$product._id",
        title: "$product.title",
        price: "$product.price",
        discountPrice: "$product.discountPrice",
        buyingPrice: "$product.buyingPrice",
        images: "$product.images",
        availableStock: "$product.availableStock",
        totalSold: { $sum: "$products.quantity" },
        totalSoldInPeriod: 1,
        totalRevenueInPeriod: 1,
        orderCount: 1,
      },
    },
  ]);

  return {
    totalOrders,
    totalRevenue,
    totalUsers,
    totalProducts,
    orderStats,
    staffEarnings,
    mySalary,
    topProducts,
    totalCost: totalProductCost,
    totalSalary: staffSalaryForPeriod,
    netProfit,
    recentOrders,
    role,
  };
};

export const DashboardService = {
  getDashboardOverview,
};
