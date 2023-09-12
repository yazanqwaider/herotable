beforeAll(() => {
    document.body.innerHTML = 
    '<table>'+
        '<thead>'+
            '<tr>'+
                '<th>header col 1</th>'+
                '<th>header col 2</th>'+
            '</tr>'+
        '</thead>'+

        '<tbody>'+
            '<tr>'+
                '<td>body col 1.1</td>'+
                '<td>body col 1.2/td>'+
            '</tr>'+

            '<tr>'+
                '<td>body col 2.1</td>'+
                '<td>body col 2.2</td>'+
            '</tr>'+

            '<tr>'+
                '<td>body col 3.1</td>'+
                '<td>body col 3.2</td>'+
            '</tr>'+
            
            '<tr>'+
                '<td>body col 4.1</td>'+
                '<td>body col 4.2</td>'+
            '</tr>'+

            '<tr>'+
                '<td>body col 5.1</td>'+
                '<td>body col 5.2</td>'+
            '</tr>'+
        '</tbody>'+
    '</table>';
});


test('Check the first page has 3 rows in tbody', function() {
    let instance = $('table').herotable({
        withPagination: true,
        rowsPerPage: 3,
    });

    const rows = instance.find('tbody tr');
    expect(rows).toHaveLength(3);
});


test('Check the pages count is two', function() {
    let instance = $('table').herotable({
        withPagination: true,
        rowsPerPage: 3,
    });

    const paginate_btns = instance.closest('.herotable').find('.paginate-btn');
    expect(paginate_btns).toHaveLength(2);
});

test('Move to another page and make it active', function() {
    let instance = $('table').herotable({
        withPagination: true,
        rowsPerPage: 3,
    });

    const second_paginate_btn = instance.closest('.herotable').find('.paginate-btn[data-pageIndex="1"]').first();
    second_paginate_btn.trigger('click');
    const has_active_class = second_paginate_btn.hasClass('active-paginate-btn');
    expect(has_active_class).toBeTruthy();
    expect(+instance[0].herotable.active_page).toBe(1);
});