import * as React from "react";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import {
  fetchOrderById,
  updateOrderAdminNote,
  updateOrderStatus,
} from "@apis/order.api";
import { ROUTES_APP } from "@constants";
import useToastStore, { type ToastState } from "@stores/toastStore";
import type { Order, OrderItemDisplay, OrderStatus } from "@types";

import OrderDetailViewBody from "./OrderDetailViewBody";
import { ORDER_STATUS_CONFIG } from "../orderStatusConfig";

const DRAWER_WIDTH = 420;

export type OrderDetailDrawerProps = {
  open: boolean;
  orderId: string | null;
  onClose: () => void;
};

function getApiErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const ax = err as AxiosError<{ message?: string }>;
    const msg = ax.response?.data?.message;
    if (typeof msg === "string") return msg;
  }
  return "Failed to update order status. Please try again.";
}

export default function OrderDetailDrawer({
  open,
  orderId,
  onClose,
}: OrderDetailDrawerProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s: ToastState) => s.showToast);
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [confirmStatus, setConfirmStatus] = React.useState<{
    status: OrderStatus;
    label: string;
  } | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = React.useState(false);
  const [adminNoteDraft, setAdminNoteDraft] = React.useState("");

  React.useEffect(() => {
    if (!open || !orderId) {
      setOrder(null);
      setConfirmStatus(null);
      setCancelConfirmOpen(false);
      setAdminNoteDraft("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchOrderById(orderId)
      .then(data => {
        if (!cancelled) setOrder(data ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  React.useEffect(() => {
    if (orderId && order?.id === orderId) {
      setAdminNoteDraft(order.adminNote ?? "");
    }
  }, [orderId, order?.id, order?.adminNote]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: updated => {
      setOrder(updated);
      setConfirmStatus(null);
      setCancelConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      showToast("Order status updated.", "success");
    },
    onError: err => {
      showToast(getApiErrorMessage(err), "error");
    },
  });

  const updateAdminNoteMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string | null }) =>
      updateOrderAdminNote(id, note),
    onSuccess: updated => {
      setOrder(updated);
      setAdminNoteDraft(updated.adminNote ?? "");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      showToast("Admin note saved.", "success");
    },
    onError: err => {
      showToast(getApiErrorMessage(err), "error");
    },
  });

  const handleSaveAdminNote = () => {
    if (!order) return;
    const trimmed = adminNoteDraft.trim();
    updateAdminNoteMutation.mutate({
      id: order.id,
      note: trimmed === "" ? null : trimmed,
    });
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (!order) return;
    if (newStatus === "payment_confirmed") {
      setConfirmStatus({
        status: newStatus,
        label: ORDER_STATUS_CONFIG[newStatus]?.label ?? newStatus,
      });
      return;
    }
    if (newStatus === "cancelled") {
      setCancelConfirmOpen(true);
      return;
    }
    updateStatusMutation.mutate({ id: order.id, status: newStatus });
  };

  const handleConfirmStatus = () => {
    if (!order || !confirmStatus) return;
    updateStatusMutation.mutate({ id: order.id, status: confirmStatus.status });
  };

  const handleConfirmCancel = () => {
    if (!order) return;
    updateStatusMutation.mutate({ id: order.id, status: "cancelled" });
  };

  const handleOrderItemClick = (item: OrderItemDisplay) => {
    const vid = item.variantId ?? item.variant?.id;
    if (!vid) return;
    const productName = item.product?.name ?? item.productName ?? "";
    const search = new URLSearchParams({
      productId: item.productId,
      variantId: vid,
      ...(productName ? { productName } : {}),
    });
    navigate(`${ROUTES_APP.ORDER_PRODUCTS}?${search.toString()}`);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: { sx: { bgcolor: "rgba(0,0,0,0.2)" } },
      }}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: DRAWER_WIDTH },
          maxWidth: "100%",
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.08)",
        },
      }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Order details
          </Typography>
          <IconButton onClick={onClose} aria-label="Close" size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Box sx={{ flex: 1, overflow: "auto", px: 2.5, py: 2 }}>
          {loading && (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Loading order...
              </Typography>
            </Stack>
          )}

          {!loading && order && (
            <OrderDetailViewBody
              order={order}
              statusUi="manage"
              onStatusChange={handleStatusChange}
              statusUpdateDisabled={updateStatusMutation.isPending}
              onOrderItemRowClick={handleOrderItemClick}
              adminNoteDraft={adminNoteDraft}
              onAdminNoteDraftChange={setAdminNoteDraft}
              onAdminNoteSave={handleSaveAdminNote}
              adminNoteSaving={updateAdminNoteMutation.isPending}
            />
          )}

          {!loading && !order && orderId && (
            <Typography color="text.secondary">Order not found.</Typography>
          )}
        </Box>
      </Box>

      {/* Confirm: Payment confirmed */}
      <Dialog
        open={!!confirmStatus}
        onClose={() => setConfirmStatus(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm payment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Confirming payment will deduct reserved stock. The order status will
            be changed to Paid.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setConfirmStatus(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmStatus}
            variant="contained"
            color="primary"
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? "Processing…" : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm: Cancel order — cannot revert */}
      <Dialog
        open={cancelConfirmOpen}
        onClose={() =>
          !updateStatusMutation.isPending && setCancelConfirmOpen(false)
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancel order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You cannot undo this action. This order will be cancelled. Any
            reserved stock (if any) will be released back.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button
            onClick={() => setCancelConfirmOpen(false)}
            color="inherit"
            disabled={updateStatusMutation.isPending}
          >
            Do not cancel
          </Button>
          <Button
            onClick={handleConfirmCancel}
            variant="contained"
            color="error"
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? "Processing…" : "Cancel order"}
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
