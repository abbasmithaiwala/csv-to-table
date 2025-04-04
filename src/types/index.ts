import { MRT_ColumnDef, MRT_RowData } from "material-react-table";

export interface TableData extends MRT_RowData {
  id: string | number;
  [key: string]: any;
}

export type TableColumn<T extends MRT_RowData = TableData> = MRT_ColumnDef<T>; 