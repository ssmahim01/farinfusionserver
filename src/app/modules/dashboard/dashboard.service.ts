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
  query: Record<string, string>
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
    ...queryObj,
  };

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

  const revenueAgg = await Payment.aggregate([
    {
      $lookup: {
        from: "orders",
        localField: "order",
        foreignField: "_id",
        as: "order",
      },
    },
    { $unwind: "$order" },
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;

  const recentOrders = await Order.find(matchCondition)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("customer", "name email")
    .populate("seller", "name email");

  let totalUsers = undefined;
  let totalProducts = undefined;
  let staffEarnings = undefined;

  if (role === Role.ADMIN) {
    totalUsers = await User.countDocuments();
    totalProducts = await Product.countDocuments();

    staffEarnings = await Order.aggregate([
      { $match: { isDeleted: false } },
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

  return {
    totalOrders,
    totalRevenue,
    totalUsers,
    totalProducts,
    orderStats,
    staffEarnings,
    recentOrders,
    role,
  };
};

export const DashboardService = {
  getDashboardOverview,
};