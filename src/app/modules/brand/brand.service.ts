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
    const queryBuilder = new QueryBuilder(
        Brand.find({ isDeleted: false }).sort({ createdAt: -1 }),
        query
    );
    const brandsData = queryBuilder
        .filter()
        .search(brandSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        brandsData.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
};

const getAllTrashBrands = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        Brand.find({ isDeleted: true }).sort({ createdAt: -1 }),
        query
    );
    const brandsData = queryBuilder
        .filter()
        .search(brandSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        brandsData.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
};

export const BrandServices = {
    createBrandService,
    updateBrandService,
    getSingleBrand,
    deleteBrand,
    getAllBrands,
    getAllTrashBrands
}
