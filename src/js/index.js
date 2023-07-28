let Herotable = function(element, options) {
    this.herotable = this;
    this.table = $(element);
    this.header = this.table.find('thead tr');
    this.body = this.table.find('tbody');
    this.header_rows_values  = [];
    this.body_rows_values  = [];
    this.table_height = null;
    this.active_resizer_col = null;

    this.init();
}

$.extend(Herotable.prototype, {
    init: function() {
        // TODO: change the true to value from options
        const scrollable_class = (false)? 'scrollable-herotable-wrapper' : '';
        let herotable_wrapper = `<div class="herotable-wrapper ${scrollable_class}"></div>`;

        this.table.wrap(`<div class="herotable">${herotable_wrapper}</div>`);

        this.initializeGeneralSearchInput();

        this.table_height = this.table.outerHeight();
        this.header_rows_values = this.getHeaderRowsValues();
        this.body_rows_values = this.getBodyRowsValues();
        
        if(this.header) {
            const header_cols_length = $(this.header).find('th').length;
            this.header.find('th').each((header_col_index, header_col) => {
                this.initializeSearchInput(header_col_index, header_col);
                this.initializeHideBtn(header_col_index, header_col);
                this.initializeSortBtn(header_col_index, header_col);
                this.initializeResizer(header_col_index, header_col, header_cols_length);
            });
    
            this.recalculateResizerHeight();
        }
    },

    getHeaderRowsValues: function() {
        let header_rows_values = [];
        this.header.each((row_index, row) => {
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
                    is_hidden: false
                });
            });
    
            header_rows_values.push(header_row);
        });

        return header_rows_values;
    },

    getBodyRowsValues: function() {
        let body_rows_values = [];
        this.body.find('tr').each((row_index, row) => {
            let body_row = {
                origin_html: row.outerHTML,
                html: row.outerHTML,
                cols: [],
            };

            $(row).find('td').each((col_index, col) => {
                const colspan = $(col).attr('colspan') || 1;
                
                for (let i = 0; i < colspan; i++) {
                    body_row.cols.push({
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
    
    updateNewHtmlForHeaderRows() {
        this.header.each((row_index, row) => {
            this.header_rows_values[row_index].html = $(row)[0].outerHTML;

            $(row).find('th').each((col_index, col) => {
                this.header_rows_values[row_index].cols[col_index].html = col.outerHTML;
            });
        });
    },

    updateNewHtmlForBodyRows: function() {
        this.body.find('tr').each((row_index, row) => {
            this.body_rows_values[row_index].html = row.outerHTML,

            $(row).find('td').each((col_index, col) => {
                this.body_rows_values[row_index].cols[col_index].html = col.outerHTML;
            });
        });
    },

    initializeGeneralSearchInput: function() {
        const general_input = $('<input type="search" class="general-search-input">');
        this.table.closest('.herotable').prepend(general_input);

        general_input.on('keyup search', (e) => {
            const value = e.target.value;
            let valid_rows = '';

            if(value) {
                for (let i = 0; i < this.body_rows_values.length; i++) {
                    const row_cols = this.body_rows_values[i].cols;
                    for (let col_index = 0; col_index < row_cols.length; col_index++) {
                        const col_value = row_cols[col_index].value;

                        if(col_value.includes(value)) {
                            valid_rows+= this.body_rows_values[i].html;
                            break;
                        }
                    }
                }
            }
            else {
                for (let i = 0; i < this.body_rows_values.length; i++) {
                    valid_rows+= this.body_rows_values[i].html;
                }			
            }

            this.table.find('tbody').html(valid_rows);
            this.recalculateResizerHeight();
        });
    },
  
    initializeSearchInput: function(header_col_index, header_col) {
        header_col = $(header_col);
        header_col.append('<input type="search" class="header-search-input">');

        // register the search input event
        const header_search_input = header_col.find('.header-search-input');
        header_search_input.on('keyup search', (e) => {
                const value = e.target.value;
                let valid_rows = '';

                if(value) {
                    for (let i = 0; i < this.body_rows_values.length; i++) {
                        if(header_col_index <= this.body_rows_values[i].cols.length - 1) {
                            const col_value = this.body_rows_values[i].cols[header_col_index].value;
                            if(col_value.includes(value)) {
                                valid_rows+= this.body_rows_values[i].html;
                            }
                        }
                    }
                }
                else {
                    for (let i = 0; i < this.body_rows_values.length; i++) {
                        valid_rows+= this.body_rows_values[i].html;
                    }			
                }

                this.table.find('tbody').html(valid_rows);
                this.recalculateResizerHeight();
            });
    },

    initializeHideBtn: function(header_col_index, header_col) {
        header_col = $(header_col);

        const hide_sort_icon = '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" height="20" width="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m17.069 6.546 2.684-2.359c.143-.125.32-.187.497-.187.418 0 .75.34.75.75 0 .207-.086.414-.254.562l-16.5 14.501c-.142.126-.319.187-.496.187-.415 0-.75-.334-.75-.75 0-.207.086-.414.253-.562l2.438-2.143c-1.414-1.132-2.627-2.552-3.547-4.028-.096-.159-.144-.338-.144-.517s.049-.358.145-.517c2.111-3.39 5.775-6.483 9.853-6.483 1.815 0 3.536.593 5.071 1.546zm2.319 1.83c.966.943 1.803 2.014 2.474 3.117.092.156.138.332.138.507s-.046.351-.138.507c-2.068 3.403-5.721 6.493-9.864 6.493-1.297 0-2.553-.313-3.729-.849l1.247-1.096c.795.285 1.626.445 2.482.445 3.516 0 6.576-2.622 8.413-5.5-.595-.932-1.318-1.838-2.145-2.637zm-3.434 3.019c.03.197.046.399.046.605 0 2.208-1.792 4-4 4-.384 0-.756-.054-1.107-.156l1.58-1.389c.895-.171 1.621-.821 1.901-1.671zm-.058-3.818c-1.197-.67-2.512-1.077-3.898-1.077-3.465 0-6.533 2.632-8.404 5.5.853 1.308 1.955 2.567 3.231 3.549l1.728-1.519c-.351-.595-.553-1.289-.553-2.03 0-2.208 1.792-4 4-4 .925 0 1.777.315 2.455.843zm-2.6 2.285c-.378-.23-.822-.362-1.296-.362-1.38 0-2.5 1.12-2.5 2.5 0 .36.076.701.213 1.011z" fill-rule="nonzero"/></svg>';
        header_col.append(`<span class="header-hide-icon">${hide_sort_icon}</span>`);

        // register the search input event
        const header_hide_icon = header_col.find('.header-hide-icon');
        header_hide_icon.on('click', () => {
            // check if there and body column in the same index is not valid,
            // such as it is colspan or it is not exist.
            const invalid_col = this.body_rows_values.find((body_row) => {
                return header_col_index > body_row.cols.length - 1 || body_row.cols[header_col_index].is_colspan;
            });

            if(invalid_col) {
                alert('There are invalid columns, please remove the colspan or add the missing column to fix it.');
                return false;
            }

            header_col.hide();
            this.header_rows_values[0].cols[header_col_index].is_hidden = true;

            this.body_rows_values.forEach((body_row, body_row_index) => {
                this.table.find(`tbody tr:eq(${body_row_index}) td:eq(${header_col_index})`).hide();
                body_row.cols[header_col_index].is_hidden = true;
            });
        });
    },

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

        // register the sort icon event
        const header_sort_icon = header_col.find('.header-sort-icon');
        let self = this;
        header_sort_icon.on('click', function() {
            const old_sort_by = self.header_rows_values[0].cols[header_col_index].sort_by;
            let new_sort_by = (old_sort_by == 'asc')? 'desc' : 'asc';
            self.header_rows_values[0].cols[header_col_index].sort_by = new_sort_by;
            $(this).html(sorting_icons_map[new_sort_by]);

            self.body_rows_values.sort(function(first, second) {
                if(header_col_index <= first.cols.length - 1 && header_col_index <= second.cols.length - 1) {
                    const first_value = first.cols[header_col_index].value;
                    const second_value = second.cols[header_col_index].value;
    
                    if(new_sort_by == 'asc') {
                        return first_value.localeCompare(second_value);
                    }
                    return second_value.localeCompare(first_value);
                }
                else {
                    console.error("The row has incorrect columns count.");
                    return -1;
                }
            });

            let sorted_rows = '';
            self.body_rows_values.forEach((row_values, index) => sorted_rows+= row_values.html);

            self.table.find('tbody').html(sorted_rows);
        });
    },

    initializeResizer: function(header_col_index, header_col, header_cols_length) {
        if(header_col_index < header_cols_length - 1) {
            $(header_col).append(`<div class="col-resizer" style="height: ${this.table_height}px"></div>`);
        }

        let x = 0;
        let width = 0;
        let self = this;
        $(header_col).find('.col-resizer').on('mousedown', function(e) {
            if(self.active_resizer_col == null) {
                self.active_resizer_col = $(this).parent();
                x = e.clientX;
                width = self.active_resizer_col.width();
                
                self.active_resizer_col.css({
                    'min-width': 'unset', 
                    'max-width': 'unset',
                    'width': width
                });

                const body_cols = self.table.find('tbody tr').find(`td:eq(${header_col_index})`);
                body_cols.css({'min-width': width, 'max-width': width, 'width': width});
                
                $(document).on('mousemove', function(e) {
                    const newClientX = e.clientX;
                    const new_width = width + newClientX - x;

                    self.active_resizer_col.css({'width': new_width, 'min-width': new_width, 'max-width': new_width});

                    body_cols.css({'width': new_width, 'min-width': new_width, 'max-width': new_width});
                });    

                $(document).on('mouseup', function(e) {
                    $(document).off('mousemove');
                    $(document).off('mouseup');
                    self.active_resizer_col = null;

                    self.updateNewHtmlForHeaderRows();
                    self.updateNewHtmlForBodyRows();
                });
            }
        });
    },

    recalculateResizerHeight: function() {
        this.table_height = this.table.outerHeight();
        this.table.find('.col-resizer').each((index, resizer) => {
            $(resizer).height(this.table_height);
        });
    },
    
    destroy: function() {
        this.table.closest('.herotable').find('.general-search-input').remove();
        this.table.unwrap().unwrap();

        let origin_header = '';
        this.header_rows_values.forEach((header_row) => {
            origin_header+= header_row.origin_html;
        });
        this.table.find('thead').html(origin_header);


        let origin_body = '';
        this.body_rows_values.forEach((body_row) => {
            origin_body+= body_row.origin_html;
        });
        this.body.html(origin_body);
    }
});

$.fn.herotable = function() {
    return this.each(function() {
        if(this.herotable) return;
        
        var instance = new Herotable(this, {});
        $.extend(this, instance);
    });
};
