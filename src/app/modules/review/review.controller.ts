import httpStatus from "http-status-codes";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReviewServices } from "./review.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.createReview(
    req.body,
    req.user as JwtPayload,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review created successfully",
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.getAllReviews(
    req.query as Record<string, string>,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reviews retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.getSingleReview(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review retrieved successfully",
    data: result.data,
  });
});

const getProductReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.getProductReviews(req.params.productId as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product reviews retrieved successfully",
    data: result.data,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.updateReview(req.params.id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review updated successfully",
    data: result,
  });
});

const approveReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.approveReview(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review approved successfully",
    data: result,
  });
});

const rejectReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.rejectReview(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review rejected successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.deleteReview(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review deleted successfully",
    data: result.data,
  });
});

const getReviewStats = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.getReviewStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review statistics retrieved successfully",
    data: result,
  });
});

export const ReviewControllers = {
  createReview,
  getAllReviews,
  getSingleReview,
  getProductReviews,
  updateReview,
  approveReview,
  rejectReview,
  deleteReview,
  getReviewStats,
};
