import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { JwtPayload } from "jsonwebtoken";
import { Review } from "./review.model";
import { Product } from "../product/product.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { reviewSearchableFields } from "./review.constants";
import { IReview, ReviewStatus } from "./review.interface";
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";

const createReview = async (payload: Partial<IReview>, user: JwtPayload) => {
  const product = await Product.findById(payload.product);

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  const review = await Review.create({
    ...payload,
    createdBy: user.userId,
  });

  return review;
};

const getSingleReview = async (id: string) => {
  const review = await Review.findById(id)
    .populate("product", "title slug images")
    .populate("createdBy", "name email");

  if (!review || review.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  return {
    data: review,
  };
};

const getAllReviews = async (query: Record<string, string>) => {
  const reviewQuery: any = {
    isDeleted: false,
  };

  if (query.status) {
    reviewQuery.status = query.status;
  }

  if (query.product) {
    reviewQuery.product = query.product;
  }

  if (query.reviewSource) {
    reviewQuery.reviewSource = query.reviewSource;
  }

  delete query.status;
  delete query.product;
  delete query.reviewSource;

  const queryBuilder = new QueryBuilder(
    Review.find(reviewQuery)
      .populate("product", "title slug images")
      .populate("createdBy", "name email"),
    query,
  );

  const reviewsData = queryBuilder
    .filter()
    .search(reviewSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    reviewsData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getProductReviews = async (productId: string) => {
  const reviews = await Review.find({
    product: productId,
    status: ReviewStatus.APPROVED,
    isDeleted: false,
  })
    .populate("product", "title slug images")
    .sort({ createdAt: -1 });

  return {
    data: reviews,
  };
};

const updateReview = async (reviewId: string, payload: Partial<IReview>) => {
  const review = await Review.findById(reviewId);

  if (!review || review.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  const updatedReview = await Review.findByIdAndUpdate(reviewId, payload, {
    new: true,
    runValidators: true,
  });

  return updatedReview;
};

const approveReview = async (reviewId: string) => {
  const review = await Review.findById(reviewId);

  if (!review || review.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  review.status = ReviewStatus.APPROVED;

  await review.save();

  return review;
};

const rejectReview = async (reviewId: string) => {
  const review = await Review.findById(reviewId);

  if (!review || review.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  review.status = ReviewStatus.REJECTED;

  await review.save();

  return review;
};

const deleteReview = async (reviewId: string) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  if (review.reviewImage) {
    try {
      await deleteImageFromCloudinary(review.reviewImage);
    } catch {}
  }

  review.isDeleted = true;

  await review.save();

  return {
    data: null,
  };
};

const getReviewStats = async () => {
  const totalReviews = await Review.countDocuments({
    isDeleted: false,
  });

  const approvedReviews = await Review.countDocuments({
    status: ReviewStatus.APPROVED,
    isDeleted: false,
  });

  const pendingReviews = await Review.countDocuments({
    status: ReviewStatus.PENDING,
    isDeleted: false,
  });

  const rejectedReviews = await Review.countDocuments({
    status: ReviewStatus.REJECTED,
    isDeleted: false,
  });

  const ratings = await Review.aggregate([
    {
      $match: {
        isDeleted: false,
        status: ReviewStatus.APPROVED,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: {
          $avg: "$rating",
        },
      },
    },
  ]);

  return {
    totalReviews,
    approvedReviews,
    pendingReviews,
    rejectedReviews,
    averageRating: ratings[0]?.averageRating || 0,
  };
};

export const ReviewServices = {
  createReview,
  getSingleReview,
  getAllReviews,
  getProductReviews,
  updateReview,
  approveReview,
  rejectReview,
  deleteReview,
  getReviewStats,
};
