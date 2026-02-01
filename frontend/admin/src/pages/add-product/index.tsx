import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Category } from "@types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { fetchCategories } from "@apis/category.api";
import { createProduct } from "@apis/product.api";
import PresignedUploader from "@components/common/presigned-uploader";
import useToastStore, { type ToastState } from "@stores/toastStore";
import { getApiErrorMessage, slugify } from "@utils";

const MAX_PRODUCT_IMAGES = 10;
const MAX_FILE_SIZE_MB = 5;

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().nullable().optional(),
  slug: z.string().min(1, "Slug is required"),
  categoryId: z.string().min(1, "Select a category"),
  productType: z.enum(["in_stock", "preorder"]),
  price: z.coerce.number().int().min(0, "Price must be ≥ 0"),
  currency: z.string().default("VND"),
  priceNote: z.string().optional(),
  shippingNote: z.string().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  sellerName: z.string().min(1, "Seller name is required"),
  sizeDescription: z.string().optional(),
  packageDescription: z.string().optional(),
  preorderDescription: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export type VariantRow = {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: string;
};

const QUERY_KEY = { categories: ["categories"] as const };

export default function AddProductPage() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s: ToastState) => s.showToast);

  const [slugTouched, setSlugTouched] = React.useState(false);
  const [imageKeys, setImageKeys] = React.useState<string[]>([]);

  const { data: categories = [] } = useQuery({
    queryKey: QUERY_KEY.categories,
    queryFn: fetchCategories,
    staleTime: 30_000,
  });

  const [hasVariants, setHasVariants] = React.useState(false);
  const [variants, setVariants] = React.useState<VariantRow[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: null,
      slug: "",
      categoryId: "",
      productType: "in_stock",
      price: 0,
      currency: "VND",
      priceNote: "",
      shippingNote: "",
      stock: 0,
      sellerName: "",
      sizeDescription: "",
      packageDescription: "",
      preorderDescription: "",
    },
  });

  const name = watch("name");
  const slug = watch("slug");

  React.useEffect(() => {
    if (!slugTouched && name)
      setValue("slug", slugify(name), {
        shouldValidate: (name || "").length > 0,
      });
  }, [name, setValue, slugTouched]);

  const createMutation = useMutation({
    mutationFn: (body: Parameters<typeof createProduct>[0]) =>
      createProduct(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showToast("Product created successfully.", "success");
    },
    onError: err => {
      showToast(getApiErrorMessage(err), "error");
    },
  });

  const addVariant = () => {
    setVariants(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        price: "",
        stock: "",
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = handleSubmit(async values => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        sku: values.sku || null,
        slug: values.slug,
        categoryId: values.categoryId,
        productType: values.productType,
        price: values.price,
        currency: values.currency,
        priceNote: values.priceNote || null,
        shippingNote: values.shippingNote || null,
        stock: values.stock,
        sellerName: values.sellerName,
        sizeDescription: values.sizeDescription || null,
        packageDescription: values.packageDescription || null,
        preorderDescription: values.preorderDescription || null,
        images: imageKeys,
        preorder: null,
      });
    } catch {
      // Error handled in mutation
    }
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Add Product
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fill in the product information below. Images are uploaded via presigned
        URL.
      </Typography>

      <form onSubmit={onSubmit}>
        <Stack spacing={3}>
          {/* Basic info */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Basic information
              </Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Product name"
                    placeholder="e.g. Sticker Pack A"
                    {...register("name")}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    fullWidth
                  />
                  {/* <TextField
                    label="SKU"
                    placeholder="e.g. STK-001"
                    {...register("sku")}
                    error={!!errors.sku}
                    helperText={errors.sku?.message}
                    fullWidth
                  /> */}
                  <TextField
                    label="Slug"
                    placeholder="sticker-pack-a"
                    value={slug}
                    onChange={e => {
                      setSlugTouched(true);
                      setValue("slug", slugify(e.target.value), {
                        shouldValidate: true,
                      });
                    }}
                    error={!!errors.slug && (slugTouched || !!errors.slug)}
                    helperText={
                      errors.slug?.message ??
                      "Auto-generated from name, you can edit"
                    }
                    fullWidth
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <FormControl fullWidth error={!!errors.categoryId}>
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
                  <FormControl fullWidth>
                    <InputLabel>Product type</InputLabel>
                    <Select
                      label="Product type"
                      value={watch("productType")}
                      onChange={e =>
                        setValue(
                          "productType",
                          e.target.value as "in_stock" | "preorder",
                          {
                            shouldValidate: true,
                          }
                        )
                      }
                    >
                      <MenuItem value="in_stock">In stock</MenuItem>
                      <MenuItem value="preorder">Preorder</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Pricing, stock & variants (merged) */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Pricing, stock & variants
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose a single price/stock for the product, or add variants
                with their own price and stock.
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <ToggleButtonGroup
                  value={hasVariants ? "variants" : "single"}
                  exclusive
                  onChange={(_, value) => {
                    if (value === null) return;
                    setHasVariants(value === "variants");
                    if (value === "single") setVariants([]);
                  }}
                  aria-label="Product pricing mode"
                  size="small"
                >
                  <ToggleButton value="single" aria-label="Single product">
                    Single product
                  </ToggleButton>
                  <ToggleButton value="variants" aria-label="With variants">
                    With variants
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Price (VND)"
                  type="number"
                  {...register("price")}
                  error={!!errors.price}
                  helperText={
                    hasVariants
                      ? "Set price per variant below."
                      : errors.price?.message
                  }
                  fullWidth
                  disabled={hasVariants}
                  InputProps={{ readOnly: hasVariants }}
                />
                <TextField
                  label="Currency"
                  {...register("currency")}
                  fullWidth
                  disabled={true}
                  InputProps={{ readOnly: hasVariants }}
                />
                <TextField
                  label="Stock"
                  type="number"
                  {...register("stock")}
                  error={!!errors.stock}
                  helperText={
                    hasVariants
                      ? "Set stock per variant below."
                      : errors.stock?.message
                  }
                  fullWidth
                  disabled={hasVariants}
                  InputProps={{ readOnly: hasVariants }}
                />
              </Stack>
              <TextField
                label="Price note"
                placeholder="e.g. Price may vary"
                {...register("priceNote")}
                fullWidth
                sx={{ mt: 2 }}
              />
              <TextField
                label="Shipping note"
                placeholder="e.g. Free shipping over 100k"
                {...register("shippingNote")}
                fullWidth
                sx={{ mt: 1 }}
              />

              {hasVariants && (
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ mb: 1.5 }}
                  >
                    Variant list
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Add size/color variants with their own price and stock.
                    Variants can be managed after the product is created.
                  </Typography>
                  {variants.length === 0 ? (
                    <Button
                      variant="outlined"
                      startIcon={<AddRoundedIcon />}
                      onClick={addVariant}
                      size="medium"
                    >
                      Add variant
                    </Button>
                  ) : (
                    <Stack spacing={2}>
                      {variants.map((field, index) => (
                        <Paper
                          key={field.id}
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 2 }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 1.5 }}
                          >
                            <Typography variant="subtitle2">
                              Variant {index + 1}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => removeVariant(index)}
                              aria-label="Remove variant"
                            >
                              <RemoveCircleOutlineRoundedIcon />
                            </IconButton>
                          </Stack>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                          >
                            <TextField
                              label="Variant name"
                              placeholder="e.g. Size M"
                              size="small"
                              fullWidth
                              value={field.name}
                              onChange={e => {
                                const next = [...variants];
                                next[index] = {
                                  ...next[index],
                                  name: e.target.value,
                                };
                                setVariants(next);
                              }}
                            />
                            <TextField
                              label="Description"
                              placeholder="Optional"
                              size="small"
                              fullWidth
                              value={field.description}
                              onChange={e => {
                                const next = [...variants];
                                next[index] = {
                                  ...next[index],
                                  description: e.target.value,
                                };
                                setVariants(next);
                              }}
                            />
                            <TextField
                              label="Price (VND)"
                              type="number"
                              size="small"
                              placeholder="Required for variant"
                              fullWidth
                              value={field.price}
                              onChange={e => {
                                const next = [...variants];
                                next[index] = {
                                  ...next[index],
                                  price: e.target.value,
                                };
                                setVariants(next);
                              }}
                            />
                            <TextField
                              label="Stock"
                              type="number"
                              size="small"
                              placeholder="Required for variant"
                              fullWidth
                              value={field.stock}
                              onChange={e => {
                                const next = [...variants];
                                next[index] = {
                                  ...next[index],
                                  stock: e.target.value,
                                };
                                setVariants(next);
                              }}
                            />
                          </Stack>
                        </Paper>
                      ))}
                      <Button
                        variant="outlined"
                        startIcon={<AddRoundedIcon />}
                        onClick={addVariant}
                        size="medium"
                        disabled={variants.length >= 20}
                      >
                        Add another variant
                      </Button>
                    </Stack>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Seller & descriptions */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Seller & descriptions
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Seller name"
                  placeholder="Store or brand name"
                  {...register("sellerName")}
                  error={!!errors.sellerName}
                  helperText={errors.sellerName?.message}
                  fullWidth
                />
                <TextField
                  label="Size description"
                  placeholder="Dimensions, size chart..."
                  {...register("sizeDescription")}
                  multiline
                  minRows={2}
                  fullWidth
                />
                <TextField
                  label="Package description"
                  placeholder="What's in the box..."
                  {...register("packageDescription")}
                  multiline
                  minRows={2}
                  fullWidth
                />
                <TextField
                  label="Preorder description"
                  placeholder="For preorder items only"
                  {...register("preorderDescription")}
                  multiline
                  minRows={2}
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Product images (presigned upload) */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <PresignedUploader
                value={imageKeys}
                onChange={setImageKeys}
                maxFiles={MAX_PRODUCT_IMAGES}
                maxFileSizeMb={MAX_FILE_SIZE_MB}
                label="Product images"
                helperText={`Upload via presigned URL (max ${MAX_PRODUCT_IMAGES} images, ${MAX_FILE_SIZE_MB}MB each)`}
                buttonLabel="Upload images"
                previewSize={88}
              />
            </CardContent>
          </Card>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1 }} />
                  Creating…
                </>
              ) : (
                "Create product"
              )}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}
