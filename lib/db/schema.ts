// PostgreSQL schema; review generated migrations for policies, grants, and triggers.
import type { Json } from "./json";
import { pgTable, unique, pgPolicy, check, bigint, text, boolean, integer, timestamp, index, foreignKey, uniqueIndex, uuid, numeric, jsonb, date, pgSchema } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const privateSchema = pgSchema("private");


export const brands = pgTable("brands", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "brands_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	code: text().notNull(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("brands_code_key").on(table.code),
	pgPolicy("brands_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("brands_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("is_published") }),
	check("brands_code_format", sql.raw("(code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)")),
	check("brands_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const brand_translations = pgTable("brand_translations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "brand_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	brand_id: bigint({ mode: "number" }).notNull(),
	locale: text().$type<"fa" | "en">().notNull(),
	name: text().notNull(),
	description: text(),
	slug: text().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("brand_translations_brand_id_idx").using("btree", table.brand_id.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.brand_id],
			foreignColumns: [brands.id],
			name: "brand_translations_brand_id_fkey"
		}).onDelete("cascade"),
	unique("brand_translations_brand_id_locale_key").on(table.brand_id, table.locale),
	unique("brand_translations_locale_slug_key").on(table.locale, table.slug),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("brand_translations_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("brand_translations_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(EXISTS ( SELECT 1\n   FROM brands\n  WHERE ((brands.id = brand_translations.brand_id) AND brands.is_published)))") }),
	check("brand_translations_locale_check", sql.raw("(locale = ANY (ARRAY['fa'::text, 'en'::text]))")),
	check("brand_translations_slug_format", sql.raw("(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)")),
]).enableRLS();

export const product_categories = pgTable("product_categories", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "product_categories_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	brand_id: bigint({ mode: "number" }).notNull(),
	code: text().notNull(),
	icon_key: text().notNull(),
	accent_color: text().default(sql.raw("'#164B82'::text")).notNull(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_categories_brand_position_idx").using("btree", table.brand_id.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")).where(sql`is_published`),
	foreignKey({
			columns: [table.brand_id],
			foreignColumns: [brands.id],
			name: "product_categories_brand_id_fkey"
		}).onDelete("restrict"),
	unique("product_categories_code_key").on(table.code),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("product_categories_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("product_categories_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(is_published AND (EXISTS ( SELECT 1\n   FROM brands\n  WHERE ((brands.id = product_categories.brand_id) AND brands.is_published))))") }),
	check("product_categories_accent_color_format", sql.raw("(accent_color ~ '^#[0-9A-Fa-f]{6}$'::text)")),
	check("product_categories_code_format", sql.raw("(code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)")),
	check("product_categories_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const product_category_translations = pgTable("product_category_translations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "product_category_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	category_id: bigint({ mode: "number" }).notNull(),
	locale: text().$type<"fa" | "en">().notNull(),
	name: text().notNull(),
	description: text(),
	slug: text().notNull(),
	seo_title: text(),
	seo_description: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_category_translations_category_id_idx").using("btree", table.category_id.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.category_id],
			foreignColumns: [product_categories.id],
			name: "product_category_translations_category_id_fkey"
		}).onDelete("cascade"),
	unique("product_category_translations_category_id_locale_key").on(table.category_id, table.locale),
	unique("product_category_translations_locale_slug_key").on(table.locale, table.slug),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("product_category_translations_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(EXISTS ( SELECT 1\n   FROM product_categories\n  WHERE ((product_categories.id = product_category_translations.category_id) AND product_categories.is_published)))") }),
	pgPolicy("product_category_translations_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	check("product_category_translations_locale_check", sql.raw("(locale = ANY (ARRAY['fa'::text, 'en'::text]))")),
	check("product_category_translations_slug_format", sql.raw("(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)")),
]).enableRLS();

export const products = pgTable("products", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "products_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	brand_id: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	category_id: bigint({ mode: "number" }).notNull(),
	sku: text(),
	image_url: text(),
	datasheet_url: text(),
	is_featured: boolean().default(sql.raw("false")).notNull(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	published_at: timestamp({ withTimezone: true, mode: 'string' }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("products_brand_id_idx").using("btree", table.brand_id.asc().nullsLast().op("int8_ops")),
	index("products_category_position_idx").using("btree", table.category_id.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")).where(sql`is_published`),
	index("products_featured_position_idx").using("btree", table.is_featured.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")).where(sql`is_published`),
	foreignKey({
			columns: [table.brand_id],
			foreignColumns: [brands.id],
			name: "products_brand_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.category_id],
			foreignColumns: [product_categories.id],
			name: "products_category_id_fkey"
		}).onDelete("restrict"),
	unique("products_sku_key").on(table.sku),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("products_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(is_published AND (published_at <= now()) AND (EXISTS ( SELECT 1\n   FROM brands\n  WHERE ((brands.id = products.brand_id) AND brands.is_published))) AND (EXISTS ( SELECT 1\n   FROM product_categories\n  WHERE ((product_categories.id = products.category_id) AND product_categories.is_published))))") }),
	pgPolicy("products_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	check("products_position_check", sql.raw("(\"position\" >= 0)")),
	check("products_published_at_required", sql.raw("((NOT is_published) OR (published_at IS NOT NULL))")),
]).enableRLS();

export const product_translations = pgTable("product_translations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "product_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	product_id: bigint({ mode: "number" }).notNull(),
	locale: text().$type<"fa" | "en">().notNull(),
	name: text().notNull(),
	short_description: text(),
	description: text(),
	key_specification: text(),
	slug: text().notNull(),
	seo_title: text(),
	seo_description: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_translations_product_id_idx").using("btree", table.product_id.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.product_id],
			foreignColumns: [products.id],
			name: "product_translations_product_id_fkey"
		}).onDelete("cascade"),
	unique("product_translations_product_id_locale_key").on(table.product_id, table.locale),
	unique("product_translations_locale_slug_key").on(table.locale, table.slug),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("product_translations_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("product_translations_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(EXISTS ( SELECT 1\n   FROM products\n  WHERE ((products.id = product_translations.product_id) AND products.is_published AND (products.published_at <= now()))))") }),
	check("product_translations_locale_check", sql.raw("(locale = ANY (ARRAY['fa'::text, 'en'::text]))")),
	check("product_translations_slug_format", sql.raw("(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)")),
]).enableRLS();

export const product_specifications = pgTable("product_specifications", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "product_specifications_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	product_id: bigint({ mode: "number" }).notNull(),
	locale: text().$type<"fa" | "en">().notNull(),
	label: text().notNull(),
	value: text().notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_specifications_product_locale_position_idx").using("btree", table.product_id.asc().nullsLast().op("int4_ops"), table.locale.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.product_id],
			foreignColumns: [products.id],
			name: "product_specifications_product_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("product_specifications_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("product_specifications_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(EXISTS ( SELECT 1\n   FROM products\n  WHERE ((products.id = product_specifications.product_id) AND products.is_published AND (products.published_at <= now()))))") }),
	check("product_specifications_locale_check", sql.raw("(locale = ANY (ARRAY['fa'::text, 'en'::text]))")),
	check("product_specifications_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	display_name: text(),
	role: text().$type<"manager" | "admin" | "seo">().default(sql.raw("'seo'::text")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	phone: text(),
	avatar_url: text(),
	is_active: boolean().default(sql.raw("false")).notNull(),
	last_seen_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("profiles_active_role_idx").using("btree", table.is_active.asc().nullsLast().op("text_ops"), table.role.asc().nullsLast().op("text_ops")),
	uniqueIndex("profiles_phone_unique").using("btree", table.phone.asc().nullsLast().op("text_ops")).where(sql`(phone IS NOT NULL)`),
	foreignKey({
			columns: [table.id],
			foreignColumns: [usersInPrivate.id],
			name: "profiles_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("profiles_manager_delete", { as: "permissive", for: "delete", to: ["app_staff"], using: sql.raw("(( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role) AND (id <> ( SELECT private.current_user_id() AS current_user_id)))") }),
	pgPolicy("profiles_manager_update", { as: "permissive", for: "update", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role)") }),
	pgPolicy("profiles_manager_insert", { as: "permissive", for: "insert", to: ["app_staff"], withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role)") }),
	pgPolicy("profiles_read_own", { as: "permissive", for: "select", to: ["app_staff"], using: sql.raw("((id = ( SELECT private.current_user_id() AS current_user_id)) OR ( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role))") }),
	check("profiles_phone_format", sql.raw("((phone IS NULL) OR (phone ~ '^\\+?[0-9]{10,15}$'::text))")),
	check("profiles_role_check", sql.raw("(role = ANY (ARRAY['manager'::text, 'admin'::text, 'seo'::text]))")),
]).enableRLS();

export const admin_settings = pgTable("admin_settings", {
	id: boolean().default(sql.raw("true")).notNull(),
	login_method: text().$type<"both" | "password" | "sms">().default(sql.raw("'password'::text")).notNull(),
	sms_provider: text().$type<"kavenegar" | "sms_ir" | "ippanel">(),
	sms_sender: text(),
	sms_template_key: text(),
	otp_ttl_seconds: integer().default(sql.raw("120")).notNull(),
	otp_resend_seconds: integer().default(sql.raw("60")).notNull(),
	require_captcha: boolean().default(sql.raw("true")).notNull(),
	updated_by: uuid(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("admin_settings_updated_by_idx").using("btree", table.updated_by.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.updated_by],
			foreignColumns: [usersInPrivate.id],
			name: "admin_settings_updated_by_fkey"
		}).onDelete("set null"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("admin_settings_manager_update", { as: "permissive", for: "update", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role)") }),
	pgPolicy("admin_settings_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("true") }),
	check("admin_settings_id_check", sql.raw("id")),
	check("admin_settings_login_method_check", sql.raw("(login_method = ANY (ARRAY['password'::text, 'sms'::text, 'both'::text]))")),
	check("admin_settings_otp_resend_seconds_check", sql.raw("((otp_resend_seconds >= 30) AND (otp_resend_seconds <= 300))")),
	check("admin_settings_otp_ttl_seconds_check", sql.raw("((otp_ttl_seconds >= 60) AND (otp_ttl_seconds <= 600))")),
	check("admin_settings_sms_configuration", sql.raw("((login_method = 'password'::text) OR ((sms_provider IS NOT NULL) AND (sms_template_key IS NOT NULL)))")),
	check("admin_settings_sms_provider_check", sql.raw("((sms_provider IS NULL) OR (sms_provider = ANY (ARRAY['kavenegar'::text, 'sms_ir'::text, 'ippanel'::text])))")),
]).enableRLS();

export const staff_login_events = pgTable("staff_login_events", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "staff_login_events_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	user_id: uuid(),
	identifier_hint: text(),
	event_type: text().$type<"password_success" | "password_failure" | "otp_requested" | "otp_success" | "otp_failure" | "signed_out" | "blocked">().notNull(),
	provider: text().$type<"password" | "kavenegar" | "sms_ir" | "ippanel">(),
	ip_hash: text(),
	user_agent: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("staff_login_events_created_idx").using("btree", table.created_at.desc().nullsFirst().op("timestamptz_ops")),
	index("staff_login_events_user_created_idx").using("btree", table.user_id.asc().nullsLast().op("timestamptz_ops"), table.created_at.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [usersInPrivate.id],
			name: "staff_login_events_user_id_fkey"
		}).onDelete("set null"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("login_events_manager_read", { as: "permissive", for: "select", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role)") }),
	check("staff_login_events_event_type_check", sql.raw("(event_type = ANY (ARRAY['password_success'::text, 'password_failure'::text, 'otp_requested'::text, 'otp_success'::text, 'otp_failure'::text, 'signed_out'::text, 'blocked'::text]))")),
	check("staff_login_events_provider_check", sql.raw("((provider IS NULL) OR (provider = ANY (ARRAY['password'::text, 'kavenegar'::text, 'sms_ir'::text, 'ippanel'::text])))")),
]).enableRLS();

export const countries = pgTable("countries", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "countries_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	code: text().notNull(),
	slug: text().notNull(),
	name_fa: text().notNull(),
	name_en: text().notNull(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("countries_code_key").on(table.code),
	unique("countries_slug_key").on(table.slug),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("countries_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	pgPolicy("countries_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("is_published") }),
	check("countries_code_check", sql.raw("(code ~ '^[A-Z]{2}$'::text)")),
	check("countries_position_check", sql.raw("(\"position\" >= 0)")),
	check("countries_slug_check", sql.raw("(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)")),
]).enableRLS();

export const provinces = pgTable("provinces", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "provinces_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	country_id: bigint({ mode: "number" }).notNull(),
	code: text().notNull(),
	slug: text().notNull(),
	name_fa: text().notNull(),
	name_en: text().notNull(),
	map_anchor_x: numeric({ mode: "number", precision: 6, scale:  3 }),
	map_anchor_y: numeric({ mode: "number", precision: 6, scale:  3 }),
	is_published: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("provinces_country_position_idx").using("btree", table.country_id.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.country_id],
			foreignColumns: [countries.id],
			name: "provinces_country_id_fkey"
		}).onDelete("restrict"),
	unique("provinces_country_id_code_key").on(table.country_id, table.code),
	unique("provinces_country_id_slug_key").on(table.country_id, table.slug),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("provinces_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	pgPolicy("provinces_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(is_published AND (EXISTS ( SELECT 1\n   FROM countries c\n  WHERE ((c.id = provinces.country_id) AND c.is_published))))") }),
	check("provinces_map_anchor_x_check", sql.raw("((map_anchor_x >= (0)::numeric) AND (map_anchor_x <= (100)::numeric))")),
	check("provinces_map_anchor_y_check", sql.raw("((map_anchor_y >= (0)::numeric) AND (map_anchor_y <= (100)::numeric))")),
	check("provinces_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const cities = pgTable("cities", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "cities_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	province_id: bigint({ mode: "number" }).notNull(),
	slug: text().notNull(),
	name_fa: text().notNull(),
	name_en: text().notNull(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("cities_province_position_idx").using("btree", table.province_id.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.province_id],
			foreignColumns: [provinces.id],
			name: "cities_province_id_fkey"
		}).onDelete("restrict"),
	unique("cities_province_id_slug_key").on(table.province_id, table.slug),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("cities_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	pgPolicy("cities_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(is_published AND (EXISTS ( SELECT 1\n   FROM (provinces p\n     JOIN countries c ON ((c.id = p.country_id)))\n  WHERE ((p.id = cities.province_id) AND p.is_published AND c.is_published))))") }),
	check("cities_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const representatives = pgTable("representatives", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "representatives_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	city_id: bigint({ mode: "number" }).notNull(),
	slug: text().notNull(),
	business_name_fa: text().notNull(),
	business_name_en: text(),
	manager_name_fa: text().notNull(),
	manager_name_en: text(),
	address_fa: text().notNull(),
	address_en: text(),
	phone: text().notNull(),
	whatsapp: text(),
	latitude: numeric({ mode: "number", precision: 9, scale:  6 }),
	longitude: numeric({ mode: "number", precision: 9, scale:  6 }),
	directions_url: text(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("representatives_city_position_idx").using("btree", table.city_id.asc().nullsLast().op("int8_ops"), table.position.asc().nullsLast().op("int8_ops")),
	index("representatives_public_idx").using("btree", table.city_id.asc().nullsLast().op("int8_ops")).where(sql`is_published`),
	foreignKey({
			columns: [table.city_id],
			foreignColumns: [cities.id],
			name: "representatives_city_id_fkey"
		}).onDelete("restrict"),
	unique("representatives_slug_key").on(table.slug),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("representatives_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	pgPolicy("representatives_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(is_published AND (EXISTS ( SELECT 1\n   FROM ((cities ci\n     JOIN provinces p ON ((p.id = ci.province_id)))\n     JOIN countries c ON ((c.id = p.country_id)))\n  WHERE ((ci.id = representatives.city_id) AND ci.is_published AND p.is_published AND c.is_published))))") }),
	check("representatives_directions_url_check", sql.raw("((directions_url IS NULL) OR (directions_url ~ '^https://'::text))")),
	check("representatives_latitude_check", sql.raw("((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))")),
	check("representatives_longitude_check", sql.raw("((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric))")),
	check("representatives_phone_check", sql.raw("(phone ~ '^\\+?[0-9]{10,15}$'::text)")),
	check("representatives_position_check", sql.raw("(\"position\" >= 0)")),
	check("representatives_slug_check", sql.raw("(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)")),
	check("representatives_whatsapp_check", sql.raw("((whatsapp IS NULL) OR (whatsapp ~ '^\\+?[0-9]{10,15}$'::text))")),
]).enableRLS();

export const media_categories = pgTable("media_categories", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "media_categories_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	code: text().notNull(),
	name_fa: text().notNull(),
	name_en: text().notNull(),
	slug_fa: text().notNull(),
	slug_en: text().notNull(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("media_categories_code_key").on(table.code),
	unique("media_categories_slug_fa_key").on(table.slug_fa),
	unique("media_categories_slug_en_key").on(table.slug_en),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("media_categories_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("media_categories_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("is_published") }),
	check("media_categories_code_check", sql.raw("(code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)")),
	check("media_categories_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const editorial_entries = pgTable("editorial_entries", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "editorial_entries_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	category_id: bigint({ mode: "number" }),
	kind: text().$type<"news" | "article" | "guide">().notNull(),
	cover_image_url: text(),
	video_url: text(),
	cta_url: text(),
	is_featured: boolean().default(sql.raw("false")).notNull(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	published_at: timestamp({ withTimezone: true, mode: 'string' }),
	position: integer().default(sql.raw("0")).notNull(),
	created_by: uuid(),
	updated_by: uuid(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("editorial_entries_category_idx").using("btree", table.category_id.asc().nullsLast().op("timestamptz_ops"), table.published_at.desc().nullsFirst().op("int8_ops")),
	index("editorial_entries_created_by_idx").using("btree", table.created_by.asc().nullsLast().op("uuid_ops")),
	index("editorial_entries_kind_published_idx").using("btree", table.kind.asc().nullsLast().op("timestamptz_ops"), table.published_at.desc().nullsFirst().op("text_ops")).where(sql`is_published`),
	index("editorial_entries_updated_by_idx").using("btree", table.updated_by.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.category_id],
			foreignColumns: [media_categories.id],
			name: "editorial_entries_category_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.created_by],
			foreignColumns: [usersInPrivate.id],
			name: "editorial_entries_created_by_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.updated_by],
			foreignColumns: [usersInPrivate.id],
			name: "editorial_entries_updated_by_fkey"
		}).onDelete("set null"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("editorial_entries_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(is_published AND (published_at <= now()))") }),
	pgPolicy("editorial_entries_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	check("editorial_entries_kind_check", sql.raw("(kind = ANY (ARRAY['news'::text, 'article'::text, 'guide'::text]))")),
	check("editorial_entries_position_check", sql.raw("(\"position\" >= 0)")),
	check("editorial_publish_date", sql.raw("((NOT is_published) OR (published_at IS NOT NULL))")),
]).enableRLS();

export const editorial_translations = pgTable("editorial_translations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "editorial_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entry_id: bigint({ mode: "number" }).notNull(),
	locale: text().$type<"fa" | "en">().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	excerpt: text(),
	body_markdown: text().default(sql.raw("''::text")).notNull(),
	content_blocks: jsonb().$type<Json>().default(sql.raw("'[]'::jsonb")).notNull(),
	cta_label: text(),
	seo_title: text(),
	seo_description: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("editorial_translations_entry_idx").using("btree", table.entry_id.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.entry_id],
			foreignColumns: [editorial_entries.id],
			name: "editorial_translations_entry_id_fkey"
		}).onDelete("cascade"),
	unique("editorial_translations_entry_id_locale_key").on(table.entry_id, table.locale),
	unique("editorial_translations_locale_slug_key").on(table.locale, table.slug),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("editorial_translations_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(EXISTS ( SELECT 1\n   FROM editorial_entries e\n  WHERE ((e.id = editorial_translations.entry_id) AND e.is_published AND (e.published_at <= now()))))") }),
	pgPolicy("editorial_translations_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	check("editorial_translations_content_blocks_check", sql.raw("(jsonb_typeof(content_blocks) = 'array'::text)")),
	check("editorial_translations_locale_check", sql.raw("(locale = ANY (ARRAY['fa'::text, 'en'::text]))")),
]).enableRLS();

export const certificates = pgTable("certificates", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "certificates_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	code: text().notNull(),
	title_fa: text().notNull(),
	title_en: text().notNull(),
	issuer_fa: text(),
	issuer_en: text(),
	certificate_number: text().notNull(),
	document_url: text(),
	image_url: text(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	issued_at: date(),
	expires_at: date(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("certificates_public_position_idx").using("btree", table.position.asc().nullsLast().op("int4_ops")).where(sql`is_published`),
	unique("certificates_code_key").on(table.code),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("certificates_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	pgPolicy("certificates_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("is_published") }),
	check("certificates_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const gallery_albums = pgTable("gallery_albums", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "gallery_albums_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: text().notNull(),
	title_fa: text().notNull(),
	title_en: text().notNull(),
	description_fa: text(),
	description_en: text(),
	cover_url: text(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("gallery_albums_public_position_idx").using("btree", table.position.asc().nullsLast().op("int4_ops")).where(sql`is_published`),
	unique("gallery_albums_slug_key").on(table.slug),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("gallery_albums_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("gallery_albums_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("is_published") }),
	check("gallery_albums_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const gallery_items = pgTable("gallery_items", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "gallery_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	album_id: bigint({ mode: "number" }).notNull(),
	media_type: text().$type<"image" | "video">().notNull(),
	file_url: text().notNull(),
	alt_fa: text().notNull(),
	alt_en: text().notNull(),
	caption_fa: text(),
	caption_en: text(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("gallery_items_album_position_idx").using("btree", table.album_id.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.album_id],
			foreignColumns: [gallery_albums.id],
			name: "gallery_items_album_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("gallery_items_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("gallery_items_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(is_published AND (EXISTS ( SELECT 1\n   FROM gallery_albums a\n  WHERE ((a.id = gallery_items.album_id) AND a.is_published))))") }),
	check("gallery_items_media_type_check", sql.raw("(media_type = ANY (ARRAY['image'::text, 'video'::text]))")),
	check("gallery_items_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const media_assets = pgTable("media_assets", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "media_assets_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	asset_type: text().$type<"image" | "video" | "document" | "catalog">().notNull(),
	title_fa: text().notNull(),
	title_en: text().notNull(),
	description_fa: text(),
	description_en: text(),
	file_url: text().notNull(),
	thumbnail_url: text(),
	mime_type: text(),
	is_public: boolean().default(sql.raw("false")).notNull(),
	downloadable: boolean().default(sql.raw("false")).notNull(),
	created_by: uuid(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("media_assets_created_by_idx").using("btree", table.created_by.asc().nullsLast().op("uuid_ops")),
	index("media_assets_type_created_idx").using("btree", table.asset_type.asc().nullsLast().op("text_ops"), table.created_at.desc().nullsFirst().op("text_ops")),
	foreignKey({
			columns: [table.created_by],
			foreignColumns: [usersInPrivate.id],
			name: "media_assets_created_by_fkey"
		}).onDelete("set null"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("media_assets_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("media_assets_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("is_public") }),
	check("media_assets_asset_type_check", sql.raw("(asset_type = ANY (ARRAY['image'::text, 'video'::text, 'document'::text, 'catalog'::text]))")),
]).enableRLS();

export const job_positions = pgTable("job_positions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "job_positions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: text().notNull(),
	department: text().notNull(),
	employment_type: text().$type<"full-time" | "part-time" | "contract" | "internship">().notNull(),
	location_fa: text().notNull(),
	location_en: text().notNull(),
	title_fa: text().notNull(),
	title_en: text().notNull(),
	summary_fa: text(),
	summary_en: text(),
	description_fa: text().notNull(),
	description_en: text().notNull(),
	requirements_fa: text(),
	requirements_en: text(),
	is_published: boolean().default(sql.raw("false")).notNull(),
	published_at: timestamp({ withTimezone: true, mode: 'string' }),
	closes_at: timestamp({ withTimezone: true, mode: 'string' }),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("job_positions_public_idx").using("btree", table.department.asc().nullsLast().op("timestamptz_ops"), table.employment_type.asc().nullsLast().op("text_ops"), table.published_at.desc().nullsFirst().op("timestamptz_ops")).where(sql`is_published`),
	unique("job_positions_slug_key").on(table.slug),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("job_positions_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	pgPolicy("job_positions_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("(is_published AND (published_at <= now()) AND ((closes_at IS NULL) OR (closes_at > now())))") }),
	check("job_positions_employment_type_check", sql.raw("(employment_type = ANY (ARRAY['full-time'::text, 'part-time'::text, 'contract'::text, 'internship'::text]))")),
	check("job_positions_position_check", sql.raw("(\"position\" >= 0)")),
	check("job_publish_date", sql.raw("((NOT is_published) OR (published_at IS NOT NULL))")),
]).enableRLS();

export const job_applications = pgTable("job_applications", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "job_applications_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	tracking_code: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	job_id: bigint({ mode: "number" }),
	locale: text().$type<"fa" | "en">().notNull(),
	full_name: text().notNull(),
	mobile: text().notNull(),
	email: text().notNull(),
	expertise: text().notNull(),
	resume_url: text().notNull(),
	note: text(),
	consent_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	status: text().$type<"new" | "reviewing" | "rejected" | "archived" | "shortlisted" | "interview" | "hired">().default(sql.raw("'new'::text")).notNull(),
	internal_note: text(),
	reviewed_by: uuid(),
	reviewed_at: timestamp({ withTimezone: true, mode: 'string' }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("job_applications_job_idx").using("btree", table.job_id.asc().nullsLast().op("int8_ops"), table.created_at.desc().nullsFirst().op("timestamptz_ops")),
	index("job_applications_reviewed_by_idx").using("btree", table.reviewed_by.asc().nullsLast().op("uuid_ops")),
	index("job_applications_status_created_idx").using("btree", table.status.asc().nullsLast().op("text_ops"), table.created_at.desc().nullsFirst().op("text_ops")),
	foreignKey({
			columns: [table.job_id],
			foreignColumns: [job_positions.id],
			name: "job_applications_job_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.reviewed_by],
			foreignColumns: [usersInPrivate.id],
			name: "job_applications_reviewed_by_fkey"
		}).onDelete("set null"),
	unique("job_applications_tracking_code_key").on(table.tracking_code),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("job_applications_manager_delete", { as: "permissive", for: "delete", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role)") }),
	pgPolicy("job_applications_staff_update", { as: "permissive", for: "update", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	pgPolicy("job_applications_staff_read", { as: "permissive", for: "select", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	pgPolicy("job_applications_public_insert", { as: "permissive", for: "insert", to: ["app_staff", "app_visitor"], withCheck: sql.raw("((status = 'new'::text) AND (internal_note IS NULL) AND (reviewed_by IS NULL))") }),
	check("job_applications_locale_check", sql.raw("(locale = ANY (ARRAY['fa'::text, 'en'::text]))")),
	check("job_applications_status_check", sql.raw("(status = ANY (ARRAY['new'::text, 'reviewing'::text, 'shortlisted'::text, 'interview'::text, 'rejected'::text, 'hired'::text, 'archived'::text]))")),
]).enableRLS();

export const contact_submissions = pgTable("contact_submissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "contact_submissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	tracking_code: text().notNull(),
	locale: text().$type<"fa" | "en">().notNull(),
	full_name: text().notNull(),
	mobile: text().notNull(),
	email: text().notNull(),
	subject: text().notNull(),
	destination: text().$type<"sales" | "technical" | "hr" | "pr">().notNull(),
	message: text().notNull(),
	attachment_path: text(),
	consent_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	status: text().$type<"new" | "reviewing" | "archived" | "answered">().default(sql.raw("'new'::text")).notNull(),
	internal_note: text(),
	reviewed_by: uuid(),
	reviewed_at: timestamp({ withTimezone: true, mode: 'string' }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("contact_submissions_reviewed_by_idx").using("btree", table.reviewed_by.asc().nullsLast().op("uuid_ops")),
	index("contact_submissions_status_created_idx").using("btree", table.status.asc().nullsLast().op("text_ops"), table.created_at.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.reviewed_by],
			foreignColumns: [usersInPrivate.id],
			name: "contact_submissions_reviewed_by_fkey"
		}).onDelete("set null"),
	unique("contact_submissions_tracking_code_key").on(table.tracking_code),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("contact_submissions_staff_update", { as: "permissive", for: "update", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	pgPolicy("contact_submissions_staff_read", { as: "permissive", for: "select", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	check("contact_submissions_destination_check", sql.raw("(destination = ANY (ARRAY['sales'::text, 'technical'::text, 'hr'::text, 'pr'::text]))")),
	check("contact_submissions_locale_check", sql.raw("(locale = ANY (ARRAY['fa'::text, 'en'::text]))")),
	check("contact_submissions_mobile_check", sql.raw("(mobile ~ '^\\+?[0-9]{10,15}$'::text)")),
	check("contact_submissions_status_check", sql.raw("(status = ANY (ARRAY['new'::text, 'reviewing'::text, 'answered'::text, 'archived'::text]))")),
]).enableRLS();

export const site_translations = pgTable("site_translations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "site_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	namespace: text().notNull(),
	translation_key: text().notNull(),
	locale: text().$type<"fa" | "en">().notNull(),
	value: text().notNull(),
	description: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("site_translations_lookup_idx").using("btree", table.locale.asc().nullsLast().op("text_ops"), table.namespace.asc().nullsLast().op("text_ops")),
	unique("site_translations_namespace_translation_key_locale_key").on(table.namespace, table.translation_key, table.locale),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("translations_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("translations_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("true") }),
	check("site_translations_locale_check", sql.raw("(locale = ANY (ARRAY['fa'::text, 'en'::text]))")),
	check("site_translations_namespace_check", sql.raw("(namespace ~ '^[a-z0-9_-]+$'::text)")),
	check("site_translations_translation_key_check", sql.raw("(translation_key ~ '^[a-z0-9_.-]+$'::text)")),
]).enableRLS();

export const seo_settings = pgTable("seo_settings", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "seo_settings_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	route: text().notNull(),
	locale: text().$type<"fa" | "en">().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	canonical_url: text(),
	robots_index: boolean().default(sql.raw("true")).notNull(),
	robots_follow: boolean().default(sql.raw("true")).notNull(),
	og_image_url: text(),
	structured_data: jsonb().$type<Json>().default(sql.raw("'{}'::jsonb")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("seo_settings_locale_route_idx").using("btree", table.locale.asc().nullsLast().op("text_ops"), table.route.asc().nullsLast().op("text_ops")),
	unique("seo_settings_route_locale_key").on(table.route, table.locale),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("seo_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("seo_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("true") }),
	check("seo_settings_locale_check", sql.raw("(locale = ANY (ARRAY['fa'::text, 'en'::text]))")),
	check("seo_settings_route_check", sql.raw("(route ~ '^/[a-z0-9/_-]*$'::text)")),
	check("seo_settings_structured_data_check", sql.raw("(jsonb_typeof(structured_data) = 'object'::text)")),
]).enableRLS();

export const international_inquiries = pgTable("international_inquiries", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "international_inquiries_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	tracking_code: text().notNull(),
	locale: text().$type<"fa" | "en">().notNull(),
	company_name: text().notNull(),
	country: text().notNull(),
	website: text(),
	business_field: text().notNull(),
	import_distribution_experience: text().notNull(),
	interested_products: text().notNull(),
	estimated_volume: text(),
	cooperation_type: text().$type<"distribution" | "representation" | "contract_manufacturing" | "other">().notNull(),
	company_profile_path: text().notNull(),
	consent_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	status: text().$type<"new" | "reviewing" | "needs_information" | "approved" | "rejected" | "archived">().default(sql.raw("'new'::text")).notNull(),
	internal_note: text(),
	reviewed_by: uuid(),
	reviewed_at: timestamp({ withTimezone: true, mode: 'string' }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("international_inquiries_reviewed_by_idx").using("btree", table.reviewed_by.asc().nullsLast().op("uuid_ops")),
	index("international_inquiries_status_created_idx").using("btree", table.status.asc().nullsLast().op("text_ops"), table.created_at.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.reviewed_by],
			foreignColumns: [usersInPrivate.id],
			name: "international_inquiries_reviewed_by_fkey"
		}).onDelete("set null"),
	unique("international_inquiries_tracking_code_key").on(table.tracking_code),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("international_inquiries_staff_update", { as: "permissive", for: "update", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	pgPolicy("international_inquiries_staff_read", { as: "permissive", for: "select", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	check("international_inquiries_cooperation_type_check", sql.raw("(cooperation_type = ANY (ARRAY['distribution'::text, 'representation'::text, 'contract_manufacturing'::text, 'other'::text]))")),
	check("international_inquiries_locale_check", sql.raw("(locale = ANY (ARRAY['fa'::text, 'en'::text]))")),
	check("international_inquiries_status_check", sql.raw("(status = ANY (ARRAY['new'::text, 'reviewing'::text, 'needs_information'::text, 'approved'::text, 'rejected'::text, 'archived'::text]))")),
]).enableRLS();

export const representative_applications = pgTable("representative_applications", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "representative_applications_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	tracking_code: text().default(sql.raw("upper(substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 12))")).notNull(),
	locale: text().$type<"fa" | "en">().notNull(),
	full_name: text().notNull(),
	identity_code: text().notNull(),
	mobile: text().notNull(),
	email: text(),
	business_name: text().notNull(),
	business_type: text().notNull(),
	country_code: text().$type<"IR" | "IQ">().notNull(),
	region: text().notNull(),
	city: text().notNull(),
	address: text().notNull(),
	experience: text().notNull(),
	distribution_area: text().notNull(),
	facilities: text().array().default(sql.raw("'{}'::text[]")).notNull(),
	document_path: text(),
	notes: text(),
	consent_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	status: text().$type<"new" | "reviewing" | "needs_information" | "approved" | "rejected" | "archived">().default(sql.raw("'new'::text")).notNull(),
	internal_note: text(),
	reviewed_by: uuid(),
	reviewed_at: timestamp({ withTimezone: true, mode: 'string' }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("representative_applications_mobile_idx").using("btree", table.mobile.asc().nullsLast().op("text_ops")),
	index("representative_applications_reviewed_by_idx").using("btree", table.reviewed_by.asc().nullsLast().op("uuid_ops")),
	index("representative_applications_status_created_idx").using("btree", table.status.asc().nullsLast().op("text_ops"), table.created_at.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.reviewed_by],
			foreignColumns: [usersInPrivate.id],
			name: "representative_applications_reviewed_by_fkey"
		}).onDelete("set null"),
	unique("representative_applications_tracking_code_key").on(table.tracking_code),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("representative_applications_staff_delete", { as: "permissive", for: "delete", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role)") }),
	pgPolicy("representative_applications_staff_update", { as: "permissive", for: "update", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	pgPolicy("representative_applications_staff_read", { as: "permissive", for: "select", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text]) AS has_staff_role)") }),
	check("representative_applications_country_code_check", sql.raw("(country_code = ANY (ARRAY['IR'::text, 'IQ'::text]))")),
	check("representative_applications_locale_check", sql.raw("(locale = ANY (ARRAY['fa'::text, 'en'::text]))")),
	check("representative_applications_mobile_check", sql.raw("(mobile ~ '^\\+?[0-9]{10,15}$'::text)")),
	check("representative_applications_status_check", sql.raw("(status = ANY (ARRAY['new'::text, 'reviewing'::text, 'needs_information'::text, 'approved'::text, 'rejected'::text, 'archived'::text]))")),
]).enableRLS();

export const navigation_items = pgTable("navigation_items", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "navigation_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	code: text().notNull(),
	label_fa: text().notNull(),
	label_en: text().notNull(),
	href: text().notNull(),
	location: text().$type<"header" | "footer" | "both">().default(sql.raw("'header'::text")).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parent_id: bigint({ mode: "number" }),
	position: integer().default(sql.raw("0")).notNull(),
	is_published: boolean().default(sql.raw("true")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("navigation_items_location_position_idx").using("btree", table.location.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("text_ops")).where(sql`is_published`),
	index("navigation_items_parent_id_idx").using("btree", table.parent_id.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.parent_id],
			foreignColumns: [table.id],
			name: "navigation_items_parent_id_fkey"
		}).onDelete("cascade"),
	unique("navigation_items_code_key").on(table.code),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("navigation_items_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("navigation_items_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("is_published") }),
	check("navigation_items_code_check", sql.raw("(code ~ '^[a-z0-9-]+$'::text)")),
	check("navigation_items_href_check", sql.raw("(href ~ '^/'::text)")),
	check("navigation_items_location_check", sql.raw("(location = ANY (ARRAY['header'::text, 'footer'::text, 'both'::text]))")),
	check("navigation_items_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const faq_items = pgTable("faq_items", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "faq_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	category_fa: text().notNull(),
	category_en: text().notNull(),
	question_fa: text().notNull(),
	question_en: text().notNull(),
	answer_fa: text().notNull(),
	answer_en: text().notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	is_published: boolean().default(sql.raw("true")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("faq_items_public_position_idx").using("btree", table.position.asc().nullsLast().op("int4_ops")).where(sql`is_published`),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("faq_items_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("faq_items_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("is_published") }),
	check("faq_items_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const product_images = pgTable("product_images", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "product_images_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	product_id: bigint({ mode: "number" }).notNull(),
	file_url: text().notNull(),
	alt_fa: text().notNull(),
	alt_en: text().notNull(),
	is_primary: boolean().default(sql.raw("false")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("product_images_one_primary_idx").using("btree", table.product_id.asc().nullsLast().op("int8_ops")).where(sql`is_primary`),
	index("product_images_product_position_idx").using("btree", table.product_id.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.product_id],
			foreignColumns: [products.id],
			name: "product_images_product_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("product_images_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("product_images_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("((EXISTS ( SELECT 1\n   FROM products p\n  WHERE ((p.id = product_images.product_id) AND p.is_published))) OR ( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role))") }),
	check("product_images_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const product_features = pgTable("product_features", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "product_features_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	product_id: bigint({ mode: "number" }).notNull(),
	icon_key: text().notNull(),
	title_fa: text().notNull(),
	title_en: text().notNull(),
	description_fa: text(),
	description_en: text(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_features_product_position_idx").using("btree", table.product_id.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.product_id],
			foreignColumns: [products.id],
			name: "product_features_product_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("product_features_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("((EXISTS ( SELECT 1\n   FROM products p\n  WHERE ((p.id = product_features.product_id) AND p.is_published))) OR ( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role))") }),
	pgPolicy("product_features_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	check("product_features_icon_key_check", sql.raw("(icon_key = ANY (ARRAY['shield'::text, 'droplet'::text, 'gear'::text, 'snowflake'::text, 'thermometer'::text, 'flask'::text, 'brake'::text, 'oil'::text, 'package'::text, 'check'::text, 'star'::text, 'leaf'::text]))")),
	check("product_features_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const product_applications = pgTable("product_applications", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "product_applications_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	product_id: bigint({ mode: "number" }).notNull(),
	title_fa: text().notNull(),
	title_en: text().notNull(),
	description_fa: text(),
	description_en: text(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_applications_product_position_idx").using("btree", table.product_id.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.product_id],
			foreignColumns: [products.id],
			name: "product_applications_product_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("product_applications_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("((EXISTS ( SELECT 1\n   FROM products p\n  WHERE ((p.id = product_applications.product_id) AND p.is_published))) OR ( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role))") }),
	pgPolicy("product_applications_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	check("product_applications_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const product_downloads = pgTable("product_downloads", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "product_downloads_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	product_id: bigint({ mode: "number" }).notNull(),
	file_url: text().notNull(),
	title_fa: text().notNull(),
	title_en: text().notNull(),
	file_type: text().$type<"catalog" | "other" | "datasheet" | "certificate" | "manual">().default(sql.raw("'catalog'::text")).notNull(),
	position: integer().default(sql.raw("0")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_downloads_product_position_idx").using("btree", table.product_id.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.product_id],
			foreignColumns: [products.id],
			name: "product_downloads_product_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("product_downloads_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("product_downloads_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("((EXISTS ( SELECT 1\n   FROM products p\n  WHERE ((p.id = product_downloads.product_id) AND p.is_published))) OR ( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role))") }),
	check("product_downloads_file_type_check", sql.raw("(file_type = ANY (ARRAY['catalog'::text, 'datasheet'::text, 'certificate'::text, 'manual'::text, 'other'::text]))")),
	check("product_downloads_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const site_settings = pgTable("site_settings", {
	id: boolean().default(sql.raw("true")).notNull(),
	site_title_fa: text().default(sql.raw("'\u062f\u06cc\u0627\u0631 \u0635\u0646\u0639\u062a \u062a\u0628\u0631\u06cc\u0632'::text")).notNull(),
	site_title_en: text().default(sql.raw("'Diyar Sanat Tabriz'::text")).notNull(),
	site_description_fa: text().default(sql.raw("''::text")).notNull(),
	site_description_en: text().default(sql.raw("''::text")).notNull(),
	header_logo_url: text(),
	admin_logo_url: text(),
	login_logo_url: text(),
	favicon_url: text(),
	google_site_verification: text(),
	default_og_image_url: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_by: uuid(),
}, (table) => [
	index("site_settings_updated_by_idx").using("btree", table.updated_by.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.updated_by],
			foreignColumns: [usersInPrivate.id],
			name: "site_settings_updated_by_fkey"
		}).onDelete("set null"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("site_settings_manager_update", { as: "permissive", for: "update", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text]) AS has_staff_role)") }),
	pgPolicy("site_settings_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql.raw("true") }),
	check("site_settings_id_check", sql.raw("id")),
]).enableRLS();

export const homepage_hero_slides = pgTable("homepage_hero_slides", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "homepage_hero_slides_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	image_url: text().notNull(),
	alt_fa: text().notNull(),
	alt_en: text().notNull(),
	kicker_fa: text().notNull(),
	kicker_en: text().notNull(),
	title_fa: text().notNull(),
	title_en: text().notNull(),
	subtitle_fa: text(),
	subtitle_en: text(),
	description_fa: text(),
	description_en: text(),
	primary_label_fa: text(),
	primary_label_en: text(),
	primary_href: text().default(sql.raw("'/products'::text")).notNull(),
	secondary_label_fa: text(),
	secondary_label_en: text(),
	secondary_href: text(),
	position: integer().default(sql.raw("0")).notNull(),
	is_published: boolean().default(sql.raw("true")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("homepage_hero_slides_public_position_idx").using("btree", table.position.asc().nullsLast().op("int4_ops")).where(sql`is_published`),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("homepage_hero_slides_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("homepage_hero_slides_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql`is_published` }),
	check("homepage_hero_slides_position_check", sql.raw("(\"position\" >= 0)")),
]).enableRLS();

export const homepage_video = pgTable("homepage_video", {
	id: boolean().default(sql.raw("true")).notNull(),
	video_url: text(),
	cover_url: text(),
	title_fa: text().default(sql.raw("'\u062a\u06cc\u0632\u0631 \u0645\u0639\u0631\u0641\u06cc \u06a9\u0627\u0631\u062e\u0627\u0646\u0647'::text")).notNull(),
	title_en: text().default(sql.raw("'Factory introduction'::text")).notNull(),
	subtitle_fa: text(),
	subtitle_en: text(),
	description_fa: text(),
	description_en: text(),
	is_published: boolean().default(sql.raw("true")).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, () => [
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	pgPolicy("homepage_video_staff_manage", { as: "permissive", for: "all", to: ["app_staff"], using: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)"), withCheck: sql.raw("( SELECT private.has_staff_role(ARRAY['manager'::text, 'admin'::text, 'seo'::text]) AS has_staff_role)") }),
	pgPolicy("homepage_video_public_read", { as: "permissive", for: "select", to: ["app_staff", "app_visitor"], using: sql`is_published` }),
	check("homepage_video_id_check", sql.raw("id")),
]).enableRLS();

export const usersInPrivate = privateSchema.table("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	password_hash: text().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_key").on(table.email),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
	check("users_email_check", sql.raw("(email = lower(email))")),
]).enableRLS();

export const sessionsInPrivate = privateSchema.table("sessions", {
	token_hash: text().primaryKey().notNull(),
	user_id: uuid().notNull(),
	expires_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("sessions_expiry_idx").using("btree", table.expires_at.asc().nullsLast().op("timestamptz_ops")),
	index("sessions_user_idx").using("btree", table.user_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [usersInPrivate.id],
			name: "sessions_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
]).enableRLS();

export const otp_challengesInPrivate = privateSchema.table("otp_challenges", {
	phone: text().primaryKey().notNull(),
	user_id: uuid().notNull(),
	code_hash: text().notNull(),
	expires_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	resend_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	attempts: integer().default(sql.raw("0")).notNull(),
}, (table) => [
	index("otp_user_idx").using("btree", table.user_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [usersInPrivate.id],
			name: "otp_challenges_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
]).enableRLS();

export const rate_limitsInPrivate = privateSchema.table("rate_limits", {
	key: text().primaryKey().notNull(),
	attempts: integer().default(sql.raw("1")).notNull(),
	resets_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("rate_limits_expiry_idx").using("btree", table.resets_at.asc().nullsLast().op("timestamptz_ops")),
	pgPolicy("backend_access", { as: "permissive", for: "all", to: ["app_backend"], using: sql.raw("true"), withCheck: sql.raw("true") }),
]).enableRLS();
