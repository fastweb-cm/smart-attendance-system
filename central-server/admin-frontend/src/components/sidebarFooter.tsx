import React from 'react'
import { SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { ChevronsUpDown, User2, LogOut, CircleUser} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function SidebarFoot() {
  const { user } = useAuth();
  return (
    <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild className='h-14 px-3'>
                  <SidebarMenuButton>
                    <User2 /> <div className="flex flex-col">
                        <p className="text-md font-extrabold">{user?.username}</p>
                        <p className="text-xs">brandonichami@gmail.com</p>
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align='end'
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem>
                    <CircleUser /> <span>Profile</span>
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem>
                    <CreditCard /> <span>Billing</span>
                  </DropdownMenuItem> */}
                  <DropdownMenuItem>
                    <LogOut /> <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
  )
}
