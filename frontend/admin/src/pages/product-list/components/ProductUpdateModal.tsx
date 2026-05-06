import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { fetchCategories } from "@apis/category.api";
import {
  deleteProductAsset,
  fetchProductById,
  updateProduct,
} from "@apis/product.api";
import PresignedUploader from "@components/common/presigned-uploader";
import {
  DEFAULT_MAX_FILE_SIZE_MB,
  DEFAULT_PREFIX,
  MAX_PRODUCT_IMAGES,
  PRESIGNED_TMP_UPLOAD_SUCCESS,
} from "@constants";
import useToastStore, { type ToastState } from "@stores/toastStore";
import type { Category } from "@types";
import { buildImageFullUrl, slugify } from "@utils";

const productStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
] as const;

const updateProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  categoryId: z.string().min(1, "Select a category"),
  productType: z.enum(["in_stock", "preorder"]),
  currency: z.string().default("VND"),
  priceNote: z.string().optional(),
  shippingNote: z.string().optional(),
  sellerName: z.string().min(1, "Seller name is required"),
  description: z.string().optional(),
  sizeDescription: z.string().optional(),
  packageDescription: z.string().optional(),
  preorderDescription: z.string().optional(),
  preorderStartDate: z.string().optional(),
  preorderEndDate: z.string().optional(),
});

type UpdateProductFormValues = z.infer<typeof updateProductSchema>;

const QUERY_KEY = {
  categories: ["categories"] as const,
  product: (id: string) => ["product", id] as const,
};

export type ProductUpdateModalProps = {
  open: boolean;
  productId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
  /** Called when "Manage variants" is clicked; parent should open variant modal for this product. */
  onOpenVariantModal?: (productId: string) => void;
};

export default function ProductUpdateModal({
  open,
  productId,
  onClose,
  onSuccess,
  onOpenVariantModal,
}: ProductUpdateModalProps) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s: ToastState) => s.showToast);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [existingImageKeys, setExistingImageKeys] = React.useState<string[]>(
    []
  );
  const [newImageKeys, setNewImageKeys] = React.useState<string[]>([]);
  const [removingIndex, setRemovingIndex] = React.useState<number | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: QUERY_KEY.categories,
    queryFn: fetchCategories,
    staleTime: 30_000,
  });

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: QUERY_KEY.product(productId ?? ""),
    queryFn: () => fetchProductById(productId!),
    enabled: open && !!productId,
    staleTime: 0,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProductFormValues>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: "",
      slug: "",
      status: "active",
      categoryId: "",
      productType: "in_stock",
      currency: "VND",
      priceNote: "",
      shippingNote: "",
      sellerName: "",
      description: "",
      sizeDescription: "",
      packageDescription: "",
      preorderDescription: "",
      preorderStartDate: "",
      preorderEndDate: "",
    },
  });

  const name = watch("name");
  const slug = watch("slug");
  const productType = watch("productType");

  React.useEffect(() => {
    if (!slugTouched && name) {
      setValue("slug", slugify(name), { shouldValidate: true });
    }
  }, [name, setValue, slugTouched]);

  React.useEffect(() => {
    if (!product) return;
    reset({
      name: product.name,
      slug: product.slug,
      status: product.status ?? "active",
      categoryId: product.categoryId,
      productType: product.productType,
      currency: product.currency ?? "VND",
      priceNote: product.priceNote ?? "",
      shippingNote: product.shippingNote ?? "",
      sellerName: product.sellerName,
      description: product.description ?? "",
      sizeDescription: product.sizeDescription ?? "",
      packageDescription: product.packageDescription ?? "",
      preorderDescription: product.preorderDescription ?? "",
      preorderStartDate: product.preorderStartsAt
        ? product.preorderStartsAt.slice(0, 10)
        : "",
      preorderEndDate: product.preorderEndsAt
        ? product.preorderEndsAt.slice(0, 10)
        : "",
    });
    setExistingImageKeys(product.images ?? []);
    setNewImageKeys([]);
    setSlugTouched(false);
  }, [product, reset]);

  const updateProductMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateProduct>[1];
    }) => updateProduct(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (productId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEY.product(productId),
        });
      }
      showToast("Product updated successfully.", "success");
      onSuccess?.();
      onClose();
    },
  });

  const handleSaveProduct = handleSubmit(async values => {
    if (!productId) return;
    const images = [...existingImageKeys, ...newImageKeys];
    const preorderStartsAt =
      values.productType === "preorder" && values.preorderStartDate
        ? `${values.preorderStartDate}T00:00:00.000Z`
        : null;
    const preorderEndsAt =
      values.productType === "preorder" && values.preorderEndDate
        ? `${values.preorderEndDate}T23:59:59.999Z`
        : null;

    await updateProductMutation.mutateAsync({
      id: productId,
      body: {
        name: values.name,
        slug: values.slug,
        status: values.status,
        categoryId: values.categoryId,
        productType: values.productType,
        currency: values.currency,
        priceNote: values.priceNote || null,
        shippingNote: values.shippingNote || null,
        sellerName: values.sellerName,
        description: values.description || null,
        sizeDescription: values.sizeDescription || null,
        packageDescription: values.packageDescription || null,
        preorderDescription: values.preorderDescription || null,
        images,
        preorderStartsAt,
        preorderEndsAt,
      },
    });
  });

  const removeExistingImage = async (index: number) => {
    const key = existingImageKeys[index];
    if (!productId || key == null) return;
    setRemovingIndex(index);
    try {
      await deleteProductAsset(productId, key);
      setExistingImageKeys(prev => prev.filter((_, i) => i !== index));
      showToast("Image removed.", "success");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.product(productId) });
    } catch {
      showToast("Failed to remove image.", "error");
    } finally {
      setRemovingIndex(null);
    }
  };

  const maxNewUploads = Math.max(
    0,
    MAX_PRODUCT_IMAGES - existingImageKeys.length - newImageKeys.length
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>Update product</DialogTitle>
      <DialogContent>
        {isLoadingProduct && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 3 }}>
            <CircularProgress size={24} />
            <Typography color="text.secondary">Loading product…</Typography>
          </Stack>
        )}

        {!isLoadingProduct && product && (
          <Box component="form" onSubmit={handleSaveProduct} sx={{ pt: 1 }}>
            <Stack spacing={2.5}>
              {/* Variants */}
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 1 }}
                  >
                    Variants
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Add, edit, or remove variants. Set price, stock, and images
                    per variant. At least one variant is required.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => product && onOpenVariantModal?.(product.id)}
                  >
                    Manage variants
                  </Button>
                </CardContent>
              </Card>

              {/* Basic information */}
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    Basic information
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Product name"
                        {...register("name")}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        fullWidth
                        size="small"
                      />
                      <TextField
                        label="Slug"
                        value={slug}
                        onChange={e => {
                          setSlugTouched(true);
                          setValue("slug", slugify(e.target.value), {
                            shouldValidate: true,
                          });
                        }}
                        error={!!errors.slug}
                        helperText={errors.slug?.message}
                        fullWidth
                        size="small"
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <FormControl
                        fullWidth
                        size="small"
                        error={!!errors.categoryId}
                      >
                        <InputLabel>Category</InputLabel>
                        <Select
                          label="Category"
                          value={watch("categoryId")}
                          onChange={e =>
                            setValue("categoryId", e.target.value, {
                              shouldValidate: true,
                            })
                          }
                        >
                          <MenuItem value="">Select category</MenuItem>
                          {(categories as Category[]).map(c => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {errors.categoryId?.message}
                        </FormHelperText>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel>Product type</InputLabel>
                        <Select
                          label="Product type"
                          value={watch("productType")}
                          onChange={e =>
                            setValue(
                              "productType",
                              e.target.value as "in_stock" | "preorder",
                              { shouldValidate: true }
                            )
                          }
                        >
                          <MenuItem value="in_stock">In stock</MenuItem>
                          <MenuItem value="preorder">Preorder</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          label="Status"
                          value={watch("status")}
                          onChange={e =>
                            setValue(
                              "status",
                              e.target.value as
                                | "active"
                                | "inactive"
                                | "archived",
                              {
                                shouldValidate: true,
                              }
                            )
                          }
                        >
                          {productStatusOptions.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {/* Preorder time */}
              {productType === "preorder" && (
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ mb: 2 }}
                    >
                      Pre-order time
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Start date"
                        type="date"
                        size="small"
                        fullWidth
                        {...register("preorderStartDate")}
                        slotProps={{
                          htmlInput: {
                            max: watch("preorderEndDate") || undefined,
                          },
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="End date"
                        type="date"
                        size="small"
                        fullWidth
                        {...register("preorderEndDate")}
                        slotProps={{
                          htmlInput: {
                            min: watch("preorderStartDate") || undefined,
                          },
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Pricing & notes */}
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    Pricing & notes
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Currency"
                      {...register("currency")}
                      fullWidth
                      size="small"
                      disabled
                    />
                    <TextField
                      label="Price note"
                      size="small"
                      {...register("priceNote")}
                      fullWidth
                    />
                    <TextField
                      label="Shipping note"
                      size="small"
                      {...register("shippingNote")}
                      fullWidth
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Seller & descriptions */}
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    Seller & descriptions
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Seller name"
                      size="small"
                      {...register("sellerName")}
                      error={!!errors.sellerName}
                      helperText={errors.sellerName?.message}
                      fullWidth
                    />
                    <TextField
                      label="Description"
                      size="small"
                      multiline
                      minRows={2}
                      {...register("description")}
                      fullWidth
                    />
                    <TextField
                      label="Size description"
                      size="small"
                      multiline
                      minRows={2}
                      {...register("sizeDescription")}
                      fullWidth
                    />
                    <TextField
                      label="Package description"
                      size="small"
                      multiline
                      minRows={2}
                      {...register("packageDescription")}
                      fullWidth
                    />
                    <TextField
                      label="Preorder description"
                      size="small"
                      multiline
                      minRows={2}
                      {...register("preorderDescription")}
                      fullWidth
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Product images */}
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 1 }}
                  >
                    Product images
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Remove saved images below or add more (max{" "}
                    {MAX_PRODUCT_IMAGES} total). New uploads go to temporary
                    storage until you click Save product.
                  </Typography>
                  {existingImageKeys.length > 0 && (
                    <Stack
                      direction="row"
                      flexWrap="wrap"
                      gap={1.5}
                      sx={{ mb: 2 }}
                    >
                      {existingImageKeys.map((key, index) => (
                        <Box
                          key={`existing-${index}-${key.slice(-12)}`}
                          sx={{
                            position: "relative",
                            width: 88,
                            height: 88,
                            borderRadius: 1.5,
                            overflow: "hidden",
                            border: 1,
                            borderColor: "divider",
                            bgcolor: "action.hover",
                          }}
                        >
                          <img
                            src={buildImageFullUrl(key)}
                            alt={`Product ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              opacity: removingIndex === index ? 0.6 : 1,
                            }}
                          />
                          {removingIndex === index && (
                            <CircularProgress
                              size={24}
                              sx={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                              }}
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={() => removeExistingImage(index)}
                            disabled={removingIndex !== null}
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              bgcolor: "background.paper",
                              "&:hover": { bgcolor: "action.selected" },
                              width: 28,
                              height: 28,
                            }}
                            aria-label="Remove image"
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  {maxNewUploads > 0 && (
                    <PresignedUploader
                      value={newImageKeys}
                      onChange={setNewImageKeys}
                      maxFiles={maxNewUploads}
                      prefix={DEFAULT_PREFIX}
                      label="Add more images"
                      helperText={`Upload new images (max ${maxNewUploads} more, ${DEFAULT_MAX_FILE_SIZE_MB}MB each). Save product to move them into this product folder.`}
                      buttonLabel="Upload images"
                      previewSize={72}
                      uploadSuccessMessage={PRESIGNED_TMP_UPLOAD_SUCCESS}
                    />
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )}
      </DialogContent>
      {!isLoadingProduct && product && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={updateProductMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProduct}
            disabled={isSubmitting || updateProductMutation.isPending}
            startIcon={
              updateProductMutation.isPending ? (
                <CircularProgress size={18} color="inherit" />
              ) : undefined
            }
          >
            {updateProductMutation.isPending ? "Saving…" : "Save product"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
