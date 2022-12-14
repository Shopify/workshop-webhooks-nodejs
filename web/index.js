// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import webhookHandlers from "./webhook-handlers.js";
import productTagger from "./product-tagger.js";
const reconciliation = {};

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers })
);

// All endpoints after this point will require an active session
app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/products/tag", async (req, res) => {
  const session = res.locals.shopify.session
  const client = new shopify.api.clients.Rest({ session });
  
  let status = 200;
  let error = null;
 
  try {
    let params = { path: '/products',
      query: {
        limit: 250,
        fields: 'id, images, tags',
        // Lean on `updated_at_min` to only fetch products which
        // have been updated since the last time this process ran
        updated_at_min: reconciliation[session.shop] || ''
      }
    };
    // Step through pagination
    do {
      const products = await client.get(params);
      // Check tags
      for (const product of products.body.products) {
        await productTagger(client, product);
      }
      params = products?.pageInfo?.nextPage;
    } while (params !== undefined);
    // Keep track of the last time this process runs
    reconciliation[session.shop] = new Date().toISOString();
    res.status(status).send({ success: status === 200, error });
  } catch (e) {
    console.log(`Failed to reconcile products: ${e.message}`);
    status = 500;
    error = e.message;
  }
});

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
