import type { IsoDateTime } from './api';

/** Someone you split expenses with. Not an app user. */
export type Contact = {
  id: string;
  name: string;
  /** Sum of this contact's PENDING shares on your split expenses. */
  owesYou: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type ContactInput = {
  name: string;
};
