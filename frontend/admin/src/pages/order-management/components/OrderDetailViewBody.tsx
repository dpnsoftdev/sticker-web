import * as React from "react";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import type { Order, OrderItemDisplay, OrderStatus } from "@types";

import { ORDER_STATUS_CONFIG, getStatusColor } from "../orderStatusConfig";

const STATUS_STEPS: OrderStatus[] = [
  "pending_confirmation",
  "payment_confirmed",
  "shipping",
  "delivered",
];

export type OrderDetailViewBodyProps = {
  order: Order;
  /** `manage` shows status update select; `readonly` shows status chip only. */
  statusUi: "manage" | "readonly";
  onStatusChange?: (status: OrderStatus) => void;
  statusUpdateDisabled?: boolean;
  /** When set, clicking a line item row invokes this (e.g. navigate to order-products). */
  onOrderItemRowClick?: (item: OrderItemDisplay) => void;
  /** Internal admin note (manage drawer only). */
  adminNoteDraft?: string;
  onAdminNoteDraftChange?: (value: string) => void;
  onAdminNoteSave?: () => void;
  adminNoteSaving?: boolean;
};

export default function OrderDetailViewBody({
  order,
  statusUi,
  onStatusChange,
  statusUpdateDisabled,
  onOrderItemRowClick,
  adminNoteDraft,
  onAdminNoteDraftChange,
  onAdminNoteSave,
  adminNoteSaving,
}: OrderDetailViewBodyProps) {
  const currentStepIndex = STATUS_STEPS.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === "cancelled";

  const hasShippingInfo =
    order?.shippingInfo?.receiver_name ||
    order?.shippingInfo?.address ||
    order?.shippingInfo?.notes;

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="caption" color="text.secondary">
          Order ID
        </Typography>
        <Chip
          label={order.id.slice(0, 8)}
          size="small"
          variant="outlined"
          sx={{ fontFamily: "monospace" }}
        />
      </Stack>

      <Box>
        <Typography variant="overline" color="text.secondary">
          Status
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
          sx={{ mt: 0.5 }}
        >
          <Chip
            label={
              ORDER_STATUS_CONFIG[order.status as OrderStatus]?.label ??
              order.status
            }
            size="small"
            color={getStatusColor(order.status as OrderStatus)}
            sx={{ fontWeight: 600 }}
          />
          {statusUi === "manage" && !isCancelled && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Update status</InputLabel>
              <Select
                value={order.status}
                label="Update status"
                onChange={e => onStatusChange?.(e.target.value as OrderStatus)}
                disabled={statusUpdateDisabled}
              >
                {STATUS_STEPS.map(s => (
                  <MenuItem key={s} value={s}>
                    {ORDER_STATUS_CONFIG[s]?.label ?? s}
                  </MenuItem>
                ))}
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          )}
        </Stack>
      </Box>

      {statusUi === "manage" &&
        onAdminNoteSave != null &&
        adminNoteDraft != null &&
        onAdminNoteDraftChange != null && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              borderColor: "warning.light",
              bgcolor: theme =>
                theme.palette.mode === "dark"
                  ? "rgba(255, 183, 77, 0.08)"
                  : "rgba(255, 183, 77, 0.12)",
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              Admin note (internal)
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Only visible in admin. Customers do not see this.
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              size="small"
              placeholder="e.g. follow up on payment, gift wrap, special handling…"
              value={adminNoteDraft}
              onChange={e => onAdminNoteDraftChange(e.target.value)}
              disabled={adminNoteSaving}
            />
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
              <Button
                variant="contained"
                color="warning"
                size="small"
                onClick={onAdminNoteSave}
                disabled={adminNoteSaving}
              >
                {adminNoteSaving ? "Saving…" : "Save note"}
              </Button>
            </Stack>
          </Paper>
        )}

      {statusUi === "readonly" && order.adminNote?.trim() && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Admin note
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
            {order.adminNote}
          </Typography>
        </Alert>
      )}

      {order.status === "pending_confirmation" && (
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon fontSize="small" />}
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2" component="span">
            <strong>Stock flow:</strong> Xác nhận thanh toán → trừ kho (confirm
            reserved stock). Hủy đơn → giải phóng kho đã giữ (release reserved
            stock).
          </Typography>
        </Alert>
      )}

      {!isCancelled && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            Progress
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {STATUS_STEPS.map((step, i) => {
              const done = currentStepIndex >= i;
              const Icon =
                step === "pending_confirmation"
                  ? PendingOutlinedIcon
                  : step === "payment_confirmed"
                    ? PaymentOutlinedIcon
                    : step === "shipping"
                      ? LocalShippingOutlinedIcon
                      : CheckCircleRoundedIcon;
              return (
                <React.Fragment key={step}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: done ? "primary.main" : "action.hover",
                        color: done ? "primary.contrastText" : "text.secondary",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ mt: 0.5, maxWidth: 56 }}
                    >
                      {ORDER_STATUS_CONFIG[step]?.shortLabel ?? step}
                    </Typography>
                  </Box>
                  {i < STATUS_STEPS.length - 1 && (
                    <Box
                      sx={{
                        flex: 0.5,
                        height: 2,
                        bgcolor:
                          currentStepIndex > i ? "primary.main" : "divider",
                        borderRadius: 1,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Stack>
        </Paper>
      )}

      <Divider />

      <Box>
        <Typography variant="overline" color="text.secondary">
          Contact
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {(order.contact as { email?: string }).email}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {(order.contact as { phone?: string }).phone}
        </Typography>
      </Box>

      {hasShippingInfo && (
        <Box>
          <Typography variant="overline" color="text.secondary">
            Shipping
          </Typography>
          {order.shippingInfo?.receiver_name && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {order.shippingInfo?.receiver_name}
            </Typography>
          )}
          {order.shippingInfo?.address && (
            <Typography variant="body2">
              {order.shippingInfo?.address}
            </Typography>
          )}
          {order.shippingInfo?.notes && (
            <Typography variant="body2" sx={{ mt: 0.5 }} color="text.secondary">
              <Box component="span" sx={{ color: "error.main", mr: 0.25 }}>
                {`*Note: `}
              </Box>
              {order.shippingInfo?.notes}
            </Typography>
          )}
        </Box>
      )}

      <Box>
        <Typography variant="overline" color="text.secondary">
          Payment
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {(order.payment as { method?: string }).method} ·{" "}
          {(order.payment as { plan_type?: string }).plan_type}
        </Typography>
      </Box>

      <Divider />

      <Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ mb: 1, display: "block" }}
        >
          Items
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell align="right">Qty</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.items?.map(item => (
              <TableRow
                key={item.id}
                hover={!!onOrderItemRowClick}
                onClick={
                  onOrderItemRowClick
                    ? () => onOrderItemRowClick(item)
                    : undefined
                }
                sx={onOrderItemRowClick ? { cursor: "pointer" } : undefined}
              >
                <TableCell>
                  {item.product?.name ?? item.productName ?? "Product"}
                  {item.variant?.name || item.variantName
                    ? ` · ${item.variant?.name ?? item.variantName}`
                    : ""}
                </TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Created{" "}
        {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
      </Typography>
    </Stack>
  );
}
