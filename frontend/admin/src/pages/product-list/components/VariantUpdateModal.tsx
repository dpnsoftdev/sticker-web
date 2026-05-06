import * as React from "react";

import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchProductById } from "@apis/product.api";
import {
  createVariant,
  deleteVariant,
  removeVariantImage,
  updateVariant,
  type CreateVariantBody,
} from "@apis/variant.api";
import PresignedUploader from "@components/common/presigned-uploader";
import {
  DEFAULT_MAX_FILE_SIZE_MB,
  DEFAULT_PREFIX,
  MAX_VARIANT_IMAGES,
  MIN_VARIANT_IMAGES,
  PRESIGNED_TMP_UPLOAD_SUCCESS,
} from "@constants";
import useToastStore, { type ToastState } from "@stores/toastStore";
import type { Variant } from "@types";
import { buildImageFullUrl } from "@utils";

const QUERY_KEY = {
  product: (id: string) => ["product", id] as const,
};

export type VariantUpdateModalProps = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName?: string;
  /** When omitted, product is fetched by productId when modal opens. */
  variants?: Variant[];
  onSuccess?: () => void;
};

type VariantRow = {
  id?: string;
  tempId?: string;
  productId: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[];
  initialImages: string[];
  isDefault: boolean;
};

function toRow(v: Variant): VariantRow {
  const images = v.images ?? [];
  return {
    id: v.id,
    productId: v.productId,
    name: v.name,
    description: v.description ?? null,
    price: v.price,
    stock: v.stock,
    images: [...images],
    initialImages: [...images],
    isDefault: v.isDefault ?? false,
  };
}

function getRowKey(row: VariantRow): string {
  return row.id ?? row.tempId!;
}

function isPersistedVariantDirty(
  row: VariantRow,
  rowKey: string,
  defaultKey: string,
  baseline: Variant | undefined
): boolean {
  if (!row.id || !baseline) return false;
  const isDefaultNow = rowKey === defaultKey;
  return (
    baseline.name !== row.name ||
    (baseline.description ?? null) !== row.description ||
    baseline.price !== row.price ||
    baseline.stock !== row.stock ||
    JSON.stringify(baseline.images ?? []) !== JSON.stringify(row.images ?? []) ||
    (baseline.isDefault ?? false) !== isDefaultNow
  );
}

export default function VariantUpdateModal({
  open,
  onClose,
  productId,
  productName: productNameProp,
  variants: initialVariantsProp,
  onSuccess,
}: VariantUpdateModalProps) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s: ToastState) => s.showToast);
  const [rows, setRows] = React.useState<VariantRow[]>([]);
  const [defaultKey, setDefaultKey] = React.useState<string>("");
  const [baselines, setBaselines] = React.useState<Record<string, Variant>>({});
  const [savingRowKey, setSavingRowKey] = React.useState<string | null>(null);
  const seededForOpenRef = React.useRef(false);

  const { data: fetchedProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: QUERY_KEY.product(productId),
    queryFn: () => fetchProductById(productId),
    enabled: open && !!productId,
  });

  const productName = productNameProp ?? fetchedProduct?.name ?? "";

  React.useEffect(() => {
    if (!open) {
      seededForOpenRef.current = false;
      return;
    }
    if (seededForOpenRef.current) return;
    if (initialVariantsProp === undefined && isLoadingProduct) return;

    const source = initialVariantsProp ?? fetchedProduct?.variants ?? [];
    const list: VariantRow[] = source.length
      ? source.map(toRow)
      : [
          {
            tempId: crypto.randomUUID(),
            productId,
            name: "",
            description: null as string | null,
            price: 0,
            stock: 0,
            images: [],
            initialImages: [],
            isDefault: true,
          } satisfies VariantRow,
        ];
    setRows(list);
    const currentDefault = list.find(r => r.isDefault);
    setDefaultKey(
      currentDefault ? getRowKey(currentDefault) : getRowKey(list[0])
    );
    const nextBaselines: Record<string, Variant> = {};
    for (const v of source) {
      nextBaselines[v.id] = v;
    }
    setBaselines(nextBaselines);
    seededForOpenRef.current = true;
  }, [
    open,
    productId,
    initialVariantsProp,
    fetchedProduct?.variants,
    isLoadingProduct,
  ]);

  const updateRow = (key: string, patch: Partial<VariantRow>) => {
    setRows(prev =>
      prev.map(r => (getRowKey(r) === key ? { ...r, ...patch } : r))
    );
  };

  const addVariant = () => {
    const newRow: VariantRow = {
      tempId: crypto.randomUUID(),
      productId,
      name: "",
      description: null,
      price: 0,
      stock: 0,
      images: [],
      initialImages: [],
      isDefault: rows.length === 0,
    };
    setRows(prev => [...prev, newRow]);
    if (rows.length === 0) setDefaultKey(newRow.tempId!);
  };

  const removeVariant = async (key: string) => {
    if (rows.length <= 1) {
      showToast("At least 1 variant is required.", "error");
      return;
    }
    const row = rows.find(r => getRowKey(r) === key);
    const nextRows = rows.filter(r => getRowKey(r) !== key);
    if (row?.id) {
      try {
        await deleteVariant(row.id);
        setBaselines(prev => {
          const next = { ...prev };
          delete next[row.id!];
          return next;
        });
        showToast("Variant deleted.", "success");
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.product(productId) });
        onSuccess?.();
      } catch {
        showToast("Failed to delete variant.", "error");
        return;
      }
    }
    setRows(nextRows);
    if (defaultKey === key && nextRows.length > 0) {
      setDefaultKey(getRowKey(nextRows[0]));
    }
  };

  const invalidateProductQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: QUERY_KEY.product(productId) });
  };

  const handleSaveRow = async (rowKey: string) => {
    const row = rows.find(r => getRowKey(r) === rowKey);
    if (!row) return;

    if (!row.name.trim()) {
      showToast("Variant name is required.", "error");
      return;
    }
    if (!row.images?.length || row.images.length < MIN_VARIANT_IMAGES) {
      showToast(
        `Each variant needs at least ${MIN_VARIANT_IMAGES} image.`,
        "error"
      );
      return;
    }

    const defaultRow = rows.find(r => getRowKey(r) === defaultKey);
    if (!defaultRow) {
      showToast("Please select a default variant.", "error");
      return;
    }

    setSavingRowKey(rowKey);
    try {
      if (row.tempId && !row.id) {
        const created = await createVariant({
          productId: row.productId,
          name: row.name.trim(),
          description: row.description,
          price: row.price,
          stock: row.stock,
          images: row.images,
          isDefault: rowKey === defaultKey,
        } as CreateVariantBody);
        setRows(prev =>
          prev.map(r => (getRowKey(r) === rowKey ? toRow(created) : r))
        );
        setBaselines(prev => ({ ...prev, [created.id]: created }));
        showToast("Variant created.", "success");
      } else if (row.id) {
        const baseline = baselines[row.id];
        if (
          !isPersistedVariantDirty(row, rowKey, defaultKey, baseline)
        ) {
          showToast("No changes to save.", "warning");
          return;
        }
        const updated = await updateVariant(row.id, {
          name: row.name.trim(),
          description: row.description,
          price: row.price,
          stock: row.stock,
          images: row.images,
          isDefault: rowKey === defaultKey,
        });
        setRows(prev =>
          prev.map(r => (r.id === updated.id ? toRow(updated) : r))
        );
        setBaselines(prev => ({ ...prev, [updated.id]: updated }));
        showToast("Variant updated.", "success");
      }
      invalidateProductQueries();
      onSuccess?.();
    } catch {
      showToast("Failed to save variant.", "error");
    } finally {
      setSavingRowKey(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        Manage variants
        {productName && (
          <Typography
            component="span"
            variant="body2"
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            — {productName}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {initialVariantsProp === undefined && isLoadingProduct ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              At least 1 variant. Each needs at least {MIN_VARIANT_IMAGES}{" "}
              image. Choose the default with the radio, then use{" "}
              <strong>Add</strong> (new row) or <strong>Save</strong> (existing)
              on each card. Delete removes the variant from the server when it
              was already saved.
            </Typography>
            {rows.length < 1 && (
              <FormHelperText error>
                At least 1 variant is required.
              </FormHelperText>
            )}
            <RadioGroup
              value={defaultKey}
              onChange={(_, value) => setDefaultKey(value)}
            >
              <Stack spacing={2}>
                {rows.map(row => {
                  const rk = getRowKey(row);
                  const baseline = row.id ? baselines[row.id] : undefined;
                  const dirty = isPersistedVariantDirty(
                    row,
                    rk,
                    defaultKey,
                    baseline
                  );
                  return (
                    <VariantRowCard
                      key={rk}
                      row={row}
                      rowKey={rk}
                      isPersistedDirty={dirty}
                      isSavingRow={savingRowKey === rk}
                      onUpdate={patch => updateRow(rk, patch)}
                      onRemove={() => void removeVariant(rk)}
                      onSaveRow={() => void handleSaveRow(rk)}
                      canRemove={rows.length > 1}
                      onPersistedImageRemoved={() => {
                        queryClient.invalidateQueries({
                          queryKey: QUERY_KEY.product(productId),
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["products"],
                        });
                      }}
                      onSyncBaseline={v =>
                        setBaselines(prev => ({ ...prev, [v.id]: v }))
                      }
                    />
                  );
                })}
              </Stack>
            </RadioGroup>
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={addVariant}
              disabled={rows.length >= 20}
            >
              Add variant
            </Button>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={savingRowKey !== null}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type VariantRowCardProps = {
  row: VariantRow;
  rowKey: string;
  isPersistedDirty: boolean;
  isSavingRow: boolean;
  onUpdate: (patch: Partial<VariantRow>) => void;
  onRemove: () => void;
  onSaveRow: () => void;
  canRemove: boolean;
  onPersistedImageRemoved: () => void;
  onSyncBaseline: (v: Variant) => void;
};

function VariantRowCard({
  row,
  rowKey,
  isPersistedDirty,
  isSavingRow,
  onUpdate,
  onRemove,
  onSaveRow,
  canRemove,
  onPersistedImageRemoved,
  onSyncBaseline,
}: VariantRowCardProps) {
  const showToast = useToastStore((s: ToastState) => s.showToast);
  const [deletingImageIndex, setDeletingImageIndex] = React.useState<
    number | null
  >(null);
  const initialImages = row.initialImages ?? [];
  const newImageKeys = (row.images ?? []).filter(
    k => !initialImages.includes(k)
  );
  const allImages = [...initialImages, ...newImageKeys];
  const canRemoveSavedImage = allImages.length > MIN_VARIANT_IMAGES;
  /** Max keys allowed in the “new uploads” list (same semantics as ProductUpdateModal uploader). */
  const maxNewKeysCapacity = Math.max(
    0,
    MAX_VARIANT_IMAGES - initialImages.length
  );
  /** Row created via “Add variant” — no server id yet; skip the full “Variant images” section chrome. */
  const isNewUnsavedVariant = Boolean(row.tempId && !row.id);
  const addFormValid =
    Boolean(row.name.trim()) &&
    (row.images?.length ?? 0) >= MIN_VARIANT_IMAGES;
  const showAddButton = isNewUnsavedVariant;
  const showSaveButton = !isNewUnsavedVariant && row.id != null;

  const removeSavedImage = async (index: number) => {
    const imageKey = initialImages[index];
    if (imageKey == null || deletingImageIndex !== null) return;
    if (allImages.length <= MIN_VARIANT_IMAGES) {
      showToast(
        `Each variant must keep at least ${MIN_VARIANT_IMAGES} image.`,
        "error"
      );
      return;
    }

    setDeletingImageIndex(index);
    try {
      if (row.id != null) {
        const v = await removeVariantImage(row.id, imageKey);
        const serverImages = v.images ?? [];
        onUpdate({
          images: [...serverImages, ...newImageKeys],
          initialImages: [...serverImages],
        });
        onSyncBaseline(v);
        onPersistedImageRemoved();
      } else {
        const nextInitial = initialImages.filter((_, i) => i !== index);
        onUpdate({
          images: [...nextInitial, ...newImageKeys],
          initialImages: nextInitial,
        });
      }
      showToast("Image removed.", "success");
    } catch {
      showToast("Failed to remove image.", "error");
    } finally {
      setDeletingImageIndex(null);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Radio value={rowKey} size="small" />
            <Typography variant="subtitle2">
              {row.name || (row.tempId ? "New variant" : "Variant")}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.25}>
            {showAddButton && (
              <IconButton
                size="small"
                onClick={onSaveRow}
                disabled={!addFormValid || isSavingRow}
                aria-label="Create variant"
                color="primary"
              >
                {isSavingRow ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AddCircleOutlineRoundedIcon fontSize="small" />
                )}
              </IconButton>
            )}
            {showSaveButton && (
              <IconButton
                size="small"
                onClick={onSaveRow}
                disabled={!isPersistedDirty || isSavingRow}
                aria-label="Save variant"
                color="primary"
              >
                {isSavingRow ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SaveRoundedIcon fontSize="small" />
                )}
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={onRemove}
              disabled={!canRemove || isSavingRow}
              aria-label="Delete variant"
              color="error"
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Variant name"
            size="small"
            value={row.name}
            onChange={e => onUpdate({ name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Description"
            size="small"
            value={row.description ?? ""}
            onChange={e => onUpdate({ description: e.target.value || null })}
            fullWidth
          />
          <TextField
            label="Price (VND)"
            type="number"
            size="small"
            value={row.price}
            onChange={e => onUpdate({ price: Number(e.target.value) || 0 })}
            slotProps={{ htmlInput: { min: 0 } }}
            fullWidth
          />
          <TextField
            label="Stock"
            type="number"
            size="small"
            value={row.stock}
            onChange={e => onUpdate({ stock: Number(e.target.value) || 0 })}
            slotProps={{ htmlInput: { min: 0 } }}
            fullWidth
          />
        </Stack>
        <Box>
          {!isNewUnsavedVariant && (
            <>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                Variant images
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                Min {MIN_VARIANT_IMAGES}, max {MAX_VARIANT_IMAGES} total. Saved
                images are listed first; new uploads stay in temporary storage
                until you save variants.
              </Typography>
            </>
          )}
          {allImages.length < MIN_VARIANT_IMAGES && (
            <FormHelperText error sx={{ mb: 1 }}>
              At least {MIN_VARIANT_IMAGES} image required.
            </FormHelperText>
          )}

          {!isNewUnsavedVariant && (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: "block" }}
              >
                Saved images
              </Typography>
              {initialImages.length > 0 ? (
                <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
                  {initialImages.map((imageKey, index) => (
                    <Box
                      key={`saved-${index}-${imageKey.slice(-12)}`}
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
                        src={buildImageFullUrl(imageKey)}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          opacity: deletingImageIndex === index ? 0.6 : 1,
                        }}
                      />
                      {canRemoveSavedImage && (
                        <IconButton
                          size="small"
                          onClick={() => void removeSavedImage(index)}
                          disabled={deletingImageIndex !== null}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "background.paper",
                            "&:hover": { bgcolor: "action.selected" },
                            width: 24,
                            height: 24,
                          }}
                          aria-label="Remove saved image"
                        >
                          {deletingImageIndex === index ? (
                            <CircularProgress size={14} />
                          ) : (
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  No saved images yet
                  {newImageKeys.length > 0 ? " — add more below." : "."}
                </Typography>
              )}
            </>
          )}

          {maxNewKeysCapacity > 0 && (
            <PresignedUploader
              value={newImageKeys}
              onChange={keys =>
                onUpdate({ images: [...initialImages, ...keys] })
              }
              maxFiles={maxNewKeysCapacity}
              maxFileSizeMb={DEFAULT_MAX_FILE_SIZE_MB}
              prefix={DEFAULT_PREFIX}
              label={isNewUnsavedVariant ? "Images" : "Add images"}
              helperText={
                isNewUnsavedVariant
                  ? `At least ${MIN_VARIANT_IMAGES} image (max ${MAX_VARIANT_IMAGES}, ${DEFAULT_MAX_FILE_SIZE_MB}MB each). Temporary storage — click Add on this card to create the variant.`
                  : `Upload new images (max ${maxNewKeysCapacity} in temporary storage, ${DEFAULT_MAX_FILE_SIZE_MB}MB each). Previews appear below the button — click Save on this card to move them to this variant.`
              }
              buttonLabel="Upload images"
              previewSize={72}
              uploadSuccessMessage={PRESIGNED_TMP_UPLOAD_SUCCESS}
            />
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
