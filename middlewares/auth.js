import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export default function authorization(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    return jwt.verify(token, process.env.JWT_SECRET, (error, data) => {
      if (error) {
       return res.status(403).json({ success: false, message: "Forbidden" });
      }
      req.user = data;

      next();
    });
  } else {
    return res.status(401).json({ message: "Unauthorized: No token provider" });
  }
}
