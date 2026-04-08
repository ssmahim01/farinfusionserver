import { Schema, model, Types } from "mongoose";
import { BrandStatus, IBrand } from "./brand.interface";

const brandSchema = new Schema<IBrand>({
    title: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    slug: {
        type: String,
        unique: true,
        index: true
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    productCount : {
      type: Number,
    },
    status: {
        type: String,
        enum: Object.values(BrandStatus),
        default: BrandStatus.ACTIVE,
    },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});

brandSchema.virtual("products", {
    ref: "Product",
    localField: "_id",
    foreignField: "brand",
});

brandSchema.set("toObject", { virtuals: true });
brandSchema.set("toJSON", { virtuals: true });

brandSchema.pre("save", async function (next) {

    if (this.isModified("title")) {
        const baseSlug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        let slug = `${baseSlug}`

        let counter = 1;
        while (await Brand.exists({ slug })) {
            slug = `${baseSlug}-${counter++}`
        }

        this.slug = slug;
    }
})

brandSchema.pre("findOneAndUpdate", async function (next) {
    const brand = this.getUpdate() as Partial<IBrand>

    if (brand.title) {
        const baseSlug = brand.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        let slug = `${baseSlug}`

        let counter = 1;
        while (await Brand.exists({ slug })) {
            slug = `${baseSlug}-${counter++}`;
        }

        brand.slug = slug
    }

    this.setUpdate(brand)

})

export const Brand = model<IBrand>("Brand", brandSchema)

