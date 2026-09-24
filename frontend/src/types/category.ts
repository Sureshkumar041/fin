import type { IsoDateTime } from './api';

export type Category = {
  id: string;
  name: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type CategoryInput = {
  name: string;
};
