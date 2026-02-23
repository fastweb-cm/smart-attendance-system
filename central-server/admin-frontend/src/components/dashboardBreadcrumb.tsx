'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  // Build breadcrumb data
  const crumbs = segments.map((segment, index) => ({
    label: segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    href: "/" + segments.slice(0, index + 1).join("/"),
  }))

  const MAX_VISIBLE = 3
  const showEllipsis = crumbs.length > MAX_VISIBLE

  // const start = crumbs.slice(0, 1)
  const middle = crumbs.slice(1, crumbs.length - 1)
  const end = crumbs.slice(-1)

  return (
    <Breadcrumb>
      <BreadcrumbList>

        {/* Ellipsis for long paths */}
        {showEllipsis && (
          <>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                  <span className="sr-only">Toggle breadcrumb menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {middle.map((crumb) => (
                    <DropdownMenuItem key={crumb.href} asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator>{">"}</BreadcrumbSeparator>
          </>
        )}

        {/* Visible crumbs */}
        {(showEllipsis ? end : crumbs).map((crumb, index) => {
          const isLast = index === (showEllipsis ? end.length - 1 : crumbs.length - 1)

          return (
            <BreadcrumbItem key={crumb.href}>
              {isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator>{">"}</BreadcrumbSeparator>
                </>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
