import React, { useEffect } from 'react';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Paper } from '@mui/material';

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
  const columnsWithFilterOptions = columns.map(column => {
    const columnDef = { ...column };
    
    // Set default filter function if not specified
    if (!columnDef.filterFn) {
      // Use range filter for numeric columns
      if (columnDef.filterVariant === 'range') {
        columnDef.filterFn = 'range';
      } else {
        columnDef.filterFn = 'startsWith';
      }
    }
    
    // Ensure column filter is enabled by default
    if (columnDef.enableColumnFilter === undefined) {
      columnDef.enableColumnFilter = true;
    }
    
    return columnDef;
  });

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
      range: (row, id, filterValue) => {
        // Handle range filter values (for numeric fields like age)
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          const value = Number(row.getValue(id));
          const [min, max] = filterValue;
          return !isNaN(value) && value >= min && value <= max;
        }
        return true;
      },
    },
    initialState: { 
      showGlobalFilter: enableGlobalFilter,
      density: 'compact',
      columnFilters: initialColumnFilters,
      columnVisibility: initialColumnVisibility,
      sorting: columns.length > 0 ? [{ id: columns[0].accessorKey as string, desc: false }] : [],
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