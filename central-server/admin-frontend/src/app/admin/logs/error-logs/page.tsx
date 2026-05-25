import Logs from "@/components/logger/Logs";

export default function page() {
  return (
    <div className="space-y-4 my-4">
       <Logs category="error" disabled={true}/>
    </div>
  )
}
