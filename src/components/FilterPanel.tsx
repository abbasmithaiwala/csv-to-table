import React, { useState, useMemo } from 'react';
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
import { type MRT_ColumnDef, type MRT_Column, type MRT_TableInstance } from 'material-react-table';

// Type for column filters
interface ColumnFilter {
  id: string;
  value: any;
}
interface FilterPanelProps<TData extends Record<string, any>> {
  columns: MRT_ColumnDef<TData>[];
  table: MRT_TableInstance<TData> | null;
  title?: string;
}

export const FilterPanel = <TData extends Record<string, any>>({
  columns,
  table,
  title = 'FILTER SETTING',
}: FilterPanelProps<TData>): React.ReactElement => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // State for active section (used on mobile)
  const [activeSection, setActiveSection] = useState<'filters' | 'columns'>('filters');
  
  // Check if table instance is available
  const isTableReady = !!table;
  
  // Get only filterable columns - memoized to prevent recalculation
  const filterableColumns = useMemo(() => 
    columns.filter(column => 
      column.enableColumnFilter !== false && 
      column.accessorKey
    ), 
    [columns]
  );

  // Determine filter type for each column - memoized to avoid recalculation
  const getFilterType = useMemo(() => {
    return (column: MRT_ColumnDef<TData>) => {
      if (!isTableReady || !table) return 'text';
      
      // First check if the column has a specified filter variant
      if (column.filterVariant) return column.filterVariant;
      
      // Check if it's a specific column that should be a numeric filter
      const numericColumns = ['age', 'price', 'amount', 'quantity'];
      if (typeof column.accessorKey === 'string' && numericColumns.includes(column.accessorKey.toLowerCase())) {
        return 'range';
      }
      
      // Get all rows before any filtering
      const allRows = table.getCoreRowModel().rows;
      if (allRows.length === 0) return 'text';
      
      // Get value from first row to determine type
      const accessorKey = column.accessorKey as string;
      const value = allRows[0].getValue(accessorKey);
      
      if (typeof value === 'number') return 'range';
      if (typeof value === 'string') {
        // For strings, check if there are few unique values (categorical)
        const uniqueValues = new Set(
          allRows.map(row => row.getValue(accessorKey))
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
  }, [isTableReady, table]);

  // Initialize column filter types - memoized to prevent recalculation
  const columnFilterTypes = useMemo(() => {
    if (!isTableReady || !table) return {};
    
    const types: Record<string, string> = {};
    filterableColumns.forEach(column => {
      if (typeof column.accessorKey === 'string') {
        types[column.accessorKey] = getFilterType(column);
      }
    });
    return types;
  }, [isTableReady, filterableColumns, getFilterType, table]);
  
  // Helper function to get current filter values from table state
  const getCurrentFilterValues = () => {
    if (!isTableReady || !table) return {};
    
    const currentFilters = table.getState().columnFilters;
    const newFilterValues: Record<string, any> = {};
    
    // First set all values to empty/default
    filterableColumns.forEach(column => {
      if (typeof column.accessorKey !== 'string') return;
      
      const filterType = columnFilterTypes[column.accessorKey] || 'text';
      if (filterType === 'range' || column.filterVariant === 'range') {
        newFilterValues[column.accessorKey] = '';
      } else if (filterType === 'select') {
        newFilterValues[column.accessorKey] = [];
      } else {
        newFilterValues[column.accessorKey] = '';
      }
    });
    
    // Then apply any active filters from the table state
    currentFilters.forEach((filter: ColumnFilter) => {
      newFilterValues[filter.id] = filter.value;
    });
    
    return newFilterValues;
  };

  // Initialize and update filter values based on current table state
  const [filterValues, setFilterValues] = useState<Record<string, any>>(() => {
    if (!isTableReady || !table) return {};
    
    // Load saved filters if no filters are already applied
    const currentFilters = table.getState().columnFilters;
    if (currentFilters.length === 0) {
      try {
        const savedFilters = localStorage.getItem('tableFilters');
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters);
          // Apply saved filters to the table
          parsedFilters.forEach((filter: ColumnFilter) => {
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
    
    // Initialize with current table filter state
    return getCurrentFilterValues();
  });
  
  // Function to update filter values from table state when needed
  const refreshFilterValues = () => {
    setFilterValues(getCurrentFilterValues());
  };

  // Handle search button click
  const handleSearch = () => {
    if (isTableReady && table) {
      // Get current filters
      const currentFilters = table.getState().columnFilters;
      
      // Apply current filters
      currentFilters.forEach((filter: ColumnFilter) => {
        const column = table.getColumn(filter.id);
        if (column) {
          column.setFilterValue(filter.value);
        }
      });
      
      // Force update the filtered model
      table.getFilteredRowModel();
      
      // Update local state with current filter values
      refreshFilterValues();
    }
    
    // Close mobile drawer if needed
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // Handle save button click
  const handleSave = () => {
    if (!isTableReady || !table) return;
    
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
    if (!isTableReady || !table) return;
    
    // First explicitly clear all column filter values in the table
    filterableColumns.forEach(column => {
      if (typeof column.accessorKey === 'string') {
        const columnInstance = table.getColumn(column.accessorKey);
        if (columnInstance) {
          columnInstance.setFilterValue('');
        }
      }
    });
    
    // Clear all filters in the table state
    table.resetColumnFilters();
    
    // Initialize empty filter values based on filter types
    const emptyFilterValues: Record<string, any> = {};
    filterableColumns.forEach(column => {
      if (typeof column.accessorKey !== 'string') return;
      
      const filterType = columnFilterTypes[column.accessorKey] || 'text';
      if (filterType === 'range' || column.filterVariant === 'range') {
        emptyFilterValues[column.accessorKey] = '';
      } else if (filterType === 'select') {
        emptyFilterValues[column.accessorKey] = [];
      } else {
        emptyFilterValues[column.accessorKey] = '';
      }
    });
    
    // Set the empty filter values
    setFilterValues(emptyFilterValues);
    
    // Force immediate filtering to show all rows
    table.getFilteredRowModel();
    
    // Remove from localStorage
    localStorage.removeItem('tableFilters');
  };

  // Toggle column visibility
  const handleToggleColumnVisibility = (column: MRT_Column<TData>) => {
    if (!isTableReady || !table) return;
    column.toggleVisibility();
  };

  // Define the types of filters
  const getFilterComponent = (columnType: string, column: MRT_ColumnDef<TData>, columnInstance: MRT_Column<TData>) => {
    if (typeof column.accessorKey !== 'string') return null;
    
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
          label={typeof column.header === 'string' ? column.header : String(column.accessorKey)}
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
            if (table) table.getFilteredRowModel();
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
                  if (table) table.getFilteredRowModel();
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
      
      if (isTableReady && table) {
        // Get all rows before any filtering
        const allRows = table.getCoreRowModel().rows;
        
        // Extract unique values from all rows for this column
        uniqueValues = Array.from(
          new Set(
            allRows.map(row => row.getValue(columnId))
          )
        ).filter(Boolean).sort();
      }
      
      return (
        <Autocomplete
          multiple
          value={Array.isArray(filterValue) ? filterValue : (filterValue ? [filterValue] : [])}
          onChange={(_, newValue) => {
            // Update local state
            setFilterValues(prev => ({
              ...prev,
              [columnId]: newValue
            }));
            // Set the filter value - empty string is used to clear filter
            columnInstance.setFilterValue(newValue === null ? '' : newValue);
            // Force immediate filtering
            if (table) table.getFilteredRowModel();
          }}
          options={uniqueValues}
          renderInput={(params) => (
            <TextField
              {...params}
              label={typeof column.header === 'string' ? column.header : String(column.accessorKey)}
              fullWidth
              size="small"
              placeholder="Select value(s)"
            />
          )}
          size="small"
          fullWidth
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          renderOption={(props, option) => {
            // Extract key from props and remove it from props that will be spread
            const { key, ...propsWithoutKey } = props;
            return (
              <li key={key || option} {...propsWithoutKey}>
                {option}
              </li>
            );
          }}
          disableCloseOnSelect
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
          label={typeof column.header === 'string' ? column.header : String(column.accessorKey)}
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
            // Force immediate filtering
            if (table) table.getFilteredRowModel();
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
                  if (table) table.getFilteredRowModel();
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
        label={typeof column.header === 'string' ? column.header : String(column.accessorKey)}
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
          if (table) table.getFilteredRowModel();
        }}
        variant="outlined"
      />
    );
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
  const filtersContent = !isTableReady || !table ? loadingContent : (
    <>
      <FormGroup sx={{ gap: 2 }}>
        {columns
          .filter(column => 
            column.enableColumnFilter !== false && 
            column.accessorKey
          )
          .map((column) => {
            // Get the column instance from the table
            if (typeof column.accessorKey !== 'string') return null;
            
            const columnInstance = table.getColumn(column.accessorKey);
            
            if (!columnInstance) return null;
            
            // Use cached filter type instead of recalculating
            const filterType = columnFilterTypes[column.accessorKey] || 'text';
            
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
  const columnsContent = !isTableReady || !table ? loadingContent : (
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
          .filter(column => typeof column.accessorKey === 'string' && column.accessorKey !== 'mrt-row-select')
          .map((column) => {
            if (typeof column.accessorKey !== 'string') return null;
            
            const columnInstance = table.getColumn(column.accessorKey);
            if (!columnInstance) return null;
            
            const isVisible = columnInstance.getIsVisible();
            
            return (
              <Chip
                key={column.accessorKey}
                label={typeof column.header === 'string' ? column.header : String(column.accessorKey)}
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
      
      {!isTableReady || !table ? (
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