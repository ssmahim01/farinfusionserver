/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from 'http-status-codes';
import { IUser, Role } from "./user.interface";
import { User } from "./user.model";
import AppError from '../../errorHelpers/appError';
import bcryptjs from "bcryptjs";
import { envVars } from '../../config/env';
import { JwtPayload } from 'jsonwebtoken';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { userSearchableFields } from './user.constants copy';
import { Order } from '../order/order.model';

const createUserService = async (payload: Partial<IUser>) => {
    const { email, password, ...rest } = payload;

    const isExistUser = await User.findOne({ email })

    if (isExistUser) {
        throw new AppError(httpStatus.BAD_REQUEST, "User already exist")
    }

    const hashPassword = await bcryptjs.hash(password as string, 10)
    const user = await User.create({
        email,
        password: hashPassword,
        ...rest
    })

    const { password: _, ...userWithoutPassword } = user.toObject();

    return userWithoutPassword;

}

const getMe = async (userId: string) => {
    const user = await User.findById(userId).select("-password");
    return {
        data: user
    }
};

const getSingleUser = async (id: string) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Not Found")
    }
    return {
        data: user
    }
};

const updateUser = async (
    userId: string,
    payload: Partial<IUser>,
    decodedToken: JwtPayload
) => {
    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Without Admin Role Restrictions
    if (decodedToken.role !== Role.ADMIN) {
        if (userId !== decodedToken.userId) {
            throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized to update this user.");
        }

        if (payload.password) {
            throw new AppError(httpStatus.BAD_REQUEST, "You cannot update your password here.");
        }

        if (payload.role || payload.isActive || payload.isDeleted || payload.isVerified) {
            throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to modify these fields.");
        }
    }

    if (payload.password) {
        const hashedPassword = await bcryptjs.hash(payload.password, Number(envVars.BCRYPT_SALT_ROUND))
        payload.password = hashedPassword;
    }

    // No restrictions for Admin — directly update
    const updatedUser = await User.findByIdAndUpdate(userId, payload, {
        new: true,
        runValidators: true,
    });

    return updatedUser;
};

const getMyCustomers = async (
  userId: string,
  query: Record<string, string>
) => {
    const queryObj: any = {};

    // DATE FILTER
    if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
        queryObj.createdAt = {};

        if (query["createdAt[gte]"]) {
            queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
        }

        if (query["createdAt[lte]"]) {
            queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
        }
    }

    // REMOVE SPECIAL FIELDS
    delete query["createdAt[gte]"];
    delete query["createdAt[lte]"];

  const orders = await Order.find({
    seller: userId,
    isDeleted: false,
      ... queryObj,
  })
    .populate("customer", "name email phone address")
    .select("customer billingDetails");

  const customerMap = new Map();

  orders.forEach((order) => {
    if (order.customer?._id) {
      customerMap.set(order.customer._id.toString(), order.customer);
    }

    else if (order.billingDetails?.email) {
      customerMap.set(order.billingDetails.email, {
        name: order.billingDetails.fullName,
        email: order.billingDetails.email,
        phone: order.billingDetails.phone,
        address: order.billingDetails.address,
      });
    }
  });

  const customers = Array.from(customerMap.values());

  return {
    data: customers,
    meta: {
      total: customers.length,
    },
  };
};

const deleteUser = async (id: string) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Not Found")
    }

    await User.findByIdAndDelete(id);

    return {
        data: null
    }
};

const getAllUsers = async (query: Record<string, string>) => {
    const queryObj: any = {};

    // DATE FILTER
    if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
        queryObj.createdAt = {};

        if (query["createdAt[gte]"]) {
            queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
        }

        if (query["createdAt[lte]"]) {
            queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
        }
    }

    // REMOVE SPECIAL FIELDS
    delete query["createdAt[gte]"];
    delete query["createdAt[lte]"];

    const queryBuilder = new QueryBuilder(
        User.find({ role: { $ne: "CUSTOMER" }, isDeleted: false, ...queryObj }),
        query
    );
    const usersData = queryBuilder
        .filter()
        .search(userSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        usersData.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
};
const getAllTrashUsers = async (query: Record<string, string>) => {
    const queryObj: any = {};

    // DATE FILTER
    if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
        queryObj.createdAt = {};

        if (query["createdAt[gte]"]) {
            queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
        }

        if (query["createdAt[lte]"]) {
            queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
        }
    }

    // REMOVE SPECIAL FIELDS
    delete query["createdAt[gte]"];
    delete query["createdAt[lte]"];

    const queryBuilder = new QueryBuilder(
        User.find({ role: { $ne: "CUSTOMER" }, isDeleted: true, ...queryObj }),
        query
    );
    const usersData = queryBuilder
        .filter()
        .search(userSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        usersData.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
};

const getAllCustomers = async (query: Record<string, string>) => {
    const queryObj: any = {};

    // DATE FILTER
    if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
        queryObj.createdAt = {};

        if (query["createdAt[gte]"]) {
            queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
        }

        if (query["createdAt[lte]"]) {
            queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
        }
    }

    // REMOVE SPECIAL FIELDS
    delete query["createdAt[gte]"];
    delete query["createdAt[lte]"];

    const queryBuilder = new QueryBuilder(
        User.find({ role: "CUSTOMER", isDeleted: false, ...queryObj }),
        query
    );

    const usersData = queryBuilder
        .filter()
        .search(userSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        usersData.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
};

const getAllTrashCustomers = async (query: Record<string, string>) => {
    const queryObj: any = {};

    // DATE FILTER
    if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
        queryObj.createdAt = {};

        if (query["createdAt[gte]"]) {
            queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
        }

        if (query["createdAt[lte]"]) {
            queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
        }
    }

    // REMOVE SPECIAL FIELDS
    delete query["createdAt[gte]"];
    delete query["createdAt[lte]"];

    const queryBuilder = new QueryBuilder(
        User.find({ role: "CUSTOMER", isDeleted: true, ...queryObj }),
        query
    );

    const usersData = queryBuilder
        .filter()
        .search(userSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        usersData.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
};

const updateProfile = async (payload: Partial<IUser>, decodedToken: JwtPayload) => {
    const user = await User.findById(decodedToken.userId);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (payload.password) {
        throw new AppError(httpStatus.FORBIDDEN, "You can't change your password here");
    }

    const updatedUser = await User.findByIdAndUpdate(decodedToken.userId, payload, {
        new: true,
        runValidators: true,
    });
    return {
        data: updatedUser
    }
}

export const UserServices = {
    createUserService,
    getMe,
    getSingleUser,
    updateUser,
    updateProfile,
    getAllUsers,
    getAllTrashUsers,
    getAllCustomers,
    getAllTrashCustomers,
    getMyCustomers,
    deleteUser
}
