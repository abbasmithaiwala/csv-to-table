import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { TableColumn, TableData } from '../types';
import { createColumn, convertToTableData, extractColumns } from './tableUtils';

interface ParsedResult {
  data: TableData[];
  columns: TableColumn[];
}

/**
 * Parse a CSV or Excel file and return the data and columns
 * @param file The file to parse
 * @returns Promise with ParsedResult containing data and columns
 */
export const parseFileToData = async (file: File): Promise<ParsedResult> => {
  if (file.name.toLowerCase().endsWith('.csv')) {
    return parseCSV(file);
  } else if (
    file.name.toLowerCase().endsWith('.xlsx') ||
    file.name.toLowerCase().endsWith('.xls')
  ) {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
  }
};

/**
 * Parse a CSV file using PapaParse
 * @param file The CSV file to parse
 * @returns Promise with ParsedResult containing data and columns
 */
const parseCSV = (file: File): Promise<ParsedResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true, // Automatically convert strings to numbers/booleans when possible
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Convert the data to TableData format with proper type casting
          const parsedData = results.data as Record<string, any>[];
          const data = convertToTableData(parsedData);
          
          // Extract columns from the data
          const columns = extractColumns(data, ['id']);
          
          resolve({ data, columns });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`Error parsing CSV: ${error.message}`));
      },
    });
  });
};

/**
 * Parse an Excel file using SheetJS
 * @param file The Excel file to parse
 * @returns Promise with ParsedResult containing data and columns
 */
const parseExcel = async (file: File): Promise<ParsedResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Failed to read file');
        }
        
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with proper type casting
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
        
        // Convert to TableData format
        const tableData = convertToTableData(jsonData);
        
        // Extract columns
        const columns = extractColumns(tableData, ['id']);
        
        resolve({ data: tableData, columns });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsBinaryString(file);
  });
}; 