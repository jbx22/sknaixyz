import React, { useState } from "react";
import {
  useAdminOfferingsList,
  useAdminDistributeIncome,
} from "../helpers/useAdminTokenization";
import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { toast } from "sonner";
import styles from "./AdminIncomeDistributionForm.module.css";

export const AdminIncomeDistributionForm = () => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Fetch active offerings to populate dropdown
  const { data: offeringsData } = useAdminOfferingsList({
    page: 1,
    pageSize: 100,
    status: "open", // Or settled? Usually settled assets distribute income. Let's assume 'open' or 'settled'
  });

  const { mutate, isPending } = useAdminDistributeIncome();

  const selectedAsset = offeringsData?.offerings.find(
    (o) => o.id.toString() === selectedAssetId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !amount || !startDate || !endDate) {
      toast.error("Please fill all required fields");
      return;
    }

    mutate(
      {
        assetId: parseInt(selectedAssetId),
        totalAmount: parseFloat(amount),
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
        description,
      },
      {
        onSuccess: (data) => {
          toast.success(
            `Successfully distributed income to ${data.recipientCount} investors`
          );
          setAmount("");
          setDescription("");
          setStartDate("");
          setEndDate("");
          setSelectedAssetId("");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>New Income Distribution</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Select Asset</label>
          <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tokenized asset..." />
            </SelectTrigger>
            <SelectContent>
              {offeringsData?.offerings.map((offering) => (
                <SelectItem key={offering.id} value={offering.id.toString()}>
                  #{offering.id} - {offering.propertyTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Total Amount (SAR)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <div className={styles.field}>
            <label>Period Start</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Period End</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>Description (Optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Q1 2024 Rental Income"
            rows={3}
          />
        </div>

        {selectedAsset && amount && (
          <div className={styles.preview}>
            <div className={styles.previewItem}>
              <span>Total Tokens:</span>
              <strong>{selectedAsset.totalTokens.toLocaleString()}</strong>
            </div>
            <div className={styles.previewItem}>
              <span>Est. Amount per Token:</span>
              <strong>
                {(parseFloat(amount) / selectedAsset.totalTokens).toFixed(4)}{" "}
                SAR
              </strong>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Processing..." : "Distribute Income"}
          </Button>
        </div>
      </form>
    </div>
  );
};