import React, { useState } from "react";
import { FileDropzone } from "./FileDropzone";
import { Button } from "./Button";
import { ImageIcon, X } from "lucide-react";
import { imagesToBase64 } from "../helpers/imageToBase64";
import styles from "./PropertyImageUpload.module.css";

interface PropertyImageUploadProps {
  className?: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const PropertyImageUpload: React.FC<PropertyImageUploadProps> = ({
  className = "",
  images,
  onChange,
  maxImages = 5,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    setIsUploading(true);

    try {
      const base64Images = await imagesToBase64(files);
      const newImages = [...images, ...base64Images].slice(0, maxImages);
      onChange(newImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload images");
      console.error("Image upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const remainingSlots = maxImages - images.length;

  return (
    <div className={`${styles.container} ${className}`}>
      {images.length > 0 && (
        <div className={styles.previewGrid}>
          {images.map((image, index) => (
            <div key={index} className={styles.previewItem}>
              <img src={image} alt={`Property ${index + 1}`} className={styles.previewImage} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={styles.removeButton}
                onClick={() => handleRemoveImage(index)}
                aria-label={`Remove image ${index + 1}`}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {remainingSlots > 0 && (
        <FileDropzone
          icon={<ImageIcon size={48} />}
          title={isUploading ? "Uploading..." : "Upload Property Images"}
          subtitle={`PNG, JPG up to 5MB (${remainingSlots} remaining)`}
          accept=".jpg,.jpeg,.png,.webp"
          maxFiles={remainingSlots}
          maxSize={5 * 1024 * 1024}
          onFilesSelected={handleFilesSelected}
          disabled={isUploading}
        />
      )}

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};