import express from "express";
import dotenv from "dotenv";

dotenv.config();

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 3333;
const app = express();

app.use(express.json());

app.post("/users", async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const user = await User.create({
      name,
      email,
      age,
    });
    console.log("User created:", user);
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
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
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
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

app.put("/users/:id", async (req, res) => {
  try {
    const { name, email, age, isActive } = req.body;
    const userId = req.params.id;
    const [updated] = await User.update(
      { name, email, age, isActive },
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
    await User.destroy({ where: { id: userId } });
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error deleting user:", error);
    res.status(400).json({ message: "Invalid request body" });
  }
});

app.listen(port, host, () => {
  console.log(`Server is running at ${host}:${port}`);
});
