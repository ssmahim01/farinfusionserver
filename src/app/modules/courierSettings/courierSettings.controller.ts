/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status-codes";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CourierSettingsServices } from "./courierSettings.service";
import { CourierProvider } from "./courierSettings.interface";

const createCourierSettings = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const payload = req.body;

    const result = await CourierSettingsServices.createCourierSettings(
      payload,
      user,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Courier settings created successfully",
      data: result,
    });
  },
);

const getAllCourierSettings = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query;

    const result = await CourierSettingsServices.getAllCourierSettings(
      query as Record<string, string>,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courier settings retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getSingleCourierSettings = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const result = await CourierSettingsServices.getSingleCourierSettings(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courier settings retrieved successfully",
      data: result,
    });
  },
);

const getCourierSettingsByProvider = catchAsync(
  async (req: Request, res: Response) => {
    const provider = req.params.provider as CourierProvider;

    const result =
      await CourierSettingsServices.getCourierSettingsByProvider(provider);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courier provider settings retrieved successfully",
      data: result,
    });
  },
);

const updateCourierSettings = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const id = req.params.id as string;
    const payload = req.body;

    const result = await CourierSettingsServices.updateCourierSettings(
      id,
      payload,
      user,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courier settings updated successfully",
      data: result,
    });
  },
);

const toggleCourierSettingsStatus = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const id = req.params.id as string;

    const result = await CourierSettingsServices.toggleCourierSettingsStatus(
      id,
      user,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courier settings status updated successfully",
      data: result,
    });
  },
);

const deleteCourierSettings = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await CourierSettingsServices.deleteCourierSettings(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courier settings deleted successfully",
      data: null,
    });
  },
);

export const CourierSettingsControllers = {
  createCourierSettings,
  getAllCourierSettings,
  getSingleCourierSettings,
  getCourierSettingsByProvider,
  updateCourierSettings,
  toggleCourierSettingsStatus,
  deleteCourierSettings,
};
