import type { IsoDateTime } from './api';

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: IsoDateTime;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
