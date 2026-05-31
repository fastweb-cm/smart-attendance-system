import { AttendanceException } from "@/types";
import {
  Home,
  Users,
  UserPlus,
  Computer,
  AlertTriangle,
  Settings,
  Sliders,
  IdCard,
  AlarmClock,
  FileSpreadsheet,
  ClipboardCheck,
  FileCode2,
  Activity,
  ShieldAlert,
} from "lucide-react"

export const sidebarMenItems = [
  {
    label: "Menu",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: Home,
      },
      {
        title: "Terminals",
        icon: Computer,
        children: [
          {
            title: "All Terminals",
            url: "/admin/terminals",
          },
          {
            title: "Add Terminal",
            url: "/admin/terminals/add",
          }
        ]
      },
      // {
      //   title: "Subscriptions",
      //   url: "/admin/subscriptions",
      //   icon: UserPlus,
      // },
      {
        title: "Employees",
        icon: Users,
        url: "/admin/users"
      },

      // {
      //   title: "Issue Cards",
      //   url: "/admin/issue-card",
      //   icon: IdCard,
      // }
    ],
  },
  {
    label: "Modules",
    items: [
      {
        title: "Cards",
        url: "/admin/issue-card",
        icon: IdCard,
      },
      {
        title: "Exceptions",
        url: "/admin/exceptions",
        icon: AlarmClock,
      },
      {
        title: "Permissions",
        url: "/admin/permissions",
        icon: ShieldAlert
      }
    ],
  },
  {
    label: "Reports",
    items: [
      {
        title: "Attendance Report",
        url: "/admin/attendance",
        icon: FileSpreadsheet,
      },
      // {
      //   title: "Attendance Summary",
      //   url: "/admin/exceptions",
      //   icon: ClipboardCheck,
      // }
    ],
  },
  {
    label: "Logs",
    items: [
      {
        title: "System Logs",
        url: "/admin/logs",
        icon: FileCode2,
      },
      {
        title: "Error Logs",
        url: "/admin/logs/error-logs",
        icon: Activity,
      }
    ],
  },
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

export const INITIAL_EXCEPTIONS: AttendanceException[] = [
  {
    id: 1,
    exception_type: 'public_holiday',
    title: 'New Year Federal Break',
    description: 'National public holiday observed across all terminal servers.',
    start_date: '2026-01-01',
    end_date: '2026-01-02'
  },
  {
    id: 2,
    exception_type: 'emergency_closure',
    title: 'Severe Blizzard Emergency',
    description: 'City-wide transport lockout. Automated terminal check-in exempt.',
    start_date: '2026-02-12',
    end_date: '2026-02-13'
  },
  {
    id: 3,
    exception_type: 'system_maintenance',
    title: 'Q2 Core Database Upgrade',
    description: 'Scheduled backend schema migration and system terminal sync window.',
    start_date: '2026-06-20',
    end_date: '2026-06-21'
  },
  {
    id: 4,
    exception_type: 'company_event',
    title: 'Strategic Leadership Summit',
    description: 'Corporate building locked for non-executive workforce.',
    start_date: '2026-08-14',
    end_date: '2026-08-15'
  },
  {
    id: 5,
    exception_type: 'other',
    title: 'Power Grid Load Shedding',
    description: 'Pre-emptive regional power outage adjustments.',
    start_date: '2026-11-05',
    end_date: '2026-11-05'
  }
];
