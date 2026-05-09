create table profiles (
  id uniqueidentifier not null default newid(),
  auth_user_id uniqueidentifier not null default newid(),
  full_name nvarchar(160) not null,
  email nvarchar(320) not null,
  password_hash nvarchar(300) not null,
  phone nvarchar(40) null,
  role nvarchar(20) not null,
  is_active bit not null default 1,
  created_at datetimeoffset not null default sysdatetimeoffset(),
  updated_at datetimeoffset not null default sysdatetimeoffset(),
  constraint PK_profiles primary key (id),
  constraint UQ_profiles_auth_user_id unique (auth_user_id),
  constraint UQ_profiles_email unique (email),
  constraint CK_profiles_role check (role in ('admin', 'manager', 'cashier', 'barista'))
);

create table staff_sessions (
  id uniqueidentifier not null,
  profile_id uniqueidentifier not null,
  expires_at datetimeoffset not null,
  created_at datetimeoffset not null default sysdatetimeoffset(),
  constraint PK_staff_sessions primary key (id),
  constraint FK_staff_sessions_profiles foreign key (profile_id) references profiles(id) on delete cascade
);

create table categories (
  id uniqueidentifier not null default newid(),
  name nvarchar(120) not null,
  description nvarchar(500) null,
  sort_order int not null default 0,
  is_active bit not null default 1,
  created_at datetimeoffset not null default sysdatetimeoffset(),
  updated_at datetimeoffset not null default sysdatetimeoffset(),
  constraint PK_categories primary key (id)
);

create table products (
  id uniqueidentifier not null default newid(),
  category_id uniqueidentifier not null,
  sku nvarchar(80) not null,
  name nvarchar(160) not null,
  description nvarchar(500) null,
  image_url nvarchar(1000) null,
  price decimal(12,2) not null,
  cost decimal(12,2) not null default 0,
  is_available bit not null default 1,
  is_archived bit not null default 0,
  track_stock bit not null default 0,
  sort_order int not null default 0,
  created_at datetimeoffset not null default sysdatetimeoffset(),
  updated_at datetimeoffset not null default sysdatetimeoffset(),
  constraint PK_products primary key (id),
  constraint FK_products_categories foreign key (category_id) references categories(id),
  constraint UQ_products_sku unique (sku),
  constraint CK_products_price check (price > 0),
  constraint CK_products_cost check (cost >= 0)
);

create table modifier_groups (
  id uniqueidentifier not null default newid(),
  name nvarchar(120) not null,
  is_required bit not null default 0,
  min_select int not null default 0,
  max_select int not null default 1,
  is_active bit not null default 1,
  sort_order int not null default 0,
  constraint PK_modifier_groups primary key (id),
  constraint CK_modifier_groups_min_select check (min_select >= 0),
  constraint CK_modifier_groups_max_select check (max_select >= 1)
);

create table modifier_options (
  id uniqueidentifier not null default newid(),
  modifier_group_id uniqueidentifier not null,
  name nvarchar(120) not null,
  price_delta decimal(12,2) not null default 0,
  is_active bit not null default 1,
  sort_order int not null default 0,
  constraint PK_modifier_options primary key (id),
  constraint FK_modifier_options_modifier_groups foreign key (modifier_group_id) references modifier_groups(id) on delete cascade
);

create table product_modifier_groups (
  id uniqueidentifier not null default newid(),
  product_id uniqueidentifier not null,
  modifier_group_id uniqueidentifier not null,
  constraint PK_product_modifier_groups primary key (id),
  constraint FK_product_modifier_groups_products foreign key (product_id) references products(id) on delete cascade,
  constraint FK_product_modifier_groups_modifier_groups foreign key (modifier_group_id) references modifier_groups(id) on delete cascade,
  constraint UQ_product_modifier_groups unique (product_id, modifier_group_id)
);

create table orders (
  id uniqueidentifier not null default newid(),
  order_number nvarchar(40) not null,
  receipt_number nvarchar(40) not null,
  customer_id uniqueidentifier null,
  cashier_id uniqueidentifier not null,
  status nvarchar(20) not null default 'pending',
  payment_status nvarchar(20) not null default 'unpaid',
  subtotal decimal(12,2) not null default 0,
  discount_amount decimal(12,2) not null default 0,
  vat_amount decimal(12,2) not null default 0,
  service_charge_amount decimal(12,2) not null default 0,
  total_amount decimal(12,2) not null default 0,
  order_type nvarchar(30) not null default 'in_store',
  note nvarchar(1000) null,
  created_at datetimeoffset not null default sysdatetimeoffset(),
  updated_at datetimeoffset not null default sysdatetimeoffset(),
  constraint PK_orders primary key (id),
  constraint UQ_orders_order_number unique (order_number),
  constraint UQ_orders_receipt_number unique (receipt_number),
  constraint FK_orders_profiles foreign key (cashier_id) references profiles(id),
  constraint CK_orders_status check (status in ('pending', 'preparing', 'ready', 'completed', 'cancelled', 'refunded')),
  constraint CK_orders_payment_status check (payment_status in ('unpaid', 'paid', 'refunded', 'failed'))
);

create table order_items (
  id uniqueidentifier not null default newid(),
  order_id uniqueidentifier not null,
  product_id uniqueidentifier not null,
  product_name nvarchar(160) not null,
  quantity int not null,
  base_price decimal(12,2) not null,
  modifier_total decimal(12,2) not null default 0,
  unit_price decimal(12,2) not null,
  total_price decimal(12,2) not null,
  note nvarchar(500) null,
  constraint PK_order_items primary key (id),
  constraint FK_order_items_orders foreign key (order_id) references orders(id) on delete cascade,
  constraint FK_order_items_products foreign key (product_id) references products(id),
  constraint CK_order_items_quantity check (quantity > 0)
);

create table order_item_modifiers (
  id uniqueidentifier not null default newid(),
  order_item_id uniqueidentifier not null,
  modifier_group_name nvarchar(120) not null,
  modifier_option_name nvarchar(120) not null,
  price_delta decimal(12,2) not null default 0,
  constraint PK_order_item_modifiers primary key (id),
  constraint FK_order_item_modifiers_order_items foreign key (order_item_id) references order_items(id) on delete cascade
);

create table payments (
  id uniqueidentifier not null default newid(),
  order_id uniqueidentifier not null,
  payment_method nvarchar(30) not null,
  amount decimal(12,2) not null,
  received_amount decimal(12,2) null,
  change_amount decimal(12,2) null,
  status nvarchar(20) not null default 'paid',
  transaction_ref nvarchar(160) null,
  paid_at datetimeoffset not null default sysdatetimeoffset(),
  created_by uniqueidentifier not null,
  constraint PK_payments primary key (id),
  constraint FK_payments_orders foreign key (order_id) references orders(id) on delete cascade,
  constraint FK_payments_profiles foreign key (created_by) references profiles(id),
  constraint CK_payments_method check (payment_method in ('cash', 'promptpay_qr', 'qr_payment', 'credit_card', 'e_wallet')),
  constraint CK_payments_status check (status in ('unpaid', 'paid', 'refunded', 'failed')),
  constraint CK_payments_amount check (amount >= 0)
);

create table store_settings (
  id uniqueidentifier not null default newid(),
  store_name nvarchar(160) not null default 'Coffee POS',
  logo_url nvarchar(1000) null,
  address nvarchar(500) null,
  phone nvarchar(40) null,
  tax_id nvarchar(80) null,
  currency nvarchar(10) not null default 'THB',
  timezone nvarchar(80) not null default 'Asia/Bangkok',
  vat_enabled bit not null default 1,
  vat_rate decimal(5,2) not null default 7,
  service_charge_enabled bit not null default 0,
  service_charge_rate decimal(5,2) not null default 0,
  receipt_prefix nvarchar(20) not null default 'R',
  receipt_footer nvarchar(300) not null default 'Thank you',
  printer_paper_size nvarchar(20) not null default '80mm',
  updated_at datetimeoffset not null default sysdatetimeoffset(),
  constraint PK_store_settings primary key (id)
);

create index IX_categories_active_sort on categories (is_active, sort_order);
create index IX_products_catalog on products (is_archived, is_available, category_id, sort_order);
create index IX_orders_cashier_created on orders (cashier_id, created_at desc);
create index IX_orders_status_created on orders (payment_status, status, created_at);
create index IX_order_items_order on order_items (order_id);
create index IX_payments_order on payments (order_id);
create index IX_staff_sessions_expires_at on staff_sessions (expires_at);
