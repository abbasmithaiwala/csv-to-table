import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import { FilterableDataTable } from '../components/FilterableDataTable';
import { TableColumn, TableData } from '../types';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from 'react-router-dom';

export const Index: React.FC = () => {
  const navigate = useNavigate();
  const [storedData, setStoredData] = useState<TableData[] | null>(null);
  const [storedColumns, setStoredColumns] = useState<TableColumn[] | null>(null);

  // Load data from localStorage if available
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('tableData');
      const savedColumns = localStorage.getItem('tableColumns');
      
      if (savedData && savedColumns) {
        setStoredData(JSON.parse(savedData));
        setStoredColumns(JSON.parse(savedColumns));
      } else {
        // Redirect to upload page if no data is available
        window.location.href = '/upload';
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      // Redirect to upload page if there's an error loading data
      window.location.href = '/upload';
    }
  }, [navigate]);

  // Clear stored data and navigate to upload page
  const handleClearData = () => {
    localStorage.removeItem('tableData');
    localStorage.removeItem('tableColumns');
    localStorage.removeItem('tableFilters');
    window.location.href = '/upload';
  };
  
  // If no data is available, show nothing (will redirect to upload)
  if (!storedData || !storedColumns) {
    return null;
  }
  
  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
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
          Using uploaded data: {storedData.length} rows
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
            onClick={() => window.location.href = '/upload'}
          >
            Upload New Data
          </Button>
        </Stack>
      </Paper>

      <FilterableDataTable 
        data={storedData}
        columns={storedColumns}
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
                Uploaded Data
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