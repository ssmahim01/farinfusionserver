import { CourierName } from "../courier.interface";
import { PathaoProvider } from "./pathao.provider";
import { SteadfastProvider } from "./steadfast.provider";

export const getCourierProvider = (
  courierName: CourierName,
) => {
  switch (courierName) {
    case CourierName.STEADFAST:
      return SteadfastProvider;

    case CourierName.PATHAO:
      return PathaoProvider;

    default:
      throw new Error("Unsupported courier provider");
  }
};