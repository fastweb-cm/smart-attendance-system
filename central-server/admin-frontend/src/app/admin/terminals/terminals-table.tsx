import { DataTable } from '@/components/data-table'
import { terminalColumns } from './columns'
import { TerminalFetchResponse } from '@/client'

export default function TerminalsTable({
  data,
  onView,
  onDelete
}: {
  data: TerminalFetchResponse[],
  onView: (t: TerminalFetchResponse) => void
  onDelete: (t: TerminalFetchResponse) => void
}) {
  return <DataTable columns={terminalColumns(onView, onDelete)} data={data} label='All Terminals' emptyText='No Terminal Found' />
}
