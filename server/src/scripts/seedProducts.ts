import { products } from "../db/schema/products";
import { count } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { db } from "../db";

const PRODUCT_IMAGES_DIR = path.join(__dirname, "../../../product_images");
const MIN_PRODUCTS = 100;

interface ImageData {
  filename: string;
  base64: string;
  name: string; // filename without extension
}

async function loadImages(): Promise<ImageData[]> {
  const imageFiles = fs.readdirSync(PRODUCT_IMAGES_DIR).filter(
    (file) => file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png")
  );

  const images: ImageData[] = [];

  for (const file of imageFiles) {
    const filePath = path.join(PRODUCT_IMAGES_DIR, file);
    const imageBuffer = fs.readFileSync(filePath);
    const base64 = imageBuffer.toString("base64");
    const name = path.parse(file).name; // filename without extension

    images.push({
      filename: file,
      base64: `data:image/jpeg;base64,${base64}`,
      name: name,
    });
  }

  return images;
}

function generateProductName(imageName: string, index: number): string {
  if (index === 0) {
    // First product uses the image filename as name (capitalized)
    return imageName.charAt(0).toUpperCase() + imageName.slice(1);
  } else {
    // Subsequent products with same image: "Product 2", "Product 3", etc.
    return `Product ${index + 1}`;
  }
}

async function seedProducts() {
  try {
    // Check if products table is empty
    const productCount = await db.select({ count: count() }).from(products);
    const countValue = productCount[0]?.count || 0;

    if (countValue > 0) {
      console.log(`Products table already has ${countValue} products. Skipping seed.`);
      return;
    }

    console.log("Loading images...");
    const imageData = await loadImages();

    if (imageData.length === 0) {
      console.error("No images found in product_images directory!");
      return;
    }

    console.log(`Found ${imageData.length} images. Creating products...`);

    const productsToInsert = [];
    const productsNeeded = Math.max(MIN_PRODUCTS, imageData.length);

    // Track usage count for each image (to determine naming)
    const imageUsageCount = new Map<number, number>();
    imageData.forEach((_, index) => imageUsageCount.set(index, 0));

    // First, use each image once (so each gets its filename as the first product name)
    for (let i = 0; i < imageData.length && i < productsNeeded; i++) {
      const imageIndex = i;
      const image = imageData[imageIndex];
      const usageCount = imageUsageCount.get(imageIndex)!;
      imageUsageCount.set(imageIndex, usageCount + 1);

      const productName = generateProductName(image.name, usageCount);
      const price = Math.round((Math.random() * 990 + 10) * 100) / 100;
      const stock = Math.floor(Math.random() * 100);

      productsToInsert.push({
        name: productName,
        price: price,
        stock: stock,
        image: image.base64,
      });
    }

    // For remaining products, randomly select from all images
    for (let i = imageData.length; i < productsNeeded; i++) {
      // Randomly select an image index
      const randomImageIndex = Math.floor(Math.random() * imageData.length);
      const image = imageData[randomImageIndex];
      const usageCount = imageUsageCount.get(randomImageIndex)!;
      imageUsageCount.set(randomImageIndex, usageCount + 1);

      const productName = generateProductName(image.name, usageCount);
      const price = Math.round((Math.random() * 990 + 10) * 100) / 100;
      const stock = Math.floor(Math.random() * 100);

      productsToInsert.push({
        name: productName,
        price: price,
        stock: stock,
        image: image.base64,
      });
    }

    console.log(`Inserting ${productsToInsert.length} products...`);
    
    // Insert products in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      await db.insert(products).values(batch);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productsToInsert.length / batchSize)}`);
    }

    console.log(`Successfully seeded ${productsToInsert.length} products!`);
  } catch (error) {
    console.error("Error seeding products:", error);
    throw error;
  }
}

// Run the seed function
seedProducts()
  .then(() => {
    console.log("Seed completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });

