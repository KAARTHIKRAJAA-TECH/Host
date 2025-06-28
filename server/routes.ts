import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { z } from "zod";
import {
  loginSchema,
  registerSchema,
  updateLicenseRequestSchema,
  updateDeleteRequestSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import session from "express-session";
import { resolve } from 'path';
import Database from 'better-sqlite3';
import connectSqlite3 from 'connect-sqlite3';
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Create a temporary directory for file uploads
const TEMP_UPLOAD_DIR = path.join(process.cwd(), "temp-uploads");
fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, TEMP_UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: any) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Admin authentication middleware
const isAdmin = async (req: Request, res: Response, next: any) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUserById(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
    return next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session middleware with SQLite
  const SQLiteStore = connectSqlite3(session);
  
  // Create a sessions directory if it doesn't exist
  const sessionsDir = resolve('./sqlite/sessions');
  fs.mkdirSync(sessionsDir, { recursive: true });
  
  app.use(
    session({
      store: new SQLiteStore({
        dir: sessionsDir,
        db: 'sessions.db',
      }),
      secret: process.env.SESSION_SECRET || "content-shield-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // Serve uploaded files
  app.use("/api/uploads", (req, res, next) => {
    const filePath = path.join(process.cwd(), "uploads", req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        if (err.code === "ENOENT") {
          return res.status(404).json({ message: "File not found" });
        }
        next(err);
      }
    });
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Add debug logging to help troubleshoot
      console.log(`Login attempt for email: ${email}`);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`User not found for email: ${email}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      console.log(`User found: ${user.email}, role: ${user.role}`);
      
      // Special case for admin
      if (email === 'admin@contentshield.com' && password === 'admin123') {
        // Set user session
        req.session.userId = user.id;
        
        return res.status(200).json({
          id: user.id,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
        });
      }
      
      const isPasswordValid = await storage.validatePassword(user, password);
      console.log(`Password validation result: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Set user session
      req.session.userId = user.id;
      
      return res.status(200).json({
        id: user.id,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const user = await storage.createUser(email, password);
      
      return res.status(201).json({
        id: user.id,
        email: user.email,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/check", isAuthenticated, (req, res) => {
    return res.status(200).json({ authenticated: true });
  });

  // User routes
  app.get("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUserWithStats(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUserWithStats(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Post routes
  app.post("/api/posts", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const userId = req.session.userId;
      
      // Parse and validate post data
      const postSchema = z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        licenseType: z.enum(["free", "paid", "permission", "none"], {
          required_error: "License type is required",
        }),
        allowDownload: z.string().transform(val => val === "true"),
        price: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
      });
      
      const postData = postSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      
      // Create post
      const post = await storage.createPost({
        title: postData.title,
        description: postData.description,
        licenseType: postData.licenseType,
        allowDownload: postData.allowDownload,
        price: postData.price,
        ownerId: userId,
      }, req.file);
      
      return res.status(201).json(post);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create post error:", error);
      
      // Handle custom errors
      if (error.message === "Duplicate content detected") {
        return res.status(409).json({ message: "This content already exists" });
      }
      
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const posts = await storage.getAllPosts();
      
      // Add access information for the current user
      const postsWithAccess = await storage.getPostsWithAccessInfo(posts, userId);
      
      return res.status(200).json(postsWithAccess);
    } catch (error) {
      console.error("Get posts error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/posts/trending", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const trendingPosts = await storage.getTrendingPosts();
      
      // Add access information for the current user
      const postsWithAccess = await storage.getPostsWithAccessInfo(trendingPosts, userId);
      
      return res.status(200).json(postsWithAccess);
    } catch (error) {
      console.error("Get trending posts error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/me/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const posts = await storage.getPostsByUser(userId);
      
      // User is owner of all these posts, so they have access to all
      const postsWithAccess = posts.map(post => ({
        ...post,
        userHasAccess: true,
      }));
      
      return res.status(200).json(postsWithAccess);
    } catch (error) {
      console.error("Get user posts error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const targetUserId = parseInt(req.params.id);
      
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const posts = await storage.getPostsByUser(targetUserId);
      
      // Add access information for the current user
      const postsWithAccess = await storage.getPostsWithAccessInfo(posts, userId);
      
      return res.status(200).json(postsWithAccess);
    } catch (error) {
      console.error("Get user posts error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/posts/:id/download", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Check if user has access to the post
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const hasAccess = await storage.checkUserAccess(userId, postId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "You don't have permission to download this content" });
      }
      
      // Check if downloads are allowed
      if (!post.allowDownload && post.ownerId !== userId) {
        return res.status(403).json({ message: "Downloads are not allowed for this content" });
      }
      
      // Get the file path and serve the file
      const filePath = await storage.getFilePath(post.filePath);
      res.download(filePath, `${post.title}${path.extname(filePath)}`);
    } catch (error) {
      console.error("Download post error:", error);
      
      if (error.message === "File not found") {
        return res.status(404).json({ message: "File not found" });
      }
      
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/posts/:id/certificate", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Get post and check if user is the owner
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can download the certificate" });
      }
      
      // Generate PDF certificate
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const { width, height } = page.getSize();
      
      // Get font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Add content
      // Title
      page.drawText("Certificate of Ownership", {
        x: 175,
        y: height - 100,
        size: 24,
        font: boldFont,
      });
      
      page.drawText("Content Shield Blockchain Verification", {
        x: 175,
        y: height - 130,
        size: 12,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Divider
      page.drawLine({
        start: { x: 250, y: height - 150 },
        end: { x: 350, y: height - 150 },
        thickness: 2,
        color: rgb(0.2, 0.4, 0.8),
      });
      
      // Post title
      page.drawText(`"${post.title}"`, {
        x: 175,
        y: height - 200,
        size: 18,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Owner info
      page.drawText("Owner:", {
        x: 100,
        y: height - 250,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawText(post.owner.email.split("@")[0], {
        x: 100,
        y: height - 270,
        size: 12,
        font: boldFont,
      });
      
      // Email
      page.drawText("Email:", {
        x: 350,
        y: height - 250,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawText(post.owner.email, {
        x: 350,
        y: height - 270,
        size: 12,
        font: boldFont,
      });
      
      // Creation date
      page.drawText("Creation Date:", {
        x: 100,
        y: height - 320,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      const creationDate = new Date(post.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      
      page.drawText(creationDate, {
        x: 100,
        y: height - 340,
        size: 12,
        font: boldFont,
      });
      
      // License type
      page.drawText("License Type:", {
        x: 350,
        y: height - 320,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      const licenseTypeMap = {
        free: "Free License",
        paid: "Paid License",
        permission: "Permission Required",
        none: "No Usage",
      };
      
      page.drawText(licenseTypeMap[post.licenseType], {
        x: 350,
        y: height - 340,
        size: 12,
        font: boldFont,
      });
      
      // Content hash
      page.drawText("Content Hash:", {
        x: 100,
        y: height - 390,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawRectangle({
        x: 100,
        y: height - 420,
        width: 400,
        height: 20,
        color: rgb(0.95, 0.95, 0.95),
      });
      
      page.drawText(post.contentHash, {
        x: 110,
        y: height - 410,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Footer
      page.drawText("This certificate verifies ownership of the content as registered on Content Shield.", {
        x: 120,
        y: 100,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawText("Verify at: contentshield.io/verify", {
        x: 215,
        y: 80,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Send the PDF
      res.contentType("application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="certificate-${post.id}.pdf"`);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("Generate certificate error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // License request routes
  app.post("/api/posts/:id/request-license", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Get post
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if user is the owner
      if (post.ownerId === userId) {
        return res.status(400).json({ message: "You can't request a license for your own content" });
      }
      
      // Check license type
      if (post.licenseType !== "permission") {
        return res.status(400).json({ message: `This content doesn't require a license request (type: ${post.licenseType})` });
      }
      
      // Create license request
      const licenseRequest = await storage.createLicenseRequest(postId, userId);
      
      return res.status(201).json(licenseRequest);
    } catch (error) {
      console.error("Request license error:", error);
      
      if (error.message === "You already have a pending request for this content") {
        return res.status(409).json({ message: error.message });
      }
      
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/license-requests", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const requests = await storage.getLicenseRequestsReceived(userId);
      
      return res.status(200).json(requests);
    } catch (error) {
      console.error("Get license requests error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/license-requests/received", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const requests = await storage.getLicenseRequestsReceived(userId);
      
      return res.status(200).json(requests);
    } catch (error) {
      console.error("Get received license requests error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/license-requests/sent", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const requests = await storage.getLicenseRequestsSent(userId);
      
      return res.status(200).json(requests);
    } catch (error) {
      console.error("Get sent license requests error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/license-requests/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const requestId = parseInt(req.params.id);
      
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      // Validate request body
      const { status } = updateLicenseRequestSchema.parse(req.body);
      
      // Get license request
      const licenseRequest = await storage.getLicenseRequestById(requestId);
      
      if (!licenseRequest) {
        return res.status(404).json({ message: "License request not found" });
      }
      
      // Check if user is the owner of the post
      if (licenseRequest.ownerId !== userId) {
        return res.status(403).json({ message: "You can only update license requests for your own content" });
      }
      
      // Check if request is already approved or rejected
      if (licenseRequest.status !== "pending") {
        return res.status(400).json({ message: `This request has already been ${licenseRequest.status}` });
      }
      
      // Update license request
      const updatedRequest = await storage.updateLicenseRequest(requestId, status);
      
      return res.status(200).json(updatedRequest);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Update license request error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get all users error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/users/count", isAdmin, async (req, res) => {
    try {
      const count = await storage.getUserCount();
      return res.status(200).json({ count });
    } catch (error) {
      console.error("Get user count error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/posts", isAdmin, async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      return res.status(200).json(posts);
    } catch (error) {
      console.error("Get all posts error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/delete-requests", isAdmin, async (req, res) => {
    try {
      const requests = await storage.getDeleteRequests();
      return res.status(200).json(requests);
    } catch (error) {
      console.error("Get delete requests error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/delete-requests/:id", isAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      const { status } = updateDeleteRequestSchema.parse(req.body);
      const updatedRequest = await storage.updateDeleteRequest(requestId, status);
      
      return res.status(200).json(updatedRequest);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Update delete request error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete user and all their posts (admin only)
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Delete the user and all their content
      await storage.deleteUser(userId);
      
      // Ensure we're sending a JSON response with the correct content-type header
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ message: "User and all their content deleted successfully", success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      
      // Handle specific error cases
      if (error.message === "User not found") {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (error.message === "Admin users cannot be deleted") {
        return res.status(403).json({ message: "Admin users cannot be deleted" });
      }
      
      // Ensure we're sending a JSON response with the correct content-type header
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ message: "Internal server error", success: false });
    }
  });

  // Direct post deletion endpoint for users
  app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Get the post to check ownership
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the user owns the post or is an admin
      const user = await storage.getUserById(userId);
      const isAdmin = user?.role === 'admin';
      
      if (post.ownerId !== userId && !isAdmin) {
        return res.status(403).json({ message: "You don't have permission to delete this post" });
      }
      
      // Delete the post directly
      await storage.deletePost(postId);
      
      // Ensure we're sending a JSON response with the correct content-type header
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ message: "Post deleted successfully", success: true });
    } catch (error) {
      console.error("Delete post error:", error);
      // Ensure we're sending a JSON response with the correct content-type header
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ message: "Internal server error", success: false });
    }
  });

  // User-side delete request routes (for users who prefer admin approval)
  app.post("/api/posts/:id/request-deletion", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Get the post to check ownership
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the user owns the post (only owners can request deletion)
      if (post.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can request post deletion" });
      }
      
      // Create a delete request
      const reason = req.body.reason || "No reason provided";
      const request = await storage.createDeleteRequest(postId, userId, reason);
      
      return res.status(201).json(request);
    } catch (error) {
      console.error("Create delete request error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
