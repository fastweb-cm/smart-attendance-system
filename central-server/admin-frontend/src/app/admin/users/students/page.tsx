
// import UsersForm from '@/components/forms/UsersForm';
// import StudentsList from '@/components/StudentsList';
// import SyncUsersButton from '@/components/SyncUsersButton';
// import UsersDirectoryView from '@/components/Users/UserDirectoryView';
// import { getClasses } from '@/lib/actions/lookups';
// import { LookupClass } from '@/types';

// export default async function Students() {
//   // fetch classes from the server
//   const classes: LookupClass[] = await getClasses();

//   return (
//     <div className="relative space-y-4 my-4 pb-24">
//       {/* The Manual Enrollment Form */}
//       {/* <UsersForm userType="student" initialData={classes} /> */}

//       {/* The List of Students */}
//       {/* <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
//         <StudentsList />
//       </div> */}
//       <UsersDirectoryView />

//       {/* The Floating Pull Button */}
//       <SyncUsersButton />
//     </div>
//   );
// }

import React from "react";
import UsersDirectoryView from "@/components/Users/UserDirectoryView";
import { GraduationCap } from "lucide-react";

export const metadata = {
  title: "Student Ledger Directory Matrix",
  description: "System enrollment pipeline tracking matrix for student accounts.",
};

export default function StudentsPage() {
  return (
    <main className="my-4 max-w-6xl space-y-6">
      {/* Header Framework Layout Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-2xl tracking-tight">
            <GraduationCap className="w-7 h-7 text-blue-600 shrink-0" />
            <h1>Student Management</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review academic profiles, adjust status frames, and balance biometric states.
          </p>
        </div>
      </div>

      {/* Primary Polymorphic Directory Client View */}
      <UsersDirectoryView />
    </main>
  );
}
