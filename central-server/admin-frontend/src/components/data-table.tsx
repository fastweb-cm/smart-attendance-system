'use client'

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  getSortedRowModel,
  RowSelectionState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import { ExtendedDataTableProps } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { useState, useEffect } from "react"

export function DataTable<TData, TValue>({
  columns,
  data,
  showSearchBar = true,
  emptyText = 'No data found',
  label,
  filtersComponent,
  enableGlobalFilter = true,
  manualFiltering = false,
  onGlobalSearchChange,
}: ExtendedDataTableProps<TData, TValue>) {

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Debounced global search
  const [search, setSearch] = useState("")
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    const timeout = setTimeout(() => {
      if(onGlobalSearchChange){
        onGlobalSearchChange(search)
      }else{
        setGlobalFilter(search)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [search,onGlobalSearchChange])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter: manualFiltering ? undefined : globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10, // default rows per page
      },
    },
    manualFiltering,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
  })

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const total = manualFiltering
    ? data.length
    : table.getFilteredRowModel().rows.length

  const from = total === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, total)

  // Limited pagination window (max 5 pages visible)
  const pageCount = table.getPageCount()
  const maxVisible = 5

  const startPage = Math.max(0, pageIndex - Math.floor(maxVisible / 2))
  const endPage = Math.min(pageCount, startPage + maxVisible)

  const pages = Array.from(
    { length: endPage - startPage },
    (_, i) => startPage + i
  )

  return (
    <div className="bg-white rounded-md border shadow-sm space-y-4">
      <h4 className="p-4 leading-none mb-0 text-primary">{label}</h4>
      {/* Top Bar */}
      {(showSearchBar || filtersComponent) && (
        <div className="flex items-center justify-between p-4">
          {enableGlobalFilter && showSearchBar && (
            <Input placeholder="Search..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          )}

          {filtersComponent && (
            <div className="flex items-center gap-2">
              {filtersComponent}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto my-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-red-500"
                >
                  ** {emptyText} **
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center flex-col md:flex-row justify-between gap-2 px-4 py-3 border-t">
        <p className="text-xs md:text-sm text-muted-foreground">
          Showing {from} to {to} of {total} entries
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pages.map((page) => {
              const isActive = page === pageIndex

              return (
                <Button
                  key={page}
                  variant={isActive ? "primary" : "outline"}
                  size="sm"
                  onClick={() => table.setPageIndex(page)}
                  disabled={isActive}
                  className="h-8 w-8 p-0"
                >
                  {page + 1}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
