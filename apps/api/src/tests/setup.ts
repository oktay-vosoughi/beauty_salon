import { config } from "dotenv";
import { resolve } from "path";

export function setup() {
  config({ path: resolve(__dirname, "../../../../.env") });
}
