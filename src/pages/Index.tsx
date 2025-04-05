import React, { useMemo, useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import { FilterableDataTable } from '../components/FilterableDataTable';
import { TableColumn, TableData } from '../types';
import { createMockPersonData } from '../utils/mockData';
import { createColumn } from '../utils/tableUtils';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from 'react-router-dom';

export const Index: React.FC = () => {
  const navigate = useNavigate();
  const [storedData, setStoredData] = useState<TableData[] | null>(null);
  const [storedColumns, setStoredColumns] = useState<TableColumn[] | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(true);

  // Load data from localStorage if available
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('tableData');
      const savedColumns = localStorage.getItem('tableColumns');
      
      if (savedData && savedColumns) {
        setStoredData(JSON.parse(savedData));
        setStoredColumns(JSON.parse(savedColumns));
        setIsUsingMockData(false);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Generate mock data if no stored data
  const mockData = useMemo(() => createMockPersonData(100), []);
  
  // Define mock columns
  const mockColumns = useMemo<TableColumn[]>(() => [
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
      filterVariant: 'range',
      filterFn: 'range',
    }),
    createColumn('city', 'City', { 
      enableColumnFilter: true,
    }),
    createColumn('state', 'State', { 
      enableColumnFilter: true,
    }),
  ], []);

  // Use stored data or mock data
  const data = storedData || mockData;
  const columns = storedColumns || mockColumns;
  
  // Clear stored data and reload page
  const handleClearData = () => {
    localStorage.removeItem('tableData');
    localStorage.removeItem('tableColumns');
    window.location.reload();
  };
  
  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {isUsingMockData ? (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}
        >
          <Typography variant="body1">
            Currently using mock data. Upload a CSV or Excel file to see your own data.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={() => navigate('/upload')}
          >
            Upload Data
          </Button>
        </Paper>
      ) : (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}
        >
          <Typography variant="body1">
            Using uploaded data: {data.length} rows
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              onClick={handleClearData}
            >
              Reset Data
            </Button>
            <Button 
              variant="contained" 
              startIcon={<UploadFileIcon />}
              onClick={() => navigate('/upload')}
            >
              Upload New Data
            </Button>
          </Stack>
        </Paper>
      )}

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
                {isUsingMockData ? 'Personnel Data' : 'Uploaded Data'}
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