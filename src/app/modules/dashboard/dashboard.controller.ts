import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { DashboardService } from "./dashboard.service";

const getOverview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  const query = req.query as Record<string, string>;

  const result = await DashboardService.getDashboardOverview(
    userId,
    role,
    query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard overview retrieved successfully",
    data: result,
  });
});

export const DashboardController = {
  getOverview,
};