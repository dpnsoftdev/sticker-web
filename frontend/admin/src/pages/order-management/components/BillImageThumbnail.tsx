import React from "react";

import { Box, Tooltip, Typography } from "@mui/material";

import { buildImageFullUrl } from "@utils";

function BillImageThumbnail({
  billKey,
}: {
  billKey: string | null | undefined;
}) {
  const src = buildImageFullUrl(billKey ?? "");
  const [failed, setFailed] = React.useState(false);

  if (!src || failed) {
    return (
      <Typography variant="caption" color="text.disabled">
        —
      </Typography>
    );
  }

  const preview = (
    <Box
      component="img"
      src={src}
      alt=""
      sx={{
        display: "block",
        maxWidth: { xs: 280, sm: 420 },
        maxHeight: 560,
        width: "auto",
        height: "auto",
        objectFit: "contain",
      }}
    />
  );

  return (
    <Tooltip
      title={preview}
      enterDelay={200}
      leaveDelay={120}
      slotProps={{
        popper: {
          modifiers: [{ name: "offset", options: { offset: [0, 10] } }],
        },
        tooltip: {
          sx: {
            bgcolor: "background.paper",
            color: "text.primary",
            border: 1,
            borderColor: "divider",
            p: 0.75,
            maxWidth: "none",
            boxShadow: 3,
          },
        },
      }}
    >
      <Box
        component="img"
        src={src}
        alt="Payment bill"
        onError={() => setFailed(true)}
        sx={{
          width: 48,
          height: 48,
          objectFit: "cover",
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          cursor: "zoom-in",
          display: "block",
        }}
      />
    </Tooltip>
  );
}

export default BillImageThumbnail;
