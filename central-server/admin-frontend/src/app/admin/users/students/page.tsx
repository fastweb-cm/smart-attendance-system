"use client";

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import UsersForm from '@/components/forms/UsersForm';
import StudentsList from '@/components/StudentsList';
import { useSyncUsers } from '@/hooks/useUsers';

export default function Students() {
  const [loading, setLoading] = useState(false);
  const syncUsers = useSyncUsers();

  // The Sync Logic
  const handleUsersPull = async () => {
    setLoading(true);
    try {
      // 1. Pull from ssec online
      const res = await fetch('http://ssec.online/api_sync.php');
      const data = await res.json();


      if (!data.students?.length && !data.staff?.length) {
        toast.info("Database is already up to date.");
        return;
      }

      // 2. Sync with our local server
      const localResponse = await syncUsers.mutateAsync({
        body: {
          students: data.students || [],
          staff: data.staff || []
        }
      });

      // If local sync was successful, Acknowledge back to ssec.online
      // The localResponse should contain the studentIds and staffIds from your PHP controller
      if (localResponse.success) {
        await fetch('http://ssec.online/api_sync.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentIds: localResponse.studentIds,
            staffIds: localResponse.staffIds
          })
        });

        toast.success(`Successfully synced ${localResponse.studentIds?.length || 0} students and ${localResponse.staffIds?.length || 0} staff.`);
      }
    } catch (error) {
      console.error('Sync Error:', error);
      toast.error('Failed to pull data from online server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative space-y-4 my-4 pb-24">
      {/* 1. The Manual Enrollment Form */}
      <UsersForm userType="student" />

      {/* 2. The List of Students */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <StudentsList />
      </div>

      {/* 3. The Floating Pull Button */}
      <button 
        onClick={handleUsersPull}
        disabled={loading}
        className="fixed bottom-8 right-8 z-60 flex items-center gap-3 px-6 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group border border-white/10"
      >
        <RefreshCw 
          size={20} 
          className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} 
        />
        <div className="flex flex-col items-start cursor-pointer leading-none">
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Database</span>
          <span className="font-bold text-sm uppercase tracking-wider">
            {loading ? 'Syncing...' : 'Pull Online Data'}
          </span>
        </div>
      </button>
    </div>
  );
}
