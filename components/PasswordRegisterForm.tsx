import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { Checkbox } from "./Checkbox";
import styles from "./PasswordRegisterForm.module.css";
import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import {
  schema as baseSchema,
  postRegister,
} from "../endpoints/auth/register_with_password_POST.schema";

// Extend the base schema to include the terms agreement
const schema = baseSchema.extend({
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and privacy policy",
  }),
});

export type RegisterFormData = z.infer<typeof schema>;

interface PasswordRegisterFormProps {
  className?: string;
  defaultValues?: Partial<RegisterFormData>;
}

export const PasswordRegisterForm: React.FC<PasswordRegisterFormProps> = ({
  className,
  defaultValues,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onLogin } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const isArabic = language === "ar";

  const t = {
    termsStart: isArabic ? "أوافق على " : "I agree to the ",
    termsLink: isArabic ? "شروط الخدمة" : "Terms of Service",
    and: isArabic ? " و " : " and ",
    privacyLink: isArabic ? "سياسة الخصوصية" : "Privacy Policy",
  };

  const form = useForm({
    schema,
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      terms: false, // Default to unchecked
      ...defaultValues,
    },
  });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setError(null);
    setIsLoading(true);

    try {
      // Destructure terms out since the API doesn't expect it
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { terms, ...registerData } = data;
      
      const result = await postRegister(registerData);
      console.log("Registration successful for:", registerData.email);
      onLogin(result.user);
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);

      if (err instanceof Error) {
        const errorMessage = err.message;

        if (errorMessage.includes("Email already in use")) {
          setError(
            "This email is already registered. Please try logging in instead."
          );
        } else if (errorMessage.toLowerCase().includes("display name")) {
          setError("Please provide a valid display name that isn't empty.");
        } else if (
          errorMessage.includes("display") ||
          errorMessage.includes("name")
        ) {
          setError("Please check your display name: " + errorMessage);
        } else {
          setError(errorMessage || "Registration failed. Please try again.");
        }
      } else {
        console.log("Unknown error type:", err);
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <form
        onSubmit={form.handleSubmit((data) =>
          handleSubmit(data)
        )}
        className={`${styles.form} ${className || ""}`}
      >
        <FormItem name="email">
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              placeholder="your@email.com"
              value={form.values.email || ""}
              onChange={(e) =>
                form.setValues((prev: any) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="displayName">
          <FormLabel>Display Name</FormLabel>
          <FormControl>
            <Input
              id="register-display-name"
              placeholder="Your Name"
              value={form.values.displayName || ""}
              onChange={(e) =>
                form.setValues((prev: any) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
            />
          </FormControl>
          <FormDescription>
            Spaces, emojis, and special characters are all allowed
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="password">
          <FormLabel>Password</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.values.password || ""}
              onChange={(e) =>
                form.setValues((prev: any) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
            />
          </FormControl>
          <FormDescription>
            At least 8 characters with uppercase, lowercase, number, and special character (!@#$%^&* etc.)
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="terms">
          <div className={styles.termsWrapper}>
            <FormControl>
              <Checkbox
                id="terms-checkbox"
                checked={!!form.values.terms}
                onChange={(e) =>
                  form.setValues((prev: any) => ({
                    ...prev,
                    terms: e.target.checked,
                  }))
                }
              />
            </FormControl>
            <label htmlFor="terms-checkbox" className={styles.termsLabel}>
              {t.termsStart}
              <Link to="/terms" target="_blank" className={styles.link}>
                {t.termsLink}
              </Link>
              {t.and}
              <Link to="/privacy" target="_blank" className={styles.link}>
                {t.privacyLink}
              </Link>
            </label>
          </div>
          <FormMessage />
        </FormItem>

        <Button
          type="submit"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" /> Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  );
};