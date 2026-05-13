import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ShieldCheck, Activity, Users, Fingerprint } from "lucide-react"
import { TerminalFetchResponse } from "@/client"
import { Badge } from "./ui/badge"
import { getRelativeTimeString } from "@/lib/utils"




export const TerminalDetailsView = ({ terminal }: { terminal: TerminalFetchResponse }) => {
  const relativeTime = getRelativeTimeString(terminal?.last_heartbeat);
  // Determine health color for the dot
  const getHeartbeatColor = () => {
    if (!terminal?.last_heartbeat) return "bg-slate-400";
    const diff = (new Date().getTime() - new Date(terminal.last_heartbeat).getTime()) / 1000;
    if (diff < 60) return "bg-emerald-500 animate-pulse"; // Under 1 min
    if (diff < 3600) return "bg-amber-500"; // Under 1 hour
    return "bg-red-500"; // Over 1 hour
  };
  return (
    <div className="py-4 space-y-8">
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{terminal?.name}</h2>
          <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
            SLUG: {terminal?.slug}
          </code>
        </div>
        <Badge variant={terminal.health_status === "online" ? "active" : "destructive"} className="px-3 py-1">
          {terminal.health_status}
        </Badge>
      </div>
      
      <Tabs defaultValue="overview" className="w-full flex flex-col gap-4">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="rounded-lg py-2.5 transition-all duration-200
              data-[state=active]:bg-background 
              data-[state=active]:text-primary 
              data-[state=active]:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] 
              data-[state=active]:ring-1 
              data-[state=active]:ring-black/5
              font-semibold text-sm">Overview</TabsTrigger>
          <TabsTrigger value="auth" className="rounded-lg py-2.5 transition-all duration-200
              data-[state=active]:bg-background 
              data-[state=active]:text-primary 
              data-[state=active]:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] 
              data-[state=active]:ring-1 
              data-[state=active]:ring-black/5
              font-semibold text-sm">Security</TabsTrigger>
          <TabsTrigger value="access" className="rounded-lg py-2.5 transition-all duration-200
              data-[state=active]:bg-background 
              data-[state=active]:text-primary 
              data-[state=active]:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] 
              data-[state=active]:ring-1 
              data-[state=active]:ring-black/5
              font-semibold text-sm">Access Control</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border bg-card shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground italic">
                <Activity size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Network Address</span>
              </div>
              <p className="text-lg font-mono font-semibold">{terminal.ip_address || "0.0.0.0"}</p>
            </div>

            <div className="p-4 rounded-xl border bg-card shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground italic">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Last Heartbeat</span>
              </div>
              <p className="text-sm text-primary font-medium">
                {terminal?.last_heartbeat ? relativeTime : "Never connected"}
              </p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-dashed bg-muted/20">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Location / Branch</p>
            <p className="text-sm font-medium">{terminal.branch}</p>
          </div>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="auth" className="pt-6">
          <div className="bg-secondary/10 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
              <Fingerprint className="w-4 h-4 text-primary" />
              Auth Sequence
            </h3>
            <p className="text-xs text-muted-foreground">The hardware supports the following steps in order.</p>
          </div>
          
          <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-muted">
            {(terminal.auth_capabilities?.slice() ?? []).sort((a, b) => a.auth_step - b.auth_step).map((step) => (
              <div key={step.auth_type_id} className="relative flex items-center gap-4 pl-10">
                <span className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm ring-4 ring-background">
                  <span className="text-xs font-bold text-primary">{step.auth_step}</span>
                </span>
                <div className="flex-1 p-3 border rounded-lg bg-card capitalize font-semibold shadow-sm text-sm">
                  {step.auth_type_name} Verification
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ACCESS POLICIES TAB */}
        <TabsContent value="access" className="pt-6">
          <div className="space-y-3">
            {terminal.access_policy?.length ? (
              terminal.access_policy.map((policy) => (
                <div key={policy.id} className="group p-4 flex justify-between items-center border rounded-xl hover:border-primary/50 transition-all bg-card shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{policy.group_name}</p>
                      <p className="text-[10px] text-muted-foreground">Policy ID: #{policy.id}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize text-[10px] font-bold">
                    {policy.auth_type_name}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-10 border rounded-xl border-dashed">
                <p className="text-sm text-muted-foreground">No access policies configured for this terminal.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
