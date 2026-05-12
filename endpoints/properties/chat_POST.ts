import { schema, OutputType } from "./chat_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 1_000_000) {
      // 1MB limit
      return new Response(
        superjson.stringify({ error: "Request payload too large" }),
        { status: 413 }
      );
    }

    // Authenticate user
    let currentUserId: number;
    let currentUser: { displayName: string; avatarUrl: string | null };
    
    try {
      const session = await getServerUserSession(request);
      currentUserId = session.user.id;
      currentUser = {
        displayName: session.user.displayName,
        avatarUrl: session.user.avatarUrl,
      };
    } catch (e) {
      throw new NotAuthenticatedError();
    }

    // Parse input
    const json = superjson.parse(body);
    const input = schema.parse(json);

    // Verify property exists
    const property = await db
      .selectFrom("properties")
      .select("id")
      .where("id", "=", input.propertyId)
      .executeTakeFirst();

    if (!property) {
      return new Response(
        superjson.stringify({ error: "العقار غير موجود" }), // Property not found
        { status: 404 }
      );
    }

    // Insert message
    const result = await db
      .insertInto("propertyChats")
      .values({
        propertyId: input.propertyId,
        userId: currentUserId,
        message: input.message,
        deletedByAdmin: false,
        updatedAt: new Date(), // Although schema says generated, good to be explicit if needed or rely on DB default
      })
      .returning(["id", "createdAt", "message", "userId"])
      .executeTakeFirstOrThrow();

    // Construct response with user info
    // Since we just inserted, we know the user info from session
    // canDelete is false for the creator unless they are also the owner/admin, 
    // but for immediate UI feedback we might need to check that.
    // However, usually the creator can't delete based on the specific requirement "Only property owner or admin can delete".
    // So we need to check if current user is property owner or admin.
    
    const propertyOwnerCheck = await db
        .selectFrom("properties")
        .select("userId")
        .where("id", "=", input.propertyId)
        .executeTakeFirst();
        
    const session = await getServerUserSession(request);
    const isOwner = propertyOwnerCheck?.userId === currentUserId;
    const isAdmin = session.user.role === "admin";
    const canDelete = isOwner || isAdmin;

    return new Response(
      superjson.stringify({
        message: {
          id: result.id,
          message: result.message,
          userId: result.userId,
          userName: currentUser.displayName,
          userAvatarUrl: currentUser.avatarUrl,
          createdAt: result.createdAt,
          canDelete: canDelete,
        }
      } satisfies OutputType)
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "يجب عليك تسجيل الدخول لإرسال رسالة" }), // You must be logged in to send a message
        { status: 401 }
      );
    }

    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "حدث خطأ غير معروف", // Unknown error
      }),
      { status: 400 }
    );
  }
}