declare @password_hash nvarchar(300) = 'pbkdf2_sha256$100000$pos-coffee-demo-salt$0484010410ac18f18f20c7d65b528687fbdb2fc0b4630053f5246df912935ff1';

insert into profiles (id, full_name, email, password_hash, role)
values
('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@example.com', @password_hash, 'admin'),
('22222222-2222-2222-2222-222222222222', 'Manager User', 'manager@example.com', @password_hash, 'manager'),
('33333333-3333-3333-3333-333333333333', 'Cashier User', 'cashier@example.com', @password_hash, 'cashier'),
('44444444-4444-4444-4444-444444444444', 'Barista User', 'barista@example.com', @password_hash, 'barista');

insert into store_settings (store_name)
values ('Coffee POS');

insert into categories (id, name, description, sort_order) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Coffee', 'Espresso-based and brewed coffee drinks', 1),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Tea', 'Tea and non-coffee beverages', 2),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Bakery', 'Bakery and small food items', 3);

insert into products (id, category_id, sku, name, description, price, cost, sort_order)
values
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'LATTE', 'Latte', 'Espresso with steamed milk', 85, 35, 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'AMERICANO', 'Americano', 'Espresso with water', 70, 25, 2),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'MATCHA-LATTE', 'Matcha Latte', 'Matcha with milk', 95, 40, 3),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'CROISSANT', 'Butter Croissant', 'Classic butter croissant', 65, 30, 1);

insert into modifier_groups (id, name, is_required, min_select, max_select, sort_order) values
('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'Cup Size', 1, 1, 1, 1),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'Temperature', 1, 1, 1, 2),
('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'Sweetness', 1, 1, 1, 3),
('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'Milk Type', 0, 0, 1, 4),
('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'Add-ons', 0, 0, 3, 5);

insert into modifier_options (modifier_group_id, name, price_delta, sort_order) values
('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'Small', 0, 1),
('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'Medium', 10, 2),
('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'Large', 20, 3),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'Hot', 0, 1),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'Iced', 0, 2),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'Frappe', 10, 3),
('cccccccc-cccc-cccc-cccc-ccccccccccc3', '0%', 0, 1),
('cccccccc-cccc-cccc-cccc-ccccccccccc3', '25%', 0, 2),
('cccccccc-cccc-cccc-cccc-ccccccccccc3', '50%', 0, 3),
('cccccccc-cccc-cccc-cccc-ccccccccccc3', '75%', 0, 4),
('cccccccc-cccc-cccc-cccc-ccccccccccc3', '100%', 0, 5),
('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'Fresh Milk', 0, 1),
('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'Oat Milk', 20, 2),
('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'Soy Milk', 15, 3),
('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'Extra Shot', 20, 1),
('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'Syrup', 10, 2),
('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'Whipped Cream', 15, 3);

insert into product_modifier_groups (product_id, modifier_group_id)
select p.id, mg.id
from products p
cross join modifier_groups mg
where p.sku in ('LATTE', 'AMERICANO', 'MATCHA-LATTE')
  and mg.name in ('Cup Size', 'Temperature', 'Sweetness', 'Milk Type', 'Add-ons');
