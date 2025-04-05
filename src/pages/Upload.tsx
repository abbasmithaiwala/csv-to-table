import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import TableViewIcon from '@mui/icons-material/TableView';
import { parseFileToData } from '../utils/fileParser';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileType = file.name.toLowerCase().endsWith('.csv') 
      ? 'csv' 
      : file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls') 
        ? 'excel' 
        : null;

    if (!fileType) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    setError(null);
    setIsLoading(true);
    setFileInfo({
      name: file.name,
      size: file.size,
      type: fileType,
    });

    try {
      // Parse the file and set the data in localStorage
      const parsedData = await parseFileToData(file);

      // Store the data in localStorage to be accessed by the Index page
      localStorage.setItem('tableData', JSON.stringify(parsedData.data));
      localStorage.setItem('tableColumns', JSON.stringify(parsedData.columns));

      // Navigate to the index page
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  }, [navigate]);

  return (
    <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Upload Data File
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Stack spacing={2} direction="column" alignItems="center">
            <Box sx={{ 
              border: '2px dashed #ccc', 
              borderRadius: 2, 
              p: 5, 
              width: '100%',
              backgroundColor: 'rgba(0,0,0,0.02)',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderColor: 'primary.main',
              }
            }}>
              <input
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<FileUploadIcon />}
                  disabled={isLoading}
                  size="large"
                >
                  Select File
                </Button>
              </label>
              
              <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                Supported formats: CSV, Excel (.xlsx, .xls)
              </Typography>
            </Box>

            {fileInfo && (
              <Paper variant="outlined" sx={{ p: 2, width: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>File selected:</strong> {fileInfo.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Size:</strong> {(fileInfo.size / 1024).toFixed(2)} KB
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {fileInfo.type.toUpperCase()}
                </Typography>
              </Paper>
            )}

            {isLoading && (
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Processing file...
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                <AlertTitle>Error</AlertTitle>
                {error}
              </Alert>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<TableViewIcon />}
            onClick={() => window.location.href = '/'}
            disabled={isLoading}
          >
            Go to Data Table
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Upload; 