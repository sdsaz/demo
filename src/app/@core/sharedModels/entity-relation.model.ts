export interface EntityRelationComponentsModel {
    id: number;
    code?: string;
    customHeaderName?: string;
    deleteDataSourceID?: number;
    description?: string;
    displayOrder?: number;
    formColumnSettings?: string;
    fromEntityTypeID: number;
    insertDataSourceID?: number;
    listColumnSettings?: string;
    columnSettings?: any;
    formLayoutSettings?: FormLayout;
    listDataSourceID?: number;
    name?: string;
    selectDataSourceID?: number;
    tenantID: number;
    toEntityTypeDatasourceID?: number;
    toEntityTypeID: number;
    updateDataSourceID?: number;
    isReverseRelation: boolean;
    toTenantID?: number;
}

export interface FormLayout {
    optionsForParentFormDialog: OptionsForFormDialog;
    optionsForFormDialog: OptionsForFormDialog;
    permission?: Permission;
    messages: Messages;
    panelGroup: FormPanelGroup[];
}

export interface FormPanelGroup {
    groupTitle?: string;
    controls: FormControls[];
}

export interface FormControls {
    fieldName?: string;
    labelName?: string;
    fieldType?: string;
    className?: string;
    loadCustomFields?: boolean;
    dataSourceId?: number;
    optionJSON?: OptionJSON[];
    validators: Validators[];
}

export interface Permission {
    addPermission?: string;
}

export interface Validators {
    type: string;
    message: string;
    value: any;
}

export interface OptionsForFormDialog {
    size?: string;
}

export interface Messages {
    titleHeader?: string;
}

export interface OptionJSON {
    value: any;
    label: string;
}