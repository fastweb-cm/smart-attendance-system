'use client'

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./ui/collapsible"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import SidebarHead from "./sidebarHeader"
import SidebarFoot from "./sidebarFooter"
import { sidebarMenItems } from "@/lib/data"

export function AppSidebar() {
  const pathname = usePathname()
  const { state, setOpen } = useSidebar()
  const isCollapsed = state === "collapsed"
  const isActive = (url?: string) => pathname === url

  return (
    <Sidebar>
      <SidebarHead />

      <SidebarContent>
        <TooltipProvider delayDuration={0}>
          {sidebarMenItems.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) =>
                    item.children ? (
                      // Item with submenu
                      <Collapsible key={item.title}>
                        <SidebarMenuItem>
                          {isCollapsed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SidebarMenuButton
                                  className="flex items-center justify-center p-2"
                                  onClick={(e) => {
                                    // Expand sidebar on submenu click
                                    setOpen(true)
                                    e.preventDefault()
                                  }}
                                >
                                  <item.icon className="h-5 w-5" />
                                </SidebarMenuButton>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {item.title}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton className="group flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <item.icon className="h-5 w-5" />
                                  <span>{item.title}</span>
                                </div>
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                          )}

                          {!isCollapsed && (
                            <CollapsibleContent>
                              <SidebarMenu className="ml-6 mt-1">
                                {item.children.map((child) => (
                                  <SidebarMenuItem key={child.title}>
                                    <SidebarMenuButton
                                      asChild
                                      size="sm"
                                      isActive={isActive(child.url)}
                                    >
                                      <Link href={child.url}>
                                        <span>{child.title}</span>
                                      </Link>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                ))}
                              </SidebarMenu>
                            </CollapsibleContent>
                          )}
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : (
                      // Flat menu item
                      <SidebarMenuItem key={item.title}>
                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                className="flex items-center justify-center p-2"
                                isActive={isActive(item.url)}
                              >
                                <Link href={item.url}>
                                  <item.icon className="h-5 w-5" />
                                </Link>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <SidebarMenuButton asChild isActive={isActive(item.url)}>
                            <Link href={item.url} className="flex items-center gap-2">
                              <item.icon className="h-5 w-5" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    )
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </TooltipProvider>
      </SidebarContent>

      <SidebarFoot />
    </Sidebar>
  )
}
