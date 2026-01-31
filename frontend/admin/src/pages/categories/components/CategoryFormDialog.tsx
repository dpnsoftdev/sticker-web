import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { slugify } from "@utils";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPT_IMAGES = "image/jpeg,image/png,image/gif,image/webp";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof schema>;

export type CategoryFormSubmitPayload = CategoryFormValues & {
  images: File[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CategoryFormSubmitPayload) => Promise<void> | void;
};

export default function CategoryFormDialog({ open, onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", description: "" },
  });

  const name = watch("name");
  const slug = watch("slug");

  const [slugTouched, setSlugTouched] = React.useState(false);
  const [images, setImages] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateAndAddImages = (files: FileList | null) => {
    setImageError(null);
    if (!files?.length) return;

    const next = [...images];
    for (let i = 0; i < files.length; i++) {
      if (next.length >= MAX_IMAGES) {
        setImageError(`Maximum ${MAX_IMAGES} images allowed.`);
        break;
      }
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        setImageError("Only image files (JPEG, PNG, GIF, WebP) are allowed.");
        break;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setImageError(`Each image must be under ${MAX_FILE_SIZE_MB}MB.`);
        break;
      }
      next.push(file);
    }

    const newImages = next.slice(0, MAX_IMAGES);
    setImages(newImages);
    setPreviewUrls(newImages.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setImageError(null);
    URL.revokeObjectURL(previewUrls[index]);
  };

  // Auto-generate slug from name until user edits slug manually
  React.useEffect(() => {
    if (!slugTouched)
      setValue("slug", slugify(name || ""), {
        shouldValidate: (name || "").length > 0,
      });
  }, [name, setValue, slugTouched]);

  React.useEffect(() => {
    if (!open) {
      reset();
      setSlugTouched(false);
      setImages([]);
      setPreviewUrls([]);
      setImageError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, reset]);

  React.useEffect(() => {
    return () => previewUrls.forEach(URL.revokeObjectURL);
  }, [previewUrls]);

  const submit = handleSubmit(async values => {
    try {
      await onSubmit({ ...values, images });
      onClose();
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Category</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            placeholder="Outfit & Doll"
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
            autoFocus
          />

          <TextField
            label="Slug"
            placeholder="outfit-doll"
            value={slug}
            onChange={e => {
              setSlugTouched(true);
              setValue("slug", slugify(e.target.value), {
                shouldValidate: true,
              });
            }}
            error={!!errors.slug && (slugTouched || isSubmitted)}
            helperText={
              slugTouched || isSubmitted
                ? errors.slug?.message ||
                  "Auto-generated from name, you can edit"
                : "Auto-generated from name, you can edit"
            }
          />

          <TextField
            label="Description"
            placeholder="Optional description"
            {...register("description")}
            error={!!errors.description}
            helperText={errors.description?.message}
            multiline
            minRows={3}
          />

          <Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Images (max {MAX_IMAGES}, {MAX_FILE_SIZE_MB}MB each)
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_IMAGES}
              multiple
              hidden
              onChange={e => validateAndAddImages(e.target.files)}
            />
            <Button
              variant="outlined"
              startIcon={<CloudUploadRoundedIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= MAX_IMAGES}
              size="medium"
            >
              Upload images
            </Button>
            {imageError && (
              <Typography
                variant="caption"
                color="error"
                display="block"
                sx={{ mt: 0.5 }}
              >
                {imageError}
              </Typography>
            )}
            {images.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
                {images.map((file, index) => (
                  <Box
                    key={`${file.name}-${index}`}
                    sx={{
                      position: "relative",
                      width: 72,
                      height: 72,
                      borderRadius: 1.5,
                      overflow: "hidden",
                      border: 1,
                      borderColor: "divider",
                      bgcolor: "action.hover",
                    }}
                  >
                    <img
                      src={previewUrls[index]}
                      alt={file.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeImage(index)}
                      sx={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        bgcolor: "background.paper",
                        "&:hover": { bgcolor: "action.selected" },
                        width: 24,
                        height: 24,
                      }}
                      aria-label="Remove image"
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submit} disabled={isSubmitting}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
