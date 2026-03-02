"use client";

import { SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { ChevronsUpDown, User2, LogOut, CircleUser} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'react-toastify';

export default function SidebarFoot() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logout Successfully");
    } catch (error) {
      console.error(error)
      toast.error("An Unexpected error occurred")
    }
  }
  return (
    <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild className='h-14 px-3'>
                  <SidebarMenuButton>
                    <User2 /> <div className="flex flex-col">
                        <p className="text-md font-extrabold">{user?.username}</p>
                        <p className="text-xs">{user?.email}</p>
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
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut/> <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
  )
}
