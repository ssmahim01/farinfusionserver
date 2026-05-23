/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/appError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { CourierSettings } from "./courierSettings.model";
import {
  ICourierSettings,
  CourierProvider,
} from "./courierSettings.interface";
import {
  courierSettingsPopulateFields,
  courierSettingsSearchableFields,
} from "./courierSettings.constant";

const createCourierSettings = async (
  payload: Partial<ICourierSettings>,
  user: JwtPayload,
) => {
  const existing = await CourierSettings.findOne({
    provider: payload.provider,
    isDeleted: false,
  });

  if (existing) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `${payload.provider} settings already exist`,
    );
  }

  payload.createdBy = user.userId;
  payload.updatedBy = user.userId;

  const result = await CourierSettings.create(payload);

  return await CourierSettings.findById(result._id).populate(
    courierSettingsPopulateFields,
  );
};

const getAllCourierSettings = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    CourierSettings.find({ isDeleted: false }).populate(
      courierSettingsPopulateFields,
    ),
    query,
  );

  const courierSettingsData = queryBuilder
    .filter()
    .search(courierSettingsSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    courierSettingsData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getSingleCourierSettings = async (id: string) => {
  const result = await CourierSettings.findOne({
    _id: id,
    isDeleted: false,
  }).populate(courierSettingsPopulateFields);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier settings not found");
  }

  return result;
};

const getCourierSettingsByProvider = async (provider: CourierProvider) => {
  const result = await CourierSettings.findOne({
    provider,
    isDeleted: false,
  }).populate(courierSettingsPopulateFields);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier settings not found");
  }

  return result;
};

const updateCourierSettings = async (
  id: string,
  payload: Partial<ICourierSettings>,
  user: JwtPayload,
) => {
  const existing = await CourierSettings.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier settings not found");
  }

  const updatedPayload: any = {
    ...payload,
    updatedBy: user.userId,
  };

  if (payload.config) {
    updatedPayload.$set = {};

    Object.entries(payload.config).forEach(([key, value]) => {
      updatedPayload.$set[`config.${key}`] = value;
    });

    delete updatedPayload.config;
  }

  const result = await CourierSettings.findByIdAndUpdate(
    id,
    updatedPayload,
    {
      new: true,
      runValidators: true,
    },
  ).populate(courierSettingsPopulateFields);

  return result;
};

const toggleCourierSettingsStatus = async (id: string, user: JwtPayload) => {
  const existing = await CourierSettings.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier settings not found");
  }

  existing.isActive = !existing.isActive;
  existing.updatedBy = user.userId;

  await existing.save();

  return await CourierSettings.findById(id).populate(
    courierSettingsPopulateFields,
  );
};

const deleteCourierSettings = async (id: string) => {
  const existing = await CourierSettings.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier settings not found");
  }

  existing.isDeleted = true;

  await existing.save();

  return null;
};

export const CourierSettingsServices = {
  createCourierSettings,
  getAllCourierSettings,
  getSingleCourierSettings,
  getCourierSettingsByProvider,
  updateCourierSettings,
  toggleCourierSettingsStatus,
  deleteCourierSettings,
};