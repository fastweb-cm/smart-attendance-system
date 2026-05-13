
import UsersForm from '@/components/forms/UsersForm';
import StudentsList from '@/components/StudentsList';
import SyncUsersButton from '@/components/SyncUsersButton';
import { getClasses } from '@/lib/actions/lookups';
import { LookupClass } from '@/types';

export default async function Students() {
  // fetch classes from the server
  const classes: LookupClass[] = await getClasses();

  return (
    <div className="relative space-y-4 my-4 pb-24">
      {/* The Manual Enrollment Form */}
      <UsersForm userType="student" initialData={classes} />

      {/* The List of Students */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <StudentsList />
      </div>

      {/* The Floating Pull Button */}
      <SyncUsersButton />
    </div>
  );
}
