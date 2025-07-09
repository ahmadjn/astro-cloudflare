import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fungsi untuk download gambar
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          const file = fs.createWriteStream(filepath);
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        } else {
          reject(new Error(`Failed to download: ${response.statusCode}`));
        }
      })
      .on("error", reject);
  });
}

// Fungsi untuk convert gambar ke WebP
async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath).webp({ quality: 80 }).toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error);
    return false;
  }
}

// Fungsi untuk format installs
function formatInstalls(installs) {
  if (installs >= 1000000) {
    return `${(installs / 1000000).toFixed(1)}M+`;
  } else if (installs >= 1000) {
    return `${(installs / 1000).toFixed(1)}K+`;
  }
  return `${installs}+`;
}

// Fungsi untuk format description HTML
function formatDescriptionHTML(descriptionHTML) {
  // Convert <br> tags to proper paragraphs
  return descriptionHTML
    .split("<br>")
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("\n\n");
}

// Fungsi untuk filter reviews dengan score >= 4
async function filterReviews(reviews, slug, imagesDir) {
  const filteredReviews = reviews
    .filter((review) => review.score >= 4)
    .slice(0, 5); // Ambil maksimal 5 review

  const processedReviews = [];

  for (let i = 0; i < filteredReviews.length; i++) {
    const review = filteredReviews[i];
    let userImagePath = null;

    // Process userImage if exists
    if (review.userImage) {
      const userImageFilename = `${slug}-user-${i + 1}.webp`;
      userImagePath = path.join(imagesDir, userImageFilename);
      const tempUserImagePath = path.join(
        imagesDir,
        `${slug}-user-${i + 1}-temp.jpg`,
      );

      // Check if file already exists
      if (fs.existsSync(userImagePath)) {
        console.log(
          `  📷 User image ${i + 1} already exists: ${userImageFilename}`,
        );
        userImagePath = `/images/${userImageFilename}`;
      } else {
        try {
          await downloadImage(review.userImage, tempUserImagePath);
          await convertToWebP(tempUserImagePath, userImagePath);
          fs.unlinkSync(tempUserImagePath);
          userImagePath = `/images/${userImageFilename}`;
          console.log(
            `  📥 Downloaded user image ${i + 1}: ${userImageFilename}`,
          );
        } catch (error) {
          console.error(
            `Error processing user image ${i + 1} for ${review.userName}:`,
            error,
          );
        }
      }
    }

    processedReviews.push({
      userName: review.userName,
      score: review.score,
      text: review.text,
      userImage: userImagePath,
    });
  }

  return processedReviews;
}

// Fungsi untuk generate slug dari title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Fungsi untuk process satu file JSON
async function processJsonFile(filePath, category) {
  try {
    const jsonContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(jsonContent);
    const app = data.app;

    // Generate slug dari title
    const slug = generateSlug(app.title);

    // Buat direktori content jika belum ada
    const contentDir = path.join(__dirname, "../src/content/posts");
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    // Buat direktori images jika belum ada
    const imagesDir = path.join(__dirname, "../public/images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Download dan convert gambar
    const images = [];

    // Process icon
    if (app.icon) {
      const iconFilename = `${slug}-icon.webp`;
      const iconPath = path.join(imagesDir, iconFilename);
      const tempIconPath = path.join(imagesDir, `${slug}-icon-temp.jpg`);

      // Check if file already exists
      if (fs.existsSync(iconPath)) {
        console.log(`  📷 Icon already exists: ${iconFilename}`);
        images.push(`/images/${iconFilename}`);
      } else {
        try {
          await downloadImage(app.icon, tempIconPath);
          await convertToWebP(tempIconPath, iconPath);
          fs.unlinkSync(tempIconPath);
          images.push(`/images/${iconFilename}`);
          console.log(`  📥 Downloaded icon: ${iconFilename}`);
        } catch (error) {
          console.error(`Error processing icon for ${app.title}:`, error);
        }
      }
    }

    // Process header image
    if (app.headerImage) {
      const headerFilename = `${slug}-header.webp`;
      const headerPath = path.join(imagesDir, headerFilename);
      const tempHeaderPath = path.join(imagesDir, `${slug}-header-temp.jpg`);

      // Check if file already exists
      if (fs.existsSync(headerPath)) {
        console.log(`  📷 Header already exists: ${headerFilename}`);
        images.push(`/images/${headerFilename}`);
      } else {
        try {
          await downloadImage(app.headerImage, tempHeaderPath);
          await convertToWebP(tempHeaderPath, headerPath);
          fs.unlinkSync(tempHeaderPath);
          images.push(`/images/${headerFilename}`);
          console.log(`  📥 Downloaded header: ${headerFilename}`);
        } catch (error) {
          console.error(
            `Error processing header image for ${app.title}:`,
            error,
          );
        }
      }
    }

    // Process screenshots - combine 5 screenshots into 1 landscape image
    if (app.screenshots && app.screenshots.length > 0) {
      const screenshotCount = Math.min(app.screenshots.length, 5);
      const screenshotFilename = `${slug}-screenshots.webp`;
      const screenshotPath = path.join(imagesDir, screenshotFilename);

      // Check if combined screenshot already exists
      if (fs.existsSync(screenshotPath)) {
        console.log(
          `  📷 Combined screenshots already exists: ${screenshotFilename}`,
        );
        images.push(`/images/${screenshotFilename}`);
      } else {
        try {
          // Download all screenshots first
          const tempScreenshotPaths = [];
          for (let i = 0; i < screenshotCount; i++) {
            const screenshot = app.screenshots[i];
            const tempScreenshotPath = path.join(
              imagesDir,
              `${slug}-screenshot-${i + 1}-temp.jpg`,
            );
            await downloadImage(screenshot, tempScreenshotPath);
            tempScreenshotPaths.push(tempScreenshotPath);
          }

          // Create combined landscape image
          const screenshotImages = [];
          for (const tempPath of tempScreenshotPaths) {
            const image = await sharp(tempPath)
              .resize(300, 600, { fit: "cover" })
              .toBuffer();
            screenshotImages.push(image);
          }

          // Create canvas with 5 screenshots side by side
          const canvasWidth = 300 * screenshotCount;
          const canvasHeight = 600;

          const combinedImage = await sharp({
            create: {
              width: canvasWidth,
              height: canvasHeight,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 1 },
            },
          })
            .composite(
              screenshotImages.map((image, index) => ({
                input: image,
                left: index * 300,
                top: 0,
              })),
            )
            .webp({ quality: 80 })
            .toFile(screenshotPath);

          // Clean up temp files
          for (const tempPath of tempScreenshotPaths) {
            fs.unlinkSync(tempPath);
          }

          images.push(`/images/${screenshotFilename}`);
          console.log(
            `  📥 Created combined screenshots: ${screenshotFilename}`,
          );
        } catch (error) {
          console.error(
            `Error processing screenshots for ${app.title}:`,
            error,
          );
        }
      }
    }

    // Process reviews with userImage download
    const processedReviews = await filterReviews(app.reviews, slug, imagesDir);

    // Format data untuk content
    const contentData = {
      title: app.title,
      summary: app.summary,
      descriptionHTML: formatDescriptionHTML(app.descriptionHTML),
      content: app.AIReview,
      installs: formatInstalls(app.maxInstalls),
      rating: app.scoreText,
      reviews: processedReviews,
      developer: app.developer,
      genre: app.genre,
      category: category,
      images: images,
      url: app.url,
      slug: slug,
    };

    // Buat frontmatter untuk Astro content
    const frontmatter = `---
title: "${contentData.title}"
summary: "${contentData.summary}"
installs: "${contentData.installs}"
rating: "${contentData.rating}"
developer: "${contentData.developer}"
genre: "${contentData.genre}"
category: "${contentData.category}"
images: ${JSON.stringify(contentData.images)}
url: "${contentData.url}"
reviews: ${JSON.stringify(contentData.reviews)}
descriptionHTML: ${JSON.stringify(contentData.descriptionHTML)}
publishDate: ${new Date().toISOString()}
---

${contentData.content}

`;

    // Tulis file content
    const contentFilePath = path.join(contentDir, `${slug}.md`);
    fs.writeFileSync(contentFilePath, frontmatter);

    console.log(`✅ Processed: ${app.title}`);
    return { success: true, slug, title: app.title };
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return { success: false, error: error.message };
  }
}

// Fungsi utama untuk process semua file
async function convertAllJsonFiles() {
  const dataDir = path.join(__dirname, "../data");
  const categories = fs
    .readdirSync(dataDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  console.log("🚀 Starting conversion process...");
  console.log(`📁 Found categories: ${categories.join(", ")}`);

  const results = [];

  for (const category of categories) {
    const categoryPath = path.join(dataDir, category);
    const files = fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith(".json"));

    console.log(
      `\n📂 Processing category: ${category} (${files.length} files)`,
    );

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const result = await processJsonFile(filePath, category);
      results.push(result);
    }
  }

  // Summary
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log("\n📊 Conversion Summary:");
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\n❌ Failed conversions:");
    failed.forEach((f) => console.log(`  - ${f.error}`));
  }

  console.log("\n🎉 Conversion completed!");
}

// Jalankan script
convertAllJsonFiles().catch(console.error);
