"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { GroupCreateFormValues } from "@/schema/group.schema";
import { Button } from "../../ui/button";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { useUsersLookup, useClassesLookup } from "@/hooks/useLookups";

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
}

export const Step2Members: React.FC<Step2Props> = ({ onNext, onBack }) => {
  const { watch, setValue } = useFormContext<GroupCreateFormValues>();
  const selectedMembers = watch("member_ids") || [];

  const [search, setSearch] = useState("");
  const [userType, setUserType] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  // TanStack Query lookup hooks
  const { data: classesList, isLoading: isLoadingClasses } = useClassesLookup();
  const { data: users, isLoading: isLoadingUsers } = useUsersLookup({
    search: search || undefined,
    user_type: userType || undefined,
    class_id: userType === "student" && selectedClassId ? Number(selectedClassId) : undefined,
    page,
    limit,
  });

  // Guard against undefined IDs
  const handleToggleUser = (userId: number | undefined) => {
    if (userId === undefined) return;

    const set = new Set(selectedMembers);
    if (set.has(userId)) set.delete(userId);
    else set.add(userId);
    setValue("member_ids", Array.from(set));
  };

  const handleToggleSelectAll = () => {
    if (!users) return;
    const set = new Set(selectedMembers);

    // Collect only valid numeric IDs
    const pageIds = users
      .map((u) => u.id)
      .filter((id): id is number => id !== undefined);

    const allSelected = pageIds.length > 0 && pageIds.every((id) => set.has(id));

    if (allSelected) {
      pageIds.forEach((id) => set.delete(id));
    } else {
      pageIds.forEach((id) => set.add(id));
    }
    setValue("member_ids", Array.from(set));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Assign Members</h3>
          <p className="text-xs text-gray-500">
            Selected: <span className="font-bold text-primary">{selectedMembers.length}</span> members
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search member name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-300 focus:outline-none"
          />
        </div>

        <select
          value={userType}
          onChange={(e) => {
            setUserType(e.target.value);
            if (e.target.value !== "student") setSelectedClassId("");
          }}
          className="text-sm p-2 rounded-md border border-gray-300 bg-white"
        >
          <option value="">All User Types</option>
          <option value="student">Student</option>
          <option value="staff">Staff</option>
        </select>

        {/* Dynamic Class Filter (Only visible when userType === 'student') */}
        {userType === "student" && (
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={isLoadingClasses}
            className="text-sm p-2 rounded-md border border-blue-300 bg-blue-50/50 text-blue-900 min-w-[150px]"
          >
            <option value="">All Classes</option>
            {classesList?.map((cls: { id: number; class_name: string }) => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name}
              </option>
            ))}
          </select>
        )}

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="text-sm p-2 rounded-md border border-gray-300 bg-white"
        >
          <option value={10}>Show 10</option>
          <option value={20}>Show 20</option>
          <option value={50}>Show 50</option>
          <option value={100}>Show 100</option>
        </select>
      </div>

      {/* Member Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600 border-b">
            <tr>
              <th className="p-3 w-10">
                <input type="checkbox" onChange={handleToggleSelectAll} />
              </th>
              <th className="p-3">User</th>
              <th className="p-3">User Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoadingUsers ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : users?.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  No users found matching current filters.
                </td>
              </tr>
            ) : (
              users?.map((user) => {
                if (user.id === undefined) return null;

                const isChecked = selectedMembers.includes(user.id);
                return (
                  <tr key={user.id} className={`hover:bg-gray-50 ${isChecked ? "bg-blue-50/30" : ""}`}>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleUser(user.id)}
                      />
                    </td>
                    <td className="p-3 font-medium text-gray-900">
                      {user.fname} {user.lname}
                    </td>
                    <td className="p-3 capitalize">{user.user_type}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </Button>
        <Button type="button" variant="outline" onClick={onNext} className="flex items-center gap-2">
          Next <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
};
