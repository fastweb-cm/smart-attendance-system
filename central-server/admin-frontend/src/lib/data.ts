import {
  Home,
  Users,
  UserPlus,
  Computer,
  AlertTriangle,
  Settings,
  Sliders,
} from "lucide-react"

export const sidebarMenItems = [
  {
    label: "Menu",
    items: [
      {
        title: "Home",
        url: "/admin",
        icon: Home,
      },
      {
        title: "Terminals",
        url: "/admin/terminals",
        icon: Computer,
      },
      // {
      //   title: "Subscriptions",
      //   url: "/admin/subscriptions",
      //   icon: UserPlus,
      // },
      {
        title: "Users",
        icon: Users,
        children: [
          {
            title: "Students",
            url: "/admin/users/students",
          },
          {
            title: "Staff",
            url: "/admin/users/staff",
          },
        ],
      },
    ],
  },
  // {
  //   label: "Reports",
  //   items: [
  //     {
  //       title: "Power Outages",
  //       url: "/admin/poweroutages",
  //       icon: AlertTriangle,
  //     },
  //   ],
  // },
  // {
  //   label: "Others",
  //   items: [
  //     {
  //       title: "Settings",
  //       url: "/admin/settings",
  //       icon: Settings,
  //     },
  //     {
  //       title: "System Configuration",
  //       url: "/admin/system",
  //       icon: Sliders,
  //     },
  //   ],
  // },
]
