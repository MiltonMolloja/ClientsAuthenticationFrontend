export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber?: string;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnd?: Date;
  lockoutEnabled: boolean;
  accessFailedCount: number;
  passwordChangedAt?: Date;
}

export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
}
