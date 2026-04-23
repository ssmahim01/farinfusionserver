import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { Permission } from "./permission.model";
import { User } from "../user/user.model";

const createPermission = async (payload: any) => {
  const exist = await Permission.findOne({ url: payload.url });

  if (exist) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Permission already exists for this route"
    );
  }

  const result = await Permission.create(payload);
  return result;
};

const getAllPermissions = async () => {
  const result = await Permission.find().sort({ createdAt: -1 });
  return result;
};

const assignPermissionsToUser = async (
  userId: string,
  permissionIds: string[]
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  user.permissions = permissionIds as any;

  await user.save();

  return user;
};

export const PermissionServices = {
  createPermission,
  getAllPermissions,
  assignPermissionsToUser,
};