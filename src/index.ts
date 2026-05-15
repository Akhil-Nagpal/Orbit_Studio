import { connectDB } from "./db/connect";
import { app } from "./app";

const PORT = Bun.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server is running on Port:", PORT);
    });
  })
  .catch((error) => {
    console.error("Database connection failed!", error);
  });
