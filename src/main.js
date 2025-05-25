import { web } from "./apps/web.js";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.APP_PORT || 3000;
web.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
