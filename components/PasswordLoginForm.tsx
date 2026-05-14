import React, { useState } from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import styles from "./PasswordLoginForm.module.css";
import {
  schema,
  postLogin,
} from "../endpoints/auth/login_with_password_POST.schema";
import { useAuth } from "../helpers/useAuth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDemoComplianceForUser } from "../helpers/demoAccounts";
import { User } from "../helpers/User";

export type LoginFormData = z.infer<typeof schema>;

interface PasswordLoginFormProps {
  className?: string;
}

export const PasswordLoginForm: React.FC<PasswordLoginFormProps> = ({
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onLogin } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    schema,
  });

  const handleSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      let user: User;
      const normalizedEmail = data.email.toLowerCase();
      const isDemo = import.meta.env.DEV && DEMO_ACCOUNTS.some((a) => a.email === normalizedEmail) && data.password === DEMO_PASSWORD;
      if (isDemo) {
        // Client-side demo login — no backend needed
        const demo = DEMO_ACCOUNTS.find((a) => a.email === normalizedEmail)!;
        user = {
          id: 9000 + DEMO_ACCOUNTS.indexOf(demo),
          email: demo.email,
          displayName: demo.label,
          avatarUrl: null,
          role: demo.role as "admin" | "user" | "superadmin",
          subscriptionTier: "premium" as const,
        };
      } else {
        const result = await postLogin(data);
        user = result.user;
      }
      seedDemoComplianceForUser(user);
      onLogin(user);
      setTimeout(() => navigate("/"), 200);
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={`${styles.form} ${className || ""}`}
      >
        {error && <div className={styles.errorMessage}>{error}</div>}

        <FormItem name="email">
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              placeholder="your@email.com"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              value={form.values.email}
              onChange={(e) =>
                form.setValues((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="password">
          <FormLabel>Password</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              value={form.values.password}
              onChange={(e) =>
                form.setValues((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <Button
          type="submit"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? (
            <span className={styles.loadingText}>
              <Spinner className={styles.spinner} size="sm" />
              Logging in...
            </span>
          ) : (
            "Log In"
          )}
        </Button>
      </form>
    </Form>
  );
};
