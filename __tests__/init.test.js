beforeAll(() => {
    document.body.innerHTML = 
    '<table>'+
        '<thead>'+
            '<tr>'+
                '<th>1</th>'+
                '<th>2</th>'+
            '</tr>'+
        '</thead>'+

        '<tbody>'+
            '<tr>'+
                '<td>1</td>'+
                '<td>2</td>'+
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