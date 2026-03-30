// import { z } from "zod";
// import { OrderStatus, DeliveryStatus, OrderType } from "./order.interface";

// export const createOrderZodSchema = z.object({

//   orderId: z
//     .string({ invalid_type_error: "OrderId must be a string" })
//     .min(1, { message: "OrderId is required" }).optional(),

//   orderType: z.enum([OrderType.POS, OrderType.ONLINE], {
//     invalid_type_error: "Order type must be POS or ONLINE",
//   }),

//   user: z.string().optional(),

//   billingDetails: z.object({
//     fullName: z.string().min(1, "Full name is required"),
//     phone: z.string().min(1, "Phone is required"),
//     email: z.string().email("Invalid email"),
//     address: z.string().min(1, "Address is required"),
//   }).optional(),

//   products: z.array(
//     z.object({
//       product: z.string({
//         required_error: "Product id is required",
//       }),
//       quantity: z.preprocess(
//         (val) => {
//           if (typeof val === "string") return Number(val);
//           return val;
//         },
//         z
//           .number({ invalid_type_error: "Quantity must be a number" })
//           .int("Quantity must be an integer")
//           .positive("Quantity must be positive")
//       ),

//       price: z.preprocess(
//         (val) => {
//           if (typeof val === "string") return Number(val);
//           return val;
//         },
//         z
//           .number({ invalid_type_error: "Price must be a number" })
//           .positive("Price must be positive")
//       ),
//     })
//   ),

//   subtotal: z.preprocess(
//     (val) => {
//       if (typeof val === "string") return Number(val);
//       return val;
//     },
//     z.number({ invalid_type_error: "Subtotal must be a number" })
//   ),

//   shippingCost: z.preprocess(
//     (val) => {
//       if (typeof val === "string") return Number(val);
//       return val;
//     },
//     z.number({ invalid_type_error: "Shipping cost must be a number" }).optional()
//   ),

//   total: z.preprocess(
//     (val) => {
//       if (typeof val === "string") return Number(val);
//       return val;
//     },
//     z.number({ invalid_type_error: "Total must be a number" })
//   ),

//   transactionId: z
//     .string({ invalid_type_error: "TransactionId must be a string" })
//     .optional(),

//   payment: z
//     .string({ invalid_type_error: "Payment must be a string" })
//     .optional(),

//   courierName: z
//     .string({ invalid_type_error: "Courier name must be a string" })
//     .optional(),

//   trackingNumber: z
//     .string({ invalid_type_error: "Tracking number must be a string" })
//     .optional(),

//   orderStatus: z
//     .enum(
//       [
//         OrderStatus.PENDING,
//         OrderStatus.CONFIRMED,
//         OrderStatus.PROCESSING,
//         OrderStatus.SHIPPED,
//         OrderStatus.DELIVERED,
//         OrderStatus.CANCELLED,
//       ],
//       {
//         invalid_type_error: "Invalid order status",
//       }
//     )
//     .optional(),

//   deliveryStatus: z
//     .enum(
//       [
//         DeliveryStatus.NOT_SHIPPED,
//         DeliveryStatus.IN_TRANSIT,
//         DeliveryStatus.DELIVERED,
//         DeliveryStatus.RETURNED,
//       ],
//       {
//         invalid_type_error: "Invalid delivery status",
//       }
//     )
//     .optional(),
//       seller: z.string().optional(),
// });


// export const updateOrderZodSchema = z.object({

//   orderId: z
//     .string({ invalid_type_error: "OrderId must be a string" })
//     .min(1, { message: "OrderId cannot be empty" })
//     .optional(),

//   orderType: z
//     .enum([OrderType.POS, OrderType.ONLINE], {
//       invalid_type_error: "Order type must be POS or ONLINE",
//     })
//     .optional(),

//   user: z.string().optional(),

//   billingDetails: z.object({
//     fullName: z.string().min(1, "Full name is required").optional(),
//     phone: z.string().min(1, "Phone is required").optional(),
//     email: z.string().email("Invalid email").optional(),
//     address: z.string().min(1, "Address is required").optional(),
//   }).optional(),

//   products: z.array(
//     z.object({
//       product: z.string({
//         invalid_type_error: "Product id must be string",
//       }).optional(),

//       quantity: z.preprocess(
//         (val) => {
//           if (typeof val === "string") return Number(val);
//           return val;
//         },
//         z
//           .number({ invalid_type_error: "Quantity must be a number" })
//           .int("Quantity must be an integer")
//           .positive("Quantity must be positive")
//           .optional()
//       ),

//       price: z.preprocess(
//         (val) => {
//           if (typeof val === "string") return Number(val);
//           return val;
//         },
//         z
//           .number({ invalid_type_error: "Price must be a number" })
//           .positive("Price must be positive")
//           .optional()
//       ),
//     })
//   ).optional(),

//   subtotal: z.preprocess(
//     (val) => {
//       if (typeof val === "string") return Number(val);
//       return val;
//     },
//     z.number({ invalid_type_error: "Subtotal must be a number" }).optional()
//   ),

//   shippingCost: z.preprocess(
//     (val) => {
//       if (typeof val === "string") return Number(val);
//       return val;
//     },
//     z.number({ invalid_type_error: "Shipping cost must be a number" }).optional()
//   ),

//   total: z.preprocess(
//     (val) => {
//       if (typeof val === "string") return Number(val);
//       return val;
//     },
//     z.number({ invalid_type_error: "Total must be a number" }).optional()
//   ),

//   transactionId: z
//     .string({ invalid_type_error: "TransactionId must be a string" })
//     .optional(),

//   payment: z
//     .string({ invalid_type_error: "Payment must be a string" })
//     .optional(),

//   courierName: z
//     .string({ invalid_type_error: "Courier name must be a string" })
//     .optional(),

//   trackingNumber: z
//     .string({ invalid_type_error: "Tracking number must be a string" })
//     .optional(),

//   orderStatus: z
//     .enum(
//       [
//         OrderStatus.PENDING,
//         OrderStatus.CONFIRMED,
//         OrderStatus.PROCESSING,
//         OrderStatus.SHIPPED,
//         OrderStatus.DELIVERED,
//         OrderStatus.CANCELLED,
//       ],
//       {
//         invalid_type_error: "Invalid order status",
//       }
//     )
//     .optional(),

//   deliveryStatus: z
//     .enum(
//       [
//         DeliveryStatus.NOT_SHIPPED,
//         DeliveryStatus.IN_TRANSIT,
//         DeliveryStatus.DELIVERED,
//         DeliveryStatus.RETURNED,
//       ],
//       {
//         invalid_type_error: "Invalid delivery status",
//       }
//     )
//     .optional(),
// });
