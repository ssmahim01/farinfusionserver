import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { PermissionServices } from "./permission.service";

const createPermission = catchAsync(async (req: Request, res: Response) => {
  const result = await PermissionServices.createPermission(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Permission created successfully",
    data: result,
  });
});

const getAllPermissions = catchAsync(async (req: Request, res: Response) => {
  const result = await PermissionServices.getAllPermissions();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Permissions fetched successfully",
    data: result,
  });
});

const assignPermissionsToUser = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await PermissionServices.assignPermissionsToUser(
      id as string,
      req.body.permissions
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Permissions updated successfully",
      data: result,
    });
  }
);

export const PermissionControllers = {
  createPermission,
  getAllPermissions,
  assignPermissionsToUser,
};