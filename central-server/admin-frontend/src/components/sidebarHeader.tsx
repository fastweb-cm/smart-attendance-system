import Link from "next/link"
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar"
import Image from "next/image"

export default function SidebarHead() {
  return (
    <SidebarHeader className="p-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className="h-14 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <Link
              href="/"
              className="flex items-center gap-1 font-semibold group-data-[collapsible=icon]:gap-0"
            >
              {/* Logo container */}
              <Image src="/logo.jpg" alt="logo" width={32} height={32} />

              {/* App name */}
              <span
                className="
                  text-base transition-opacity duration-200
                  group-data-[collapsible=icon]:hidden text-primary
                "
              >
                SSEC
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
