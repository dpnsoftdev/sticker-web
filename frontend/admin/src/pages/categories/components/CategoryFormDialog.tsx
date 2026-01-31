import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { slugify } from "@utils";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<void> | void;
};

export default function CategoryFormDialog({ open, onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", description: "" },
  });

  const name = watch("name");
  const slug = watch("slug");
  const [slugTouched, setSlugTouched] = React.useState(false);

  // Auto-generate slug from name until user edits slug manually
  React.useEffect(() => {
    if (!slugTouched)
      setValue("slug", slugify(name || ""), { shouldValidate: true });
  }, [name, setValue, slugTouched]);

  React.useEffect(() => {
    if (!open) {
      reset();
      setSlugTouched(false);
    }
  }, [open, reset]);

  const submit = handleSubmit(async values => {
    await onSubmit(values);
    onClose();
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
            error={!!errors.slug}
            helperText={
              errors.slug?.message || "Auto-generated from name, you can edit"
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
