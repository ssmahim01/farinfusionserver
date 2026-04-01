import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { POSServices } from "./pos.service";

const createPOSOrder = async (req: Request, res: Response) => {
  const result = await POSServices.createPOSOrder(
    req.body,
    req.user.userId
  );

  res.status(httpStatus.CREATED).json({
    success: true,
    message: "POS Order created successfully",
    data: result,
  });
};

const getAllPOSOrders = async (_req: Request, res: Response) => {
  const result = await POSServices.getAllPOSOrders();

  res.status(200).json({
    success: true,
    data: result,
  });
};

const getSinglePOSOrder = async (req: Request, res: Response) => {
  const result = await POSServices.getSinglePOSOrder(req?.params?.id as string);

  res.status(200).json({
    success: true,
    data: result,
  });
};

const updatePOSOrderStatus = async (req: Request, res: Response) => {
  const result = await POSServices.updatePOSOrderStatus(
    req?.params?.id as string,
    req?.body?.status
  );

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const POSControllers = {
  createPOSOrder,
  getAllPOSOrders,
  getSinglePOSOrder,
  updatePOSOrderStatus,
};