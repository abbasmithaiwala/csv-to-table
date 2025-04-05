import { MRT_RowData } from "material-react-table";
import { TableData, TableColumn } from "../types";

/**
 * Creates a column definition for Material React Table
 * 
 * @param accessorKey The property key to access in the data
 * @param header The text to display in the header
 * @param options Additional column options
 * @returns TableColumn column definition
 */
export const createColumn = <T extends MRT_RowData>(
  accessorKey: keyof T & string,
  header: string,
  options: Partial<TableColumn<T>> = {}
): TableColumn<T> => ({
  accessorKey,
  header,
  ...options,
});

/**
 * Convert data from any source format to TableData format
 * 
 * @param data The source data array
 * @param idField Optional field to use as ID, defaults to creating auto-incremented IDs
 * @returns Array of TableData objects
 */
export const convertToTableData = <T extends Record<string, any>>(
  data: T[],
  idField?: keyof T
): TableData[] => {
  return data.map((item, index) => {
    const id = idField ? item[idField] : index + 1;
    return {
      id,
      ...item,
    };
  });
};

/**
 * Extract column definitions automatically from data
 * 
 * @param data Sample data to extract column definitions from
 * @param exclude Optional array of field names to exclude
 * @returns Array of TableColumn column definitions
 */
export const extractColumns = <T extends TableData>(
  data: T[],
  exclude: string[] = []
): TableColumn<T>[] => {
  if (!data.length) return [];
  
  const sample = data[0];
  return Object.keys(sample)
    .filter(key => !exclude.includes(key))
    .map(key => createColumn<T>(
      key as keyof T & string,
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
    ));
};

/**
 * Extract column definitions while preserving the order of fields
 * 
 * @param data Sample data to extract column definitions from
 * @param fields Array of field names in the desired order
 * @param exclude Optional array of field names to exclude
 * @returns Array of TableColumn column definitions in the same order as fields
 */
export const extractColumnsInOrder = <T extends TableData>(
  data: T[],
  fields: string[],
  exclude: string[] = []
): TableColumn<T>[] => {
  if (!data.length) return [];
  
  // Filter out excluded fields from the ordered fields array
  const orderedFields = fields.filter(field => !exclude.includes(field));
  
  // Create column definitions in the specified order
  return orderedFields.map(key => createColumn<T>(
    key as keyof T & string,
    key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
  ));
}; 