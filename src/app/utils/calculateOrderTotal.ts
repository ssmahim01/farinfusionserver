/* eslint-disable @typescript-eslint/no-inferrable-types */
// import { Types } from "mongoose";
// import { Product } from "../modules/product/product.model";
// import { IOrderProduct } from "../modules/order/order.interface";

// export const calculateOrderPrice = async (products: IOrderProduct[]) => {

//   const productsWithPrice: IOrderProduct[] = [];
//   let totalPrice = 0;

//   for (const p of products) {

//     const productId = new Types.ObjectId(p.product);

//     const productDoc = await Product.findById(productId);

//     if (!productDoc) {
//       throw new Error(`Product not found: ${p.product}`);
//     }

//     // ---------- Base Price ----------
//     let unitPrice = productDoc.discountPrice
//       ? productDoc.discountPrice
//       : productDoc.price;

//     const lineTotal = unitPrice * p.quantity;

//     productsWithPrice.push({
//       product: productId,
//       quantity: p.quantity,
//       price: unitPrice,
//       lineTotal,
//     });

//     totalPrice += lineTotal;
//   }

//   return {
//     productsWithPrice,
//     totalPrice,
//   };
// };

import { Types } from "mongoose";
import { Product } from "../modules/product/product.model";
import { IOrderProduct } from "../modules/order/order.interface";

export const calculateOrderPrice = async (
  products: IOrderProduct[],
  shippingCost: number = 0
) => {

  const productsWithPrice: IOrderProduct[] = [];
  let subtotal = 0;

  for (const p of products) {

    const productId = new Types.ObjectId(p.product);

    const productDoc = await Product.findById(productId);

    if (!productDoc) {
      throw new Error(`Product not found: ${p.product}`);
    }

    // ---------- Base Price ----------
    const unitPrice = productDoc.discountPrice
      ? productDoc.discountPrice
      : productDoc.price;

    const lineTotal = unitPrice * p.quantity;

    productsWithPrice.push({
      product: productId,
      quantity: p.quantity,
      price: unitPrice,
      lineTotal,
    });

    subtotal += lineTotal;
  }

  const totalPrice = subtotal + shippingCost;

  return {
    productsWithPrice,
    subtotal,
    shippingCost,
    totalPrice,
  };
};