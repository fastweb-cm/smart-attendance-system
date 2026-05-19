
import { DataTable } from '@/components/data-table'
import { exceptionColumns } from './columns'
import { AttendanceException } from '@/types'
import InputField from '@/components/ui/InputField'

export default function ExceptionsTable({
  data,
  onDelete,
  onEdit
}: {
  data: AttendanceException[],
  onDelete: (e: AttendanceException) => void
  onEdit: (e: AttendanceException) => void
}) {
  return <DataTable columns={exceptionColumns(onEdit, onDelete)} data={data} label='All Exceptions' emptyText='No Exceptions Found'/>
}
