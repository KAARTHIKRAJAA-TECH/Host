import { db } from "@db";
import * as schema from "@shared/schema";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { eq, and, desc, ne, asc, sql } from "drizzle-orm";
import { ZodError } from "zod";
import bcrypt from "bcrypt";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const THUMBNAILS_DIR = path.join(UPLOAD_DIR, "thumbnails");

// Ensure upload directories exist
const ensureDirectoriesExist = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directories:", error);
  }
};

ensureDirectoriesExist();

export const storage = {
  // User operations
  async createUser(email: string, password: string): Promise<schema.User> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [user] = await db
        .insert(schema.users)
        .values({
          email,
          password: hashedPassword,
        })
        .returning();
      
      return user;
    } catch (error) {
      if (error.code === "23505") { // PostgreSQL unique constraint violation
        throw new Error("Email already exists");
      }
      throw error;
    }
  },
  
  async getUserByEmail(email: string): Promise<schema.User | null> {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    
    return user || null;
  },
  
  async getUserById(id: number): Promise<schema.User | null> {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    
    return user || null;
  },
  
  async getUserWithStats(id: number): Promise<any> {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    
    if (!user) return null;
    
    // Count posts by user
    const postsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.posts)
      .where(eq(schema.posts.ownerId, id));
    
    // Count licenses granted to user
    const licensesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.licenseRequests)
      .where(and(
        eq(schema.licenseRequests.ownerId, id),
        eq(schema.licenseRequests.status, "approved")
      ));
    
    return {
      ...user,
      postCount: postsResult[0]?.count || 0,
      licenseCount: licensesResult[0]?.count || 0,
    };
  },
  
  async validatePassword(user: schema.User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  },
  
  // Post operations
  async createPost(postData: Partial<schema.PostInsert>, file: Express.Multer.File): Promise<schema.Post> {
    // Generate SHA-256 hash for the file
    const fileBuffer = await fs.readFile(file.path);
    const contentHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    
    // Check if content with same hash already exists
    const existingPost = await db.query.posts.findFirst({
      where: eq(schema.posts.contentHash, contentHash),
    });
    
    if (existingPost) {
      // Clean up the uploaded file
      await fs.unlink(file.path);
      throw new Error("Duplicate content detected");
    }
    
    // Move file to permanent location
    const fileExtension = path.extname(file.originalname);
    const filename = `${contentHash}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    
    await fs.rename(file.path, filePath);
    
    // For images, create a thumbnail
    let thumbnailPath = null;
    if (file.mimetype.startsWith('image/')) {
      // Create a thumbnail (copying the original for now)
      const thumbnailFilePath = path.join(THUMBNAILS_DIR, filename);
      await fs.copyFile(filePath, thumbnailFilePath);
      thumbnailPath = `/api/uploads/thumbnails/${filename}`;
    }
    
    // Create post record in database
    const [post] = await db
      .insert(schema.posts)
      .values({
        title: postData.title,
        description: postData.description || "",
        licenseType: postData.licenseType,
        allowDownload: postData.allowDownload || false,
        filePath: `/api/uploads/${filename}`,
        thumbnailPath: thumbnailPath || null,
        contentType: file.mimetype,
        contentHash,
        price: postData.licenseType === "paid" ? (postData.price || 599) : null, // Default price $5.99
        ownerId: postData.ownerId,
      })
      .returning();
    
    return post;
  },
  
  async getPostById(id: number): Promise<any> {
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, id),
      with: {
        owner: true,
      },
    });
    
    return post;
  },
  
  async getAllPosts(): Promise<any[]> {
    const posts = await db.query.posts.findMany({
      orderBy: [desc(schema.posts.createdAt)],
      with: {
        owner: true,
      },
    });
    
    return posts;
  },
  
  async getPostsByUser(userId: number): Promise<any[]> {
    const posts = await db.query.posts.findMany({
      where: eq(schema.posts.ownerId, userId),
      orderBy: [desc(schema.posts.createdAt)],
      with: {
        owner: true,
      },
    });
    
    return posts;
  },
  
  async getTrendingPosts(limit = 3): Promise<any[]> {
    const posts = await db.query.posts.findMany({
      orderBy: [desc(schema.posts.likeCount)],
      limit,
      with: {
        owner: true,
      },
    });
    
    return posts;
  },
  
  async checkUserAccess(userId: number, postId: number): Promise<boolean> {
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, postId),
    });
    
    if (!post) return false;
    
    // Owner always has access
    if (post.ownerId === userId) return true;
    
    // Free content is accessible to all
    if (post.licenseType === "free") return true;
    
    // For permission-based or paid content, check if user has approved request
    if (post.licenseType === "permission" || post.licenseType === "paid") {
      const approvedRequest = await db.query.licenseRequests.findFirst({
        where: and(
          eq(schema.licenseRequests.postId, postId),
          eq(schema.licenseRequests.requesterId, userId),
          eq(schema.licenseRequests.status, "approved")
        ),
      });
      
      return !!approvedRequest;
    }
    
    // No usage - no access except for owner (already checked above)
    return false;
  },
  
  // License request operations
  async createLicenseRequest(postId: number, requesterId: number): Promise<schema.LicenseRequest> {
    // Get post to get owner ID
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, postId),
    });
    
    if (!post) {
      throw new Error("Post not found");
    }
    
    // Check if user already has a pending request for this post
    const existingRequest = await db.query.licenseRequests.findFirst({
      where: and(
        eq(schema.licenseRequests.postId, postId),
        eq(schema.licenseRequests.requesterId, requesterId),
        eq(schema.licenseRequests.status, "pending")
      ),
    });
    
    if (existingRequest) {
      throw new Error("You already have a pending request for this content");
    }
    
    // Create license request
    const [licenseRequest] = await db
      .insert(schema.licenseRequests)
      .values({
        postId,
        requesterId,
        ownerId: post.ownerId,
        status: "pending",
      })
      .returning();
    
    return licenseRequest;
  },
  
  async getLicenseRequestById(id: number): Promise<any> {
    const request = await db.query.licenseRequests.findFirst({
      where: eq(schema.licenseRequests.id, id),
      with: {
        post: true,
        requester: true,
        owner: true,
      },
    });
    
    return request;
  },
  
  async getLicenseRequestsReceived(userId: number): Promise<any[]> {
    const requests = await db.query.licenseRequests.findMany({
      where: eq(schema.licenseRequests.ownerId, userId),
      orderBy: [desc(schema.licenseRequests.createdAt)],
      with: {
        post: true,
        requester: true,
      },
    });
    
    // Format the response to include necessary fields
    return requests.map(request => ({
      id: request.id,
      postId: request.postId,
      postTitle: request.post.title,
      requesterId: request.requesterId,
      requesterEmail: request.requester.email,
      requesterAvatarUrl: request.requester.avatarUrl,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));
  },
  
  async getLicenseRequestsSent(userId: number): Promise<any[]> {
    const requests = await db.query.licenseRequests.findMany({
      where: eq(schema.licenseRequests.requesterId, userId),
      orderBy: [desc(schema.licenseRequests.createdAt)],
      with: {
        post: true,
        owner: true,
      },
    });
    
    // Format the response to include necessary fields
    return requests.map(request => ({
      id: request.id,
      postId: request.postId,
      postTitle: request.post.title,
      ownerId: request.ownerId,
      ownerEmail: request.owner.email,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));
  },
  
  async updateLicenseRequest(id: number, status: "approved" | "rejected"): Promise<schema.LicenseRequest> {
    const [updatedRequest] = await db
      .update(schema.licenseRequests)
      .set({
        status,
        updatedAt: new Date().toISOString(), // Convert Date to string for SQLite
      })
      .where(eq(schema.licenseRequests.id, id))
      .returning();
    
    return updatedRequest;
  },
  
  // Add userHasAccess field to posts
  async getPostsWithAccessInfo(posts: any[], userId: number): Promise<any[]> {
    // For each post, determine if user has access
    const postsWithAccess = await Promise.all(
      posts.map(async (post) => {
        const hasAccess = await this.checkUserAccess(userId, post.id);
        return {
          ...post,
          userHasAccess: hasAccess,
        };
      })
    );
    
    return postsWithAccess;
  },
  
  // File operations
  async getFilePath(filePath: string): Promise<string> {
    // Convert API path to actual file path
    const relativePath = filePath.replace('/api/uploads/', '');
    const fullPath = path.join(UPLOAD_DIR, relativePath);
    
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch (error) {
      throw new Error("File not found");
    }
  },

  // Admin operations
  async getAllUsers(): Promise<schema.User[]> {
    const users = await db.query.users.findMany({
      orderBy: [asc(schema.users.id)],
    });
    
    return users;
  },

  async getUserCount(): Promise<number> {
    const result = await db.select({
      count: sql`count(*)`.as('count'),
    }).from(schema.users)
      .where(ne(schema.users.role, 'admin'))
      .execute();
    
    return Number(result[0].count);
  },

  async createDeleteRequest(postId: number, userId: number, reason?: string): Promise<schema.DeleteRequest> {
    const [request] = await db
      .insert(schema.deleteRequests)
      .values({
        postId,
        userId,
        reason: reason || null,
      })
      .returning();
    
    return request;
  },

  async getDeleteRequests(): Promise<any[]> {
    const requests = await db.query.deleteRequests.findMany({
      orderBy: [desc(schema.deleteRequests.createdAt)],
      with: {
        post: {
          with: {
            owner: true,
          },
        },
        user: true,
      },
    });
    
    return requests.map(request => ({
      id: request.id,
      postId: request.postId,
      postTitle: request.post.title,
      postOwnerEmail: request.post.owner.email,
      userId: request.userId,
      userEmail: request.user.email,
      reason: request.reason,
      status: request.status,
      createdAt: request.createdAt,
    }));
  },

  async updateDeleteRequest(id: number, status: "approved" | "rejected"): Promise<schema.DeleteRequest> {
    const [updatedRequest] = await db
      .update(schema.deleteRequests)
      .set({
        status,
        updatedAt: new Date().toISOString(), // Convert Date to string for SQLite
      })
      .where(eq(schema.deleteRequests.id, id))
      .returning();
    
    // If approved, delete the post
    if (status === "approved") {
      const request = await db.query.deleteRequests.findFirst({
        where: eq(schema.deleteRequests.id, id),
      });
      
      if (request) {
        await this.deletePost(request.postId);
      }
    }
    
    return updatedRequest;
  },

  async deletePost(id: number): Promise<void> {
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, id),
    });
    
    if (!post) {
      throw new Error("Post not found");
    }
    
    // Delete all related records first
    await db.delete(schema.licenseRequests).where(eq(schema.licenseRequests.postId, id));
    await db.delete(schema.comments).where(eq(schema.comments.postId, id));
    await db.delete(schema.likes).where(eq(schema.likes.postId, id));
    await db.delete(schema.deleteRequests).where(eq(schema.deleteRequests.postId, id));
    
    // Delete the file if it exists
    try {
      const filePath = post.filePath.replace('/api/uploads/', '');
      const fullPath = path.join(UPLOAD_DIR, filePath);
      await fs.unlink(fullPath);
      
      // Delete thumbnail if it exists
      if (post.thumbnailPath) {
        const thumbnailPath = post.thumbnailPath.replace('/api/uploads/', '');
        const thumbnailFullPath = path.join(UPLOAD_DIR, thumbnailPath);
        await fs.unlink(thumbnailFullPath).catch(() => {
          // Ignore errors if thumbnail doesn't exist
        });
      }
    } catch (error) {
      console.error("Error deleting post files:", error);
    }
    
    // Finally delete the post
    await db.delete(schema.posts).where(eq(schema.posts.id, id));
  },
  
  async deleteUser(id: number): Promise<void> {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if user is an admin to prevent admin deletion
    if (user.role === 'admin') {
      throw new Error("Admin users cannot be deleted");
    }
    
    // Get all posts by this user
    const userPosts = await db.query.posts.findMany({
      where: eq(schema.posts.ownerId, id),
    });
    
    // Delete each post and related data
    for (const post of userPosts) {
      await this.deletePost(post.id);
    }
    
    // Delete user-related data
    await db.delete(schema.licenseRequests).where(eq(schema.licenseRequests.requesterId, id));
    await db.delete(schema.comments).where(eq(schema.comments.userId, id));
    await db.delete(schema.likes).where(eq(schema.likes.userId, id));
    await db.delete(schema.deleteRequests).where(eq(schema.deleteRequests.userId, id));
    
    // Finally delete the user
    await db.delete(schema.users).where(eq(schema.users.id, id));
  },
};
