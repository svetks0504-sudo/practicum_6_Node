import express from "express";
import dotenv from "dotenv";
import { User, Post, Comment } from "./models/index.js";
import sequelize from "./config/db.js";
/*import "./config/sync.js";*/
import bcrypt from "bcrypt";
import cors from "cors"

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

app.post("/users", async (req, res) => {
  try {
    const { username, email, age, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password required" });
    }

    const user = await User.create({
      username,
      email,
      age,
      password: await bcrypt.hash(password, 10),
    });

    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json({
      message: "User created successfully",
      user: userData,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "Username or email already exists" });
    }
    console.error("Error creating user:", error);
    res.status(400).json({ message: "Invalid request body" });
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
    const userId = req.params.id;

    const posts = await Post.findAll({
      where: { userId },
      include: [
        {
          model: Comment,
          attributes: ["id", "content"],
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
    res.status(404).json({ message: "Posts not found" });
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

app.post("/posts", async (req, res) => {
  try {
    const { title, content, userId } = req.body;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const post = await Post.create({
      title,
      content,
      userId,
    });
    res.status(201).json({ message: "Post created successfully", data: post });
  } catch (error) {
    console.log("Error creating post:", error);
    res.status(400).json({ message: "Invalid request body" });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
    });
    if (posts.length === 0) {
      return res.status(404).json({ message: "Posts not found" });
    }
    res.status(200).json({ message: "Posts fetched successfully", posts });
  } catch (error) {
    console.log("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

app.get("/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findOne({
      where: { id: postId },
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
        {
          model: Comment,
          attributes: ["id", "content"],
          include: [
            {
              model: User,
              attributes: ["id", "username"],
            },
          ],
        },
      ],
    });
    if (!post) {
      console.log("Post not found with id:", postId);
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({
      message: "Post fetched successfully",
      post: post.toJSON(),
    });
  } catch (error) {
    console.log("Error fetching post:", error);
    res.status(404).json({ message: "Post not found" });
  }
});

app.put("/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const [updated] = await Post.update(req.body, {
      where: { id: postId },
    });
    if (!updated || updated === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.log("Error updating post:", error);
    res.status(400).json({ message: "Invalid request body" });
  }
});

app.delete("/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.destroy({ where: { id: postId } });
    if (!post || post === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error deleting post:", error);
    res.status(400).json({ message: "Invalid request body" });
  }
});

app.post("/posts/:postId/comments", async (req, res) => {
  try {
    const postId = req.params.postId;
    const { content } = req.body;
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const comment = await Comment.create({
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
