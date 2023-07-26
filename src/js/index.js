$.fn.herotable = function() {
    this.each(function() {
        const table = $(this);
        const header = table.find('thead tr');
        const body = table.find('tbody').clone();
        
        // TODO: change the true to value from options
        const scrollable_class = (true)? 'scrollable-herotable-wrapper' : '';
        let herotable_wrapper = `<div class="herotable-wrapper ${scrollable_class}"></div>`;

        table.wrap(`<div class="herotable">${herotable_wrapper}</div>`);
        initializeGeneralSearchInput();
    
        let table_height = table.outerHeight();
        let active_resizer_col = null;
    
        let header_rows_values = [];
        header.each((row_index, row) => {
            let header_row = {
                html: $(row)[0].outerHTML,
                cols: [],
            };
    
            $(row).find('th').each((col_index, col) => {
                header_row.cols.push({
                    html: col.outerHTML,
                    value: $(col).text(),
                    sort_by: ''
                });
            });
    
            header_rows_values.push(header_row);
        });
    
    
        let body_rows_values = getBodyRowsValues();
        
        if(header) {
            const header_cols_length = $(header).find('th').length;
            header.find('th').each(function(header_col_index, header_col) {
                initializeSearchInput(header_col_index, header_col);
                initializeSortBtn(header_col_index, header_col);
                initializeResizer(header_col_index, header_col, header_cols_length);
            });
    
            recalculateResizerHeight();
        }
    
        function getBodyRowsValues() {
            let body_rows_values = [];
            body.find('tr').each((row_index, row) => {
                let body_row = {
                    html: row.outerHTML,
                    cols: [],
                };
    
                $(row).find('td').each((col_index, col) => {
                    const colspan = $(col).attr('colspan') || 1;
                    
                    for (let i = 0; i < colspan; i++) {
                        body_row.cols.push({
                            html: col.outerHTML,
                            value: $(col).text(),
                            original: i == 0
                        });
                    }
                });
    
                body_rows_values.push(body_row);
            });
    
            return body_rows_values;
        }

        function initializeGeneralSearchInput() {
            const general_input = $('<input type="search" class="general-search-input">');
            table.closest('.herotable').prepend(general_input);

            general_input.on('keyup search', function(e) {
                const value = $(this).val();
                let valid_rows = '';

                if(value) {
                    for (let i = 0; i < body_rows_values.length; i++) {
                        const row_cols = body_rows_values[i].cols;
                        for (let col_index = 0; col_index < row_cols.length; col_index++) {
                            const col_value = row_cols[col_index].value;

                            if(col_value.includes(value)) {
                                valid_rows+= body_rows_values[i].html;
                                break;
                            }
                        }
                    }
                }
                else {
                    for (let i = 0; i < body_rows_values.length; i++) {
                        valid_rows+= body_rows_values[i].html;
                    }			
                }

                table.find('tbody').html(valid_rows);
                recalculateResizerHeight();
            });
        }
    
        function initializeSearchInput(header_col_index, header_col) {
            header_col = $(header_col);
            header_col.append('<input type="search" class="header-search-input">');
    
            // register the search input event
            const header_search_input = header_col.find('.header-search-input');
            header_search_input.on('keyup search', function(e) {
                    const value = $(this).val();
                    let valid_rows = '';
    
                    if(value) {
                        for (let i = 0; i < body_rows_values.length; i++) {
                            if(header_col_index <= body_rows_values[i].cols.length - 1) {
                                const col_value = body_rows_values[i].cols[header_col_index].value;
                                if(col_value.includes(value)) {
                                    valid_rows+= body_rows_values[i].html;
                                }
                            }
                        }
                    }
                    else {
                        for (let i = 0; i < body_rows_values.length; i++) {
                            valid_rows+= body_rows_values[i].html;
                        }			
                    }
    
                    table.find('tbody').html(valid_rows);
                    recalculateResizerHeight();
                });
        }
    
        function initializeSortBtn(header_col_index, header_col) {
            header_col = $(header_col);
    
            const unsorted_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M12 3.202l3.839 4.798h-7.678l3.839-4.798zm0-3.202l-8 10h16l-8-10zm3.839 16l-3.839 4.798-3.839-4.798h7.678zm4.161-2h-16l8 10 8-10z"/></svg>';
            const asc_sort_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M12 0l-8 10h16l-8-10zm3.839 16l-3.839 4.798-3.839-4.798h7.678zm4.161-2h-16l8 10 8-10z"/></svg>';
            const desc_sort_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M12 3.202l3.839 4.798h-7.678l3.839-4.798zm0-3.202l-8 10h16l-8-10zm8 14h-16l8 10 8-10z"/></svg>';

            const sorting_icons_map = {
                '': unsorted_icon,
                'asc': asc_sort_icon,
                'desc': desc_sort_icon,
            };

            const first_sort_by = header_rows_values[0].cols[header_col_index].sort_by;
            header_col.append(`<span class="header-sort-icon">${sorting_icons_map[first_sort_by]}</span>`);
    
            // register the sort icon event
            const header_sort_icon = header_col.find('.header-sort-icon');
            header_sort_icon.on('click', function(e) {
                const old_sort_by = header_rows_values[0].cols[header_col_index].sort_by;
                let new_sort_by = (old_sort_by == 'asc')? 'desc' : 'asc';
                header_rows_values[0].cols[header_col_index].sort_by = new_sort_by;
                $(this).html(sorting_icons_map[new_sort_by]);

                body_rows_values.sort(function(first, second) {
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
                body_rows_values.forEach((row_values, index) => sorted_rows+= row_values.html);
    
                table.find('tbody').html(sorted_rows);
            });
        }
    
        function initializeResizer(header_col_index, header_col, header_cols_length) {
            if(header_col_index < header_cols_length - 1) {
                $(header_col).append(`<div class="col-resizer" style="height: ${table_height}px"></div>`);
            }
    
            let x = 0;
            let width = 0;
            $(header_col).find('.col-resizer').on('mousedown', function(e) {
                if(active_resizer_col == null) {
                    active_resizer_col = $(this).parent();
                    x = e.clientX;
                    width = active_resizer_col.width();
                    
                    $(document).on('mousemove', function(e) {
                        const newClientX = e.clientX;
                        active_resizer_col.css('width', width + newClientX - x);
                    });    
    
                    $(document).on('mouseup', function(e) {
                        $(document).off('mousemove');
                        $(document).off('mouseup');
                        active_resizer_col = null;
                    });   
                }
            });
        }
    
        function recalculateResizerHeight() {
            table_height = table.outerHeight();
            table.find('.col-resizer').each(function(index, resizer) {
                $(resizer).height(table_height);
            });
        }
    });
};