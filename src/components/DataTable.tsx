import React, { useEffect } from 'react';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Box, Paper } from '@mui/material';

export interface DataTableProps<TData extends Record<string, any>> {
  data: TData[];
  columns: MRT_ColumnDef<TData>[];
  enableRowSelection?: boolean;
  enableColumnFilters?: boolean;
  enableGlobalFilter?: boolean;
  enablePagination?: boolean;
  enableDensityToggle?: boolean;
  enableFullScreenToggle?: boolean;
  enableColumnResizing?: boolean;
  enableHiding?: boolean;
  enableGrouping?: boolean;
  initialColumnFilters?: any[];
  initialColumnVisibility?: Record<string, boolean>;
  renderTopToolbarCustomActions?: (props: { table: any }) => React.ReactNode;
  onTableInstanceChange?: (tableInstance: any) => void;
}

export function DataTable<TData extends Record<string, any>>(props: DataTableProps<TData>) {
  const {
    data,
    columns,
    enableRowSelection = false,
    enableColumnFilters = true,
    enableGlobalFilter = true,
    enablePagination = true,
    enableDensityToggle = true,
    enableFullScreenToggle = true,
    enableColumnResizing = true,
    enableHiding = true,
    enableGrouping = false,
    initialColumnFilters = [],
    initialColumnVisibility = {},
    renderTopToolbarCustomActions,
    onTableInstanceChange,
  } = props;

  // Create columns with proper filter options
  const columnsWithFilterOptions = columns.map(column => ({
    ...column,
    filterFn: 'fuzzy', // default filter function
    enableColumnFilter: true,
  }));

  const table = useMaterialReactTable({
    columns: columnsWithFilterOptions,
    data,
    enableRowSelection,
    enableColumnFilters,
    enableGlobalFilter,
    enablePagination,
    enableDensityToggle,
    enableFullScreenToggle,
    enableColumnResizing,
    enableHiding,
    enableGrouping,
    // These enable actual filtering (not just highlighting)
    enableFilters: true,
    enableColumnFilterModes: true,
    enableFilterMatchHighlighting: false,
    columnFilterDisplayMode: 'popover',
    filterFns: {
      startsWith: (row, id, filterValue) => 
        String(row.getValue(id))
          .toLowerCase()
          .startsWith(String(filterValue).toLowerCase()),
      endsWith: (row, id, filterValue) => 
        String(row.getValue(id))
          .toLowerCase()
          .endsWith(String(filterValue).toLowerCase()),
      contains: (row, id, filterValue) => 
        String(row.getValue(id))
          .toLowerCase()
          .includes(String(filterValue).toLowerCase()),
      equals: (row, id, filterValue) => 
        String(row.getValue(id))
          .toLowerCase() === String(filterValue).toLowerCase(),
      fuzzy: (row, id, filterValue) => 
        String(row.getValue(id))
          .toLowerCase()
          .includes(String(filterValue).toLowerCase()),
    },
    initialState: { 
      showGlobalFilter: enableGlobalFilter,
      density: 'compact',
      columnFilters: initialColumnFilters,
      columnVisibility: initialColumnVisibility,
    },
    // Display only filtered rows (important!)
    manualFiltering: false,
    layoutMode: enableColumnResizing ? 'grid-no-grow' : 'semantic',
    positionToolbarAlertBanner: 'bottom',
    muiTableContainerProps: {
      sx: {
        maxHeight: '70vh',
      },
    },
    muiTableHeadProps: {
      sx: {
        '& th': {
          fontWeight: 'bold',
        },
      },
    },
    renderTopToolbarCustomActions,
  });

  // Call the onTableInstanceChange callback when the table instance changes
  useEffect(() => {
    if (onTableInstanceChange) {
      onTableInstanceChange(table);
    }
  }, [table, onTableInstanceChange]);

  return (
    <Paper elevation={3}>
      <MaterialReactTable table={table} />
    </Paper>
  );
} 