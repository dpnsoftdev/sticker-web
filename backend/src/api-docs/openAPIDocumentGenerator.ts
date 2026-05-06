import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { assetRegistry } from "@/api/assets/assetRouter";
import { authRegistry } from "@/api/auth/authRouter";
import { healthCheckRegistry } from "@/api/healthCheck/healthCheckRouter";
import { productRegistry } from "@/api/product/productRouter";
import { userRegistry } from "@/api/user/userRouter";
import { categoryRegistry } from "@/api/category/categoryRouter";
import { variantRegistry } from "@/api/variant/variantRouter";
import { homepageRegistry } from "@/api/@client/homepage/homepageRouter";
import { categoryPageRegistry } from "@/api/@client/category-page/categoryPageRouter";
import { dashboardRegistry } from "@/api/@admin/dashboard/dashboardRouter";
import { orderRegistry } from "@/api/order/orderRouter";

export function generateOpenAPIDocument() {
  const registry = new OpenAPIRegistry([
    healthCheckRegistry,
    authRegistry,
    userRegistry,
    productRegistry,
    categoryRegistry,
    variantRegistry,
    assetRegistry,
    homepageRegistry,
    categoryPageRegistry,
    orderRegistry,
    dashboardRegistry,
  ]);
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const doc = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Swagger API",
    },
    externalDocs: {
      description: "View the raw OpenAPI Specification in JSON format",
      url: "/swagger.json",
    },
  });

  return {
    ...doc,
    components: {
      ...doc.components,
      securitySchemes: {
        ...doc.components?.securitySchemes,
        bearerAuth: {
          type: "http" as const,
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token from login or refresh",
        },
      },
    },
  };
}
