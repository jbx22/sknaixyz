import React, { useEffect, useRef, useState } from "react";
import { Send, Trash2, MessageSquare, User as UserIcon } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import {
  usePropertyChatQuery,
  usePostChatMutation,
  useDeleteChatMutation,
} from "../helpers/usePropertyChat";
import { Button } from "./Button";
import { Input } from "./Input";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import { Skeleton } from "./Skeleton";
import { Link } from "react-router-dom";
import styles from "./PropertyChat.module.css";

interface PropertyChatProps {
  propertyId: number;
  className?: string;
}

export const PropertyChat: React.FC<PropertyChatProps> = ({
  propertyId,
  className,
}) => {
  const { authState } = useAuth();
  const { language } = useLanguage();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = usePropertyChatQuery(propertyId);
  const postMutation = usePostChatMutation(propertyId);
  const deleteMutation = useDeleteChatMutation(propertyId);

  const messages = data?.messages || [];
  const isAuthenticated = authState.type === "authenticated";
  const currentUserId =
    authState.type === "authenticated" ? authState.user.id : null;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    postMutation.mutate(message, {
      onSuccess: () => {
        setMessage("");
      },
    });
  };

  const handleDeleteMessage = (chatId: number) => {
    if (confirm(language === "ar" ? "هل أنت متأكد؟" : "Are you sure?")) {
      deleteMutation.mutate(chatId);
    }
  };

  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", {
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  const translations = {
    header: language === "ar" ? "المحادثة العامة" : "Public Chat",
    placeholder: language === "ar" ? "اكتب رسالتك..." : "Write your message...",
    send: language === "ar" ? "إرسال" : "Send",
    login: language === "ar" ? "تسجيل الدخول للمشاركة" : "Login to participate",
    empty: language === "ar" ? "لا توجد رسائل بعد" : "No messages yet",
    sending: language === "ar" ? "جاري الإرسال..." : "Sending...",
    error: language === "ar" ? "حدث خطأ في تحميل الرسائل" : "Error loading messages",
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <div className={styles.header}>
        <MessageSquare size={20} className={styles.headerIcon} />
        <h3 className={styles.title}>{translations.header}</h3>
      </div>

      <div className={styles.messagesContainer}>
        {isLoading ? (
          <div className={styles.loadingState}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonWrapper}>
                <Skeleton className={styles.avatarSkeleton} />
                <div className={styles.contentSkeleton}>
                  <Skeleton className={styles.nameSkeleton} />
                  <Skeleton className={styles.textSkeleton} />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className={styles.errorState}>{translations.error}</div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{translations.empty}</p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((msg) => {
              const isMe = currentUserId === msg.userId;
              return (
                <div
                  key={msg.id}
                  className={`${styles.messageItem} ${
                    isMe ? styles.messageItemMe : styles.messageItemOther
                  }`}
                >
                  <Avatar className={styles.avatar}>
                    <AvatarImage src={msg.userAvatarUrl || undefined} />
                    <AvatarFallback>
                      <UserIcon size={16} />
                    </AvatarFallback>
                  </Avatar>

                  <div className={styles.messageContent}>
                    <div className={styles.messageHeader}>
                      <span className={styles.userName}>{msg.userName}</span>
                      <span className={styles.timestamp}>
                        {formatTime(msg.createdAt)}
                      </span>
                      {msg.canDelete && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className={styles.deleteButton}
                          disabled={deleteMutation.isPending}
                          aria-label="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className={styles.messageBubble}>{msg.message}</div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {isAuthenticated ? (
          <form onSubmit={handleSendMessage} className={styles.inputForm}>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={translations.placeholder}
              className={styles.input}
              disabled={postMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || postMutation.isPending}
              size="icon-md"
              className={styles.sendButton}
            >
              <Send size={18} />
            </Button>
          </form>
        ) : (
          <div className={styles.loginPrompt}>
            <Button asChild variant="outline" className={styles.loginButton}>
              <Link to={`/login?redirect=/properties?id=${propertyId}`}>
                {translations.login}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};