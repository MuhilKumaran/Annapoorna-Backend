INSERT INTO menu_items (product_name, product_info)
VALUES (
    'Fruit & Nuts',
    JSON_OBJECT(
        'Product_Name', 'Fruit & Nuts',
        'Category', 'Sweets',
        'Flavours', 'Mango Kiwi Blueberry Strawberry Dates Fig Pineapple',
        'HSN_Code', '21069099',
        'Shelf_Life', '2 Months',
        'Description', JSON_OBJECT(
            'Logo', '',
            'Shelf_Life', '2 Months From MFD',	
            'Description', 'Dry Fruits such like Kiwi, Strawberry, ',
            'Ingredients', 'Kiwi, Strawberry, Cashewnut, Pistachio, Anjeer, Apricot, Rasins.',
            'Direction_of_Usage', 'Store in a tightly sealed container in cool and dry place away from exposure of sun light.'
        ),
        'Pricing', JSON_OBJECT(
            '250G', 393,
            '500G', 785,
            '1KG', 1570
        ),
        'SKU_ID', '',
        'Packing', ''
    )
);

UPDATE menu_items
        SET product_info = JSON_REMOVE(product_info, '$.Selling_Price')
        WHERE product_name = 'Kambu Pori';
