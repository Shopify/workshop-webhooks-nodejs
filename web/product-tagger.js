const TAG_NO_PHOTOS = 'no-photos';
 
export default async function productTagger (client, product) {
 const images = product.images;
 const tags = product.tags ? product.tags.split(',') : [];
 const data = {
   product: {
     id: product.id,
     tags: [...tags]
   },
 }
 
 // Add tag if there are no products
 if (!images.length && !tags.includes(TAG_NO_PHOTOS)) {
   data.product.tags.push(TAG_NO_PHOTOS)
 }
 
 // Remove tag if there are photos
 if (images.length && tags.includes(TAG_NO_PHOTOS)) {
   const index = data.product.tags.indexOf(TAG_NO_PHOTOS);
   data.product.tags.splice(index, 1);
 }
 
 // Update the tags if they've changed
 if (tags.length !== data.product.tags.length) {
   console.log('Updating tags for', product.id);
   const products = await client.put({
     path: `products/${product.id}.json`,
     data,
   })
 }
}