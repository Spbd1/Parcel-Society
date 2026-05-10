"use client";
import { DataTable, type Column } from "../../../_components/DataTable";
import { formatDate } from "../../../_components/format";
export type EventRow = { type: string; category: string; round: number; value: string; createdAt: string };
export function EventsTable({ events }: { events: EventRow[] }) { const columns: Column<EventRow>[] = [{key:"type",header:"Type",accessor:e=>e.type,searchValue:e=>e.type},{key:"category",header:"Category",accessor:e=>e.category,searchValue:e=>e.category},{key:"round",header:"Round",accessor:e=>e.round},{key:"value",header:"Value",accessor:e=><code className="text-xs">{e.value}</code>,searchValue:e=>e.value},{key:"created",header:"Timestamp",accessor:e=>formatDate(e.createdAt)}]; return <DataTable rows={events} columns={columns} placeholder="Search events, rule changes, shocks, or treasury events…" />; }
