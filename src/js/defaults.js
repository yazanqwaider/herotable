export const defaults = {
    isRTL: false,
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
    columns: {
        sizes: {},
        hidden: [],
    },
    lang: {
        generalSearch: "Search",
        noAvailableData: "No available data in table",
        showHiddenColumn: "Show hidden columns",
    }
}