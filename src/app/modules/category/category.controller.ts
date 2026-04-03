/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from 'http-status-codes';
import { NextFunction, Request, Response } from "express"

import { CategoryServices } from './category.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { deleteImageFromCloudinary } from '../../config/cloudinary.config';
import AppError from '../../errorHelpers/appError';
import { Category } from './category.model';
import {CommonTrashService} from "../common/CommonTrashService";

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    if (req.file) {
        payload.image = (req.file as any).path;
    }

    const category = await CategoryServices.createCategoryService(payload)

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Category Created Successfully",
        data: category
    })
})

const getSingleCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const categorySlug = req.params.slug as string
    const result = await CategoryServices.getSingleCategory(categorySlug);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category Retrieved Successfully",
        data: result.data
    })
})

const deleteCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const categoryId = req.params.id as string
    const result = await CategoryServices.deleteCategory(categoryId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category Deleted Successfully",
        data: result.data
    })
})

const updateCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const categoryId = req.params.id as string;
        const payload = req.body;

        // Find existing category
        const existingCategory = await Category.findById(categoryId);

        if (!existingCategory) {
            throw new AppError(httpStatus.NOT_FOUND, "Category not found");
        }

        // If new image uploaded
        if (req.file) {
            const newImage = (req.file as any).path;

            // Delete old image from cloudinary
            if (existingCategory.image) {
                await deleteImageFromCloudinary(existingCategory.image);
            }

            payload.image = newImage;
        }

        const category = await CategoryServices.updateCategory(categoryId, payload);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Category Updated Successfully",
            data: category,
        });
    }
);

const getAllCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await CategoryServices.getAllCategories(query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Categories Retrieved Successfully",
        data: result.data,
        meta: result.meta
    })
})

const getAllTrashCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await CategoryServices.getAllTrashCategories(query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Trash Categories Retrieved Successfully",
        data: result.data,
        meta: result.meta
    })
})

const updateCategoryTrash = catchAsync(
    async (req: Request, res: Response) => {
        const id = req.params.id as string;

        // @ts-expect-error
        const Data = await CommonTrashService(id, Category);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Trash Status Updated",
            data: Data,
        });
    }
);

export const CategoryControllers = {
    createCategory,
    getSingleCategory,
    deleteCategory,
    updateCategory,
    getAllCategories,
    getAllTrashCategories,
    updateCategoryTrash,
}
