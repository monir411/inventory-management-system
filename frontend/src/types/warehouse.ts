export type Warehouse = {
  id: string;
  name: string;
  code?: string | null;
  note?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type WarehouseFormInput = {
  name: string;
  code?: string;
  note?: string;
  isActive?: boolean;
};
