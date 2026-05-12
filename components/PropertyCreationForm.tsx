import React, { useState, useMemo } from "react";
import { z } from "zod";
import { Link } from "react-router-dom";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { PropertyImageUpload } from "./PropertyImageUpload";
import { useCreateProperty } from "../helpers/useCreateProperty";
import { useSubscription } from "../helpers/useSubscription";
import { useLanguage } from "../helpers/useLanguage";
import { PropertyTypeArrayValues, SubscriptionTier } from "../helpers/schema";
import styles from "./PropertyCreationForm.module.css";
import { AlertCircleIcon, CheckCircle2Icon, CrownIcon } from "lucide-react";
import { STRINGS } from "../helpers/propertyFormTranslations";

interface PropertyCreationFormProps {
  latitude: number;
  longitude: number;
  locationName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TierBadgeVariantMap: Record<SubscriptionTier, "default" | "secondary" | "outline" | "destructive" | "success" | "warning"> = {
  free: "secondary",
  basic: "outline",
  premium: "default",
};

export const PropertyCreationForm: React.FC<PropertyCreationFormProps> = ({
  latitude,
  longitude,
  locationName,
  onSuccess,
  onCancel,
}) => {
  const { language } = useLanguage();
  const t = STRINGS[language];
  const createPropertyMutation = useCreateProperty();
  const { status, isLoading: isSubscriptionLoading } = useSubscription();

  // Create schema with translated messages
  const formSchema = useMemo(() => z.object({
    title: z.string().min(3, t.validation.titleMin),
    description: z.string().optional(),
    price: z.number().positive(t.validation.pricePositive),
    locationName: z.string().min(3, t.validation.locationRequired),
    latitude: z.number(),
    longitude: z.number(),
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().nonnegative().optional(),
    areaSqm: z.number().positive(t.validation.areaPositive),
    propertyType: z.enum(PropertyTypeArrayValues),
    zipCode: z.string().optional(),
    images: z.array(z.string()).optional(),
  }), [t]);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      locationName,
      latitude,
      longitude,
      bedrooms: undefined,
      bathrooms: undefined,
      areaSqm: 0,
      propertyType: "apartment" as const,
      zipCode: "",
      images: [],
    },
    schema: formSchema,
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (status && !status.canAddMoreProperties) {
      return;
    }

    createPropertyMutation.mutate(values, {
      onSuccess: () => {
        console.log("Property created successfully");
        onSuccess();
      },
      onError: (error) => {
        console.error("Failed to create property:", error);
        form.setFieldError("title", error.message || t.validation.createError);
      },
    });
  };

  const isLimitReached = status ? !status.canAddMoreProperties : false;
  
  // Loading state for subscription
  if (isSubscriptionLoading) {
    return <div className={styles.loading}>{t.subscription.loading}</div>;
  }

  const getTierLabel = (tier: SubscriptionTier) => {
    switch (tier) {
      case "free": return t.subscription.free;
      case "basic": return t.subscription.basic;
      case "premium": return t.subscription.premium;
      default: return tier;
    }
  };

  return (
    <div className={styles.container} role="form" aria-labelledby="property-form-title">
      <h2 id="property-form-title" className="sr-only">
        {language === "ar" ? "نموذج إضافة عقار جديد" : "New Property Creation Form"}
      </h2>
      {status && (
        <div className={`${styles.subscriptionStatus} ${isLimitReached ? styles.limitReached : ''}`}>
          <div className={styles.statusHeader}>
            <div className={styles.tierInfo}>
              <Badge variant={TierBadgeVariantMap[status.tier]}>
                <span className={styles.crownBadge}>
                  {status.tier === "premium" && <CrownIcon size={12} />}
                  {getTierLabel(status.tier)}
                </span>
              </Badge>
              <span className={styles.usageText}>
                {status.propertyLimit === -1 
                  ? t.subscription.unlimited 
                  : t.subscription.usage(status.propertiesCount, status.propertyLimit)
                }
              </span>
            </div>
            {isLimitReached ? (
              <div className={styles.limitWarning} role="alert">
                <AlertCircleIcon size={16} aria-hidden="true" />
                <span>{t.subscription.limitReached}</span>
              </div>
            ) : (
              <div className={styles.limitOk}>
                <CheckCircle2Icon size={16} aria-hidden="true" />
                <span>{t.subscription.limitOk}</span>
              </div>
            )}
          </div>
          
          {isLimitReached && (
             <div className={styles.upgradePrompt}>
               <p>{t.subscription.upgradePrompt}</p>
               <Button asChild size="sm" variant="primary">
                 <Link to="/settings/subscription">{t.buttons.upgrade}</Link>
               </Button>
             </div>
          )}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
          <fieldset disabled={isLimitReached} className={styles.fieldset}>
            <FormItem name="title">
              <FormLabel>{t.labels.title}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t.placeholders.title}
                  value={form.values.title}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, title: e.target.value }))
                  }
                  aria-required="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="description">
              <FormLabel>{t.labels.description}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t.placeholders.description}
                  value={form.values.description}
                  onChange={(e) =>
                    form.setValues((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="propertyType">
              <FormLabel>{t.labels.propertyType}</FormLabel>
              <FormControl>
                <Select
                  value={form.values.propertyType}
                  onValueChange={(value) =>
                    form.setValues((prev) => ({
                      ...prev,
                      propertyType: value as z.infer<typeof formSchema>["propertyType"],
                    }))
                  }
                  disabled={isLimitReached}
                >
                  <SelectTrigger aria-label={t.labels.propertyType}>
                    <SelectValue placeholder={t.placeholders.propertyType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">{t.propertyTypes.apartment}</SelectItem>
                    <SelectItem value="villa">{t.propertyTypes.villa}</SelectItem>
                    <SelectItem value="townhouse">{t.propertyTypes.townhouse}</SelectItem>
                    <SelectItem value="land">{t.propertyTypes.land}</SelectItem>
                    <SelectItem value="commercial">{t.propertyTypes.commercial}</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <div className={styles.row}>
              <FormItem name="price">
                <FormLabel>{t.labels.price}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t.placeholders.priceExample}
                    value={form.values.price || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        price: e.target.value ? Number(e.target.value) : 0,
                      }))
                    }
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="areaSqm">
                <FormLabel>{t.labels.area}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t.placeholders.areaExample}
                    value={form.values.areaSqm || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        areaSqm: e.target.value ? Number(e.target.value) : 0,
                      }))
                    }
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem name="bedrooms">
                <FormLabel>{t.labels.bedroomsOptional}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t.placeholders.bedroomsExample}
                    value={form.values.bedrooms ?? ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        bedrooms: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="bathrooms">
                <FormLabel>{t.labels.bathroomsOptional}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t.placeholders.bathroomsExample}
                    value={form.values.bathrooms ?? ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        bathrooms: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem name="locationName">
                <FormLabel>{t.labels.locationName}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.placeholders.locationName}
                    value={form.values.locationName}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        locationName: e.target.value,
                      }))
                    }
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="zipCode">
                <FormLabel>{t.labels.zipCode}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.placeholders.zipCode}
                    value={form.values.zipCode}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        zipCode: e.target.value,
                      }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div className={styles.row}>
              <FormItem name="latitude">
                <FormLabel>{t.labels.latitude}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={form.values.latitude}
                    readOnly
                    disabled
                    aria-readonly="true"
                  />
                </FormControl>
                <FormDescription>{t.images.autoFilled}</FormDescription>
              </FormItem>

              <FormItem name="longitude">
                <FormLabel>{t.labels.longitude}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={form.values.longitude}
                    readOnly
                    disabled
                    aria-readonly="true"
                  />
                </FormControl>
                <FormDescription>{t.images.autoFilled}</FormDescription>
              </FormItem>
            </div>

            <FormItem name="images">
              <FormLabel>{t.labels.images}</FormLabel>
              <FormControl>
                <PropertyImageUpload
                  images={form.values.images || []}
                  onChange={(images) =>
                    form.setValues((prev) => ({ ...prev, images }))
                  }
                  maxImages={5}
                />
              </FormControl>
              <FormDescription>{t.images.uploadPrompt}</FormDescription>
              <FormMessage />
            </FormItem>
          </fieldset>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createPropertyMutation.isPending}
            >
              {t.buttons.cancel}
            </Button>
            <Button 
              type="submit" 
              disabled={createPropertyMutation.isPending || isLimitReached}
              className={isLimitReached ? styles.hiddenButton : ""}
            >
              {createPropertyMutation.isPending ? t.buttons.creating : t.buttons.create}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};