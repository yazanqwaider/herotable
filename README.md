# Herotable
Herotable is a plug-in for the jQuery Javascript library, to make your tables have the ability to filter, sort and hide and a lot of another features.

### Installing

```shell
npm install herotable
```

From CDN :

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/herotable@latest/dist/css/main.min.css">
```

```html
<script src="https://cdn.jsdelivr.net/npm/herotable@latest/dist/js/index.js"></script>
```

#### Note: 
You must import the jquery plugin before the herotable.

### Usage

```js
$('table').herotable();
```


with options :

```js
$('table').herotable({
    // options
});
```

#### Available options:
|       Name         |      Description     |
|--------------------| ---------------------|
|scrollableWrapper   | Make the table scrollable, Boolean (default: false)|
|columnSearch        | Enable searching on each column, Boolean (default: true)|
|columnResizer       | Enable resizing feature on columns, Boolean (default: true)|
|hideColumn          | Enalbe the hide column feature, Boolean (default: true) |
|noAvailableData     | When the table is empty, would you like to show the empty row or not, Boolean (default: true)|
|afterResizeCallback | You can call your callback function after column resizing, there is passed parameter to function is data contains on (new_width and col_index), function (default: null)|
|afterHideCallback   | You can call your callback function after column hiding, function (default: null)|
|lang                | Change the default text on elements, like (generalSearch, noAvailableData)|


Ex:

```js
$('table').herotable({
    afterHideCallback: function(data) {
        console.log(`Column index is: ${data.col_index}`);
        console.log(`New width is: ${data.new_width}`);
    },
    lang: {
        generalSearch: "Search on products",
    }
});
```


If you would like to destroy the herotable :
```js
let instance = $('table').herotable();
instance[0].herotable.destroy();
```