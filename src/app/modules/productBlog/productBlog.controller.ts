import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ProductBlogServices } from "./productBlog.service";

const createProductBlog = catchAsync(async (req, res) => {
  const result = await ProductBlogServices.createProductBlog({
    ...req.body,
    createdBy: req.user.userId,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Product blog created successfully",
    data: result,
  });
});

const getAllProductBlogs = catchAsync(async (req, res) => {
  const result = await ProductBlogServices.getAllProductBlogs(
    req.query as Record<string, string>,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product blogs retrieved successfully",
    meta: result.meta,
    data: result,
  });
});

const getSingleProductBlog = catchAsync(async (req, res) => {
  const result = await ProductBlogServices.getSingleProductBlog(
    req.params.idOrSlug as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product blog retrieved successfully",
    data: result,
  });
});

const updateProductBlog = catchAsync(async (req, res) => {
  const result = await ProductBlogServices.updateProductBlog(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product blog updated successfully",
    data: result,
  });
});

const deleteProductBlog = catchAsync(async (req, res) => {
  const result = await ProductBlogServices.deleteProductBlog(
    req.params.id as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product blog deleted successfully",
    data: result,
  });
});

const increaseView = catchAsync(async (req, res) => {
  const result = await ProductBlogServices.increaseView(
    req.params.id as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "View count updated successfully",
    data: result,
  });
});

export const ProductBlogControllers = {
  createProductBlog,
  getAllProductBlogs,
  getSingleProductBlog,
  updateProductBlog,
  deleteProductBlog,
  increaseView,
};
