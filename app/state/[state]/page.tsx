import type { Metadata } from "next";
import { dataMap, facilitiesFor, listStates } from "@/lib/data";
import Provenance from "@/components/Provenance";
import StateTable from "@/components/StateTable";

export const dynamicParams = false;

export function generateStaticParams() {
  return listStates().map(({ state }) => ({ state }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  return { title: `${state} nursing homes` };
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const facilities = facilitiesFor(state);
  const providersInfo = dataMap().tables["providers"];
  const vintage =
    providersInfo?.modified_date?.slice(0, 7) ??
    dataMap().generated_at.slice(0, 7);

  return (
    <>
      <h1>{state} nursing homes</h1>
      <StateTable state={state} rows={facilities} vintage={vintage} />
      {providersInfo ? <Provenance info={providersInfo} /> : null}
    </>
  );
}
