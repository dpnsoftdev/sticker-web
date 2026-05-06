import * as React from "react";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { fetchProductVariantAggregates } from "@apis/order.api";
import OrderViewDialog from "@pages/order-management/components/OrderViewDialog";
import {
  ORDER_STATUS_CONFIG,
  getStatusColor,
} from "@pages/order-management/orderStatusConfig";
import type { OrderRefInVariantAggregate, OrderStatus } from "@types";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

function formatMoney(amount: number, currency: string) {
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

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function aggregateRowKey(productId: string, variantId: string) {
  return `${productId}:${variantId}`;
}

export default function OrderProductsPage() {
  const [searchParams] = useSearchParams();
  const highlightProductId = searchParams.get("productId") ?? "";
  const highlightVariantId = searchParams.get("variantId") ?? "";
  const keywordFromParams =
    searchParams.get("productName") ?? searchParams.get("keyword") ?? "";

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [keyword, setKeyword] = React.useState(keywordFromParams);
  const [excludeCancelled, setExcludeCancelled] = React.useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = React.useState<
    OrderStatus | ""
  >("");

  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [menuForKey, setMenuForKey] = React.useState<string | null>(null);
  const [viewOrderId, setViewOrderId] = React.useState<string | null>(null);
  const highlightRef = React.useRef<HTMLTableRowElement | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "order-product-aggregates",
      {
        page: page + 1,
        limit: rowsPerPage,
        excludeCancelled,
        keyword: keyword.trim() || undefined,
        orderStatus: orderStatusFilter || undefined,
      },
    ],
    queryFn: () =>
      fetchProductVariantAggregates({
        page: page + 1,
        limit: rowsPerPage,
        excludeCancelled,
        keyword: keyword.trim() || undefined,
        orderStatus: orderStatusFilter || undefined,
      }),
    staleTime: 15_000,
  });

  const rows = data?.data ?? [];
  const totalRows = data?.total ?? 0;

  const handleOrdersMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    rowKey: string
  ) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuForKey(rowKey);
  };

  const handleOrdersMenuClose = () => {
    setMenuAnchor(null);
    setMenuForKey(null);
  };

  const openOrderModal = (orderId: string) => {
    setViewOrderId(orderId);
    handleOrdersMenuClose();
  };

  const menuOrders =
    menuForKey != null
      ? rows.find(
          r => aggregateRowKey(r.productId, r.variantId) === menuForKey
        )?.orders ?? []
      : [];

  React.useEffect(() => {
    setKeyword(keywordFromParams);
    setPage(0);
  }, [keywordFromParams]);

  React.useEffect(() => {
    if (!highlightProductId || !highlightVariantId) return;
    highlightRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightProductId, highlightVariantId, rows, isLoading]);

  return (
    <Box>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Order products
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Demand grouped by product and variant. Open the order list to inspect
            each order (read-only).
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
          flexWrap="wrap"
        >
          <TextField
            size="small"
            placeholder="Search product, variant, or order ID..."
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
            sx={{ minWidth: 260, flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="agg-status-label">Order status filter</InputLabel>
            <Select
              labelId="agg-status-label"
              value={orderStatusFilter}
              label="Order status filter"
              onChange={e => {
                setOrderStatusFilter(e.target.value as OrderStatus | "");
                setPage(0);
              }}
            >
              <MenuItem value="">All (respect exclude cancelled)</MenuItem>
              {(Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[]).map(s => (
                <MenuItem key={s} value={s}>
                  {ORDER_STATUS_CONFIG[s].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={excludeCancelled}
                onChange={e => {
                  setExcludeCancelled(e.target.checked);
                  setPage(0);
                }}
              />
            }
            label="Hide cancelled"
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
                Loading…
              </Typography>
            </Stack>
          )}

          {!isLoading && isError && (
            <Typography sx={{ p: 2 }} color="error">
              Failed to load aggregates.
            </Typography>
          )}

          {!isLoading && !isError && (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Unit price
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Total qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Orders
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => {
                    const rk = aggregateRowKey(row.productId, row.variantId);
                    const isHighlighted =
                      highlightProductId === row.productId &&
                      highlightVariantId === row.variantId;
                    return (
                      <TableRow
                        key={rk}
                        ref={isHighlighted ? highlightRef : undefined}
                        hover
                        sx={{
                          ...(isHighlighted && {
                            outline: "2px solid",
                            outlineColor: "primary.main",
                            outlineOffset: -2,
                            bgcolor: "action.selected",
                          }),
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.productName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.variantName ?? "Default variant"}
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.disabled"
                            sx={{ fontFamily: "monospace", mt: 0.25 }}
                          >
                            {row.productId.slice(0, 8)}… ·{" "}
                            {row.variantId.slice(0, 8)}…
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatMoney(row.unitPrice, row.currency)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.totalQuantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            endIcon={<ExpandMoreRoundedIcon />}
                            onClick={e => handleOrdersMenuOpen(e, rk)}
                            aria-haspopup="true"
                            aria-expanded={
                              Boolean(menuAnchor) && menuForKey === rk
                            }
                          >
                            {row.orderCount}{" "}
                            {row.orderCount === 1 ? "order" : "orders"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography
                          align="center"
                          color="text.secondary"
                          sx={{ py: 4 }}
                        >
                          No matching product–variant lines.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalRows > 0 && (
                <TablePagination
                  component="div"
                  count={totalRows}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={e => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleOrdersMenuClose}
        slotProps={{
          list: { dense: true, sx: { minWidth: 280 } },
        }}
      >
        {menuOrders.map((o: OrderRefInVariantAggregate) => (
          <MenuItem
            key={o.orderItemId}
            onClick={() => openOrderModal(o.orderId)}
            sx={{ alignItems: "flex-start", flexDirection: "column", py: 1 }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ width: "100%" }}
            >
              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                {o.orderId.slice(0, 8)}…
              </Typography>
              <Chip
                size="small"
                label={
                  ORDER_STATUS_CONFIG[o.status as OrderStatus]?.label ??
                  o.status
                }
                color={getStatusColor(o.status as OrderStatus)}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Qty {o.quantity} · {formatShortDate(o.createdAt)}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      <OrderViewDialog
        open={viewOrderId != null}
        orderId={viewOrderId}
        onClose={() => setViewOrderId(null)}
      />
    </Box>
  );
}
