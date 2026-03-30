import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { OrderServices } from "./order.service";

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const createdOrder = await OrderServices.createOrder(payload);

    console.log({createOrder})

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Order created successfully",
    data: createdOrder,
  });
});

/* ---------- GET MY ORDERS ---------- */

const getMyOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const query = req.query as Record<string, string>;

    const result = await OrderServices.getMyOrders(userId, query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Orders Retrieved Successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

/* ---------- GET ALL ORDERS (ADMIN) ---------- */

const getAllOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as Record<string, string>;

    const result = await OrderServices.getAllOrders(query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All Orders Retrieved Successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

const getAllTrashOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as Record<string, string>;

    const result = await OrderServices.getAllTrashOrders(query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All Trash Orders Retrieved Successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);
/* ---------- GET SINGLE ORDER ---------- */

const getSingleOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.id as string;

    const result = await OrderServices.getSingleOrder(orderId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order Retrieved Successfully",
      data: result,
    });
  }
);

/* ---------- UPDATE ORDER ---------- */

const updateOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.id as string;
    const payload = req.body;

    const result = await OrderServices.updateOrder(
      orderId,
      payload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order Updated Successfully",
      data: result,
    });
  }
);

/* ---------- DELETE ORDER ---------- */

const deleteOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.id as string;

    const result = await OrderServices.deleteOrder(orderId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order Deleted Successfully",
      data: result,
    });
  }
);

export const OrderControllers = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getAllTrashOrders,
  getSingleOrder,
  updateOrder,
  deleteOrder,
};