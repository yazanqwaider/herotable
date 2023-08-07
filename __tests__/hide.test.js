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
        '</tbody>'+
    '</table>';
});

test('Hide the first column', () => {
    let instance = $('table').herotable();
    const first_header_col_elm = $('table thead tr th').first();
    first_header_col_elm.find('.header-hide-icon').trigger('click');
    expect(first_header_col_elm.css('display')).toBe('none');

    const first_header_row = instance[0].herotable.header_rows_values[0];
    expect(first_header_row.cols[0].is_hidden).toBeTruthy();

    const body_rows = instance[0].herotable.body_rows_values;
    for(let i = 0; i < body_rows.length; i++) {
        expect(body_rows[i].cols[0].is_hidden).toBeTruthy();
    }
});
