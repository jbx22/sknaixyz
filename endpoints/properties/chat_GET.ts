import { schema, OutputType } from "./chat_GET.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    // Parse input manually since it comes from query params
    const rawInput = {
      propertyId: searchParams.propertyId ? Number(searchParams.propertyId) : undefined,
    };

    const input = schema.parse(rawInput);

    // Get current user session (optional, but needed for canDelete logic)
    let currentUserId: number | null = null;
    let currentUserRole: string | null = null;
    try {
      const session = await getServerUserSession(request);
      currentUserId = session.user.id;
      currentUserRole = session.user.role;
    } catch (e) {
      // Ignore if not authenticated, user can still view chats
    }

    // We need to know who owns the property to determine canDelete permissions
    // Ideally we could join properties table, but let's do it in the main query or separate check.
    // Since we need to return canDelete for each message, and canDelete depends on if the viewer is admin OR property owner.
    // If viewer is admin, they can delete everything.
    // If viewer is property owner, they can delete everything on their property.
    // The requirement says: "canDelete should be true if the current user is the property owner or admin"
    // It doesn't explicitly say users can delete their own messages, but usually they can. 
    // However, strictly following: "Only property owner or admin can delete" from the delete endpoint requirements.
    
    // Let's fetch the property owner ID first to simplify the query logic if needed, 
    // or just join properties table.
    
    let query = db
      .selectFrom("propertyChats")
      .innerJoin("users", "propertyChats.userId", "users.id")
      .innerJoin("properties", "propertyChats.propertyId", "properties.id")
      .select([
        "propertyChats.id",
        "propertyChats.message",
        "propertyChats.createdAt",
        "propertyChats.userId",
        "users.displayName as userName",
        "users.avatarUrl as userAvatarUrl",
        "properties.userId as propertyOwnerId"
      ])
      .where("propertyChats.propertyId", "=", input.propertyId)
      .where((eb) => eb.or([
        eb("propertyChats.deletedByAdmin", "is", null),
        eb("propertyChats.deletedByAdmin", "=", false)
      ]))
      .orderBy("propertyChats.createdAt", "asc");

    const results = await query.execute();

    const messages = results.map((row) => {
      const isOwner = currentUserId === row.propertyOwnerId;
      const isAdmin = currentUserRole === "admin";
      
      return {
        id: row.id,
        message: row.message,
        userId: row.userId,
        userName: row.userName,
        userAvatarUrl: row.userAvatarUrl,
        createdAt: row.createdAt,
        canDelete: !!currentUserId && (isOwner || isAdmin),
      };
    });

    return new Response(superjson.stringify({ messages } satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}