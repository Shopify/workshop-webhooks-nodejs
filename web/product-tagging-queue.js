import Queue from "better-queue";
import productTagger from "./product-tagger.js";
import shopify from "./shopify.js";
 
const productTaggingQueue = new Queue(async (input, done) => {
  const { product, shop } = input;
 
  const sessionId = await shopify.api.session.getOfflineId(shop)
  const session = await shopify.config.sessionStorage.loadSession(sessionId);
  const client = new shopify.api.clients.Rest({session});
  await productTagger(client, product);
  done();
})
 
export default productTaggingQueue;