export const courierSettingsSearchableFields = [
  "provider",
  "displayName",
  "notes",
  "pickupInfo.name",
  "pickupInfo.phone",
  "pickupInfo.address",
  "pickupInfo.area",
  "pickupInfo.city",
];

export const courierSettingsPopulateFields = [
  {
    path: "createdBy",
    select: "name email role phone",
  },
  {
    path: "updatedBy",
    select: "name email role phone",
  },
];