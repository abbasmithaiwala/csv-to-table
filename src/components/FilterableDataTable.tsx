import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { MRT_ColumnDef } from 'material-react-table';
import { DataTable, DataTableProps } from './DataTable';
import { FilterPanel } from './FilterPanel';

export interface FilterableDataTableProps<TData extends Record<string, any>> extends DataTableProps<TData> {
  showFilterPanel?: boolean;
  filterPanelTitle?: string;
}

export function FilterableDataTable<TData extends Record<string, any>>(
  props: FilterableDataTableProps<TData>
) {
  const {
    data,
    columns,
    showFilterPanel = true,
    filterPanelTitle,
    ...otherProps
  } = props;

  // Reference to the table instance, will be updated when the table is rendered
  const tableInstanceRef = React.useRef<any>(null);

  // Function to update the table instance reference
  const updateTableInstanceRef = (tableInstance: any) => {
    tableInstanceRef.current = tableInstance;
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
          <FilterPanel 
            columns={columns as any[]} 
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
          {...otherProps}
          onTableInstanceChange={updateTableInstanceRef}
        />
      </Box>
    </Box>
  );
} 