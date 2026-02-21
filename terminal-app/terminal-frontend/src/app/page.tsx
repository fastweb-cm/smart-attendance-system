import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";


export default function Home() {
  const configPath = path.join(process.cwd(), "config.json");
  const isActivated = fs.existsSync(configPath);

  if (isActivated) {
    redirect("/terminal");
  } else {
    redirect("/activate");
  }

}
