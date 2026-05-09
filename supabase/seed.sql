insert into public.categories (name, description, sort_order) values
('Coffee', 'Espresso-based and brewed coffee drinks', 1),
('Tea', 'Tea and non-coffee beverages', 2),
('Bakery', 'Bakery and small food items', 3);

insert into public.products (category_id, sku, name, description, price, cost, sort_order)
select id, 'LATTE', 'Latte', 'Espresso with steamed milk', 85, 35, 1
from public.categories
where name = 'Coffee';

insert into public.products (category_id, sku, name, description, price, cost, sort_order)
select id, 'AMERICANO', 'Americano', 'Espresso with water', 70, 25, 2
from public.categories
where name = 'Coffee';

insert into public.products (category_id, sku, name, description, price, cost, sort_order)
select id, 'MATCHA-LATTE', 'Matcha Latte', 'Matcha with milk', 95, 40, 3
from public.categories
where name = 'Tea';

insert into public.products (category_id, sku, name, description, price, cost, sort_order)
select id, 'CROISSANT', 'Butter Croissant', 'Classic butter croissant', 65, 30, 1
from public.categories
where name = 'Bakery';

insert into public.modifier_groups (name, is_required, min_select, max_select, sort_order) values
('Cup Size', true, 1, 1, 1),
('Temperature', true, 1, 1, 2),
('Sweetness', true, 1, 1, 3),
('Milk Type', false, 0, 1, 4),
('Add-ons', false, 0, 3, 5);

insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Small', 0, 1 from public.modifier_groups where name = 'Cup Size';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Medium', 10, 2 from public.modifier_groups where name = 'Cup Size';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Large', 20, 3 from public.modifier_groups where name = 'Cup Size';

insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Hot', 0, 1 from public.modifier_groups where name = 'Temperature';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Iced', 0, 2 from public.modifier_groups where name = 'Temperature';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Frappe', 10, 3 from public.modifier_groups where name = 'Temperature';

insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, '0%', 0, 1 from public.modifier_groups where name = 'Sweetness';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, '25%', 0, 2 from public.modifier_groups where name = 'Sweetness';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, '50%', 0, 3 from public.modifier_groups where name = 'Sweetness';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, '75%', 0, 4 from public.modifier_groups where name = 'Sweetness';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, '100%', 0, 5 from public.modifier_groups where name = 'Sweetness';

insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Fresh Milk', 0, 1 from public.modifier_groups where name = 'Milk Type';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Oat Milk', 20, 2 from public.modifier_groups where name = 'Milk Type';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Soy Milk', 15, 3 from public.modifier_groups where name = 'Milk Type';

insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Extra Shot', 20, 1 from public.modifier_groups where name = 'Add-ons';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Syrup', 10, 2 from public.modifier_groups where name = 'Add-ons';
insert into public.modifier_options (modifier_group_id, name, price_delta, sort_order)
select id, 'Whipped Cream', 15, 3 from public.modifier_groups where name = 'Add-ons';

insert into public.product_modifier_groups (product_id, modifier_group_id)
select products.id, modifier_groups.id
from public.products
cross join public.modifier_groups
where products.sku in ('LATTE', 'AMERICANO', 'MATCHA-LATTE')
  and modifier_groups.name in ('Cup Size', 'Temperature', 'Sweetness', 'Milk Type', 'Add-ons');

