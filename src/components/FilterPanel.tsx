import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  TextField,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';

// Define the types for the filter panel props
interface FilterPanelProps {
  columns: any[];
  table: any;
  title?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ columns, table, title = 'FILTER SETTING' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // State for group by selection
  // const [groupBySelections, setGroupBySelections] = useState<string[]>([]);
  
  // State for active section (used on mobile)
  const [activeSection, setActiveSection] = useState<'filters' | 'columns'>('filters');
  
  // State to track filter values for UI rendering
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  
  // Get only filterable columns
  const filterableColumns = columns.filter(column => 
    column.enableColumnFilter !== false && 
    column.accessorKey
  );

  // Check if table instance is available
  const isTableReady = !!table;

  // Update local state when table filters change
  useEffect(() => {
    if (isTableReady) {
      const currentFilters = table.getState().columnFilters;
      const newFilterValues: Record<string, any> = {};
      
      // First set all values to empty/default
      filterableColumns.forEach(column => {
        // Initialize range filters with [min, max] by default
        if (column.filterVariant === 'range' || getFilterType(column) === 'range') {
          // We'll set proper min/max values when the component renders
          newFilterValues[column.accessorKey] = null;
        } else {
          newFilterValues[column.accessorKey] = '';
        }
      });
      
      // Then apply any active filters from the table state
      currentFilters.forEach((filter: any) => {
        newFilterValues[filter.id] = filter.value;
      });
      
      setFilterValues(newFilterValues);
    }
  }, [isTableReady, table, filterableColumns]);

  // Define the types of filters
  const getFilterComponent = (columnType: string, column: any, columnInstance: any) => {
    // Get filter value from our local state or from the column instance
    const columnId = column.accessorKey;
    const filterValue = filterValues[columnId] !== undefined 
      ? filterValues[columnId] 
      : columnInstance.getFilterValue();
    
    // Handle text filters (default)
    if (columnType === 'text' || !columnType) {
      return (
        <TextField
          size="small"
          fullWidth
          label={column.header}
          value={filterValue === undefined || filterValue === null ? '' : filterValue}
          onChange={(e) => {
            const newValue = e.target.value;
            // Update local state
            setFilterValues(prev => ({
              ...prev,
              [columnId]: newValue
            }));
            // Set the filter value
            columnInstance.setFilterValue(newValue);
            // Force immediate filtering
            table.getFilteredRowModel();
          }}
          variant="outlined"
        />
      );
    }
    
    // Handle select filters for categorical data
    if (columnType === 'select') {
      // Get unique values from the entire data set for this column
      let uniqueValues: any[] = [];
      
      if (isTableReady) {
        // Get all rows before any filtering
        const allRows = table.getCoreRowModel().rows;
        
        // Extract unique values from all rows for this column
        uniqueValues = Array.from(
          new Set(
            allRows.map((row: any) => row.getValue(column.accessorKey))
          )
        ).filter(Boolean).sort();
      }
      
      return (
        <FormControl fullWidth size="small">
          <InputLabel>{column.header}</InputLabel>
          <Select
            value={filterValue === undefined || filterValue === null ? '' : filterValue}
            label={column.header}
            onChange={(e) => {
              const newValue = e.target.value;
              // Update local state
              setFilterValues(prev => ({
                ...prev,
                [columnId]: newValue
              }));
              // Set the filter value
              columnInstance.setFilterValue(newValue);
              // Force immediate filtering
              table.getFilteredRowModel();
            }}
            displayEmpty
            renderValue={(selected) => {
              if (!selected) return <em>All</em>;
              return <Typography>{selected}</Typography>;
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 48 * 4.5,
                  width: 'auto',
                },
              },
            }}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {uniqueValues.map((value: any) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
    
    // Handle range filters for numeric data
    if (columnType === 'range') {
      // Get min and max values from the entire data set for this column
      let min = 0;
      let max = 100;
      
      if (isTableReady) {
        // Get all rows before any filtering
        const allRows = table.getCoreRowModel().rows;
        
        // Extract all values from this column
        const allValues = allRows
          .map((row: any) => row.getValue(column.accessorKey))
          .filter((val: any) => val !== null && val !== undefined);
        
        if (allValues.length > 0) {
          min = Math.min(...allValues);
          max = Math.max(...allValues);
        }
      }
      
      return (
        <Box sx={{ px: 2, mt: 1 }}>
          <Typography variant="body2">{column.header}</Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              value={filterValue || [min, max]}
              onChange={(_, newValue) => {
                // Update local state
                setFilterValues(prev => ({
                  ...prev,
                  [columnId]: newValue
                }));
                // Set the filter value
                columnInstance.setFilterValue(newValue);
                // Force immediate filtering
                table.getFilteredRowModel();
              }}
              valueLabelDisplay="auto"
              min={min}
              max={max}
              marks
              getAriaLabel={() => `${column.header} range`}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">{min}</Typography>
              <Typography variant="caption">{max}</Typography>
            </Box>
          </Box>
        </Box>
      );
    }
    
    // Default to text filter if no match
    return (
      <TextField
        size="small"
        fullWidth
        label={column.header}
        value={filterValue === undefined || filterValue === null ? '' : filterValue}
        onChange={(e) => {
          const newValue = e.target.value;
          // Update local state
          setFilterValues(prev => ({
            ...prev,
            [columnId]: newValue
          }));
          // Set the filter value
          columnInstance.setFilterValue(newValue);
          // Force immediate filtering
          table.getFilteredRowModel();
        }}
        variant="outlined"
      />
    );
  };

  // Load saved filters when the component mounts and table is ready
  useEffect(() => {
    if (isTableReady) {
      try {
        // We only need to apply filters here if they're not already applied via initialState
        // Check if any filters are already applied
        const currentFilters = table.getState().columnFilters;
        if (currentFilters && currentFilters.length > 0) {
          // Filters are already applied via initialState, so we don't need to do anything
          return;
        }
        
        const savedFilters = localStorage.getItem('tableFilters');
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters);
          // Apply saved filters to the table
          parsedFilters.forEach((filter: any) => {
            const column = table.getColumn(filter.id);
            if (column) {
              column.setFilterValue(filter.value);
            }
          });
        }
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, [isTableReady, table]);

  // Handle search button click
  const handleSearch = () => {
    if (isTableReady) {
      // Get current filters
      const currentFilters = table.getState().columnFilters;
      
      // Apply current filters (this should now be redundant since we filter immediately on change)
      // but keeping it ensures synchronization
      currentFilters.forEach((filter: any) => {
        const column = table.getColumn(filter.id);
        if (column) {
          column.setFilterValue(filter.value);
        }
      });
      
      // Force update the filtered model
      table.getFilteredRowModel();
    }
    
    // Close mobile drawer if needed
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // Handle save button click
  const handleSave = () => {
    if (!isTableReady) return;
    
    // Ensure filters are applied from our local state
    Object.entries(filterValues).forEach(([columnId, value]) => {
      const column = table.getColumn(columnId);
      if (column) {
        column.setFilterValue(value);
      }
    });
    
    // Save filter state
    const filterState = table.getState().columnFilters;
    localStorage.setItem('tableFilters', JSON.stringify(filterState));
    alert('Filters saved successfully');
  };

  // Reset all filters
  const handleResetFilters = () => {
    if (!isTableReady) return;
    
    // Clear all filters
    table.resetColumnFilters();
    
    // Clear local filter values state
    setFilterValues({});
    
    // Force immediate filtering to show all rows
    table.getFilteredRowModel();

    // Explicitly clear all column filter values in the table
    filterableColumns.forEach(column => {
      const columnInstance = table.getColumn(column.accessorKey);
      if (columnInstance) {
        columnInstance.setFilterValue('');
      }
    });
    
    // Remove from localStorage
    localStorage.removeItem('tableFilters');
  };

  // Toggle column visibility
  const handleToggleColumnVisibility = (column: any) => {
    if (!isTableReady) return;
    column.toggleVisibility();
  };

  // Determine filter type for each column
  const getFilterType = (column: any) => {
    if (!isTableReady) return 'text';
    
    // First check if the column has a specified filter variant
    if (column.filterVariant) return column.filterVariant;
    
    // Check if it's a specific column that should be a range filter (like age)
    const numericColumns = ['age', 'price', 'amount', 'quantity'];
    if (numericColumns.includes(column.accessorKey.toLowerCase())) {
      return 'range';
    }
    
    // Get all rows before any filtering
    const allRows = table.getCoreRowModel().rows;
    if (allRows.length === 0) return 'text';
    
    // Get value from first row to determine type
    const value = allRows[0].getValue(column.accessorKey);
    
    if (typeof value === 'number') return 'range';
    if (typeof value === 'string') {
      // For strings, check if there are few unique values (categorical)
      const uniqueValues = new Set(
        allRows.map((row: any) => row.getValue(column.accessorKey))
      );
      
      // If there are relatively few unique values compared to data size,
      // treat it as a categorical column with select filter
      if (uniqueValues.size <= 20 || uniqueValues.size <= allRows.length * 0.2) {
        return 'select';
      }
    }
    
    // Default to text
    return 'text';
  };

  // Loading/placeholder content when table is not ready
  const loadingContent = (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <CircularProgress size={24} />
      <Typography variant="body2" color="text.secondary">
        Loading filters...
      </Typography>
    </Box>
  );

  // Filters content
  const filtersContent = !isTableReady ? loadingContent : (
    <>
      <FormGroup sx={{ gap: 2 }}>
        {columns
          .filter(column => 
            column.enableColumnFilter !== false && 
            column.accessorKey
          )
          .map((column) => {
            // Get the column instance from the table
            const columnInstance = table.getColumn(column.accessorKey);
            
            if (!columnInstance) return null;
            
            // Determine the filter type
            const filterType = getFilterType(column);
            
            // Render the appropriate filter component
            return (
              <Box key={column.accessorKey} sx={{ mb: 2 }}>
                {getFilterComponent(filterType, column, columnInstance)}
              </Box>
            );
          })}
      </FormGroup>
    </>
  );

  // Column management content
  const columnsContent = !isTableReady ? loadingContent : (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Manage Columns
        </Typography>
        <IconButton 
          size="small" 
          onClick={() => table.resetColumnVisibility()}
          title="Reset column visibility"
        >
          <ViewColumnIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Columns to Print
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {columns
          .filter(column => column.accessorKey !== 'mrt-row-select')
          .map((column) => {
            const columnInstance = table.getColumn(column.accessorKey);
            if (!columnInstance) return null;
            
            const isVisible = columnInstance.getIsVisible();
            
            return (
              <Chip
                key={column.accessorKey}
                label={column.header}
                onClick={() => handleToggleColumnVisibility(columnInstance)}
                variant={isVisible ? "filled" : "outlined"}
                color={isVisible ? "primary" : "default"}
                size="small"
                sx={{ mb: 1 }}
              />
            );
          })}
      </Box>
    </>
  );

  // Combined content for the filter panel
  const filterContent = (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        <IconButton 
          onClick={handleResetFilters}
          title="Clear all filters"
          color="error"
          sx={{ fontSize: '15px' }}
          style={{ marginLeft: 'auto' }}
        >
          Clear
        </IconButton> 
        <Box>
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {!isTableReady ? (
        // Show loading state when table is not ready
        loadingContent
      ) : isMobile ? (
        // On mobile, use accordions for sections
        <>
          <Accordion
            expanded={activeSection === 'filters'}
            onChange={() => setActiveSection('filters')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {filtersContent}
            </AccordionDetails>
          </Accordion>
          
          <Accordion
            expanded={activeSection === 'columns'}
            onChange={() => setActiveSection('columns')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Columns</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {columnsContent}
            </AccordionDetails>
          </Accordion>
        </>
      ) : (
        // On desktop, show both sections
        <>
          {filtersContent}
          
          <Divider sx={{ my: 2 }} />
          
          {columnsContent}
        </>
      )}
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, gap: 1 }}>
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ flex: 1 }}
          color="secondary"
          disabled={!isTableReady}
        >
          Save
        </Button>
        <Button 
          variant="contained" 
          startIcon={<SearchIcon />}
          onClick={handleSearch}
          sx={{ flex: 1 }}
          color="primary"
          disabled={!isTableReady}
        >
          Search
        </Button>
      </Box>
    </Box>
  );

  // If mobile, render as a drawer
  if (isMobile) {
    return (
      <>
        <IconButton 
          onClick={() => setDrawerOpen(true)}
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16, 
            zIndex: 1000, 
            bgcolor: theme.palette.primary.main, 
            color: 'white',
            '&:hover': { bgcolor: theme.palette.primary.dark }
          }}
        >
          <FilterListIcon />
        </IconButton>
        
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box sx={{ width: 280 }}>
            {filterContent}
          </Box>
        </Drawer>
      </>
    );
  }

  // On desktop, render as a floating panel
  return (
    <Paper 
      elevation={3}
      sx={{
        width: 280,
        position: 'sticky',
        top: 16,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        mr: 2,
        borderRadius: 2,
      }}
    >
      {filterContent}
    </Paper>
  );
}; 