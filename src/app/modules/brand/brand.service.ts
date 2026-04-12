import httpStatus from 'http-status-codes';
import AppError from '../../errorHelpers/appError';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { deleteImageFromCloudinary } from '../../config/cloudinary.config';
import { IBrand } from './brand.interface';
import { Brand } from './brand.model';
import { brandSearchableFields } from './brand.constants';


const createBrandService = async (payload: Partial<IBrand>) => {
    const isExistBrand = await Brand.findOne({ title: payload.title })
    if (isExistBrand) {
        throw new AppError(httpStatus.CONFLICT, "Brand already exist")
    }
    const brand = await Brand.create(payload);
    return brand;
};


const updateBrandService = async (
    brandId: string,
    payload: Partial<IBrand>
) => {
    const existingBrand = await Brand.findById(brandId);

    if (!existingBrand) {
        throw new AppError(httpStatus.NOT_FOUND, "Brand not found");
    }

    const updatedBrand = await Brand.findByIdAndUpdate(
        brandId,
        payload,
        { new: true, runValidators: true }
    );

    return updatedBrand;

};

const getSingleBrand = async (slug: string) => {
    const brand = await Brand.findOne({ slug });
    if (!brand) {
        throw new AppError(httpStatus.NOT_FOUND, "Brand Not Found")
    }
    return {
        data: brand
    }
};

const deleteBrand = async (id: string) => {

    const brand = await Brand.findById(id);
    if (!brand) {
        throw new AppError(httpStatus.NOT_FOUND, "Brand Not Found");
    }

    if (brand.image) {
        await deleteImageFromCloudinary(brand.image);
    }

    await Brand.findByIdAndDelete(id);

    return { data: null };
};


const getAllBrands = async (query: Record<string, string>) => {
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
        Brand.find({ isDeleted: false, ...queryObj }).sort({ createdAt: -1 }),
        query
    );

    const brandsQuery = queryBuilder
        .filter()
        .search(brandSearchableFields)
        .sort()
        .fields()
        .paginate()
        .build()
        .populate({
            path: "products",
            match: { isDeleted: false },
            select: "_id",
        });

    const [brands, meta] = await Promise.all([
        brandsQuery,
        queryBuilder.getMeta()
    ]);

    const data = brands.map((brand: any) => {
        const obj = brand.toObject();

        return {
            ...obj,
            productCount: obj.products?.length || 0,
            products: undefined,
        };
    });

    return { data, meta };
};


const getAllTrashBrands = async (query: Record<string, string>) => {
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
        Brand.find({ isDeleted: true, ...queryObj }).sort({ createdAt: -1 }),
        query
    );


    const brandsQuery = queryBuilder
        .filter()
        .search(brandSearchableFields)
        .sort()
        .fields()
        .paginate()
        .build()
        .populate({
            path: "products",
            match: { isDeleted: false },
            select: "_id",
        });

    const [brands, meta] = await Promise.all([
        brandsQuery,
        queryBuilder.getMeta()
    ]);

    // maping data
    const data = brands.map((brand: any) => {
        const obj = brand.toObject();

        return {
            ...obj,
            productCount: obj.products?.length || 0,
            products: undefined, // hide products
        };
    });

    return {
        data,
        meta
    };
};

export const BrandServices = {
    createBrandService,
    updateBrandService,
    getSingleBrand,
    deleteBrand,
    getAllBrands,
    getAllTrashBrands
}
