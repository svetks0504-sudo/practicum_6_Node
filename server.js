import express, { request } from "express";
import dotenv from "dotenv";
import { User, Post, Comment } from "./models/index.js";
import sequelize from "./config/db.js";
/*import "./config/sync.js";*/
import bcrypt from "bcrypt";
import cors from "cors";
import authorization from "./middlewares/auth.js";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("Server works 🚀");
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(201)
      .json({ success: true, data: { id: user.id, email, username } });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Username or email already exist" });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

app.get("/users", async (req, res) => {
  try {
    const { limit, offset, isActive } = req.query;

    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }
    const users = await User.findAll({
      where,
      limit: limit ? Number(limit) : 10,
      offset: offset ? Number(offset) : 0,
      attributes: {
        exclude: ["password"],
      },
    });

    res.status(200).json({
      message: "Users fetched successfully",
      users: users.map((user) => user.toJSON()),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentailes" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentailes" });
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res
      .status(201)
      .json({ success: true, message: "Successfull loggen in", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findOne({
      where: { id: userId },
      attributes: {
        exclude: ["password"],
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User fetched successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.log("Error fetching user:", error);
    res.status(404).json({ message: "User not found" });
  }
});

app.get("/users/:id/posts", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const posts = await Post.findAll({
      where: { userId },
      include: [
        {
          model: Comment,
          attributes: ["id", "content"],
          include: [{ model: User, attributes: ["id", "username"] }],
        },
      ],
    });
    if (posts.length === 0) {
      return res.status(404).json({ message: "Posts not found" });
    }
    res.status(200).json({
      message: "Posts fetched successfully",
      posts: posts.map((post) => post.toJSON()),
    });
  } catch (error) {
    console.log("Error fetching posts:", error);
    res.status(500).json({ message: "Error:", error });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const { username, email, age, isActive } = req.body;
    const userId = req.params.id;
    const [updated] = await User.update(
      { username, email, age, isActive },
      { where: { id: userId } },
    );
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.log("Error updating user:", error);
    res.status(400).json({ message: "Invalid request body" });
  }
});

app.patch("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const [updated] = await User.update(req.body, { where: { id: userId } });
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.log("Error updating user:", error);
    res.status(400).json({ message: "Invalid request body" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const deleted = await User.destroy({ where: { id: userId } });
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error deleting user:", error);
    res.status(400).json({ message: "Invalid request body" });
  }
});

app.post("/posts", authorization, async (req, res) => {
  try {
    const { title, content, published } = req.body;
    const { id: userId } = req.user;

    /* const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }*/
    const post = await Post.create({
      title,
      content,
      userId,
      published,
    });
    res.status(201).json({ message: "Post created successfully", data: post });
  } catch (error) {
    console.log("Error creating post:", error);
    res.status(400).json({ message: "Invalid request body" });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const posts = await Post.findAndCountAll({
      where: { published: 1 },
      include: [{ model: User, attributes: ["id", "username"] }],
      limit: limit ? parseInt(limit) : 5,
      offset: offset ? parseInt(offset) : 0,
      order: [[Post,"createdAt", "DESC"]],
    });
    if (posts.rows.length === 0) {
      return res.status(404).json({ message: "Posts not found" });
    }
    res.status(200).json({
      message: "Posts fetched successfully",
      success: true,
      total: posts.count,
      limit: limit ? parseInt(limit) : 5,
      offset: offset ? parseInt(offset) : 0,
      data: posts.rows,
    });
  } catch (error) {
    console.log("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

app.get("/posts/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await Post.findByPk(postId, {
      include: [
        { model: User, attributes: ["id", "username"] },
        {
          model: Comment,
          include: [{ model: User, attributes: ["id", "username"] }],
          order: [["createdAt", "ASC"]],
        },
      ],
    });

    if (!post) {
      console.log("Post not found with id:", postId);
      return res.status(404).json({ message: "Post not found" });
    }

    await post.increment("views"); //для увеличения views

    res.status(200).json({
      message: "Post fetched successfully",
      post: post.toJSON(),
    });
  } catch (error) {
    console.log("Error fetching post:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/posts/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, content, published } = req.body;

    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    await post.update({ title, content, published });
    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.log("Error updating post:", error);
    res.status(400).json({ message: "Invalid request body" });
  }
});

app.delete("/posts/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found", success: true });
    }
    await post.destroy();
    res.status(200).json({ message: "Post deleted successfully", success: false });
  } catch (error) {
    console.log("Error deleting post:", error);
    res.status(400).json({ message: "Invalid request body" });
  }
});

app.post("/posts/:postId/comments", async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const { content, userId } = req.body;
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const comment = await Comment.create({
      userId,
      postId,
      content,
    });
    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    console.log("Error creating post:", error);
    res.status(400).json({ message: "Invalid request body" });
  }
});

app.get("/stats", async (request, response) => {
  try {
    const totalPosts = await Post.count();
    const publishedPosts = await Post.count({ where: { published: 1 } });
    const totalComments = await Comment.count();
    const topPosts = await Post.findAll({
      attributes: ["id", "title", "views"],
      order: [["views", "DESC"]],
      limit: 5,
    });
    response.json({
      success: true,
      data: {
        totalPosts,
        publishedPosts,
        draftPosts: totalPosts - publishedPosts,
        totalComments,
        topPostsByViews: topPosts,
      },
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
}); //последний без next

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connected");
    app.listen(port, host, () => {
      console.log(`Server is running at  http://${host}:${port}`);
    });
  } catch (error) {
    console.error("Database error:", error);
  }
}
startServer();
