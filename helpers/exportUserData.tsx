import { db } from "./db";
import type { UserExportData } from "./UserExportDataType";

/**
 * Gathers all data associated with a specific user for GDPR export compliance.
 * 
 * @param userId The ID of the user to export data for
 * @returns A comprehensive object containing all user data
 */
export async function exportUserData(userId: number): Promise<UserExportData> {
  // 1. Fetch User Profile
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", userId)
    .executeTakeFirst();

  // 2. Fetch User's Properties
  const properties = await db
    .selectFrom("properties")
    .selectAll()
    .where("userId", "=", userId)
    .execute();

  // 3. Fetch User's Favorites with Property Details
  const favorites = await db
    .selectFrom("userFavorites")
    .innerJoin("properties", "userFavorites.propertyId", "properties.id")
    .select([
      "userFavorites.id",
      "userFavorites.userId",
      "userFavorites.propertyId",
      "userFavorites.createdAt",
      // Select all property fields as a nested object or flattened. 
      // Kysely returns flattened by default, so we'll fetch property data separately or map it.
      // To keep it clean and typed, let's fetch the join and map it manually or just select specific fields.
      // However, for a data export, we want raw data.
      // Let's do a separate query approach for cleaner typing or use json_build_object if we were writing raw SQL.
      // Since we want "with property details", let's just fetch the favorites and then for each, the property.
      // Actually, a join is better for performance.
    ])
    .selectAll("properties") // This might cause name collisions if not careful.
    .where("userFavorites.userId", "=", userId)
    .execute();

  // Re-fetching favorites to structure them properly to avoid collision issues in a simple way
  // or we can just select columns carefully.
  // Let's try a cleaner approach: fetch favorites, then fetch properties for those favorites.
  const rawFavorites = await db
    .selectFrom("userFavorites")
    .selectAll()
    .where("userId", "=", userId)
    .execute();

  const favoritePropertyIds = rawFavorites.map(f => f.propertyId);
  
  const favoriteProperties = favoritePropertyIds.length > 0 
    ? await db
        .selectFrom("properties")
        .selectAll()
        .where("id", "in", favoritePropertyIds)
        .execute()
    : [];

  const favoritesWithDetails = rawFavorites.map(fav => ({
    ...fav,
    property: favoriteProperties.find(p => p.id === fav.propertyId) || null
  }));

  // 4. Fetch Chat Messages
  const chats = await db
    .selectFrom("propertyChats")
    .selectAll()
    .where("userId", "=", userId)
    .execute();

  // 5. Fetch Subscription History
  const subscriptions = await db
    .selectFrom("subscriptionPayments")
    .selectAll()
    .where("userId", "=", userId)
    .orderBy("createdAt", "desc")
    .execute();

  // 6. Fetch OAuth Accounts
  const oauthAccounts = await db
    .selectFrom("oauthAccounts")
    .selectAll()
    .where("userId", "=", userId)
    .execute();

  return {
    profile: user || null,
    properties,
    favorites: favoritesWithDetails,
    chats,
    subscriptions,
    oauthAccounts,
    generatedAt: new Date()
  };
}