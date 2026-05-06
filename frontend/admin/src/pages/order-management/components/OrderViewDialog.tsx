import * as React from "react";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import { fetchOrderById } from "@apis/order.api";
import type { Order } from "@types";

import OrderDetailViewBody from "./OrderDetailViewBody";

export type OrderViewDialogProps = {
  open: boolean;
  orderId: string | null;
  onClose: () => void;
};

export default function OrderViewDialog({
  open,
  orderId,
  onClose,
}: OrderViewDialogProps) {
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !orderId) {
      setOrder(null);
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      slotProps={{
        paper: { sx: { borderRadius: 2 } },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
          Order details
        </Typography>
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {loading && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Loading order...
            </Typography>
          </Stack>
        )}
        {!loading && order && (
          <OrderDetailViewBody order={order} statusUi="readonly" />
        )}
        {!loading && !order && orderId && (
          <Typography color="text.secondary">Order not found.</Typography>
        )}
        {!orderId && <Box sx={{ py: 2 }} />}
      </DialogContent>
    </Dialog>
  );
}
