import { Hono } from "hono";
import puppeteer from "puppeteer";

const app = new Hono();

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { HTTPException } from "hono/http-exception";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", async (c) => {
  try {
    const handleUpload = async () => {
      // Launch Puppeteer
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      try {
        await page.goto("https://example.com");

        // Generate PDF
        const pdf = await page.pdf({
          format: "A4",
          margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
          landscape: true,
        });

        // Debug: Save PDF Locally
        Bun.write("debug-test.pdf", pdf); // Check if the file is valid

        // Upload to Cloudinary
        const resource: UploadApiResponse = await new Promise(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {}, // Specify "raw" for non-image files
              (error, result) => {
                if (error) reject(error);
                else resolve(result as UploadApiResponse);
              }
            );

            uploadStream.end(pdf); // Stream the PDF data
          }
        );

        return resource;
      } finally {
        await browser.close(); // Ensure browser is closed
      }
    };

    const result = await handleUpload();

    return c.json({ url: result.url });
  } catch (error) {
    // console.error("Error handling request:", error);
    throw new HTTPException(500, {
      message: `Error handling request`,
    });
  }
});

export default app;
