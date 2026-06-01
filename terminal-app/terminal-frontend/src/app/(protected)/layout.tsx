import { loadTerminalConfig } from "@/lib";
import { TerminalConfigProvider } from "@/context/TerminalConfigContext";
import { redirect } from "next/navigation";

// Forces Next.js to run this code on the server on every request
export const dynamic = "force-dynamic";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = loadTerminalConfig();

  if (!config) { //if config is null, then let us redirect to activation page
    redirect("/activate");
  }

  return (
    <TerminalConfigProvider config={config}>
      {children}
    </TerminalConfigProvider>
  );
}
