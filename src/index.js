$.fn.herotable = function() {
    const table = this;
    const header = table.find('thead tr');
    const body = table.find('tbody').clone();

    let header_rows_values = [];
    header.each((row_index, row) => {
        let header_row = {
            html: row.outerHTML,
            cols: [],
        };

        $(row).find('th').each((col_index, col) => {
            header_row.cols.push({
                html: col.outerHTML,
                value: $(col).text(),
                sort_by: null
            });
        });

        header_rows_values.push(header_row);
    });


    let body_rows_values = getBodyRowsValues();
    
    if(header) {
        header.find('th').each(function(header_col_index, header_col) {
            initializeSearchInput(header_col_index, header_col);
            initializeSortBtn(header_col_index, header_col);
        });
    }

    function getBodyRowsValues() {
        let body_rows_values = [];
        body.find('tr').each((row_index, row) => {
            let body_row = {
                html: row.outerHTML,
                cols: [],
            };

            $(row).find('td').each((col_index, col) => {
                body_row.cols.push({
                    html: col.outerHTML,
                    value: $(col).text()
                });
            });

            body_rows_values.push(body_row);
        });

        return body_rows_values;
    }

    function initializeSearchInput(header_col_index, header_col) {
        header_col = $(header_col);
        header_col.append('<input class="header-search-input">');

        // register the search input event
        const header_search_input = header_col.find('.header-search-input');
        header_search_input.on('keyup', function(e) {
                const value = $(this).val();
                let valid_rows = '';

                if(value) {
                    for (let i = 0; i < body_rows_values.length; i++) {
                        const col_value = body_rows_values[i].cols[header_col_index].value;
                        if(col_value.includes(value)) {
                            valid_rows+= body_rows_values[i].html;
                        }
                    }							

                }
                else {
                    for (let i = 0; i < body_rows_values.length; i++) {
                        valid_rows+= body_rows_values[i].html;
                    }			
                }

                table.find('tbody').html(valid_rows);
            });
    }

    function initializeSortBtn(header_col_index, header_col) {
        header_col = $(header_col);

        header_col.append('<span class="header-sort-icon"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 21 21"><path d="M8 10v4h4l-6 7-6-7h4v-4h-4l6-7 6 7h-4zm16 5h-10v2h10v-2zm0 6h-10v-2h10v2zm0-8h-10v-2h10v2zm0-4h-10v-2h10v2zm0-4h-10v-2h10v2z"/></svg></span>');

        // register the sort icon event
        const header_sort_icon = header_col.find('.header-sort-icon');
        header_sort_icon.on('click', function(e) {
            const old_sort_by = header_rows_values[0].cols[header_col_index].sort_by;
            let new_sort_by = (old_sort_by == 'asc')? 'desc' : 'asc';
            header_rows_values[0].cols[header_col_index].sort_by = new_sort_by;

            body_rows_values.sort(function(first, second) {
                const first_value = first.cols[header_col_index].value;
                const second_value = second.cols[header_col_index].value;

                if(new_sort_by == 'asc') {
                    return first_value.localeCompare(second_value);
                }
                return second_value.localeCompare(first_value);
            });

            let sorted_rows = '';
            body_rows_values.forEach((row_values, index) => sorted_rows+= row_values.html);

            table.find('tbody').html(sorted_rows);
        });
    }
};