import { Router } from "express";

import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { userRouter } from "@/api/user/userRouter";
import { productRouter } from "@/api/product/productRouter";
import { categoryRouter } from "@/api/category/categoryRouter";
import { variantRouter } from "@/api/variant/variantRouter";
import { assetRouter } from "@/api/assets/assetRouter";

const apiRouter = Router();

apiRouter.use("/health-check", healthCheckRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/variants", variantRouter);
apiRouter.use("/assets", assetRouter);

export { apiRouter };
