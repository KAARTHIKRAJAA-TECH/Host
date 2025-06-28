import { db } from "./index";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// Ensure uploads directories exist
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const THUMBNAILS_DIR = path.join(UPLOAD_DIR, "thumbnails");

async function ensureDirectoriesExist() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directories:", error);
  }
}

async function seed() {
  try {
    await ensureDirectoriesExist();

    console.log("Starting database seed...");

    // Check if users already exist to prevent duplicate seeding
    const existingUsers = await db.query.users.findMany();

    // Check if admin user exists
    let adminUserExists = existingUsers.some(user => user.role === "admin");
    
    if (!adminUserExists) {
      console.log("Creating admin user...");
      const passwordHash = await bcrypt.hash("admin123", 10);
      await db.insert(schema.users).values({
        email: "admin@contentshield.com",
        password: passwordHash,
        avatarUrl: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&h=120&q=80",
        role: "admin"
      });
      console.log("Admin user created successfully!");
    } else {
      console.log("Admin user already exists.");
    }
    
    // Check if custom admin email is requested
    const customAdminEmail = process.env.ADMIN_EMAIL;
    const customAdminExists = customAdminEmail ? existingUsers.some(user => user.email === customAdminEmail && user.role === "admin") : true;
    
    if (customAdminEmail && !customAdminExists) {
      console.log(`Creating custom admin user with email: ${customAdminEmail}`);
      const passwordHash = await bcrypt.hash("admin123", 10);
      await db.insert(schema.users).values({
        email: customAdminEmail,
        password: passwordHash,
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&h=120&q=80",
        role: "admin"
      });
      console.log("Custom admin user created successfully!");
    }
    
    if (existingUsers.length > 0) {
      console.log("Other seed data already exists. Skipping regular seeding.");
      return;
    }

    // Create demo users
    console.log("Creating demo users...");
    const passwordHash = await bcrypt.hash("password123", 10);

    const [user1] = await db.insert(schema.users).values({
      email: "alex@example.com",
      password: passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&h=120&q=80",
    }).returning();

    const [user2] = await db.insert(schema.users).values({
      email: "sarah@example.com",
      password: passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&h=120&q=80",
    }).returning();

    const [user3] = await db.insert(schema.users).values({
      email: "marcus@example.com",
      password: passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&h=120&q=80",
    }).returning();

    // Function to create hash from image URL
    const createHashFromString = (str: string) => {
      return crypto.createHash("sha256").update(str).digest("hex");
    };

    // Create demo posts
    console.log("Creating demo posts...");
    const [post1] = await db.insert(schema.posts).values({
      title: "Morning Mountain View",
      description: "Captured this amazing sunrise during my hike last weekend. The colors were breathtaking!",
      licenseType: "free",
      allowDownload: true,
      filePath: "/api/uploads/mock-mountain-view.jpg",
      thumbnailPath: "/api/uploads/thumbnails/mock-mountain-view.jpg",
      contentType: "image/jpeg",
      contentHash: createHashFromString("Morning Mountain View by Alex Johnson"),
      ownerId: user1.id,
      likeCount: 245,
      commentCount: 18,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    }).returning();

    const [post2] = await db.insert(schema.posts).values({
      title: "Urban Geometry",
      description: "The interplay of light and shadow on modern architecture creates fascinating patterns.",
      licenseType: "permission",
      allowDownload: false,
      filePath: "/api/uploads/mock-urban-geometry.jpg",
      thumbnailPath: "/api/uploads/thumbnails/mock-urban-geometry.jpg",
      contentType: "image/jpeg",
      contentHash: createHashFromString("Urban Geometry by Sarah Miller"),
      ownerId: user2.id,
      likeCount: 178,
      commentCount: 24,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    }).returning();

    const [post3] = await db.insert(schema.posts).values({
      title: "Professional Photoshop Workshop",
      description: "Learn my top 10 techniques for creating stunning visual effects in Adobe Photoshop.",
      licenseType: "paid",
      allowDownload: false,
      filePath: "/api/uploads/mock-workshop.mp4",
      thumbnailPath: "/api/uploads/thumbnails/mock-workshop.jpg",
      contentType: "video/mp4",
      contentHash: createHashFromString("Professional Photoshop Workshop by Marcus Chen"),
      price: 1299, // $12.99
      ownerId: user3.id,
      likeCount: 421,
      commentCount: 53,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    }).returning();

    // Create demo license requests
    console.log("Creating demo license requests...");
    await db.insert(schema.licenseRequests).values({
      postId: post2.id,
      requesterId: user1.id,
      ownerId: user2.id,
      status: "pending",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    });

    await db.insert(schema.licenseRequests).values({
      postId: post3.id,
      requesterId: user2.id,
      ownerId: user3.id,
      status: "pending",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    });

    // Add trending posts based on the design
    console.log("Creating trending posts...");
    const [trendingPost1] = await db.insert(schema.posts).values({
      title: "Digital Artwork Collection",
      description: "A series of abstract digital art pieces created using different techniques.",
      licenseType: "paid",
      allowDownload: true,
      filePath: "/api/uploads/mock-digital-art.jpg",
      thumbnailPath: "/api/uploads/thumbnails/mock-digital-art.jpg",
      contentType: "image/jpeg",
      contentHash: createHashFromString("Digital Artwork Collection by Lisa Wang"),
      price: 999, // $9.99
      ownerId: user2.id,
      likeCount: 2500,
      commentCount: 145,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    }).returning();

    const [trendingPost2] = await db.insert(schema.posts).values({
      title: "Night City Photography",
      description: "Captured the vibrant lights of the city after dark.",
      licenseType: "free",
      allowDownload: true,
      filePath: "/api/uploads/mock-night-city.jpg",
      thumbnailPath: "/api/uploads/thumbnails/mock-night-city.jpg",
      contentType: "image/jpeg",
      contentHash: createHashFromString("Night City Photography by James Peterson"),
      ownerId: user1.id,
      likeCount: 1800,
      commentCount: 92,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    }).returning();

    const [trendingPost3] = await db.insert(schema.posts).values({
      title: "React Component Library",
      description: "A collection of custom React components with source code.",
      licenseType: "paid",
      allowDownload: true,
      filePath: "/api/uploads/mock-react-components.zip",
      thumbnailPath: "/api/uploads/thumbnails/mock-react-components.jpg",
      contentType: "application/zip",
      contentHash: createHashFromString("React Component Library by Michael Brown"),
      price: 1999, // $19.99
      ownerId: user3.id,
      likeCount: 3200,
      commentCount: 218,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    }).returning();

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
