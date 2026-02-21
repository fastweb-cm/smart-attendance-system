import Image from "next/image"

export default function HeaderBar() {
  return (
    <div className="flex items-center justify-between">
        {/* logo */}
        <div className="flex items-center space-x-2">
            <Image src="/logo.jpg" alt="Logo" width={32} height={32} />
            <span className="text-xl font-bold text-primary">SSEC Bamenda</span>
        </div>
        {/* branchname */}
        {/* <div className="text-sm font-medium text-gray-600">
          Branch: Main Street
        </div> */}
        {/* terminal name */}
        <div className="text-sm font-medium text-gray-600">
          Terminal: T001
        </div>
    </div>
  )
}
