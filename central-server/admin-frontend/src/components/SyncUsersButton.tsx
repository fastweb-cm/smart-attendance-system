"use client";
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSyncUsers } from '@/hooks/useUsers';

export default function SyncUsersButton() {
  const syncUsers = useSyncUsers();
  const [loading, setLoading] = useState(false);

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
    <button
      onClick={handleUsersPull}
        disabled={loading}
      className="fixed bottom-8 cursor-pointer right-8 z-60 flex items-center gap-3 px-6 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group border border-white/10"
    >
      <RefreshCw 
          size={20} 
          className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} 
      />
      {loading ? 'Pulling...' : 'Pull from SSEC Online'}
    </button>
  );
}
