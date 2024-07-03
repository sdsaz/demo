import { DynamicTableColumnType } from "../enum";

declare interface DynamicTableColumnPermission {
    permission: string;
}

export interface DynamicTableColumnLink extends DynamicTableColumnPermission {
    url: string;
    params: Array<string>;
}

export interface DynamicTableColumnPerson extends DynamicTableColumnPermission {
    avatar: string;
    image: string;
}

export interface DynamicTableColumn {
    field: string;
    header: string;
    type: DynamicTableColumnType;
    link: DynamicTableColumnLink,
    hiddenFieldName: string;
    person: DynamicTableColumnPerson;
    sortable: string;
    visibilityExpression: string;
    isVisible?: boolean;
    style: { [key: string]: string };
}

export interface DynamicTableAction {

}

export interface DynamicTableColumnSchema {
    totalRecordsKey: string;
    fields?: Array<DynamicTableColumn>;
    actions?: Array<DynamicTableAction>
}

export interface DynamicTableFormControlSchema { }

export interface DynamicTableDataSource {
    code?: string;
    name?: string;
    listDatasourceRecordKey?: string;
    listColumnSettings?: string;
    columnSchema?: DynamicTableColumnSchema;
    selectDatasourceRecordKey?: string;
    insertDatasourceRecordKey?: string;
    updateDatasourceRecordKey?: string;
    deleteDatasourceRecordKey?: string;
    formColumnSettings?: string;
    formControlSchema?: DynamicTableColumnSchema;
    data?: Array<any>;
}

export interface DynamicTableParameter {
    name: string;
    type: string;
    value: any
}