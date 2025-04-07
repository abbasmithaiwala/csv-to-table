import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { DataTable, DataTableProps } from './DataTable';
import { FilterPanel } from './FilterPanel';
import { MRT_TableInstance } from 'material-react-table';

export interface FilterableDataTableProps<TData extends Record<string, any>> extends DataTableProps<TData> {
  showFilterPanel?: boolean;
  filterPanelTitle?: string;
  initialColumnVisibility?: Record<string, boolean>;
}

export function FilterableDataTable<TData extends Record<string, any>>(
  props: FilterableDataTableProps<TData>
) {
  const {
    data,
    columns,
    showFilterPanel = true,
    filterPanelTitle,
    initialColumnVisibility,
    ...otherProps
  } = props;

  // State to store initial column filters from localStorage
  const [initialColumnFilters, setInitialColumnFilters] = useState<any[]>([]);
   
  // Load saved filters on component mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('tableFilters');
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        setInitialColumnFilters(parsedFilters);
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }, []);

  // Reference to the table instance, will be updated when the table is rendered
  const tableInstanceRef = React.useRef<MRT_TableInstance<TData> | null>(null);

  // Function to update the table instance reference
  const updateTableInstanceRef = (tableInstance: MRT_TableInstance<TData>) => {
    tableInstanceRef.current = tableInstance;
    
    // Apply initial filters when table instance is available
    if (tableInstance && initialColumnFilters.length > 0) {
      initialColumnFilters.forEach((filter: { id: string; value: any }) => {
        const column = tableInstance.getColumn(filter.id);
        if (column) {
          column.setFilterValue(filter.value);
          
          // Set appropriate filter function for array values
          if (Array.isArray(filter.value) && filter.value.length > 0) {
            // This method doesn't exist in MRT, but we need to handle it for compatibility
            // with the existing implementation. Will be fixed in future versions.
            if ('setFilterFn' in column) {
              (column as any).setFilterFn('arrIncludesSome');
            }
          }
        }
      });
      
      // Force immediate filtering
      tableInstance.getFilteredRowModel();
    }
  };

  // Force re-render when table instance changes
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  
  useEffect(() => {
    if (tableInstanceRef.current) {
      forceUpdate();
    }
  }, [tableInstanceRef.current]);

  return (
    <Box sx={{ 
      display: 'flex', 
      width: '100%',
      flexDirection: { xs: 'column', md: 'row' },
      gap: 2,
      position: 'relative'
    }}>
      {showFilterPanel && (
        <Box sx={{ 
          width: { xs: '100%', md: 280 },
          flexShrink: 0,
        }}>
          <FilterPanel<TData> 
            columns={columns} 
            table={tableInstanceRef.current}
            title={filterPanelTitle}
          />
        </Box>
      )}
      
      <Box sx={{ 
        flex: 1, 
        width: { xs: '100%', md: `calc(100% - ${showFilterPanel ? '300px' : '0px'})` }
      }}>
        <DataTable 
          data={data}
          columns={columns}
          initialColumnFilters={initialColumnFilters}
          initialColumnVisibility={initialColumnVisibility}
          {...otherProps}
          onTableInstanceChange={updateTableInstanceRef}
        />
      </Box>
    </Box>
  );
} 