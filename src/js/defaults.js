export const defaults = {
    isRTL: false,
    generalSearch: true,
    scrollableWrapper: false,
    columnSearch: true,
    columnResizer: true,
    hideColumn: true,
    afterResizeCallback: null,
    afterHideCallback: null,
    afterShowHiddenColsCallback: null,
    noAvailableData: true,
    hideFooterIfBodyEmpty: true,
    enableSumValuesOnColumns: [],
    sumValuesCell: 'td',    // in tfoot
    decimalNumberLength: 0,
    afterSumCallback: null,
    withPagination: false,
    rowsPerPage: 15,
    columns: {
        sizes: {},
        hidden: [],
    },
    lang: {
        generalSearch: "Search",
        noAvailableData: "No available data in table",
        showHiddenColumn: "Show hidden columns",
        nextPaginateBtn: "Next",
        prevPaginateBtn: "Previous",
        all: "All",
    }
}