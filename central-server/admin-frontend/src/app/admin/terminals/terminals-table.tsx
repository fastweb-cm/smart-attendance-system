import { DataTable } from '@/components/data-table'
import { terminalColumns } from './columns'
import { TerminalFetchResponse } from '@/client'

export default function TerminalsTable({
  data,
  onView
}: {
  data: TerminalFetchResponse[],
  onView: (t: TerminalFetchResponse) => void
}) {
  return <DataTable columns={terminalColumns(onView)} data={data} label='All Terminals' emptyText='No Terminal Found' />
}
