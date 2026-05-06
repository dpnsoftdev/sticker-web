import { Router } from "express";

import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { authRouter } from "@/api/auth/authRouter";
import { userRouter } from "@/api/user/userRouter";
import { productRouter } from "@/api/product/productRouter";
import { categoryRouter } from "@/api/category/categoryRouter";
import { variantRouter } from "@/api/variant/variantRouter";
import { assetRouter } from "@/api/assets/assetRouter";
import { homepageRouter } from "@/api/@client/homepage/homepageRouter";
import { categoryPageRouter } from "@/api/@client/category-page/categoryPageRouter";
import { dashboardRouter } from "@/api/@admin/dashboard/dashboardRouter";
import { orderRouter } from "@/api/order/orderRouter";

const apiRouter = Router();

apiRouter.use("/health-check", healthCheckRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/variants", variantRouter);
apiRouter.use("/assets", assetRouter);
apiRouter.use("/homepage", homepageRouter);
apiRouter.use("/category-page", categoryPageRouter);
apiRouter.use("/admin/dashboard", dashboardRouter);
apiRouter.use("/orders", orderRouter);

export { apiRouter };
