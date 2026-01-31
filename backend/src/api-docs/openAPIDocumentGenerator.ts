import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { assetRegistry } from "@/api/assets/assetRouter";
import { healthCheckRegistry } from "@/api/healthCheck/healthCheckRouter";
import { productRegistry } from "@/api/product/productRouter";
import { userRegistry } from "@/api/user/userRouter";
import { categoryRegistry } from "@/api/category/categoryRouter";

export function generateOpenAPIDocument() {
  const registry = new OpenAPIRegistry([
    healthCheckRegistry,
    userRegistry,
    productRegistry,
    categoryRegistry,
    assetRegistry,
  ]);
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
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
}
