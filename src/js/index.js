import {defaults} from './defaults.js';

let Herotable = function(element, mode = 'initialize', options) {
    element.herotable = this;
    this.table = $(element);
    this.header = this.table.find('thead');
    this.body = this.table.find('tbody');
    this.footer = this.table.find('tfoot');
    this.header_rows_values  = [];
    this.body_rows_values  = [];
    this.footer_rows_values  = [];
    this.table_height = null;
    this.active_resizer_col = null;
    this.active_page = 0;
    this.pages_count = 1;
    this.page_body_rows = [];
    this.hidden_columns = [];
    this.options = {};

    $.extend(true, this.options, defaults, options);

    if(mode == 'initialize') {
        this.init();
    }

    if(mode == 'destroy') {
        this.getTableData();
        this.destroy();
    }
}

$.extend(Herotable.prototype, {
    init: function() {
        const scrollable_class = (this.options.scrollableWrapper)? 'scrollable-herotable-wrapper' : '';
        let herotable_wrapper = `<div class="herotable-wrapper ${scrollable_class}"></div>`;
        herotable_wrapper = `<div class="outer-herotable-wrapper">${herotable_wrapper}</div>`;
        
        this.table.wrap(`<div class="herotable">${herotable_wrapper}</div>`);

        if(this.options.generalSearch) {
            this.initializeGeneralSearchInput();
        }

        this.getTableData();

        this.refreshTheBody();

        this.applyRequiredStylesOnColumns();

        this.applyPagination();

        if(this.header && this.header_rows_values.length > 0) {          
            const header_row_cols = this.header.find('tr').first().find('th');
            const header_cols_length = header_row_cols.length;

            header_row_cols.each((header_col_index, header_row_col) => {
                // clone the header columns contents without trash the connected js events
                const nested_header_col_layout = $('<div class="nested-header-col-layout"></div>');
                $(header_row_col).contents().each((content_index, content_el) => nested_header_col_layout.append(content_el));
                $(header_row_col).children().detach();
                $(header_row_col).html(nested_header_col_layout);

                if(this.options.columnSearch) {
                    this.initializeSearchInput(header_col_index, header_row_col);
                }

                if(this.options.hideColumn) {
                    this.initializeHideBtn(header_col_index, header_row_col);
                }

                this.initializeSortBtn(header_col_index, header_row_col);

                if(this.options.columnResizer) {
                    this.initializeResizer(header_col_index, header_row_col, header_cols_length);
                }
            });

            this.recalculateResizerHeight();
        }

        this.showNoDataRowIfNoData();
        this.hideFooterIfBodyEmpty();
        this.applySumOnColumns();
    },

    getTableData: function() {
        this.table_height = this.table.outerHeight();
        this.header_rows_values = this.getHeaderRowsValues();
        this.body_rows_values = this.getBodyRowsValues();
        this.detectAllHeaderColumnsTypes();
        this.page_body_rows = this.getPageBodyRows();
        this.footer_rows_values = this.getFooterRowsValues();
    },

    // Get the header rows data to make easy to deal with
    getHeaderRowsValues: function() {
        let header_rows_values = [];
        const header_rows = this.header.find('tr');
        header_rows.each((row_index, row) => {
            let header_row = {
                origin_html: $(row)[0].outerHTML,
                html: $(row)[0].outerHTML,
                cols: [],
            };
    
            $(row).find('th').each((col_index, col) => {
                header_row.cols.push({
                    origin_html: col.outerHTML,
                    html: col.outerHTML,
                    value: $(col).text(),
                    sort_by: '',
                    is_hidden: false,
                    type: 'string'
                });
            });
    
            header_rows_values.push(header_row);
        });

        return header_rows_values;
    },

    // Get the body rows data to make easy to deal with
    getBodyRowsValues: function() {
        let body_rows_values = [];
        this.body.find('tr').each((row_index, row) => {
            let body_row = {
                el: $(row),
                origin_html: row.outerHTML,
                html: row.outerHTML,
                cols: [],
            };

            $(row).find('td').each((col_index, col) => {
                const colspan = $(col).attr('colspan') || 1;
                
                for (let i = 0; i < colspan; i++) {
                    body_row.cols.push({
                        el: $(col),
                        origin_html: col.outerHTML,
                        html: col.outerHTML,
                        value: $(col).text(),
                        is_colspan: colspan > 1,
                        original: i == 0,
                        is_hidden: false
                    });
                }
            });

            body_rows_values.push(body_row);
        });

        return body_rows_values;
    },

    // Get the body rows data for the active page to make easy to deal with
    getPageBodyRows: function() {        
        const start_row_index = (this.options.withPagination)? +this.active_page * (this.options.rowsPerPage || 15) : 0;
        const end_row_index = ((this.options.withPagination)? (+this.active_page + 1) * (this.options.rowsPerPage || 15) : this.body_rows_values.length) - 1;
        
        let page_body_rows = [];
        for (let i = start_row_index; i <= end_row_index; i++) {
            if(i < this.body_rows_values.length) {
                page_body_rows.push(this.body_rows_values[i]);
            }
        }

        return page_body_rows;
    },

    // Detect all header rows columns types
    detectAllHeaderColumnsTypes() {
        if(this.header_rows_values.length > 0) {
            const first_header_row = this.header_rows_values[0];
            const options_columns_types = this.options.columns.types;

            first_header_row.cols.map((hc, header_col_index) => {
                let type = null;
                
                const passed_col_type = (options_columns_types.length - 1 >= header_col_index)? options_columns_types[header_col_index] : null;
                if(passed_col_type && ['string', 'number', 'date'].includes(passed_col_type)) {
                    type = passed_col_type;
                }
                else {
                    type = this.detectColumnType(header_col_index);
                }

                this.header_rows_values[0].cols[header_col_index].type = type || 'string';
            });
        }
    },

    // Detect the column type
    detectColumnType(column_index) {
        const types_counts = {
            'string': 0,
            'number': 0,
            'date': 0,
        };

        const dateFormatFunc = this.options.dateFormatFunc;
        this.body_rows_values.forEach((body_row) => {
            const value = body_row.cols[column_index].value;

            if(value) {
                if(isNaN(value) && ((dateFormatFunc && dateFormatFunc(value)) || new Date(value) != 'Invalid Date')) {
                    types_counts['date']++;
                    return;
                }

                const sanitized_number = value.replace(/[,$€£¥]/g, '');
                if(!isNaN(+sanitized_number)) {
                    types_counts['number']++;
                    return;
                }

                types_counts['string']++;
            }
            else {
                types_counts['string']++;
            }
        });

        let largest_type = {'type': 'string', 'repetitions': 0};
        for (const type_key in types_counts) {
            const repetitions = types_counts[type_key];
            if(repetitions > largest_type['repetitions']) {
                largest_type['type'] = type_key;
                largest_type['repetitions'] = repetitions;
            }
        }
 
        return largest_type['type'];
    },

    // Refresh the body rows through remove the exist rows and add the page_body_rows.
    refreshTheBody: function() {
        let body_rows = [];
        for (let i = 0; i < this.page_body_rows.length; i++) {
            body_rows.push(this.page_body_rows[i].el[0]);
        }

        this.body.children().detach();
        this.body.html($(body_rows));
    },

    // Get the footer rows data to make easy to deal with
    getFooterRowsValues: function() {
        let footer_rows_values = [];
        this.footer.find('tr').each((row_index, row) => {
            let footer_row = {
                origin_html: row.outerHTML,
                html: row.outerHTML,
                cols: [],
            };

            $(row).find('td').each((col_index, col) => {
                const colspan = $(col).attr('colspan') || 1;
                
                for (let i = 0; i < colspan; i++) {
                    footer_row.cols.push({
                        el: $(col),
                        origin_html: col.outerHTML,
                        html: col.outerHTML,
                        value: $(col).text(),
                        is_colspan: colspan > 1,
                        original: i == 0,
                        is_hidden: false
                    });
                }
            });

            footer_rows_values.push(footer_row);
        });

        return footer_rows_values;
    },
    
    // Apply the gived styles through options on columns
    applyRequiredStylesOnColumns: function() {
        const columns_styles = this.options.columns;

        this.header.find('tr').each((row_index, row) => {
            $(row).find('th').each((col_index, col) => {
                const width = columns_styles.sizes[col_index] || $(col).outerWidth();
                $(col).css('width', width + 'px');
                
                if(columns_styles.hidden.includes(col_index)) {
                    this.header_rows_values[row_index].cols[col_index].is_hidden = true;
                    $(col).css('display', 'none');
                    this.hidden_columns.push(col_index);    // do it just one time
                }
            });
        });

        this.body.find('tr').each((row_index, row) => {
            $(row).find('td').each((col_index, col) => {
                if(columns_styles.sizes[col_index]) {
                    $(col).css('width', columns_styles.sizes[col_index] + 'px');
                }

                if(columns_styles.hidden.includes(col_index)) {
                    this.page_body_rows[row_index].cols[col_index].is_hidden = true;
                    $(col).css('display', 'none');
                }
            });
        });

        this.footer.find('tr').each((row_index, row) => {
            $(row).find('td').each((col_index, col) => {
                if(columns_styles.sizes[col_index]) {
                    $(col).css('width', columns_styles.sizes[col_index] + 'px');
                }

                if(columns_styles.hidden.includes(col_index)) {
                    this.footer_rows_values[row_index].cols[col_index].is_hidden = true;
                    $(col).css('display', 'none');
                }
            });
        });

        this.updateNewHtmlForHeaderRows();
        this.updateNewHtmlForBodyRows();
        this.updateNewHtmlForFooterRows();

        if(this.hidden_columns.length > 0) {
            this.showTableControlBtn();
        }
    },

    // Apply the pagination feature if it enabled in options
    applyPagination: function() {
        if(this.options.withPagination) {
            const rowsPerPage = this.options.rowsPerPage || 15;
            this.pages_count = Math.ceil(this.body_rows_values.length / rowsPerPage);

            let pagesHtmlElements = '<div class="pagination-layout">';
            pagesHtmlElements+= `
                <button class="prev-paginate-btn disabled-btn" tabindex="0" disabled>
                    ${this.options.lang.prevPaginateBtn}
                </button>
            `;

            for (let pageIndex = 0; pageIndex < this.pages_count; pageIndex++) {
                pagesHtmlElements+= `
                    <button class="paginate-btn ${(pageIndex == 0? 'active-paginate-btn' : '')}" tabindex="0" data-pageIndex="${pageIndex}">
                        ${pageIndex + 1}
                    </button>
                `;
            }

            pagesHtmlElements+= `
                <button class="next-paginate-btn" tabindex="0">
                    ${this.options.lang.nextPaginateBtn}
                </button>
            `;
            pagesHtmlElements+= '</div>';

            $('.herotable').append(pagesHtmlElements);

            let self = this;
            $('.herotable .paginate-btn').on('click', function() {
                const page_index = parseInt($(this).attr('data-pageIndex'));
                self.activatePage(parseInt(page_index));
            });

            $('.herotable .prev-paginate-btn').on('click', function() {
                const page_index = parseInt(self.active_page) - 1;
                self.activatePage(page_index);
            });

            $('.herotable .next-paginate-btn').on('click', function() {
                const page_index = parseInt(self.active_page) + 1;
                self.activatePage(page_index);
            });
        }
    },

    // Make a specific page is active
    activatePage(page_index) {
        if(page_index >= 0 && page_index < this.pages_count) {
            this.table.closest('.herotable').find('.active-paginate-btn').removeClass('active-paginate-btn');
            this.table.closest('.herotable').find(`.paginate-btn[data-pageIndex="${page_index}"]`).addClass('active-paginate-btn');
            this.active_page = page_index;
            this.page_body_rows = this.getPageBodyRows();
            this.refreshTheBody();

            const next_btn = this.table.closest('.herotable').find('.next-paginate-btn');
            const prev_btn = this.table.closest('.herotable').find('.prev-paginate-btn');
            const can_next = this.pages_count > 1 && page_index + 1 < this.pages_count;
            const can_prev = this.pages_count > 1 && page_index > 0;

            if(can_next) {
                next_btn.removeClass('disabled-btn').prop('disabled', false);
            }
            else {
                next_btn.addClass('disabled-btn').prop('disabled');
            }

            if(can_prev) {
                prev_btn.removeClass('disabled-btn').prop('disabled', false);
            }
            else {
                prev_btn.addClass('disabled-btn').prop('disabled');
            }
        }
    },

    // Make the header rows html in a variable is the same in DOM
    updateNewHtmlForHeaderRows() {
        this.header.find('tr').each((row_index, row) => {
            this.header_rows_values[row_index].html = $(row)[0].outerHTML;

            $(row).find('th').each((col_index, col) => {
                this.header_rows_values[row_index].cols[col_index].html = col.outerHTML;
            });
        });
    },

    // Make the body rows html in a variable is the same in DOM
    updateNewHtmlForBodyRows: function() {
        this.body.find('tr').each((row_index, row) => {
            this.page_body_rows[row_index].html = row.outerHTML,

            $(row).find('td').each((col_index, col) => {
                if(col_index < this.page_body_rows[row_index].cols.length) {
                    this.page_body_rows[row_index].cols[col_index].html = col.outerHTML;
                }
            });
        });
    },

    // Make the footer rows html in a variable is the same in DOM
    updateNewHtmlForFooterRows: function() {
        this.footer.find('tr').each((row_index, row) => {
            this.footer_rows_values[row_index].html = row.outerHTML,

            $(row).find('td').each((col_index, col) => {
                this.footer_rows_values[row_index].cols[col_index].html = col.outerHTML;
            });
        });
    },

    initializeGeneralSearchInput: function() {
        const general_input = $(`<input type="search" class="general-search-input" placeholder="${this.options.lang.generalSearch}">`);
        this.table.closest('.herotable').prepend(general_input);

        general_input.on('keyup search', (e) => {
            const value = e.target.value;
            let valid_rows = [];

            if(value) {
                for (let i = 0; i < this.page_body_rows.length; i++) {
                    const row_cols = this.page_body_rows[i].cols;
                    for (let col_index = 0; col_index < row_cols.length; col_index++) {
                        const col_value = row_cols[col_index].value;

                        if(col_value.includes(value)) {
                            valid_rows.push(this.page_body_rows[i].el[0]);
                            break;
                        }
                    }
                }
            }
            else {
                for (let i = 0; i < this.page_body_rows.length; i++) {
                    valid_rows.push(this.page_body_rows[i].el[0]);
                }			
            }

            this.body.children().detach();
            this.body.html($(valid_rows));

            this.recalculateResizerHeight();
            this.showNoDataRowIfNoData();
            this.hideFooterIfBodyEmpty();
            this.applySumOnColumns();
        });
    },
  
    // Initialize the search input on columns
    initializeSearchInput: function(header_col_index, header_col) {
        header_col = $(header_col);
        header_col.append('<input type="search" class="header-search-input">');

        // register the search input event
        const header_search_input = header_col.find('.header-search-input');
        header_search_input.on('keyup search', (e) => {
            const value = e.target.value;
            let valid_rows = [];

            if(value) {
                for (let i = 0; i < this.page_body_rows.length; i++) {
                    if(header_col_index <= this.page_body_rows[i].cols.length - 1) {
                        const col_value = this.page_body_rows[i].cols[header_col_index].value;
                        if(col_value.includes(value)) {
                            valid_rows.push(this.page_body_rows[i].el[0]);
                        }
                    }
                }
            }
            else {
                for (let i = 0; i < this.page_body_rows.length; i++) {
                    valid_rows.push(this.page_body_rows[i].el[0]);
                }			
            }

            this.body.children().detach();
            this.body.html($(valid_rows));

            this.recalculateResizerHeight();
            this.showNoDataRowIfNoData();
            this.hideFooterIfBodyEmpty();
            this.applySumOnColumns();
        });
    },

    // Initialize the hide button on each column in table header
    initializeHideBtn: function(header_col_index, header_col) {
        header_col = $(header_col);

        const hide_sort_icon = '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" height="20" width="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m17.069 6.546 2.684-2.359c.143-.125.32-.187.497-.187.418 0 .75.34.75.75 0 .207-.086.414-.254.562l-16.5 14.501c-.142.126-.319.187-.496.187-.415 0-.75-.334-.75-.75 0-.207.086-.414.253-.562l2.438-2.143c-1.414-1.132-2.627-2.552-3.547-4.028-.096-.159-.144-.338-.144-.517s.049-.358.145-.517c2.111-3.39 5.775-6.483 9.853-6.483 1.815 0 3.536.593 5.071 1.546zm2.319 1.83c.966.943 1.803 2.014 2.474 3.117.092.156.138.332.138.507s-.046.351-.138.507c-2.068 3.403-5.721 6.493-9.864 6.493-1.297 0-2.553-.313-3.729-.849l1.247-1.096c.795.285 1.626.445 2.482.445 3.516 0 6.576-2.622 8.413-5.5-.595-.932-1.318-1.838-2.145-2.637zm-3.434 3.019c.03.197.046.399.046.605 0 2.208-1.792 4-4 4-.384 0-.756-.054-1.107-.156l1.58-1.389c.895-.171 1.621-.821 1.901-1.671zm-.058-3.818c-1.197-.67-2.512-1.077-3.898-1.077-3.465 0-6.533 2.632-8.404 5.5.853 1.308 1.955 2.567 3.231 3.549l1.728-1.519c-.351-.595-.553-1.289-.553-2.03 0-2.208 1.792-4 4-4 .925 0 1.777.315 2.455.843zm-2.6 2.285c-.378-.23-.822-.362-1.296-.362-1.38 0-2.5 1.12-2.5 2.5 0 .36.076.701.213 1.011z" fill-rule="nonzero"/></svg>';
        header_col.append(`<span class="header-hide-icon">${hide_sort_icon}</span>`);

        // register the search input event
        const header_hide_icon = header_col.find('.header-hide-icon');
        header_hide_icon.on('click', () => {
            // check if there and body column in the same index is not valid,
            // such as it is colspan or it is not exist.
            let invalid_col = this.page_body_rows.find((body_row) => {
                return header_col_index > body_row.cols.length - 1 || body_row.cols[header_col_index].is_colspan;
            });
            invalid_col = invalid_col || this.footer_rows_values.find((footer_row) => {
                return header_col_index > footer_row.cols.length - 1 || footer_row.cols[header_col_index].is_colspan;
            });

            if(invalid_col) {
                alert('There are invalid columns, please remove the colspan or add the missing column to fix it.');
                return false;
            }

            // hide the column in header side
            header_col.hide();
            this.header_rows_values[0].cols[header_col_index].is_hidden = true;

            // hide the columns in body side
            this.page_body_rows.forEach((body_row, body_row_index) => {
                body_row.cols[header_col_index].el[0].style.display = 'none';
                body_row.cols[header_col_index].is_hidden = true;
            });

            // hide the column in footer side
            this.footer_rows_values.forEach((footer_row, footer_row_index) => {
                footer_row.cols[header_col_index].el[0].style.display = 'none';
                footer_row.cols[header_col_index].is_hidden = true;
            });

            this.hidden_columns.push(header_col_index);

            if(this.hidden_columns.length == 1) {
                this.showTableControlBtn();
            }
            else {
                this.refreshHiddenColumnsListInControlIfExist();
            }

            if(this.options.afterHideCallback) {
                const data = {
                    col_index: header_col_index,
                    width: header_col.width(),
                };
                this.options.afterHideCallback(data);
            }
        });
    },

    // Show the control button that includs operations for hide and resize features
    showTableControlBtn: function() {
        const control_elements = $(`
            <div class="control-layout">
                <button>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M24 14.187v-4.374c-2.148-.766-2.726-.802-3.027-1.529-.303-.729.083-1.169 1.059-3.223l-3.093-3.093c-2.026.963-2.488 1.364-3.224 1.059-.727-.302-.768-.889-1.527-3.027h-4.375c-.764 2.144-.8 2.725-1.529 3.027-.752.313-1.203-.1-3.223-1.059l-3.093 3.093c.977 2.055 1.362 2.493 1.059 3.224-.302.727-.881.764-3.027 1.528v4.375c2.139.76 2.725.8 3.027 1.528.304.734-.081 1.167-1.059 3.223l3.093 3.093c1.999-.95 2.47-1.373 3.223-1.059.728.302.764.88 1.529 3.027h4.374c.758-2.131.799-2.723 1.537-3.031.745-.308 1.186.099 3.215 1.062l3.093-3.093c-.975-2.05-1.362-2.492-1.059-3.223.3-.726.88-.763 3.027-1.528zm-4.875.764c-.577 1.394-.068 2.458.488 3.578l-1.084 1.084c-1.093-.543-2.161-1.076-3.573-.49-1.396.581-1.79 1.693-2.188 2.877h-1.534c-.398-1.185-.791-2.297-2.183-2.875-1.419-.588-2.507-.045-3.579.488l-1.083-1.084c.557-1.118 1.066-2.18.487-3.58-.579-1.391-1.691-1.784-2.876-2.182v-1.533c1.185-.398 2.297-.791 2.875-2.184.578-1.394.068-2.459-.488-3.579l1.084-1.084c1.082.538 2.162 1.077 3.58.488 1.392-.577 1.785-1.69 2.183-2.875h1.534c.398 1.185.792 2.297 2.184 2.875 1.419.588 2.506.045 3.579-.488l1.084 1.084c-.556 1.121-1.065 2.187-.488 3.58.577 1.391 1.689 1.784 2.875 2.183v1.534c-1.188.398-2.302.791-2.877 2.183zm-7.125-5.951c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0-2c-2.762 0-5 2.238-5 5s2.238 5 5 5 5-2.238 5-5-2.238-5-5-5z"/></svg>
                </button>

                <ul>
                    <li class="show-hidden-cols-trigger">
                        ${this.options.lang.showHiddenColumn}
                        
                        <ul class="hidden-cols-list"></ul>
                    </li>
                </ul>
            </div>
        `);
        this.table.closest('.outer-herotable-wrapper').append(control_elements);

        this.refreshHiddenColumnsListInControlIfExist();

        control_elements.find('button').on('click', function() {
            $(this).next('ul').toggle();
        });

        control_elements.find('.show-hidden-cols-trigger').on('click', function() {
            $(this).find('.hidden-cols-list').toggle();
        });
    },

    refreshHiddenColumnsListInControlIfExist() {
        const hidden_cols_list = $('.hidden-cols-list').first();
        if(hidden_cols_list) {
            let hidden_columns_list = `<li class="show-hidden-columns" data-show="all">${this.options.lang.all}</li>`;
            this.hidden_columns.forEach((header_col_index) => {
                const col = this.header_rows_values[0].cols[header_col_index];
                hidden_columns_list+= `<li class="show-hidden-columns" data-show="${header_col_index}">#${col.value}</li>`;
            });
            hidden_cols_list.html(hidden_columns_list);

            let self = this;
            hidden_cols_list.find('.show-hidden-columns').on('click', function() {
                // Hide the shown lists
                $(this).closest('.control-layout').find('ul').hide();
    
                const show = $(this).attr('data-show');
                const columns_indices = (show == 'all')? self.hidden_columns : [parseInt(show)]
                self.showHiddenColumns(columns_indices);
    
                if(self.options.afterShowHiddenColsCallback) {
                    const data = {cols: columns_indices};
                    self.options.afterShowHiddenColsCallback(data);
                }

                self.refreshHiddenColumnsListInControlIfExist();
            });
        }
    },

    removeTableControlBtn: function() {
        if(this.hidden_columns.length == 0) {
            this.table.closest('.outer-herotable-wrapper').find('.control-layout').remove();
        }
    },

    showHiddenColumns: function(columns_indices) {
        const hidden_columns = this.hidden_columns;
        for(let hci = 0; hci < hidden_columns.length; hci++) {
            const header_col_index = hidden_columns[hci];

            if(columns_indices.includes(header_col_index)) {
                // show the column in header side
                this.header.find(`tr th:eq(${header_col_index})`).show();
                this.header_rows_values[0].cols[header_col_index].is_hidden = false;

                // show the column in body side
                this.page_body_rows.forEach((body_row, body_row_index) => {
                    this.body.find(`tr:eq(${body_row_index}) td:eq(${header_col_index})`).show();
                    body_row.cols[header_col_index].is_hidden = false;
                });

                // show the column in footer side
                this.footer_rows_values.forEach((footer_row, footer_row_index) => {
                    this.footer.find(`tr:eq(${footer_row_index}) td:eq(${header_col_index})`).show();
                    footer_row.cols[header_col_index].is_hidden = false;
                });

                this.hidden_columns.splice(hci, 1);
            }
        }

        this.removeTableControlBtn();
    },

    // Initialize the sorting feature on each column in table header
    initializeSortBtn: function(header_col_index, header_col) {
        header_col = $(header_col);

        const unsorted_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M12 3.202l3.839 4.798h-7.678l3.839-4.798zm0-3.202l-8 10h16l-8-10zm3.839 16l-3.839 4.798-3.839-4.798h7.678zm4.161-2h-16l8 10 8-10z"/></svg>';
        const asc_sort_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M12 0l-8 10h16l-8-10zm3.839 16l-3.839 4.798-3.839-4.798h7.678zm4.161-2h-16l8 10 8-10z"/></svg>';
        const desc_sort_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M12 3.202l3.839 4.798h-7.678l3.839-4.798zm0-3.202l-8 10h16l-8-10zm8 14h-16l8 10 8-10z"/></svg>';

        const sorting_icons_map = {
            '': unsorted_icon,
            'asc': asc_sort_icon,
            'desc': desc_sort_icon,
        };

        const first_sort_by = this.header_rows_values[0].cols[header_col_index].sort_by;
        header_col.append(`<span class="header-sort-icon">${sorting_icons_map[first_sort_by]}</span>`);

        const col_type = this.header_rows_values[0].cols[header_col_index].type;

        // register the sort icon event
        const header_sort_icon = header_col.find('.header-sort-icon');
        let self = this;
        header_sort_icon.on('click', function() {
            const old_sort_by = self.header_rows_values[0].cols[header_col_index].sort_by;
            let new_sort_by = (old_sort_by == 'asc')? 'desc' : 'asc';
            self.header_rows_values[0].cols[header_col_index].sort_by = new_sort_by;
            $(this).html(sorting_icons_map[new_sort_by]);
            const parentNode = self.body[0];
            const dateFormatFunc = self.options.dateFormatFunc;

            self.page_body_rows.sort(function(first, second) {
                if(header_col_index <= first.cols.length - 1 && header_col_index <= second.cols.length - 1) {
                    const first_value = first.cols[header_col_index].value;
                    const second_value = second.cols[header_col_index].value;

                    let result = 0;
                    if(col_type == 'string') {
                        result = first_value.localeCompare(second_value);
                    }
                    else if(col_type == 'date') {
                        const parse_first_date = (dateFormatFunc && dateFormatFunc(first_value)) || new Date(first_value);
                        const parse_second_date = (dateFormatFunc && dateFormatFunc(second_value)) || new Date(first_value);
                        result = parse_first_date - parse_second_date;
                    }
                    else if(col_type == 'number') {
                        result = (+first_value.replace(/[,$€£¥]/g, '')) - (+second_value.replace(/[,$€£¥]/g, ''));
                    }

                    result = (isNaN(result))? 0 : result;
                    if(result >= 1) result = 1;
                    else if(result < 0) result = -1;
                    else result = 0;

                    result = (new_sort_by == 'desc')? result * -1 : result;

                    if(new_sort_by == 'asc') {
                        if(result == -1) {
                            parentNode.insertBefore(first.el[0], second.el[0]);
                        }
                        if(result == 1) {
                            parentNode.insertBefore(second.el[0], first.el[0]);
                        }
                    }
                    else {
                        if(result == 1) {
                            parentNode.insertBefore(second.el[0], first.el[0]);
                        }
                        if(result == -1) {
                            parentNode.insertBefore(first.el[0], second.el[0]);
                        }
                    }

                    return result;
                }
                else {
                    console.error("The row has incorrect columns count.");
                    return -1;
                }
            });
        });
    },

    // Initialize the resizing feature on each column in table header except the last one
    initializeResizer: function(header_col_index, header_col, header_cols_length) {
        if(header_col_index < header_cols_length - 1) {
            const horizontal_style = this.options.isRTL? 'left: 0px' : 'right: 0px';
            $(header_col).append(`<div class="col-resizer" style="height: ${this.table_height}px; ${horizontal_style};"></div>`);
        }

        let x = 0;
        let width = 0;
        let document_width = $(document).width();
        let self = this;
        $(header_col).find('.col-resizer').on('mousedown', function(e) {
            if(self.active_resizer_col == null) {
                self.active_resizer_col = $(this).parent();
                x = (self.options.isRTL)? document_width - e.clientX : e.clientX;
                width = self.active_resizer_col.width();
                
                self.active_resizer_col.css({
                    'min-width': 'unset', 
                    'max-width': 'unset',
                    'width': width
                });

                const body_cols = self.body.find('tr').find(`td:eq(${header_col_index})`);
                const footer_cols = self.footer.find('tr').find(`td:eq(${header_col_index})`);

                body_cols.css({'min-width': width, 'max-width': width, 'width': width});
                footer_cols.css({'min-width': width, 'max-width': width, 'width': width});
                
                $(document).on('mousemove', function(e) {
                    const newClientX = (self.options.isRTL)? document_width - e.clientX : e.clientX;
                    const new_width = width + newClientX - x;

                    self.active_resizer_col.css({'width': new_width, 'min-width': new_width, 'max-width': new_width});

                    body_cols.css({'width': new_width, 'min-width': new_width, 'max-width': new_width});

                    footer_cols.css({'width': new_width, 'min-width': new_width, 'max-width': new_width});
                });    

                $(document).on('mouseup', function(e) {
                    $(document).off('mousemove');
                    $(document).off('mouseup');

                    const data = {
                        col_index: header_col_index,
                        new_width: self.active_resizer_col.width(),
                    };

                    self.active_resizer_col = null;

                    self.updateNewHtmlForHeaderRows();
                    self.updateNewHtmlForBodyRows();
                    self.updateNewHtmlForFooterRows();

                    if(self.options.afterResizeCallback != null) {
                        self.options.afterResizeCallback(data);
                    }
                });
            }
        });
    },

    // Show the (no data row) when there is not rows in table body
    showNoDataRowIfNoData: function() {
        if(this.body.find('tr').length == 0) {
            this.table.css('table-layout', 'auto');

            if(this.options.noAvailableData) {
                const shown_header_cols = this.header_rows_values[0].cols.filter((col) => !col.is_hidden).length;
                const no_available_data_row = $(
                    `<tr data-rowtype="empty-msg-row">
                        <td colspan="${shown_header_cols}" style="text-align: center;">${this.options.lang.noAvailableData}</td>
                   </tr>`
                );
                this.body.html(no_available_data_row);
            }
        }
        else {
            this.table.css('table-layout', 'fixed');
        }
    },

    hideFooterIfBodyEmpty: function() {
        if(this.footer) {
            const hide_footer = 
                this.options.hideFooterIfBodyEmpty &&
                ((this.body.find('tr').length == 0 && !this.options.noAvailableData) || 
                (this.body.find('tr').length == 1 && this.body.find('tr').attr('data-rowtype') == 'empty-msg-row'));

            const display = (hide_footer)? 'none' : 'table-footer-group';
            this.footer.css('display', display);
        }
    },
    
    recalculateResizerHeight: function() {
        this.table_height = this.table.outerHeight();
        this.table.find('.col-resizer').each((index, resizer) => {
            $(resizer).height(this.table_height);
        });
    },
    
    applySumOnColumns() {
        if(this.options.enableSumValuesOnColumns.length > 0 && this.footer_rows_values.length > 0) {
            const sumValuesCell = this.options.sumValuesCell || 'td';
            const decimalNumberLength = parseInt(this.options.decimalNumberLength || 0);
    
            this.header_rows_values[0].cols.forEach((col, index) => {
                if(this.options.enableSumValuesOnColumns.includes(index)) {
                    let sum_col_value = parseFloat(this.sumColumnValues(index));
                    sum_col_value =  sum_col_value.toFixed(decimalNumberLength); // toFixed will round the number
    
                    // Convert the -0 or +0 to 0
                    const zero_number = parseFloat(0).toFixed(decimalNumberLength);
                    sum_col_value = (sum_col_value == '-' + zero_number || sum_col_value == '+' + zero_number)? zero_number : sum_col_value;
    
                    if(sumValuesCell == 'td') {
                        this.footer_rows_values[0].cols[index].el[0].innerText = sum_col_value;
                    }
                    else {
                        this.footer_rows_values[0].cols[index].el[0].querySelector(sumValuesCell).innerText = sum_col_value;
                    }
                }
            });

            if(this.options.afterSumCallback && typeof this.options.afterSumCallback == 'function') {
                this.options.afterSumCallback();
            }
        }
    },

    sumColumnValues(header_col_index) {
        const sum_col_values = this.page_body_rows.reduce((summation, row) => {
            if(row.el[0].isConnected) {
                const col = row.cols[header_col_index];
                if(!col.is_hidden) {
                    if(typeof(col.value) == 'string' || typeof(col.value) == 'number') {
                        const value = (col.value + '').replaceAll(',', '');
                        if(value && !isNaN(value)) {
                            summation+= parseFloat(value);
                        }
                    }
                }
            }
    
            return summation;
        }, 0);

        return sum_col_values;
    },

    destroy: function() {
        this.table.closest('.herotable').find('.pagination-layout').remove();
        this.table.closest('.herotable').find('.general-search-input').remove();
        this.table.closest('.herotable').find('.control-layout').remove();
        this.table.unwrap().unwrap().unwrap();

        let origin_thead = '';
        this.header_rows_values.forEach((header_row) => {
            origin_thead+= header_row.origin_html;
        });
        this.header.html(origin_thead);

        let origin_tbody = '';
        this.body_rows_values.forEach((body_row) => {
            origin_tbody+= body_row.origin_html;
        });
        this.body.html(origin_tbody);

        let origin_tfoot = '';
        this.footer_rows_values.forEach((footer_row) => {
            origin_tfoot+= footer_row.origin_html;
        });
        this.footer.html(origin_tfoot);

        // to force remove the herotable elements from the table
        let remove_headers_stuff = '.header-search-input, .header-hide-icon, .header-sort-icon, .col-resizer';
        this.header.find(remove_headers_stuff).remove();

        delete this.table[0].herotable;
    }
});

$.fn.herotable = function(argument) {
    const mode = typeof argument == 'string'? argument : 'initialize';
    const options = (typeof argument == 'object' && argument != undefined)? argument : {};
    
    return this.each(function() {
        if(mode == 'initialize' && this.herotable) return;
        let instance = new Herotable(this, mode, options);
    });
};
