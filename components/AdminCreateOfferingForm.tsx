import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminCreateOffering } from "../helpers/useAdminTokenization";
import { Button } from "./Button";
import { Input } from "./Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { toast } from "sonner";
import styles from "./AdminCreateOfferingForm.module.css";

// Schema matching the endpoint input
const schema = z.object({
  propertyId: z.string().min(1, "Property is required"), // Form uses string for select, convert to number
  spvName: z.string().min(3, "SPV Name must be at least 3 characters"),
  spvLegalStructure: z.string().optional(),
  spvRegistrationNumber: z.string().optional(),
  totalValue: z.coerce.number().positive("Total value must be positive"),
  tokenPrice: z.coerce.number().positive("Token price must be positive"),
  annualRentalYield: z.coerce.number().optional(),
  lockUpDays: z.coerce.number().int().min(0).default(180),
});

type FormData = z.infer<typeof schema>;

export const AdminCreateOfferingForm = () => {
  const { mutate, isPending } = useAdminCreateOffering();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      lockUpDays: 180,
    },
  });

  const totalValue = watch("totalValue");
  const tokenPrice = watch("tokenPrice");
  const totalTokens =
    totalValue && tokenPrice ? Math.floor(totalValue / tokenPrice) : 0;

  const onSubmit = (data: FormData) => {
    mutate(
      {
        ...data,
        propertyId: parseInt(data.propertyId),
        totalTokens,
        incomeRights: true,
        votingRights: false,
        transferable: true,
      },
      {
        onSuccess: () => {
          toast.success("Offering created successfully");
          reset();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label}>Property ID</label>
          <Input
            placeholder="Enter Property ID (e.g. 123)"
            {...register("propertyId")}
          />
          {errors.propertyId && (
            <span className={styles.error}>{errors.propertyId.message}</span>
          )}
          <span className={styles.hint}>
            Enter the ID of the property to tokenize
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>SPV Name</label>
          <Input placeholder="e.g. SKN Real Estate SPV 1" {...register("spvName")} />
          {errors.spvName && (
            <span className={styles.error}>{errors.spvName.message}</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Legal Structure</label>
          <Input placeholder="e.g. LLC" {...register("spvLegalStructure")} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Registration Number</label>
          <Input
            placeholder="Commercial Registration No."
            {...register("spvRegistrationNumber")}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Total Asset Value (SAR)</label>
          <Input
            type="number"
            placeholder="0.00"
            {...register("totalValue")}
          />
          {errors.totalValue && (
            <span className={styles.error}>{errors.totalValue.message}</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Token Price (SAR)</label>
          <Input
            type="number"
            placeholder="0.00"
            {...register("tokenPrice")}
          />
          {errors.tokenPrice && (
            <span className={styles.error}>{errors.tokenPrice.message}</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Calculated Total Tokens</label>
          <Input value={totalTokens.toLocaleString()} disabled />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Expected Annual Yield (%)</label>
          <Input
            type="number"
            step="0.1"
            placeholder="e.g. 8.5"
            {...register("annualRentalYield")}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Lock-up Period (Days)</label>
          <Input type="number" {...register("lockUpDays")} />
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Offering"}
        </Button>
      </div>
    </form>
  );
};