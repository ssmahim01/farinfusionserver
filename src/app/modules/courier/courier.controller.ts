import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { CourierServices } from "./courier.service";

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

export const CourierControllers = {
  createCourier,
  trackCourier,
};