import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPropertyChat } from "../endpoints/properties/chat_GET.schema";
import { postPropertyChat } from "../endpoints/properties/chat_POST.schema";
import { deletePropertyChat } from "../endpoints/properties/chat/delete_POST.schema";
import { useLanguage } from "./useLanguage";

export const PROPERTY_CHAT_QUERY_KEY = "propertyChat";

export const usePropertyChatQuery = (propertyId: number) => {
  return useQuery({
    queryKey: [PROPERTY_CHAT_QUERY_KEY, propertyId],
    queryFn: () => getPropertyChat({ propertyId }),
    refetchInterval: 10000, // Poll every 10 seconds for new messages
  });
};

export const usePostChatMutation = (propertyId: number) => {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (message: string) => postPropertyChat({ propertyId, message }),
    onSuccess: (data) => {
      // Optimistically update the cache or just invalidate
      queryClient.setQueryData(
        [PROPERTY_CHAT_QUERY_KEY, propertyId],
        (oldData: any) => {
          if (!oldData) return { messages: [data.message] };
          return {
            ...oldData,
            messages: [...oldData.messages, data.message],
          };
        }
      );
      
      // Optional: Invalidate to ensure consistency
      queryClient.invalidateQueries({
        queryKey: [PROPERTY_CHAT_QUERY_KEY, propertyId],
      });
    },
    onError: (error) => {
      toast.error(
        language === "ar"
          ? "فشل إرسال الرسالة: " + error.message
          : "Failed to send message: " + error.message
      );
    },
  });
};

export const useDeleteChatMutation = (propertyId: number) => {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (chatId: number) => deletePropertyChat({ chatId }),
    onSuccess: () => {
      toast.success(
        language === "ar" ? "تم حذف الرسالة بنجاح" : "Message deleted successfully"
      );
      queryClient.invalidateQueries({
        queryKey: [PROPERTY_CHAT_QUERY_KEY, propertyId],
      });
    },
    onError: (error) => {
      toast.error(
        language === "ar"
          ? "فشل حذف الرسالة: " + error.message
          : "Failed to delete message: " + error.message
      );
    },
  });
};