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

  // Get column order with selection column first if enabled
  const columnOrder = [
    ...(enableRowSelection ? ['mrt-row-select'] : []),
    ...columnsWithFilterOptions.map(col => col.accessorKey as string)
  ];

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
    initialState: { 
      showGlobalFilter: enableGlobalFilter,
      density: 'compact',
      columnFilters: initialColumnFilters,
      columnVisibility: initialColumnVisibility,
      columnOrder,
      sorting: [],
    },
    state: {
      columnOrder,
    },
    enableSorting: false,
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
        // Handle empty values - show all rows
        if (filterValue === undefined || filterValue === null || filterValue === '') {
          return true;
        }

        const value = Number(row.getValue(id));
        
        // If value is NaN, don't filter this row
        if (isNaN(value)) {
          return true;
        }
        
        // Handle range filter values (for numeric fields like age)
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          const [min, max] = filterValue;
          return value >= min && value <= max;
        }
        
        // Handle single numeric value (treat as minimum threshold ≥)
        if (typeof filterValue === 'number') {
          return value >= filterValue;
        }
        
        // If filter format is not recognized, don't filter
        return true;
      },
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