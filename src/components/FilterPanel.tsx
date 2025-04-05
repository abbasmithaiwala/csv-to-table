import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  FormGroup,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Autocomplete,
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
        // Initialize numeric filters with empty value
        if (column.filterVariant === 'range' || getFilterType(column) === 'range') {
          newFilterValues[column.accessorKey] = '';
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
          placeholder="Type to filter..."
          InputProps={{
            endAdornment: filterValue ? (
              <IconButton
                size="small"
                onClick={() => {
                  // Clear the filter
                  setFilterValues(prev => ({
                    ...prev,
                    [columnId]: ''
                  }));
                  columnInstance.setFilterValue('');
                  table.getFilteredRowModel();
                }}
                edge="end"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            ) : null
          }}
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
        <Autocomplete
          value={filterValue === undefined || filterValue === null ? null : filterValue}
          onChange={(_, newValue) => {
            // Update local state
            setFilterValues(prev => ({
              ...prev,
              [columnId]: newValue
            }));
            // Set the filter value - empty string is used to clear filter
            columnInstance.setFilterValue(newValue === null ? '' : newValue);
            // Force immediate filtering
            table.getFilteredRowModel();
          }}
          options={uniqueValues}
          renderInput={(params) => (
            <TextField
              {...params}
              label={column.header}
              fullWidth
              size="small"
              placeholder="Type or select a value"
            />
          )}
          size="small"
          fullWidth
          freeSolo
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          renderOption={(props, option) => (
            <li {...props}>
              {option}
            </li>
          )}
          disableClearable={false}
          filterOptions={(options, state) => {
            // Implement custom filtering for large lists
            if (state.inputValue === '') {
              return options.slice(0, 100); // Show first 100 options when input is empty
            }
            
            // Filter options by input value
            const filtered = options.filter(option => 
              option.toString().toLowerCase().includes(state.inputValue.toLowerCase())
            );
            return filtered.slice(0, 100); // Limit to 100 matching options
          }}
          ListboxProps={{
            style: { maxHeight: '200px' }
          }}
        />
      );
    }
    
    // Handle numeric filters (replacing range filters)
    if (columnType === 'range') {
      return (
        <TextField
          size="small"
          fullWidth
          label={`${column.header}`}
          type="number"
          value={filterValue === undefined || filterValue === null ? '' : filterValue}
          onChange={(e) => {
            const newValue = e.target.value === '' ? '' : Number(e.target.value);
            // Update local state
            setFilterValues(prev => ({
              ...prev,
              [columnId]: newValue
            }));
            // Set the filter value
            columnInstance.setFilterValue(newValue);
            // Ensure filter function is set to range
            if (column.filterFn !== 'range') {
              columnInstance.setFilterFn('range');
            }
            // Force immediate filtering
            table.getFilteredRowModel();
          }}
          variant="outlined"
          placeholder="Enter value"
          InputProps={{
            endAdornment: filterValue ? (
              <IconButton
                size="small"
                onClick={() => {
                  // Clear the filter
                  setFilterValues(prev => ({
                    ...prev,
                    [columnId]: ''
                  }));
                  columnInstance.setFilterValue('');
                  table.getFilteredRowModel();
                }}
                edge="end"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            ) : null,
            inputProps: { min: 0 }
          }}
          sx={{
            '& input[type=number]': {
              MozAppearance: 'textfield',
            },
            '& input[type=number]::-webkit-outer-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '& input[type=number]::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
          }}
        />
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
    
    // Check if it's a specific column that should be a numeric filter (like age)
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
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterListIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography>Filter Options</Typography>
              </Box>
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
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ViewColumnIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography>Column Visibility</Typography>
              </Box>
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