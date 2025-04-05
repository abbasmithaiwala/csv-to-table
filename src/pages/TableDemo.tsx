import React, { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { FilterableDataTable } from '../components/FilterableDataTable';
import { TableColumn, TableData } from '../types';
import { createMockPersonData } from '../utils/mockData';
import { createColumn } from '../utils/tableUtils';

export const TableDemo: React.FC = () => {
  // Generate mock data
  const data = useMemo(() => createMockPersonData(100), []);
  
  // Define columns
  const columns = useMemo<TableColumn[]>(() => [
    createColumn('firstName', 'First Name', { 
      enableSorting: true,
      enableColumnFilter: true,
    }),
    createColumn('lastName', 'Last Name', { 
      enableSorting: true,
      enableColumnFilter: true,
    }),
    createColumn('email', 'Email', { 
      enableSorting: true,
      enableColumnFilter: true,
      size: 250,
    }),
    createColumn('age', 'Age', { 
      enableSorting: true,
      enableColumnFilter: true,
    }),
    createColumn('city', 'City', { 
      enableColumnFilter: true,
    }),
    createColumn('state', 'State', { 
      enableColumnFilter: true,
    }),
  ], []);
  
  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* <Typography variant="h4" sx={{ mb: 3 }}>
        Personnel Data Table
      </Typography> */}

      <FilterableDataTable 
        data={data}
        columns={columns}
        enableRowSelection
        enableColumnFilters
        enableGlobalFilter
        enablePagination
        enableDensityToggle
        enableFullScreenToggle
        enableColumnResizing
        filterPanelTitle="Filters"
        renderTopToolbarCustomActions={({ table }) => {
          const selectedRows = table.getSelectedRowModel().rows;
          return (
            <Box sx={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                Personnel Data
              </Typography>
              
              <Button
                variant="contained" 
                color="primary"
                disabled={!selectedRows.length}
                onClick={() => {
                  const exportData = selectedRows.map((row: any) => row.original);
                  console.log('Selected Rows:', exportData);
                  alert(`Selected ${selectedRows.length} rows.`);
                }}
                size="small"
              >
                Export ({selectedRows.length})
              </Button>
            </Box>
          );
        }}
      />
    </Box>
  );
}; 