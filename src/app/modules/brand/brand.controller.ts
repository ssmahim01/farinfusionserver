/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from 'http-status-codes';
import { NextFunction, Request, Response } from "express"
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { deleteImageFromCloudinary } from '../../config/cloudinary.config';
import AppError from '../../errorHelpers/appError';
import { BrandServices } from './brand.service';
import { Brand } from './brand.model';
import {CommonTrashService} from "../common/CommonTrashService";

const createBrand = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    if (req.file) {
        payload.image = (req.file as any).path;
    }

    const brand = await BrandServices.createBrandService(payload)

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Brand Created Successfully",
        data: brand
    })
})

const getSingleBrand = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const brandSlug = req.params.slug as string
    const result = await BrandServices.getSingleBrand(brandSlug);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Brand Retrieved Successfully",
        data: result.data
    })
})

const deleteBrand = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const brandId = req.params.id as string
    const result = await BrandServices.deleteBrand(brandId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Brand Deleted Successfully",
        data: result.data
    })
})

const updateBrand = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const brandId = req.params.id as string;
        const payload = req.body;

        // Find existing brand
        const existingBrand = await Brand.findById(brandId);

        if (!existingBrand) {
            throw new AppError(httpStatus.NOT_FOUND, "Brand not found");
        }

        // If new image uploaded
        if (req.file) {
            const newImage = (req.file as any).path;

            // Delete old image from cloudinary
            if (existingBrand.image) {
                await deleteImageFromCloudinary(existingBrand.image);
            }

            payload.image = newImage;
        }

        const brand = await BrandServices.updateBrandService(brandId, payload);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Brand Updated Successfully",
            data: brand,
        });
    }
);

const getAllBrands = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await BrandServices.getAllBrands(query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Brands Retrieved Successfully",
        data: result.data,
        meta: result.meta
    })
})

const getAllTrashBrands = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await BrandServices.getAllTrashBrands(query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Trash Brands Retrieved Successfully",
        data: result.data,
        meta: result.meta
    })
})

const updateBrandTrash = catchAsync(
    async (req: Request, res: Response) => {
        const id = req.params.id as string;

        // @ts-expect-error
        const Data = await CommonTrashService(id, Brand);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Product Trash Status Updated",
            data: Data,
        });
    }
);

export const BrandControllers = {
 createBrand,
 getSingleBrand,
 deleteBrand,
 updateBrand,
 getAllBrands,
 getAllTrashBrands,
    updateBrandTrash
}
