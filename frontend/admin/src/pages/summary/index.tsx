import * as React from "react";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fetchCategories } from "@apis/category.api";
import { fetchDashboardSummary } from "@apis/dashboard.api";
import { fetchProducts } from "@apis/product.api";
import { ORDER_STATUS_CONFIG } from "@pages/order-management/orderStatusConfig";
import type { DashboardGrain, OrderStatus } from "@types";

const ALL_STATUSES: OrderStatus[] = [
  "pending_confirmation",
  "payment_confirmed",
  "shipping",
  "delivered",
  "cancelled",
];

const QUERY_KEY = "dashboard-summary";

function formatVnd(n: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toLocaleString()} ₫`;
  }
}

function formatPct(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function endOfDayIso(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

function startOfDayIso(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function SummaryPage() {
  const defaults = React.useMemo(() => defaultDateRange(), []);
  const [from, setFrom] = React.useState(defaults.from);
  const [to, setTo] = React.useState(defaults.to);
  const [grain, setGrain] = React.useState<DashboardGrain>("day");
  const [statuses, setStatuses] = React.useState<OrderStatus[]>([]);
  const [categoryId, setCategoryId] = React.useState("");
  const [productId, setProductId] = React.useState("");
  const [campaignId, setCampaignId] = React.useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: fetchCategories,
  });

  const { data: productList } = useQuery({
    queryKey: ["products", "summary-dd", categoryId],
    queryFn: () =>
      fetchProducts({
        limit: 200,
        page: 1,
        ...(categoryId ? { category_id: categoryId } : {}),
      }),
  });

  const products = productList?.data ?? [];

  const queryParams = React.useMemo(() => {
    const fromD = new Date(from);
    const toD = new Date(to);
    return {
      from: startOfDayIso(fromD),
      to: endOfDayIso(toD),
      grain,
      statuses: statuses.length ? statuses : undefined,
      categoryId: categoryId || undefined,
      productId: productId || undefined,
      campaignId: campaignId.trim() || undefined,
    };
  }, [from, to, grain, statuses, categoryId, productId, campaignId]);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: [QUERY_KEY, queryParams],
    queryFn: () => fetchDashboardSummary(queryParams),
  });

  const handleStatusChange = (e: SelectChangeEvent<OrderStatus[]>) => {
    const v = e.target.value;
    setStatuses(typeof v === "string" ? [] : v);
  };

  const chartData = React.useMemo(() => {
    if (!data?.timeSeries?.current?.length) return [];
    return data.timeSeries.current.map(row => ({
      label: row.bucket,
      net: row.netRevenue,
      orders: row.orderCount,
    }));
  }, [data]);

  const statusChartData = React.useMemo(() => {
    if (!data?.byStatus?.length) return [];
    return [...data.byStatus]
      .sort((a, b) => b.orderCount - a.orderCount)
      .map(row => ({
        name: ORDER_STATUS_CONFIG[row.status]?.shortLabel ?? row.status,
        orders: row.orderCount,
        net: row.netRevenue,
      }));
  }, [data]);

  const pctChip = (v: number | null | undefined) => (
    <Chip
      size="small"
      label={formatPct(v)}
      color={
        v == null ? "default" : v > 0 ? "success" : v < 0 ? "error" : "default"
      }
      sx={{ fontWeight: 700 }}
    />
  );

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          Filters
        </Typography>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          flexWrap="wrap"
          useFlexGap
        >
          <TextField
            label="From"
            type="date"
            size="small"
            value={from}
            onChange={e => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={to}
            onChange={e => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Grain"
            size="small"
            value={grain}
            onChange={e => setGrain(e.target.value as DashboardGrain)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
          </TextField>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="st-label">Order status</InputLabel>
            <Select<OrderStatus[]>
              labelId="st-label"
              multiple
              value={statuses}
              onChange={handleStatusChange}
              input={<OutlinedInput label="Order status" />}
              renderValue={sel =>
                sel.length === 0 ? "All" : `${sel.length} selected`
              }
            >
              {ALL_STATUSES.map(s => (
                <MenuItem key={s} value={s}>
                  {ORDER_STATUS_CONFIG[s].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            select
            label="Category"
            size="small"
            value={categoryId}
            onChange={e => {
              setCategoryId(e.target.value);
              setProductId("");
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All</MenuItem>
            {categories.map(c => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Product"
            size="small"
            value={productId}
            onChange={e => setProductId(e.target.value)}
            sx={{ minWidth: 220 }}
            disabled={!products.length}
          >
            <MenuItem value="">All</MenuItem>
            {products.map(p => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Campaign ID"
            size="small"
            value={campaignId}
            onChange={e => setCampaignId(e.target.value)}
            placeholder="Optional UUID"
            sx={{ minWidth: 260 }}
          />
          <Button
            variant="outlined"
            startIcon={
              isFetching ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshRoundedIcon />
              )
            }
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Typography color="error">
          {(error as Error).message ?? "Failed to load dashboard"}
        </Typography>
      )}

      {isLoading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && data && (
        <>
          {data.meta.empty && (
            <Typography color="text.secondary">
              No orders match these filters (check campaign dates or campaign
              ID).
            </Typography>
          )}

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
            }}
          >
            <Card variant="outlined">
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Orders
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {data.overview.orderCount}
                </Typography>
                <Stack direction="row" alignItems="center" gap={1} mt={1}>
                  <Typography variant="body2" color="text.secondary">
                    vs prev
                  </Typography>
                  {pctChip(data.overview.changePct.orderCount)}
                </Stack>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Net revenue
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {formatVnd(data.overview.netRevenue)}
                </Typography>
                <Stack direction="row" alignItems="center" gap={1} mt={1}>
                  <Typography variant="body2" color="text.secondary">
                    vs prev
                  </Typography>
                  {pctChip(data.overview.changePct.netRevenue)}
                </Stack>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  GMV (subtotal)
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {formatVnd(data.overview.gmv)}
                </Typography>
                <Stack direction="row" alignItems="center" gap={1} mt={1}>
                  {pctChip(data.overview.changePct.gmv)}
                </Stack>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Discounts
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {formatVnd(data.overview.discountTotal)}
                </Typography>
                {pctChip(data.overview.changePct.discountTotal)}
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  AOV (net)
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {formatVnd(data.overview.aov)}
                </Typography>
                {pctChip(data.overview.changePct.aov)}
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Period
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {new Date(data.meta.from).toLocaleDateString()} —{" "}
                  {new Date(data.meta.to).toLocaleDateString()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mt={1}
                >
                  Compare: {new Date(data.meta.prevFrom).toLocaleDateString()} —{" "}
                  {new Date(data.meta.prevTo).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Net revenue over time
              </Typography>
              <Box sx={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={v => `${(v / 1_000_000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={value => formatVnd(Number(value ?? 0))}
                      labelFormatter={l => String(l)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="net"
                      name="Net revenue"
                      stroke="#ab47bc"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Orders by status
              </Typography>
              <Box sx={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" name="Orders" fill="#42a5f5" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            }}
          >
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Top products (revenue)
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.topProducts.map(row => (
                      <TableRow key={row.productId}>
                        <TableCell>{row.productName}</TableCell>
                        <TableCell align="right">{row.quantity}</TableCell>
                        <TableCell align="right">
                          {formatVnd(row.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Top variants (revenue)
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Variant</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.topVariants.map(row => (
                      <TableRow key={row.variantId}>
                        <TableCell>
                          {row.productName}
                          {row.variantName ? ` — ${row.variantName}` : ""}
                        </TableCell>
                        <TableCell align="right">{row.quantity}</TableCell>
                        <TableCell align="right">
                          {formatVnd(row.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Box>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Top categories
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.topCategories.map(row => (
                    <TableRow key={row.categoryId}>
                      <TableCell>{row.categoryName}</TableCell>
                      <TableCell align="right">{row.quantity}</TableCell>
                      <TableCell align="right">
                        {formatVnd(row.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Promotions
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code / ID</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Discount</TableCell>
                    <TableCell align="right">Order revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.promotions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary">
                          No promotion rows in range
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {data.promotions.map((row, i) => (
                    <TableRow
                      key={`${row.promotionId ?? row.promotionCode ?? "p"}-${i}`}
                    >
                      <TableCell>
                        {row.promotionCode ?? row.promotionId ?? "—"}
                      </TableCell>
                      <TableCell align="right">{row.orderCount}</TableCell>
                      <TableCell align="right">
                        {formatVnd(row.totalDiscount)}
                      </TableCell>
                      <TableCell align="right">
                        {formatVnd(row.orderRevenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Campaigns (inventory / sell-through)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Revenue by campaign needs a future link from orders to
                campaign_items; figures below use stock only.
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Campaign</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Sell-through %</TableCell>
                    <TableCell align="right">Sold (est.)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.campaigns.map(c => (
                    <TableRow key={c.campaignId}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.status}</TableCell>
                      <TableCell align="right">
                        {c.sellThroughPct != null
                          ? `${c.sellThroughPct}%`
                          : "—"}
                      </TableCell>
                      <TableCell align="right">{c.soldEstimate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Inventory
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} mb={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total on hand
                  </Typography>
                  <Typography variant="h6">
                    {data.inventory.totalStockOnHand.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total reserved
                  </Typography>
                  <Typography variant="h6">
                    {data.inventory.totalStockReserved.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Low stock threshold
                  </Typography>
                  <Typography variant="h6">
                    ≤ {data.inventory.lowStockThreshold}
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Variants low on stock
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Variant</TableCell>
                    <TableCell align="right">On hand</TableCell>
                    <TableCell align="right">Reserved</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.inventory.lowStockVariants.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary">None</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {data.inventory.lowStockVariants.map(v => (
                    <TableRow key={v.variantId}>
                      <TableCell>{v.productName}</TableCell>
                      <TableCell>{v.variantName}</TableCell>
                      <TableCell align="right">{v.stockOnHand}</TableCell>
                      <TableCell align="right">{v.stockReserved}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </Stack>
  );
}
