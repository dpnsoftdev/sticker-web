import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support - must be called before any schemas are created
extendZodWithOpenApi(z);
