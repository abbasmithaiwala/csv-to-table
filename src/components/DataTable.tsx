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
    renderTopToolbarCustomActions,
    onTableInstanceChange,
  } = props;

  const table = useMaterialReactTable({
    columns,
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
    initialState: { 
      showGlobalFilter: enableGlobalFilter,
      density: 'compact',
    },
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