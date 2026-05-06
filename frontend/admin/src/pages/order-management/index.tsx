import * as React from "react";

import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchOrders, updateOrderAdminNote } from "@apis/order.api";
import useToastStore, { type ToastState } from "@stores/toastStore";
import type { Order, OrderStatus } from "@types";

import BillImageThumbnail from "./components/BillImageThumbnail";
import OrderDetailDrawer from "./components/OrderDetailDrawer";
import { ORDER_STATUS_CONFIG, getStatusColor } from "./orderStatusConfig";

const QUERY_KEY = {
  orders: (params: {
    page: number;
    limit: number;
    status?: OrderStatus;
    keyword?: string;
  }) => ["orders", params] as const,
};

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

function formatOrderTotal(amount: number, currency = "VND") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function shippingNotesText(shippingInfo: Order["shippingInfo"]): string | null {
  const raw = (shippingInfo as { notes?: string | null }).notes;
  if (raw == null || typeof raw !== "string") return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

/** Returns a safe href for opening in a new tab, or null if empty. */
function contactSocialHref(
  socialLink: string | undefined | null
): string | null {
  const t = socialLink?.trim() ?? "";
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

type NotePopoverState = {
  orderId: string;
  anchorEl: HTMLElement;
  draft: string;
};

export default function OrderManagementPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s: ToastState) => s.showToast);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "">("");
  const [keyword, setKeyword] = React.useState("");
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [notePopover, setNotePopover] = React.useState<NotePopoverState | null>(
    null
  );

  const saveNoteMutation = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote: string | null }) =>
      updateOrderAdminNote(id, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      showToast("Staff note saved.", "success");
      setNotePopover(null);
    },
    onError: () => {
      showToast("Could not save staff note.", "error");
    },
  });

  const {
    data: listData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: QUERY_KEY.orders({
      page: page + 1,
      limit: rowsPerPage,
      status: statusFilter || undefined,
      keyword: keyword.trim() || undefined,
    }),
    queryFn: () =>
      fetchOrders({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter || undefined,
        keyword: keyword.trim() || undefined,
      }),
    staleTime: 15_000,
  });

  const orders = listData?.data ?? [];
  const hasNextPage = orders.length >= rowsPerPage;

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrderId(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        flexWrap="wrap"
      >
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Track and update orders. Filter by status and search by order ID.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="order-status-label">Status</InputLabel>
            <Select
              labelId="order-status-label"
              value={statusFilter}
              label="Status"
              onChange={e => {
                setStatusFilter(e.target.value as OrderStatus | "");
                setPage(0);
              }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {(Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[]).map(s => (
                <MenuItem key={s} value={s}>
                  {ORDER_STATUS_CONFIG[s].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="Search by order ID..."
            value={keyword}
            onChange={e => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 220 }}
          />
        </Stack>
      </Stack>

      <Card sx={{ mt: 2, borderRadius: 3, overflow: "hidden" }}>
        <CardContent sx={{ p: 0 }}>
          {isLoading && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ p: 2 }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading orders...
              </Typography>
            </Stack>
          )}

          {!isLoading && !isError && (
            <>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 700, minWidth: 108 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        component="span"
                      >
                        Bill
                        <Box
                          component="span"
                          aria-hidden
                          sx={{
                            opacity: 0.45,
                            display: "inline-flex",
                            ml: -0.25,
                          }}
                        >
                          <NoteAltRoundedIcon sx={{ fontSize: 15 }} />
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Customer notes
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Items
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Total
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map(order => {
                    const shipNotes = shippingNotesText(order.shippingInfo);
                    const hasStaffNote = Boolean(order.adminNote?.trim());
                    const socialHref = contactSocialHref(
                      order.contact.social_link
                    );
                    const socialLabel = order.contact.social_link?.trim() ?? "";
                    const showSocialLink = Boolean(socialHref && socialLabel);
                    return (
                      <TableRow
                        key={order.id}
                        hover
                        sx={theme => ({
                          cursor: "pointer",
                          ...(hasStaffNote
                            ? {
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                boxShadow: `inset 4px 0 0 ${theme.palette.warning.main}`,
                                "&:hover": {
                                  bgcolor: alpha(
                                    theme.palette.warning.main,
                                    0.16
                                  ),
                                },
                              }
                            : {
                                "&:hover": { bgcolor: "action.hover" },
                              }),
                        })}
                        onClick={() => handleViewOrder(order)}
                      >
                        <TableCell
                          sx={{ width: 108, verticalAlign: "middle", py: 1 }}
                          onClick={e => e.stopPropagation()}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                          >
                            <Box
                              onClick={() => handleViewOrder(order)}
                              sx={{
                                cursor: "pointer",
                                lineHeight: 0,
                                borderRadius: 1,
                                "&:focus-visible": {
                                  outline: 2,
                                  outlineColor: "primary.main",
                                  outlineOffset: 2,
                                },
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleViewOrder(order);
                                }
                              }}
                            >
                              <BillImageThumbnail
                                billKey={order.payment?.bill_image}
                              />
                            </Box>
                            <Tooltip
                              title={
                                hasStaffNote
                                  ? "Edit staff note"
                                  : "Add staff note"
                              }
                            >
                              <IconButton
                                size="small"
                                aria-label={
                                  hasStaffNote
                                    ? "Edit staff note"
                                    : "Add staff note"
                                }
                                onClick={e => {
                                  e.stopPropagation();
                                  setNotePopover({
                                    orderId: order.id,
                                    anchorEl: e.currentTarget,
                                    draft: order.adminNote ?? "",
                                  });
                                }}
                                sx={{
                                  p: 0.5,
                                  width: 30,
                                  height: 30,
                                  borderRadius: 1.5,
                                  flexShrink: 0,
                                  ...(hasStaffNote
                                    ? {
                                        color: "warning.main",
                                        bgcolor: alpha(
                                          theme.palette.warning.main,
                                          0.2
                                        ),
                                        boxShadow: `0 0 0 1px ${alpha(theme.palette.warning.main, 0.35)} inset`,
                                        "&:hover": {
                                          bgcolor: alpha(
                                            theme.palette.warning.main,
                                            0.32
                                          ),
                                        },
                                      }
                                    : {
                                        color: "text.disabled",
                                        border: "1px dashed",
                                        borderColor: "divider",
                                        bgcolor: alpha(
                                          theme.palette.action.hover,
                                          0.6
                                        ),
                                        "&:hover": {
                                          color: "warning.main",
                                          borderColor: "warning.light",
                                          borderStyle: "solid",
                                          bgcolor: alpha(
                                            theme.palette.warning.main,
                                            0.1
                                          ),
                                        },
                                      }),
                                }}
                              >
                                <NoteAltRoundedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(order.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {order.shippingInfo.receiver_name ??
                              order.contact.email ??
                              "-"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {order.contact.email}
                          </Typography>
                          {showSocialLink && socialHref && (
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.25}
                              sx={{ mt: 0.25, maxWidth: 220 }}
                              onClick={e => e.stopPropagation()}
                            >
                              <Tooltip title={socialLabel}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                  sx={{ flex: 1, minWidth: 0 }}
                                >
                                  {socialLabel}
                                </Typography>
                              </Tooltip>
                              <Tooltip title="Open contact link">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={socialHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="Open customer social link"
                                  sx={{ flexShrink: 0, p: 0.25 }}
                                >
                                  <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          {shipNotes ? (
                            <Tooltip title={shipNotes}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                <Box
                                  component="span"
                                  sx={{ color: "error.main", mr: 0.25 }}
                                >
                                  *
                                </Box>
                                {shipNotes}
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              ORDER_STATUS_CONFIG[order.status as OrderStatus]
                                ?.label ?? order.status
                            }
                            size="small"
                            color={getStatusColor(order.status as OrderStatus)}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {order.items?.length ?? 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatOrderTotal(
                              order.finalAmount,
                              order.currency ?? "VND"
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="right"
                          onClick={e => e.stopPropagation()}
                        >
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              aria-label="View order"
                              onClick={() => handleViewOrder(order)}
                            >
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Stack alignItems="center" sx={{ py: 4 }}>
                          <FilterListRoundedIcon
                            sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                          />
                          <Typography color="text.secondary">
                            No orders found. Try changing the filter or search.
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {orders.length > 0 && (
                <TablePagination
                  component="div"
                  count={
                    hasNextPage
                      ? (page + 2) * rowsPerPage
                      : page * rowsPerPage + orders.length
                  }
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                  labelRowsPerPage="Rows per page:"
                  labelDisplayedRows={({ from, to }) => `${from}–${to}`}
                  nextIconButtonProps={{
                    disabled: !hasNextPage || orders.length === 0,
                  }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Popover
        open={Boolean(notePopover)}
        anchorEl={notePopover?.anchorEl ?? null}
        onClose={() => setNotePopover(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              borderRadius: 2,
              width: 300,
              p: 2,
              mt: 0.5,
              border: 1,
              borderColor: "divider",
            },
          },
        }}
      >
        {notePopover && (
          <Stack spacing={1.5}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              letterSpacing={0.02}
            >
              Staff note
            </Typography>
            <TextField
              multiline
              minRows={3}
              size="small"
              fullWidth
              placeholder="Internal only — not shown to customers"
              value={notePopover.draft}
              onChange={e =>
                setNotePopover(prev =>
                  prev ? { ...prev, draft: e.target.value } : null
                )
              }
              disabled={saveNoteMutation.isPending}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                onClick={() => setNotePopover(null)}
                color="inherit"
                disabled={saveNoteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                color="warning"
                disabled={saveNoteMutation.isPending}
                onClick={() => {
                  if (!notePopover) return;
                  const t = notePopover.draft.trim();
                  saveNoteMutation.mutate({
                    id: notePopover.orderId,
                    adminNote: t === "" ? null : t,
                  });
                }}
              >
                {saveNoteMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </Stack>
          </Stack>
        )}
      </Popover>

      <OrderDetailDrawer
        open={drawerOpen}
        orderId={selectedOrderId}
        onClose={handleCloseDrawer}
      />
    </Box>
  );
}
