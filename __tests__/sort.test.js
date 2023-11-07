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


test('Sort the first column ascendingly', function() {
    let instance = $('table').herotable();
    instance.find('thead tr th .header-sort-icon').first().trigger('click');
    const first_body_col = instance.find('tbody tr td').first().text();
    expect(first_body_col).toBe('body col 1.1');
});

test('Sort the first column descendingly', function() {
    let instance = $('table').herotable();
    const first_header_row_col = instance.find('thead tr th .header-sort-icon').first();

    first_header_row_col.trigger('click');
    setTimeout(() => {
        first_header_row_col.trigger('click');
        const first_body_row_col = instance.find('tbody tr td').first();
        expect(first_body_row_col.text()).toBe('body col 2.1');
    }, 100);
});
