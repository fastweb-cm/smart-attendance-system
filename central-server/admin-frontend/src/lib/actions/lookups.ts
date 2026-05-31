import { GroupWithSubgroupsLookup, Lookup, LookupBranch, LookupClass } from "@/types";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
export async function getClasses(): Promise<LookupClass[]> {
    const response = await fetch(`${baseUrl}/api/v1/lookup/classes`, {
        next: { revalidate: 3600 } // cache for 1 hour
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.statusText}`);
    }
    const data: LookupClass[] = await response.json();
    return data as LookupClass[]; // Type assertion to ensure correct typing
}

export async function getbranches(): Promise<LookupBranch[]> {
    const response = await fetch(`${baseUrl}/api/v1/lookup/branches`, {
        next: { revalidate: 3600 }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.statusText}`);
    }

    const data: LookupBranch[] = await response.json();
    return data as LookupBranch[];
}

export async function getAuthTypes(): Promise<Lookup[]> {
    const response = await fetch(`${baseUrl}/api/v1/lookup/auth-types`, {
        next: { revalidate: 3600 }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch auth types: ${response.statusText}`);
    }

    const data: Lookup[] = await response.json();
    return data as Lookup[];
}

export async function getGroupsWithSubgroups(): Promise<GroupWithSubgroupsLookup[]> {
    const response = await fetch(`${baseUrl}/api/v1/lookup/auth-policies`, {
        next: { revalidate: 3600 }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch groups with subgroups: ${response.statusText}`);
    }

    const data: GroupWithSubgroupsLookup[] = await response.json();
    return data as GroupWithSubgroupsLookup[];
}

export async function getUsers(userType: string): Promise<Lookup[]> {
    const response = await fetch(`${baseUrl}/api/v1/lookup/users/${userType}`, {

    });

    if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const data: Lookup[] = await response.json();
    return data as Lookup[];
}

export async function getEmployeeRoles(): Promise<Lookup[]> {
    const res = await fetch(`${baseUrl}/api/v1/lookup/roles`)

    if (!res.ok) {
        throw new Error(`Failed to fetch employee roles: ${res.statusText}`);
    }

    const data: Lookup[] = await res.json();
    return data as Lookup[];
}
