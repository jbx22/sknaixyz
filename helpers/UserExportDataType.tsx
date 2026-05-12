/**
 * Type definitions for user data export.
 * This file contains ONLY types and is safe to import from both frontend and backend.
 * No runtime code or backend dependencies.
 */

export type UserExportProfile = {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
  role: string;
  subscriptionTier: string;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type UserExportProperty = {
  [key: string]: unknown;
  id: number;
  userId: number;
  title: string;
  description: string | null;
  price: string | number;
  propertyType: string;
  locationName: string;
  latitude: string | number;
  longitude: string | number;
  areaSqm: string | number;
  bedrooms: number | null;
  bathrooms: string | number | null;
  floorNumber: number | null;
  yearBuilt: number | null;
  furnished: boolean | null;
  zipCode: string | null;
  amenities: string[] | null;
  images: string[] | null;
  status: string;
  isFeatured: boolean;
  contactPhone: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type UserExportFavorite = {
  id: number;
  userId: number;
  propertyId: number;
  createdAt: Date | null;
  property: UserExportProperty | null;
};

export type UserExportChat = {
  id: number;
  userId: number;
  propertyId: number;
  message: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedByAdmin: boolean | null;
};

export type UserExportSubscription = {
  id: number;
  userId: number;
  tier: string;
  paymentStatus: string;
  amount: string | number;
  currency: string;
  paymentMethod: string | null;
  transactionId: string | null;
  startedAt: Date;
  expiresAt: Date;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type UserExportOAuthAccount = {
  id: number;
  userId: number;
  provider: string;
  providerUserId: string;
  providerEmail: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type UserExportData = {
  profile: UserExportProfile | null;
  properties: UserExportProperty[];
  favorites: UserExportFavorite[];
  chats: UserExportChat[];
  subscriptions: UserExportSubscription[];
  oauthAccounts: UserExportOAuthAccount[];
  generatedAt: Date;
};