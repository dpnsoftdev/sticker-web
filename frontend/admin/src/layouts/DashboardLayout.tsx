import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

/**
 * Dashboard layout with sidebar/topbar.
 * Replace with your actual sidebar + topbar when ready.
 */
export default function DashboardLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
      {/* TODO: add Sidebar + Topbar */}
      <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
