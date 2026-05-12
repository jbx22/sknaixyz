import { schema, OutputType } from "./delete_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    // Authenticate user
    let currentUserId: number;
    let currentUserRole: string;
    try {
      const session = await getServerUserSession(request);
      currentUserId = session.user.id;
      currentUserRole = session.user.role;
    } catch (e) {
      throw new NotAuthenticatedError();
    }

    // Parse input
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Check permissions
    // We need to find the property associated with this chat to check ownership
    const chatInfo = await db
      .selectFrom("propertyChats")
      .innerJoin("properties", "propertyChats.propertyId", "properties.id")
      .select(["properties.userId as ownerId", "propertyChats.id"])
      .where("propertyChats.id", "=", input.chatId)
      .executeTakeFirst();

    if (!chatInfo) {
      return new Response(
        superjson.stringify({ error: "الرسالة غير موجودة" }), // Message not found
        { status: 404 }
      );
    }

    const isOwner = chatInfo.ownerId === currentUserId;
    const isAdmin = currentUserRole === "admin";

    if (!isOwner && !isAdmin) {
      return new Response(
        superjson.stringify({ error: "ليس لديك صلاحية لحذف هذه الرسالة" }), // You don't have permission to delete this message
        { status: 403 }
      );
    }

    // Soft delete
    await db
      .updateTable("propertyChats")
      .set({ deletedByAdmin: true })
      .where("id", "=", input.chatId)
      .execute();

    return new Response(
      superjson.stringify({ success: true, message: "تم حذف الرسالة بنجاح" } satisfies OutputType)
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "يجب عليك تسجيل الدخول" }), // You must be logged in
        { status: 401 }
      );
    }

    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "حدث خطأ غير معروف",
      }),
      { status: 400 }
    );
  }
}