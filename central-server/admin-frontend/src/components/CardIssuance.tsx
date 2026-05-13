"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  UserPlus, 
  LayoutGrid, 
  Printer, 
  Camera, 
  Trash2, 
  CheckCircle2,
  Briefcase,
  Fingerprint,
  Search,
  ChevronRight,
  X,
  GraduationCap
} from 'lucide-react';

import IDCard from './IdCard';
import { CardUser } from '@/types';
import apiClient from '@/lib/axiosClient';
import { toast } from 'react-toastify';
import { Button } from './ui/button';
import Webcam from 'react-webcam';

export default function CardIssuance() {
  const [tab, setTab] = useState<'enroll' | 'batch'>('enroll');
  const [formData, setFormData] = useState({
    id: '', 
    firstName: '', 
    lastName: '', 
    designation: '', 
    department: '', 
    employeeId: '', 
    cardUid: '', 
    regno: '',
    photo: '', 
    role: 'student' as 'student' | 'staff', 
    className: '', 
    gender: ''
  });

  const [queue, setQueue] = useState<(CardUser & { queueId: string; selected: boolean })[]>([]);
  const [dbUsers, setDbUsers] = useState<CardUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [isCameraMode, setIsCameraMode] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setFormData(prev => ({ ...prev, photo: imageSrc }));
      setIsCameraMode(false); // Close camera after taking photo
      toast.success("Photo captured!");
    }
  }, [webcamRef]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Enter' && isCameraMode) {
      // Prevent the default action (like submitting a form)
      event.preventDefault();
      capturePhoto();
    }
  }, [isCameraMode, capturePhoto]);

  useEffect(() => {
    if (isCameraMode) {
      window.addEventListener('keydown', handleKeyPress);
    }
  
    // Cleanup: Remove the listener when camera mode is turned off
  return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isCameraMode, handleKeyPress]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get("/api/v1/users/pending-card");

        const formatted = res.data.map((user: CardUser) => ({
          ...user,
          selected: true,
        }));
        // lets filter the users to only include those with pending or revoked cards
        // and also sort the entire res by the revoked and pending cards first, active next, then by the issuedAt date with the most recent first
        const filtered = formatted.filter((u: CardUser) => u.status === 'pending' || u.status === 'revoked');
        const sorted = formatted.sort((a: CardUser, b: CardUser) => {
          if ((a.status === 'pending' || a.status === 'revoked') && b.status === 'active') return -1;
          if (a.status === 'active' && (b.status === 'pending' || b.status === 'revoked')) return 1;

          const dateA = new Date(a.issuedAt || '').getUTCDate() || 0;
          const dateB = new Date(b.issuedAt || '').getUTCDate() || 0;
          return dateB - dateA;
        });

        // we set the db users to the sorted list
        setDbUsers(sorted);

        // Slice the array to only take the first 10 items
        const limitedData = filtered.slice(0, 10);

        setQueue(limitedData.map((u: CardUser) => ({ ...u, queueId: u.id, selected: true })));
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return dbUsers;
    const q = searchQuery.toLowerCase();
    return dbUsers.filter(u => 
      u.firstName.toLowerCase().includes(q) || 
      u.lastName.toLowerCase().includes(q) || 
      (u.employeeId && u.employeeId.toLowerCase().includes(q))
    );
  }, [searchQuery, dbUsers]);

  const selectUser = (user: CardUser) => {
    setFormData({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || 'student',
      employeeId: user.employeeId || '',
      className: user.className || '',
      designation: user.designation || '',
      department: user.department || '',
      gender: user.gender || '',
      cardUid: user.cardUid || '',
      photo: user.photo || '',
      regno: user.regno || '',
    });
    setSearchQuery(`${user.firstName} ${user.lastName}`);
    setShowSearch(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const addToQueue = () => {
    if (!formData.firstName || !formData.lastName) return;

    if (queue.length >= 10) {
      toast.error("Batch limit reached! Please print or clear the current 10 items before adding more.");
      return; 
    }

    // we look through the queue to find if this user already exists
    const alreadyExists = queue.some(user => user.id === formData.id);
    if (alreadyExists) {      
      alert("This user is already in the print queue.");
      return;
    }

    const newItem: CardUser & { queueId: string; selected: boolean } = { 
      ...formData,
      id: formData.id || Date.now().toString(),
      queueId: Date.now().toString(), 
      selected: true 
    };
    setQueue(prev => [newItem, ...prev]);
    setFormData({ id: '', firstName: '', lastName: '', designation: '', department: '', employeeId: '', cardUid: '', photo: '', regno: '', role: 'student', className: '', gender: '' });
    setSearchQuery('');
  };

  const toggleSelect = (id: string) => {
    setQueue(prev => prev.map(u => u.id === id ? { ...u, selected: !u.selected } : u));
  };

  const deleteFromQueue = (queueId: string) => {
    setQueue(prev => prev.filter(item => item.queueId !== queueId));
  };

  const handlePrint = () => {
    window.print();
  };

  const markAsPrinted = async () => {
    // get only the users that are selected for printing
    const toMark = queue.filter(u => u.selected).map(u => u.id);

    if (toMark.length === 0) {
      alert("No users selected to mark as issued.");
      return;
    }

    try {
      const res = await apiClient.post("/api/v1/users/mark-card-issued", { ids: toMark });
      
      if (res.status === 200) {
        // clear the local queue
      setQueue([]);

      // refresh the database users to reflect the changes
      const res = await apiClient.get("/api/v1/users/pending-card");
      const formatted = res.data.map((user: CardUser) => ({
          ...user,
          selected: true,
          queueId: user.id,
        }));
        // lets filter the users to only include those with pending or revoked cards
        // and also sort the entire res by the revoked and pending cards first, active next, then by the issuedAt date with the most recent first
        const filtered = formatted.filter((u: CardUser) => u.status === 'pending' || u.status === 'revoked');
        const sorted = formatted.sort((a: CardUser, b: CardUser) => {
          if ((a.status === 'pending' || a.status === 'revoked') && b.status === 'active') return -1;
          if (a.status === 'active' && (b.status === 'pending' || b.status === 'revoked')) return 1;

          const dateA = new Date(a.issuedAt || '').getUTCDate() || 0;
          const dateB = new Date(b.issuedAt || '').getUTCDate() || 0;
          return dateB - dateA;
        });

        // we set the db users to the sorted list
        setDbUsers(sorted);

        // Slice the array to only take the first 10 items
        const limitedData = filtered.slice(0, 10);

        setQueue(limitedData.map((u: CardUser) => ({ ...u, queueId: u.id, selected: true })));

      toast.success("Marked selected cards as issued successfully!");
      }
    } catch (err) {
      console.error("Error marking cards as issued:", err);
      toast.error("Failed to mark cards as issued.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <div className="screen-wrapper no-print">
        <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
              <div className="bg-slate-900 p-1.5 rounded-lg text-white shadow-lg">
                <Fingerprint size={24} />
              </div>
              ID-MASTER
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button 
                onClick={() => setTab('enroll')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'enroll' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <UserPlus size={14} /> Enrollment
              </button>
              <button 
                onClick={() => setTab('batch')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'batch' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutGrid size={14} /> Batch Printing
              </button>
            </div>
          </div>

          <button 
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg"
          >
            <Printer size={16} /> Print Sheet
          </button>
        </nav>


        <main className="max-w-7xl mx-auto p-8">
          {/* Floating Action Button - Only visible in Batch Tab */}
          {tab === 'batch' && queue.some(u => u.selected) && (
            <Button
              onClick={markAsPrinted}
              className="no-print fixed bottom-10 right-10 flex items-center gap-3 transition-all hover:scale-110 active:scale-50 z-[100] group"
            >
              <div className="bg-white/20 p-2 rounded-full">
                <CheckCircle2 size={24} />
              </div>
              <span className="pr-2 font-bold uppercase tracking-wider text-sm">
                Confirm {queue.filter(u => u.selected).length} Printed
              </span>
            </Button>
          )}
          {tab === 'enroll' ? (
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-12 lg:col-span-5 space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Personnel Onboarding</h3>
                  <div className="space-y-5">
                    <div className="relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1.5 block">Search Database</label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={searchQuery}
                          onFocus={() => setShowSearch(true)}
                          onChange={(e) => {setSearchQuery(e.target.value); setShowSearch(true);}}
                          placeholder="Type name or reg number..."
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        {searchQuery && (
                          <button onClick={() => {setSearchQuery(''); setFormData({id:'',firstName:'',lastName:'',designation:'',department:'',employeeId:'',cardUid:'',photo:'',regno:'',role:'student',className:'',gender:''});}} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      {showSearch && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-150 max-h-60 overflow-y-auto divide-y divide-slate-50">
                          {filteredUsers.length > 0 ? filteredUsers.map(u => (
                            <div 
                              key={u.id}
                              onClick={() => selectUser(u)}
                              className="p-4 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white ${u.role === 'staff' ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                                  {u.firstName[0]}{u.lastName[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-800">{u.firstName} {u.lastName}</p>
                                  <p className="text-[10px] font-bold text-slate-400">{u.employeeId} • {u.role?.toUpperCase()}</p>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                          )) : (
                            <div className="p-8 text-center text-slate-400 text-xs font-bold italic">No matching personnel found</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1.5 block">Role</label>
                        <select 
                          name="role" 
                          value={formData.role} 
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        >
                          <option value="student">Student</option>
                          <option value="staff">Staff Member</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1.5 block">Gender</label>
                        <select 
                          name="gender" 
                          value={formData.gender} 
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400" placeholder="First Name" />
                      <input name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400" placeholder="Last Name" />
                    </div>

                    {formData.role === 'student' && (
                      <>
                        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                          <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm"><GraduationCap size={18} /></div>
                          <input name="className" value={formData.className} onChange={handleInputChange} className="flex-1 px-3 bg-transparent text-sm font-bold outline-none" placeholder="Enter Class (e.g. Form 5 Science)" />
                        </div>
                        <input name="regno" value={formData.regno} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-black rounded-2xl text-sm outline-none placeholder:text-indigo-300" placeholder="Regno" readOnly/>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <input name="employeeId" value={formData.employeeId} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold outline-none" placeholder="Card UID" />
                      <input name="cardUid" value={formData.cardUid} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-black rounded-2xl text-sm outline-none placeholder:text-indigo-300" placeholder="Scan UID" readOnly/>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Personnel Photo</label>
                        <button 
                          type="button"
                          onClick={() => setIsCameraMode(!isCameraMode)}
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                          {isCameraMode ? "Switch to Upload" : "Switch to Live Camera"}
                        </button>
                      </div>

                      {isCameraMode ? (
                        <div className="relative group overflow-hidden rounded-2xl bg-black aspect-video border-2 border-slate-200" >
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "user" }}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-black shadow-xl hover:bg-indigo-50 transition-all active:scale-90"
                            >
                              Capture Snapshot
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative">
                          {formData.photo ? (
                            <img src={formData.photo} className="w-full h-full object-cover opacity-50" alt="Preview" />
                          ) : (
                            <>
                              <Camera className="w-6 h-6 mb-1 text-slate-400" />
                              <p className="text-xs text-slate-500">Click to Upload Photo</p>
                            </>
                          )}
                          <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                          {formData.photo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                              <p className="text-[10px] font-black text-slate-900 uppercase bg-white px-3 py-1 rounded-full shadow-sm">Change Photo</p>
                            </div>
                          )}
                        </label>
                      )}
                    </div>

                    <button onClick={addToQueue} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-black shadow-xl">Add to Print Queue</button>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-7 flex flex-col items-center justify-center min-h-125 bg-white rounded-3xl border border-slate-200 shadow-inner">
                <IDCard user={formData} />
                <p className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">Aesthetic Preview</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest">
                    Print Queue
                    <span className="bg-slate-900 text-white px-2.5 py-1 rounded-full">{queue.filter(u => u.selected).length} UNITS</span>
                  </div>
                  <div className="max-h-150 overflow-y-auto divide-y divide-slate-100">
                    {queue.map(user => (
                      <div key={user.id} onClick={() => toggleSelect(user.queueId)} className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 group ${user.selected ? 'bg-blue-50/20' : ''}`}>
                        <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${user.selected ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200'}`}>
                          {user.selected && <CheckCircle2 size={14} />}
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-bold text-slate-900 uppercase truncate">{user.firstName} {user.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{user.designation}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteFromQueue(user.queueId); }} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-8 flex flex-col items-center">
                <div className="bg-white shadow-2xl p-[10mm] border border-slate-200 origin-top scale-75 lg:scale-100 transition-transform" style={{ width: '210mm', minHeight: '297mm' }}>
                  <div className="grid grid-cols-2 gap-[5mm]">
                    {queue.filter(u => u.selected).map(user => (
                      <IDCard key={user.id} user={user} isBatch />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- PRINT TARGET --- */}
      <div className="print-page">
        <div className="print-area">
          <div className="print-grid">
            {queue.filter(u => u.selected).map(user => (
              <div key={user.id} className="card-items">
                <IDCard user={user} isBatch />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
