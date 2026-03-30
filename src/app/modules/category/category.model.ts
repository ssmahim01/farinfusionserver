import { Schema, model, Types } from "mongoose";
import { CategoryStatus, ICategory } from "./category.interface";

const categorySchema = new Schema<ICategory>({
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
    status: {
        type: String,
        enum: Object.values(CategoryStatus),
        default: CategoryStatus.ACTIVE,
    },
    showOrder: {
        type: Number,
        default: 1,
        // unique: true,
    },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});

categorySchema.pre("save", async function (next) {

    if (this.isModified("title")) {
        const baseSlug = this.title.toLowerCase().split(" ").join("-")
        let slug = `${baseSlug}`

        let counter = 1;
        while (await Category.exists({ slug })) {
            slug = `${baseSlug}-${counter++}`
        }

        this.slug = slug;
    }
})

categorySchema.pre("findOneAndUpdate", async function (next) {
    const category = this.getUpdate() as Partial<ICategory>

    if (category.title) {
        const baseSlug = category.title.toLowerCase().split(" ").join("-")
        let slug = `${baseSlug}`

        let counter = 1;
        while (await Category.exists({ slug })) {
            slug = `${baseSlug}-${counter++}`;
        }

        category.slug = slug
    }

    this.setUpdate(category)

})

export const Category = model<ICategory>("Category", categorySchema)

