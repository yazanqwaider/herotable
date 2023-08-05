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

test('Initialize the herotable instance', () => {
    let instance = $('table').herotable();
    expect(typeof(instance[0].herotable)).toBe('object');
});


test('Don\'t initialize herotable more thant one time on table', function() {
    let instance = $('table').herotable();
    let instance_2 = $('table').herotable();

    expect(instance[0].herotable).toBe(instance_2[0].herotable);
});


test('Check the body rows count', function() {
    let instance = $('table').herotable();
    expect(instance[0].herotable.body_rows_values).toHaveLength(2);
});