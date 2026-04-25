/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status-codes";
import { Lead } from "./lead.model";
import { ILead } from "./lead.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { leadSearchableFields } from "./lead.constants";
import { JwtPayload } from "jsonwebtoken";
import { Order } from "../order/order.model";
import mongoose from "mongoose";

const getTodayRangeBD = () => {
  const now = new Date();

  const bdTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
  );

  // Start of day (00:00:00)
  const start = new Date(bdTime);
  start.setHours(0, 0, 0, 0);

  // End of day (23:59:59)
  const end = new Date(bdTime);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const createLeadService = async (payload: any, user: JwtPayload) => {
  const existingLead = await Lead.findOne({ phone: payload.phone });
  const session = await mongoose.startSession();

  if (existingLead) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Lead with this phone number already exists",
    );
  }

  const { start, end } = getTodayRangeBD();

  const existingOrderToday = await Order.findOne({
    "billingDetails.phone": payload.phone,
    createdAt: {
      $gte: start,
      $lte: end,
    },
    isDeleted: false,
    isPublished: true,
  }).session(session);

  if (existingOrderToday) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This customer has already placed an order today. Only one order per day is allowed.",
    );
  }

  const leadData = {
    ...payload,
    assignedBy: user.userId,
  };

  const lead = await Lead.create(leadData);

  const populatedLead = await Lead.findById(lead._id).populate(
    "assignedBy",
    "name email role",
  );

  return populatedLead;
};

const updateLeadService = async (
  payload: Partial<ILead>,
  leadId: string,
  decodedToken: JwtPayload,
) => {
  const existingLead = await Lead.findById(leadId);

  if (payload.assignedBy && decodedToken.role !== "ADMIN") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only admin can assign leads to others",
    );
  }

  if (!existingLead) {
    throw new AppError(httpStatus.NOT_FOUND, "Lead not found");
  }

  const updatedLead = await Lead.findByIdAndUpdate(leadId, payload, {
    new: true,
  });
  return updatedLead;
};

const checkFraudByPhone = async (phone: string) => {
  const orders = await Order.find({
    "billingDetails.phone": phone,
  });

  const total = orders.length;

  const delivered = orders.filter(
    (o) => o.deliveryStatus === "DELIVERED",
  ).length;

  const cancelled = orders.filter((o) => o.orderStatus === "CANCELLED").length;

  const successRate = total ? (delivered / total) * 100 : 0;
  const cancelRate = total ? (cancelled / total) * 100 : 0;

  let risk = "SAFE";

  if (cancelRate > 50) risk = "HIGH";
  else if (cancelRate > 25) risk = "MEDIUM";

  return {
    total,
    delivered,
    cancelled,
    successRate: Number(successRate.toFixed(1)),
    cancelRate: Number(cancelRate.toFixed(1)),
    risk,
  };
};

const getSingleLead = async (id: string) => {
  const lead = await Lead.findById(id).populate(
    "assignedBy",
    "name email phone",
  );
  if (!lead) {
    throw new AppError(httpStatus.NOT_FOUND, "Lead Not Found");
  }
  return {
    data: lead,
  };
};

const deleteLead = async (id: string) => {
  const lead = await Lead.findById(id);
  if (!lead) {
    throw new AppError(httpStatus.NOT_FOUND, "Lead Not Found");
  }

  await Lead.findByIdAndDelete(id);

  return { data: null };
};

const getAllLeads = async (query: Record<string, string>) => {
  const queryObj: any = {};

  // DATE FILTER
  if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
    queryObj.createdAt = {};

    if (query["createdAt[gte]"]) {
      queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
    }

    if (query["createdAt[lte]"]) {
      queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
    }
  }

  // REMOVE SPECIAL FIELDS
  delete query["createdAt[gte]"];
  delete query["createdAt[lte]"];

  const queryBuilder = new QueryBuilder(
    Lead.find({ isDeleted: false, ...queryObj })
      .populate("assignedBy", "name email role")
      .sort({ createdAt: -1 }),
    query,
  );
  const leadsData = queryBuilder
    .filter()
    .search(leadSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    leadsData.build(),
    queryBuilder.getMeta(),
  ]);

  const { start, end } = getTodayRangeBD();

  const leadsWithOrderFlag = await Promise.all(
    data.map(async (lead) => {
      const hasOrder = await Order.exists({
        "billingDetails.phone": lead.phone,
        createdAt: { $gte: start, $lte: end },
      });

      return {
        ...lead.toObject(),
        hasOrderedToday: !!hasOrder,
      };
    }),
  );

  return {
    data: leadsWithOrderFlag,
    meta,
  };
};

const getAllTrashLeads = async (query: Record<string, string>) => {
  const queryObj: any = {};

  // DATE FILTER
  if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
    queryObj.createdAt = {};

    if (query["createdAt[gte]"]) {
      queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
    }

    if (query["createdAt[lte]"]) {
      queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
    }
  }

  // REMOVE SPECIAL FIELDS
  delete query["createdAt[gte]"];
  delete query["createdAt[lte]"];

  const queryBuilder = new QueryBuilder(
    Lead.find({ isDeleted: true, ...queryObj }).sort({ createdAt: -1 }),
    query,
  );
  const leadsData = queryBuilder
    .filter()
    .search(leadSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    leadsData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

export const LeadServices = {
  createLeadService,
  getSingleLead,
  updateLeadService,
  deleteLead,
  checkFraudByPhone,
  getAllLeads,
  getAllTrashLeads,
};
