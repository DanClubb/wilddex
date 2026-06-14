import { createClient } from "@/utils/supabase/server";
import { Suspense } from "react";

async function SpeciesData() {
    const supabase = await createClient();

    const { data, error } = await supabase.from("species").select(`
      common_name,
      categories (
        name
      )
    `);

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <ul>
            {data?.map((species) => (
                <li key={species.common_name}>
                    {species.common_name} - {species.categories?.name}
                </li>
            ))}
        </ul>
    );
}

export default function species() {
    return (
        <Suspense fallback={<div>Loading species...</div>}>
            <SpeciesData />
        </Suspense>
    );
}
