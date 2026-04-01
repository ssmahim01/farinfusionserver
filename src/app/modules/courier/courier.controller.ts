import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { CourierServices } from "./courier.service";
import { Courier } from "./courier.model";

const createCourier = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.body;

  const result = await CourierServices.createCourier(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier created successfully",
    data: result,
  });
});

const trackCourier = catchAsync(async (req: Request, res: Response) => {
  const { trackingCode } = req.params;

  const result = await CourierServices.trackCourier(trackingCode as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tracking fetched successfully",
    data: result,
  });
});

const getCourierByOrderId = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const result = await Courier.findOne({ order: orderId });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Courier fetched successfully",
    data: result,
  });
});

const getSingleCourier = catchAsync(async (req, res) => {
  const result = await Courier.findById(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Courier fetched",
    data: result,
  });
});

const getAllCouriers = catchAsync(async (req, res) => {
  const couriers = await Courier.find();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Couriers fetched",
    data: couriers,
  });
});

export const CourierControllers = {
  createCourier,
  trackCourier,
  getAllCouriers,
  getSingleCourier,
  getCourierByOrderId,
};