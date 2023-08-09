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


test('Search on first column, and the target text is exist', function() {
    let instance = $('table').herotable();
    const target_text = instance.find('tbody tr td').first().text();
    instance.closest('.herotable').find('.general-search-input').val(target_text).trigger('keyup');
    const results = instance.find('tbody tr');
    expect(results).toHaveLength(1);
});


test('Search on first column, and the target text doesn\'t exist, and the (no data row) is enabled', function() {
    let instance = $('table').herotable();
    const target_text = "Hello, I am strange text";
    instance.closest('.herotable').find('.general-search-input').val(target_text).trigger('keyup');
    const results = instance.find('tbody tr');
    
    if(instance[0].herotable.options.noAvailableData) {
        expect(results).toHaveLength(1);
    }
    else {
        expect(results).toHaveLength(0);
    }
});