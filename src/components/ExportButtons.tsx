// import React from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MRT_TableInstance, MRT_ColumnDef, MRT_Row } from 'material-react-table';

interface ExportButtonsProps<TData extends Record<string, any>> {
  table: MRT_TableInstance<TData>;
  columns: MRT_ColumnDef<TData>[];
}

export const ExportButtons = <TData extends Record<string, any>>({ 
  table, 
  columns 
}: ExportButtonsProps<TData>) => {
  // Handle exporting rows to PDF
  const handleExportRows = (rows: MRT_Row<TData>[]) => {
    const doc = new jsPDF();
    const tableData = rows.map((row) => {
      const dataRow: any[] = [];
      // Only include visible columns
      columns.forEach((column) => {
        if (column.accessorKey && table.getColumn(column.accessorKey)?.getIsVisible()) {
          const value = row.getValue(column.accessorKey as string);
          dataRow.push(value);
        }
      });
      return dataRow;
    });

    // Get headers from visible columns
    const tableHeaders = columns
      .filter(
        (column) => 
          column.accessorKey && 
          table.getColumn(column.accessorKey)?.getIsVisible()
      )
      .map((column) => column.header);

    // Add title to the PDF
    const title = 'Data Export';
    doc.setFontSize(15);
    doc.text(title, 14, 15);
    doc.setFontSize(10);

    // Get the current date
    const date = new Date().toLocaleDateString();
    doc.text(`Export Date: ${date}`, 14, 23);

    // Add the table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      margin: { top: 30 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left',
      },
      headStyles: {
        fillColor: [71, 71, 71],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
    });

    // Save the PDF
    doc.save(`table-export-${date}.pdf`);
  };

  // Get selected rows or filtered rows if none selected
  const exportRowsHandler = () => {
    // Check if any rows are selected
    const hasSelectedRows = table.getIsSomeRowsSelected() || table.getIsAllRowsSelected();
    
    // If rows are selected, export only those rows
    if (hasSelectedRows) {
      handleExportRows(table.getSelectedRowModel().rows);
    } else {
      // Otherwise export all filtered rows
      handleExportRows(table.getFilteredRowModel().rows as MRT_Row<TData>[]);
    }
  };

  // Get tooltip text based on selection state
  const getTooltipText = () => {
    const hasSelectedRows = table.getIsSomeRowsSelected() || table.getIsAllRowsSelected();
    return hasSelectedRows 
      ? 'Export selected rows to PDF' 
      : 'Export all filtered rows to PDF';
  };

  return (
    <Box sx={{ display: 'flex', gap: '16px', p: '8px' }}>
      <Tooltip title={getTooltipText()}>
        <Button
          onClick={exportRowsHandler}
          startIcon={<FileDownloadIcon />}
          variant="contained"
          color="primary"
          disabled={table.getFilteredRowModel().rows.length === 0}
        >
          Export to PDF
        </Button>
      </Tooltip>
    </Box>
  );
}; 