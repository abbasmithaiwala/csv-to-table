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
  SelectChangeEvent,
  TextField,
  Slider,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';

// Define the types for the filter panel props
interface FilterPanelProps {
  columns: any[];
  table: any;
  title?: string;
}

// Define the types of filters
const getFilterComponent = (columnType: string, column: any, columnInstance: any) => {
  // Determine column type based on first data item or specified filterVariant
  const filterValue = columnInstance.getFilterValue();
  
  // Handle text filters (default)
  if (columnType === 'text' || !columnType) {
    return (
      <TextField
        size="small"
        fullWidth
        label={column.header}
        value={filterValue || ''}
        onChange={(e) => columnInstance.setFilterValue(e.target.value)}
        variant="outlined"
      />
    );
  }
  
  // Handle select filters for categorical data
  if (columnType === 'select') {
    // Get unique values from the data for this column
    const uniqueValues = Array.from(
      new Set(
        columnInstance.getFacetedUniqueValues().keys()
      )
    ).filter(Boolean);
    
    return (
      <FormControl fullWidth size="small">
        <InputLabel>{column.header}</InputLabel>
        <Select
          value={filterValue || ''}
          label={column.header}
          onChange={(e) => columnInstance.setFilterValue(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
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
    const values = columnInstance.getFacetedMinMaxValues();
    const min = values?.[0] ?? 0;
    const max = values?.[1] ?? 100;
    
    return (
      <Box sx={{ px: 2, mt: 1 }}>
        <Typography variant="body2">{column.header}</Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            value={filterValue || [min, max]}
            onChange={(_, newValue) => columnInstance.setFilterValue(newValue)}
            valueLabelDisplay="auto"
            min={min}
            max={max}
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
      value={filterValue || ''}
      onChange={(e) => columnInstance.setFilterValue(e.target.value)}
      variant="outlined"
    />
  );
};

export const FilterPanel: React.FC<FilterPanelProps> = ({ columns, table, title = 'FILTER SETTING' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // State for group by selection
  const [groupBySelections, setGroupBySelections] = useState<string[]>([]);
  
  // State for active section (used on mobile)
  const [activeSection, setActiveSection] = useState<'filters' | 'columns'>('filters');
  
  // Get only filterable columns
  const filterableColumns = columns.filter(column => 
    column.enableColumnFilter !== false && column.accessorKey
  );

  // Check if table instance is available
  const isTableReady = !!table;

  // Handle adding a group by selection
  const handleAddGroupBy = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    if (value && !groupBySelections.includes(value)) {
      setGroupBySelections([...groupBySelections, value]);
    }
  };

  // Handle removing a group by selection
  const handleRemoveGroupBy = (value: string) => {
    setGroupBySelections(groupBySelections.filter(item => item !== value));
  };

  // Handle search button click
  const handleSearch = () => {
    // Apply any pending filters
    // The filters are already applied as they change, so this is mostly for UX
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // Handle save button click
  const handleSave = () => {
    if (!isTableReady) return;
    
    // Save filter state
    const filterState = table.getState().columnFilters;
    localStorage.setItem('tableFilters', JSON.stringify(filterState));
    alert('Filters saved successfully');
  };

  // Reset all filters
  const handleResetFilters = () => {
    if (!isTableReady) return;
    table.resetColumnFilters();
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
    
    // Otherwise try to determine from the data type
    const firstRow = table.getPrePaginationRowModel().rows[0];
    if (!firstRow) return 'text';
    
    const value = firstRow.getValue(column.accessorKey);
    
    if (typeof value === 'number') return 'range';
    if (typeof value === 'string') {
      // For strings, check if there are few unique values (categorical)
      const uniqueValues = new Set(
        table.getPrePaginationRowModel().rows.map(
          (row: any) => row.getValue(column.accessorKey)
        )
      );
      
      // If there are relatively few unique values compared to data size,
      // treat it as a categorical column with select filter
      if (uniqueValues.size <= 10 || uniqueValues.size <= table.getPrePaginationRowModel().rows.length * 0.2) {
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
      {/* Group By Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Group By
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
          <InputLabel>Grouping</InputLabel>
          <Select
            value=""
            label="Grouping"
            onChange={handleAddGroupBy}
          >
            {filterableColumns.map((column) => (
              <MenuItem 
                key={column.accessorKey}
                value={column.accessorKey}
                disabled={groupBySelections.includes(column.accessorKey)}
              >
                {column.header}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {groupBySelections.map((selection) => {
            const column = columns.find(col => col.accessorKey === selection);
            return (
              <Chip 
                key={selection}
                label={column?.header || selection}
                onDelete={() => handleRemoveGroupBy(selection)}
                size="small"
              />
            );
          })}
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Filters Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Filters
        </Typography>
        <IconButton 
          size="small" 
          onClick={handleResetFilters}
          title="Clear all filters"
          color="error"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <FormGroup sx={{ gap: 2 }}>
        {filterableColumns.map((column) => {
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
        {columns.map((column) => {
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