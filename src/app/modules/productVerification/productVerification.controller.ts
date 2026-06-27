import httpStatus from "http-status-codes";
import { ProductVerificationServices } from "./productVerification.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createProductVerification = catchAsync(async (req, res) => {
  const result = await ProductVerificationServices.createProductVerification(
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Content created successfully",
    data: result,
  });
});

const getAllProductVerifications = catchAsync(async (req, res) => {
  const result = await ProductVerificationServices.getAllProductVerifications(
    req.query as Record<string, string>,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Contents retrieved successfully",
    meta: result.meta,
    data: result,
  });
});

const increaseView = catchAsync(async (req, res) => {
  const result = await ProductVerificationServices.increaseView(
    req.params.id as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "View updated successfully",
    data: result,
  });
});

const getSingleProductVerification = catchAsync(async (req, res) => {
  const result = await ProductVerificationServices.getSingleProductVerification(
    req.params.idOrSlug as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Content retrieved successfully",
    data: result,
  });
});

const updateProductVerification = catchAsync(async (req, res) => {
  const result = await ProductVerificationServices.updateProductVerification(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Content updated successfully",
    data: result,
  });
});

const deleteProductVerification = catchAsync(async (req, res) => {
  const result = await ProductVerificationServices.deleteProductVerification(
    req.params.id as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Content deleted successfully",
    data: result,
  });
});

export const ProductVerificationControllers = {
  createProductVerification,
  getAllProductVerifications,
  getSingleProductVerification,
  increaseView,
  updateProductVerification,
  deleteProductVerification,
};
