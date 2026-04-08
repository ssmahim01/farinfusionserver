import { Router } from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { categoryRoutes } from "../modules/category/category.route";
import { brandRoutes } from "../modules/brand/brand.route";
import { productRoutes } from "../modules/product/product.route";
import { leadRoutes } from "../modules/lead/lead.route";
import { orderRoutes } from "../modules/order/order.route";
import { courierRoutes } from "../modules/courier/courier.route";
import { posRoutes } from "../modules/pos/pos.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/category",
    route: categoryRoutes,
  },
  {
    path: "/brand",
    route: brandRoutes,
  },
  {
    path: "/product",
    route: productRoutes,
  },
  {
    path: "/lead",
    route: leadRoutes,
  },
  {
    path: "/order",
    route: orderRoutes,
  },
  {
    path: "/couriers",
    route: courierRoutes,
  },
  {
    path: "/pos",
    route: posRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
