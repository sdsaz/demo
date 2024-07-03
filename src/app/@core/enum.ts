export enum Entity {
    Tenant = 0,
    Users = 1,
    Roles = 2,
    PermissionSets = 3,
    UserRoles = 4,
    RolePermissionSets = 5,
    PermissionSetPermissions = 6,
    Accounts = 7,
    Contacts = 8,
    Campaigns = 48,
    Newsletters = 49,
    Events = 9,
    Notes = 10,
    Tasks = 11,
    Files = 12,
    EntityTagCategories = 13,
    EntityTags = 14,
    EntityTagTracking = 15,
    WorkTasks = 16,
    Resources = 17,
    EntityWorkflows = 25,
    Products = 29,
    ProductCategories = 30,
    ProductSkus = 32,
    ActivityStream = 9999,
    Orders = 36,
    Opportunities = 59,
    PriceBooks = 57,
    PriceBookItems = 58,
    EntityRelation = 61,
    Cases = 62,
    EntityReviews = 9998
}

export class ReferenceType {
    id: number;
    refType: string;
    name: string;
    intValue1: number;
    intValue2: string;
    strValue1: string;
    strValue2: string;
}

export enum TeamMemberRoleRefType {
    Owner = 1,
}

export enum EntityTimespan {
    AllTime = 1,
    Today = 2,
    ThisWeek = 3,
    Last7Days = 4,
    Last30Days = 5,
    ThisMonth = 6
}

export enum AppointmentTimespan {
    AllTime = 1,
    Last7Days = 2,
    Next7Days = 3,
    Last30Days = 4
}

export enum ActivityTimespan {
    LAST7DAYS = 'LAST7DAYS',
    NEXT7DAYS = 'NEXT7DAYS',
    LAST30DAYS = 'LAST30DAYS',
    ALLTIME = 'ALLTIME'
}

export enum RefType {
    Gender = 'Gender',
    EntityTimespan = 'EntityTimespan',
    ContactType = 'ContactType',
    WidgetTimespan = 'WidgetTimespan',
    TagShapes = 'TagShapes',
    TaskType = 'TaskType',
    TaskStatus = 'TaskStatus',
    ActivityTimespan = 'ActivityTimespan',
    EventStatus = 'EventStatus',
    EntityRequest = 'EntityRequest',
    EntityRequestStatus = 'EntityRequestStatus',
    TeamUserRoles = 'TeamUserRoles',
    WidgetDisplayType = 'WidgetDisplayType',
    DiscountType = 'DiscountType',
    WorkTaskRelationType = 'WorkTaskRelationType',
    NewsletterToken = 'NewsletterToken',
    LeadSource = 'LeadSource',
    WorkTaskReason = 'WorkTaskReason',
    AccountType = 'AccountType',
    UOMType = 'UOMType',
    NotificationType = 'NotificationType',
    ReminderTimespan = 'ReminderTimespan',
    NotificationStatus = 'NotificationStatus',
    Priority = 'Priority',
    Severity = 'Severity',
    PrivacyLevels = 'PrivacyLevel'
}

export enum EventStatus {
    Pending = 1,
    Completed = 2,
    Canceled = 3,
    NotSure = 4,
    Rescheduled = 5
}

export enum TaskStatus {
    Pending = 1,
    Started = 2,
    Completed = 3,
    Canceled = 4
}

export enum AccountType {
    Lead = 1,
    Prospect = 2,
    Client = 3
}

export enum ContactTypes {
    Lead = 1,
    Prospect = 2,
    Client = 3
}

export enum DurationTimespan {
    LASTWEEK = 'LASTWEEK',
    LAST4WEEKS = 'LAST4WEEKS',
    LAST30DAYS = 'LAST4WEEKS',
    THISMONTH = 'THISMONTH',
    LASTMONTH = 'LASTMONTH',
    THISYEAR = 'THISYEAR'
}

export enum KanbanBoardTokenTypes {
    Text,
    Link,
    Email,
    Phone,
    Currency,
}

export enum DataSources {
    WORKTASKASSIGNEDTO = 'WORKTASK_ASSIGNED_TO',
    WORKTASKENTITYTYPES = 'WORKTASK_ENTITY_TYPES',
    WORKTASKRELATEDENTITIES = 'WORKTASK_RELATED_ENTITIES',
    ADDWORKTASKRELATEDENTITIES = 'ADD_WORKTASK_RELATED_ENTITIES',
    TEAMPARENTTEAMS = 'TEAM_PARENT_TEAMS',
    TEAMOWNERS = 'TEAM_OWNERS',
    TEAMMEMBERS = 'TEAM_MEMBERS',
    EVENTASSIGNEDTO = 'EVENT_ASSIGNED_TO',
    EVENTATTENDEES =  'EVENT_ATTENDEES',
    WORKFLOWTEAMS = 'WORKFLOW_TEAMS',
    WORKFLOWSTAGETEAMSMEMBERS = 'WORKFLOW_STAGE_TEAMS_MEMBERS',
    ACCOUNTTYPE = 'ADD_ACCOUNT_TYPE',
    CONTACTTYPE = 'ADD_CONTACT_TYPE',
    DOCUMENTTYPE = 'ADD_DOCUMENT_TYPE',
    PRODUCTTYPE = 'ADD_PRODUCT_TYPE',
    ENTITYSTAGES = 'ADD_ENTITYSTAGES',
    ACCOUNTASSIGNEDTO = 'ACCOUNT_ASSIGNED_TO',
    ACCOUNTRELATEDENTITIES = 'ACCOUNT_RELATED_ENTITIES',
    PRIORITY = 'ADD_PRIORITY',
    SEVERITY = 'ADD_SEVERITY',
    ADDACCOUNTCONTACTS = 'ADD_ACCOUNT_CONTACTS',
    ADDPRODUCTPRODUCTCATEGORY = 'ADD_PRODUCT_PRODUCT_CATEGORY',
    ADDPRODUCTCATEGORY = 'ADD_PRODUCT_CATEGORY',
    ENTITYSTAGEREASONS = 'ENTITY_STAGE_REASONS',
    ADDPRODUCTSFORPRODUCTCATEGORY = 'ADD_PRODUCTS_FOR_PRODUCTCATEGORY',
    ADDORDERCONTACT = "ADD_ORDER_CONTACT",
    ADDORDERACCOUNT = 'ADD_ORDER_ACCOUNT',
    RELATEDENTITYRELATIONS = 'RELATED_ENTITY_RELATIONS',
    WIDGETSIZE = 'WIDGET_SIZE',
    ORDERTYPE = 'ORDER_TYPE',
    ADDPRODUCTORDERITEM = 'ADD_PRODUCT_ORDER_ITEM',
    WORKFLOWBYENTITYTYPEID = 'WORKFLOW_BY_ENTITYTYPEID',
    AVAILABLEWORKTASKSFORLINK = 'AVAILABLE_WORK_TASKS_FOR_LINK',
    ENTITYPAUSEREASONS = 'ENTITY_PAUSE_REASONS',
    ENTITYWORKFLOWSTAGES = 'ENTITY_WORKFLOW_STAGES',
    ENTITYSTAGETYPES = 'ENTITY_STAGE_TYPES',
    ENTITYSTAGESBYWORKFLOWID='ENTITY_STAGES_BY_WORKFLOW_ID',
    WORKTASKVERIFIEDBY = 'WORKTASK_VERIFIED_BY',
    AVAILABLEPRODUCTSFORACCOUNT = 'AVAILABLE_PRODUCTS_FOR_ACCOUNT',
    ACCOUNTRELATEDPRODUCTS = 'ACCOUNT_RELATED_PRODUCTS',
    SMTPFROMEMAIL = 'SMTP_FROM_EMAIL',
    ADDCAMPAIGNSNEWSLETTER = 'ADD_CAMPAIGNS_NEWSLETTER',
    AVAILABLENEWSLETTERSFORCAMPAIGN = 'AVAILABLE_NEWSLETTERS_FOR_CAMPAIGN',
    CAMPAIGNRELATEDNEWSLETTERS = 'CAMPAIGN_RELATED_NEWSLETTERS',
    FILESUBTYPE = 'FILE_SUB_TYPE',
    CAMPAIGNRECIPIENTS = 'CAMPAIGN_RECIPIENTS',
    PRODUCTASSIGNEDTO = 'PRODUCT_ASSIGNED_TO',
    CONTACTASSIGNEDTO = 'CONTACT_ASSIGNED_TO',
    ORDERASSIGNEDTO = 'ORDER_ASSIGNED_TO',
    PRODUCTSKU = 'PRODUCT_SKU',
    OPPORTUNITYASSIGNEDTO = 'OPPORTUNITY_ASSIGNED_TO',
    OPPORTUNITYRELATEDENTITIES = 'OPPORTUNITY_RELATED_ENTITIES',
    OPPORTUNITYOWNERS = "OPPORTUNITY_OWNERS",
    OPPORTUNITYAPPROVERS = "OPPORTUNITY_APPROVERS",
    OPPORTUNITYCOMPLETEDBYUSERS = "OPPORTUNITY_COMPLETEDBYUSERS",
    ALLWORKTASKASSIGNEDTO = 'ALL_WORKTASK_ASSIGNED_TO',
    ALLWORKTASKVERIFIEDBY = 'ALL_WORKTASK_VERIFIED_BY',
    PRICEBOOKS = 'PRICEBOOKS',
    STATESBYCOUNTRY = 'STATES_BY_COUNTRY',
    UOM_TYPES = 'UOM_TYPES',
    CASEASSIGNEDTO = 'CASE_ASSIGNED_TO',
    CASEVERIFIEDBY = 'CASE_VERIFIED_BY',
    CASERELATEDENTITIES='CASE_RELATED_ENTITIES',
    ALLOPPORTUNITYASSIGNEDTO = 'ALL_OPPORTUNITY_ASSIGNED_TO',
    ALLCASEVERIFIEDBY = "ALL_CASE_VERIFIED_BY",
    ALLCASEASSIGNEDTO = 'ALL_CASE_ASSIGNED_TO',
    ALLORDERASSOGNTO = "ALL_ORDER_ASSIGNED_TO",
    ALL_RELATED_ENTITIES = 'ALL_RELATED_ENTITIES',
    USERPROFILEDETAIL = 'USER_PROFILE_DETAIL',
    AVERAGERATINGFORENTITIES = 'AVERAGE_RATING_FOR_ENTITIES',
    STAGE_TEAM_OWNER_DETAIL = 'STAGE_TEAM_OWNER_DETAIL',
    ENTITY_WORK_TASK = 'ENTITY_WORK_TASKS',
    ENTITY_SUB_WORK_TASK = 'SUB_WORK_TASKS',
    ALLAPPOINTMENTOWNER = 'ALL_APPOINTMENT_OWNER',
    GETALLPRODUCT = 'GET_ALL_PRODUCT'
}

export enum DataSourceParams {
    SearchString = 'SearchString',
    EntityIDs = 'EntityIDs',
    EntityID = 'EntityID',
    EntityTypeID = 'EntityTypeID',
    EntityRecordTypeID = 'EntityRecordTypeID',
}

export enum DynamicTableColumnType {
    key,
    hidden,
    text,
    link,
    multiline,
    phone,
    email,
    person,
    currency,
    action,
    percentage,
    download,
    numeric,
    datetime,
    duration,
    workingduration,
    dateTimePeriodAgo,
    badge,
    bookmark
}

export enum PublicTenantSettings {
    CURRENCY_SYMBOL = 'CURRENCY_SYMBOL',
    HOURS_IN_DAY = 'HOURS_IN_DAY',
    PRODUCT_IMAGE_TYPES = 'PRODUCT_IMAGE_TYPES',
    VISIBLE_PRODUCT_TYPES = 'VISIBLE_PRODUCT_TYPES',
    PRODUCT_IMAGE_SIZE = 'PRODUCT_IMAGE_SIZE',
    MAXIMUM_PRODUCT_IMAGES = 'MAXIMUM_PRODUCT_IMAGES',
    ALLOW_TASK_COMPLETE = 'ALLOW_TASK_COMPLETE',
    MISC_TASK_MIN_TIME = 'MISC_TASK_MIN_TIME',
    MISC_TASK_MAX_TIME = 'MISC_TASK_MAX_TIME',
    DEFAULT_WORKTASK_PRIVACY_LEVEL = "DEFAULT_WORKTASK_PRIVACY_LEVEL",
    DEFAULT_CASE_PRIVACY_LEVEL = "DEFAULT_CASE_PRIVACY_LEVEL",

    //Tab Settings
    ACCOUNT_TAB_LAYOUT = 'ACCOUNT_TAB_LAYOUT',
    CONTACT_TAB_LAYOUT = 'CONTACT_TAB_LAYOUT',
    PRODUCT_CATEGORY_TAB_LAYOUT = 'PRODUCT_CATEGORY_TAB_LAYOUT',
    PRODUCT_TAB_LAYOUT = 'PRODUCT_TAB_LAYOUT',
    PRODUCTSKU_TAB_LAYOUT = 'PRODUCTSKU_TAB_LAYOUT',
    WORKTASK_TAB_LAYOUT = 'WORKTASK_TAB_LAYOUT',
    ORDER_TAB_LAYOUT = 'ORDER_TAB_LAYOUT',
    CAMPAIGN_TAB_LAYOUT = 'CAMPAIGN_TAB_LAYOUT',
    NEWSLETTER_TAB_LAYOUT = 'NEWSLETTER_TAB_LAYOUT',
    PRICEBOOK_TAB_LAYOUT = 'PRICEBOOK_TAB_LAYOUT',
    OPPORTUNITY_TAB_LAYOUT = 'OPPORTUNITY_TAB_LAYOUT',
    CASES_TAB_LAYOUT = 'CASES_TAB_LAYOUT',
    APPOINTMENT_TAB_LAYOUT = 'APPOINTMENT_TAB_LAYOUT'
}

export enum EntityRecordTypeCode {
    PRODUCT_IMAGES = 'PRODUCT_IMAGES'
}


export enum TabLayoutType {
    LABEL_ADDITIONAL_TAB = 'Additional Tabs',
    DEFAULT = 'Default',
    ADDITIONAL_TAB = 'Additional Tab',
}

export enum FieldTypesFromReferenceType {
    TEXTBOX = 1,
    MULTISELECT = 2,
    DROPDOWN = 3,
    RADIOGROUP = 4,
    CHECKBOX = 5,
    NUMBER = 6
}

export enum ContactType {
    Owner = "OWNER"
}

export enum Tenants {
    SDS = 1,
    Stenson_Tamaddon = 2,
    RPMP = 3,
    Sonoran = 4,
    Synergi = 5,
    Heritage = 6
}

export enum Actions {
    Add,
    Edit,
    BulkEdit,
    InActive,
    Delete
}

export enum Week {
    Sunday = '0',
    Monday = '1',
    Tuesday = '2',
    Wednessday = '3',
    Thursday = '4',
    Friday = '5',
    Saturday = '6'
}

export enum ProcessEntityWorkflowStageValueNoteType {
    StageNote = 1,
    PauseNote = 2
}

export enum DownloadFileMimeType {
    Excel = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64",
    Csv = "text/csv"
}




export enum LocalStorageKey {
    LocalStorageHash = "LOCALSTORAGEHASH",
    SidebarStateKey = "SIDEBAR_STATE",
    ActivityStateKey = "ACTIVITY_STATE",
    Filters_AccountListingKey = 'FILTERS_ACCOUNT_LISTING',
    LoginUserSessionToken = "LOGGED_USER_SESSION_TOKEN",
    LocaleLang = "LOCAL_LANG",
    DisplayEntityTypeKey = "DISPLAY_ENTITY_TYPE",
    UsrMenuItemsKey = "USER_MENU_ITEMS",
    DashboardWidgetStartDateAndEndDateKey = 'DASHBOARD_WIDGET_STARTDATE_AND_ENDDATE',
    AccountWorkflowDetailsKey = "ACCOUNT_WORKFLOW_DETAILS",
    AccountEntityStagesWithTasks = "ACCOUNT_ENTITY_STAGES_WITH_TASKS",
    Filters_AccountWorkflowListKey = "FILTERS_ACCOUNT_WORKFLOW_LIST",
    ContactWorkflowDetailsKey = "CONTACT_WORKFLOW_DETAILS",
    ContactEntityStageWithTasksKey = "CONTACT_ENTITY_STAGES_WITH_TASKS",
    Filters_ContactKanbanViewKey = "FILTERS_CONTACT_KANBAN_VIEW",
    Filters_ContactListKey = "FILTERS_CONTACT_LIST",
    Filters_ProductCategoryListKey = "FILTERS_PRODUCT_CATEGORY_LIST",
    ProductWorkflowDetailsKey = "PRODUCT_WORKFLOW_DETAILS",
    ProductEntityStageTaskKey = "PRODUCT_ENTITY_STAGES_WITH_TASKS",
    Filters_ProductKanbanViewKey = "FILTERS_PRODUCT_KANBAN_VIEW",
    Filters_PricebookListKey = "FILTERS_PRICEBOOK_LIST",
    OrderWorkflowDetailKey = "ORDER_WORKFLOW_DETAIL",
    OrderEntityStageWithTasksKey = "ORDER_ENTITY_STAGES_WITH_TASKS",
    Filters_OrderKanbanKey = "FILTERS_ORDER_KANBAN",
    Filters_OrderListing = "FILTERS_ORDER_LISTING",
    Workflow_ListKey = "WORKFLOW_LISTS",
    WorkTaskEntityStageWithTasksKey = "WORKTASKS_ENTITY_STAGES_WITH_TASKS",
    OpportunityEntityStageWithTasksKey = "OPPORTUNITY_ENTITY_STAGES_WITH_TASKS",
    CaseEntityStageWithTasksKey = "CASE_ENTITY_STAGES_WITH_TASKS",
    Filters_CasesKey = "FILTERS_CASE",
    CaseWorkflowDetailsKey = "CASE_WORKFLOW_DETAILS",
    Case_ListKey = "CASE_LISTS",
    Filters_WorkTasksKey = "FILTERS_WORKTASK",
    WorkTaskWorkFlowStageList = "WORKTASK_WORKFLOW_STAGE_LIST",
    OpportunityWorkFlowStageList = "OPPORTUNITY_WORKFLOW_STAGE_LIST",
    Filters_WorktasksListing = "FILTERS_WORKTASKS_LISTING",
    Filters_CampaignsKey = "FILTERS_CAMPAIGNS",
    Filters_NewsletterKey = "FILTERS_NEWSLETTER",
    Filters_AppointmentsKey = "FILTERS_APPOINTMENT",
    Filters_OpportunityListKey = "FILTERS_OPPORUTNITY_LIST",
    Filters_ALLOpportunitiesListKey = "FILTERS_ALLOPPORUTNITY_LIST",
    ProfileTimeZonesKey = "TIMEZONE",
    Countries = "COUNTRIES",
    SelectedThemeKey = "SELECTED_THEME",
    AllActivePermissions = 'URAM_ALL_ACTIVE_PERMISSIONS',
    S3BucketURL = 'S3_BUCKET_URL',
    UserS3BucketURL = 'USER_S3_BUCKET_URL',
    TenantS3BucketURL = 'TENANT_S3_BUCKET_URL',
    Filters_ProductListingKey = 'FILTERS_PRODUCT_LISTING',
    OpportunityWorkflowDetailKey = 'OPPORTUNITY_WORKFLOW_DETAILS',
    WorkTaskWorkflowDetailsKey = "WORKTASK_WORKFLOW_DETAILS",
    Filters_EntityWorkflowManagementKey = 'FILTERS_ENTITY_WORKFLOWS_MANAGEMENT',
    TaskRecordTypeKey = 'TASK_RECORD_TYPES',
    EventRecordTypeKey = 'EVENT_RECORD_TYPES',
    DocumentTypeKey = 'DOCUMENT_TYPE',
    Filters_Activity = 'FILTERS_ACTIVITY',
    NoteRecordTypeKey = 'NOTE_RECORD_TYPES',
    Filters_UsersListKey = 'FILTERS_USERS_LIST',
    Filters_EntityTagKey = 'FILTERS_ENTITY_TAG',
    Filters_EntityTagCategoriesKey = 'FILTERS_ENTITY_TAG_CATEGORIES',
    UsersPermissionsSetListKey = 'USERS_PERMISSIONS_SET_LISTS',
    VisibleEntityWithRecordTypes = 'VISIBLE_ENTITIY_WITH_RECORD_TYPES',
    Filters_MiscTasksKey = 'FILTERS_MISC_TASKS',
    ProductImageRecordTypeKey = 'PRODUCT_IMAGE_RECORD_TYPES',
    Filters_RoleSearch = "FILTERS_ROLE_SEARCH",
    UOM_TypeKey = "UOM_TYPES",
    NativeTabList_Accounts = "NativeTabList_Accounts",
    NativeTabList_Campaigns = "NativeTabList_Campaigns",
    NativeTabList_Contacts = "NativeTabList_Contacts",
    NativeTabList_Newsletters = "NativeTabList_Newsletters",
    NativeTabList_Opportunities = "NativeTabList_Opportunities",
    NativeTabList_Orders = "NativeTabList_Orders",
    NativeTabList_PriceBooks = "NativeTabList_PriceBooks",
    NativeTabList_Products = "NativeTabList_Products",
    NativeTabList_ProductCategories = "NativeTabList_ProductCategories",
    NativeTabList_ProductSkus = "NativeTabList_ProductSkus",
    NativeTabList_WorkTasks = "NativeTabList_WorkTasks",
    NativeTabList_Cases = 'NATIVE_TAB_LIST_CASES',
    NativeTabList_Appointments = "NativeTabList_Appointments",
    Filters_CasesListing = "FILTERS_CASES_LISTING",
    Case_WorkFlow_StageList = "CASE_WORKFLOW_STAGE_LIST",
    Order_WorkFlow_StageList = "ORDER_WORKFLOW_STAGE_LIST",
    Filters_TeamMembersRecords = "FILTERS_TEAMMEMBERSRECORDS",
    Filters_OwnersRecord =  "FILTERS_OWNERSRECORDS",
    Accounts_Workflow_SelectedItem = "QV_ACCOUNTS_WF_SELECTED_ITEM",
    Contacts_Workflow_SelectedItem = "QV_CONTACTS_WF_SELECTED_ITEM",
    Orders_Workflow_SelectedItem = "QV_ORDERS_WF_SELECTED_ITEM",
    Products_Workflow_SelectedItem = "QV_PRODUCTS_WF_SELECTED_ITEM",
    Worktasks_Workflow_SelectedItem = "QV_WORKTASKS_WF_SELECTED_ITEM",
    Opportunities_Workflow_SelectedItem = "QV_OPPORTUNITIES_WF_SELECTED_ITEM",
    Cases_Workflow_SelectedItem = "QV_CASES_WF_SELECTED_ITEM",
    User_Profile_Details = "USER_PROFILE_DETAILS",
    AllEntityRecordTypes = 'ALL_ENTITY_RECORD_TYPES',
    ALLENTITYSUBTYPES = 'ALL_ENTITY_SUB_TYPES',
    AllEntityHiddenFieldSettings = "ALL_ENTITY_HIDDEN_FIELD_SETTING",
    Accounts_List_SelectedItem = "QV_ACCOUNTS_LIST_SELECTED_ITEM",
    Contacts_List_SelectedItem = "QV_CONTACTS_LIST_SELECTED_ITEM",
    ProductCategories_List_SelectedItem = "QV_PRODUCTCATEGORIES_LIST_SELECTED_ITEM",
    Products_List_SelectedItem = "QV_PRODUCTS_LIST_SELECTED_ITEM",
    Pricebooks_List_SelectedItem = "QV_PRICEBOOKS_LIST_SELECTED_ITEM",
    Orders_List_SelectedItem = "QV_ORDERS_LIST_SELECTED_ITEM",
    Cases_List_SelectedItem = "QV_CASES_LIST_SELECTED_ITEM",
    Worktasks_List_SelectedItem = "QV_WORKTASKS_LIST_SELECTED_ITEM",
    Campaigns_List_SelectedItem = "QV_CAMPAIGNS_LIST_SELECTED_ITEM",
    Appointments_List_SelectedItem = "QV_APPOINTMENTS_LIST_SELECTED_ITEM",
    Newsletters_List_SelectedItem = "QV_NEWSLETTERS_LIST_SELECTED_ITEM",
    Opportunities_List_SelectedItem = "QV_OPPORTUNITIES_LIST_SELECTED_ITEM",
    Stage_Collapsible_Key = "COLLAPSIBLE_STAGE",
}

export enum DocumentViewerType {
    Excel = "excel",
    PowerPoint = "ppt",
    Word = "word",
    Pdf = "pdf",
    Image = "image",
    Csv = "csv",
    Video='video',
    Audio='audio'
}

export enum ExportType {
    Excel = "excel",
    Csv = "csv"
}

export enum FileExtension {
    Excel = ".xlsx",
    Csv = ".csv"
}

export enum NotificationStatus {
    Pending = 1,
    InProcess = 2,
    Completed = 3,
    Failed = 4
}

export enum LayoutTypes {
    KanbanView = 1,
    ListView = 2,
    KanbanAndListView = 3
}

export enum PrivacyLevels{
    None = 0,
    OnlyMe = 10,
    EveryoneAnonymously = 2,
    Everyone = 1
}

export enum SectionCodes {
    KanbanListColumn = "KANBAN_LIST_COLUMN",
    KanbanListFilter = "KANBAN_LIST_FILTER",
    AllListColumn = "ALL_LIST_COLUMN",
    AllListFilter = "ALL_LIST_FILTER",
    AddPopup = "ADD_POPUP",
    DetailHeader = "DETAIL_HEADER",
    DetailSection = "DETAIL_SECTION",
    HistoryColumn = "HISTORY_COLUMN",
    LinkedWorkTasksColumn = "LINKED_WORK_TASKS_COLUMN",
    SubWorkTasksColumn = "SUB_WORK_TASKS_COLUMN",
    EntityWorkTasksColumn = "ENTITY_WORK_TASKS_COLUMN",
    KanbanCard = "KANBAN_CARD",
    EntityWorkTaskPopup = "ENTITY_WORK_TASKS_POPUP",
    SubWorkTaskPopup = "SUB_WORK_TASKS_POPUP",
    EntityCasePopup = "ENTITY_CASES_POPUP",
    EntityCaseColumn = "ENTITY_CASES_COLUMN",
    HeaderSection = "HEADER_SECTION"
}

export enum FieldNames {
    AssignedTo = "AssignedTo",
    VerifiedBy = "VerifiedBy",
    Status = "Status",
    Created = "Created",
    Modified = "Modified",
    RelatedTo = "RelatedTo",
    EstimatedMins = "EstimatedMins",
    EstimatedPoints = "EstimatedPoints",
    TotalElapsedTime = "TotalElapsedTime",
    TotalEffectiveTime = "TotalEffectiveTime",
    TotalPauseTime = "TotalPauseTime"
}

export enum UserTypeID {
    AssignedTo = 1,
    VerifiedBy = 2,
    Owner = 3,
    CreatedBy = 4
}

export enum AppointmentStatus {
    Pending	=	1,
    Completed =	2,
    Canceled =	3,
    NotSure =	4,
    Rescheduled	= 5
}