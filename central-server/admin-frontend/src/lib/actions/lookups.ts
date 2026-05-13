import { LookupClass } from "@/types";

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
