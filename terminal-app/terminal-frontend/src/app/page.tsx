import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";


export default function Home() {
  const configPath = path.join(process.cwd(), "terminal-configs/config.json");
  let status = "pending";

  if(fs.existsSync(configPath)) {
    // then let us read the file content
    const data = JSON.parse(fs.readFileSync(configPath,'utf-8'));
    status = data.status;
  }

  if (status === "active") {
    redirect("/terminal");
  } else if(status === 'pending'){
    redirect("/activate");
  }else{
    redirect("/access-denied");
  }

}
