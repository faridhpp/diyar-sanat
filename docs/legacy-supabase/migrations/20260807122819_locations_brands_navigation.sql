-- Complete administrative regions and their official centers for Iran and Iraq.
insert into public.countries(code,slug,name_fa,name_en,is_published,position) values
('IR','iran','ایران','Iran',true,0),('IQ','iraq','عراق','Iraq',true,1)
on conflict(code) do update set slug=excluded.slug,name_fa=excluded.name_fa,name_en=excluded.name_en,is_published=true,position=excluded.position;

with region(country_code,code,slug,name_fa,name_en,city_slug,city_fa,city_en,position) as (values
('IR','EAZ','east-azerbaijan','آذربایجان شرقی','East Azerbaijan','tabriz','تبریز','Tabriz',1),('IR','WAZ','west-azerbaijan','آذربایجان غربی','West Azerbaijan','urmia','ارومیه','Urmia',2),('IR','ARD','ardabil','اردبیل','Ardabil','ardabil','اردبیل','Ardabil',3),('IR','ISF','isfahan','اصفهان','Isfahan','isfahan','اصفهان','Isfahan',4),('IR','ALB','alborz','البرز','Alborz','karaj','کرج','Karaj',5),('IR','ILM','ilam','ایلام','Ilam','ilam','ایلام','Ilam',6),('IR','BUS','bushehr','بوشهر','Bushehr','bushehr','بوشهر','Bushehr',7),('IR','THR','tehran','تهران','Tehran','tehran','تهران','Tehran',8),('IR','CHB','chaharmahal-bakhtiari','چهارمحال و بختیاری','Chaharmahal and Bakhtiari','shahrekord','شهرکرد','Shahrekord',9),('IR','SKH','south-khorasan','خراسان جنوبی','South Khorasan','birjand','بیرجند','Birjand',10),('IR','RKH','razavi-khorasan','خراسان رضوی','Razavi Khorasan','mashhad','مشهد','Mashhad',11),('IR','NKH','north-khorasan','خراسان شمالی','North Khorasan','bojnurd','بجنورد','Bojnurd',12),('IR','KHZ','khuzestan','خوزستان','Khuzestan','ahvaz','اهواز','Ahvaz',13),('IR','ZAN','zanjan','زنجان','Zanjan','zanjan','زنجان','Zanjan',14),('IR','SEM','semnan','سمنان','Semnan','semnan','سمنان','Semnan',15),('IR','SBL','sistan-baluchestan','سیستان و بلوچستان','Sistan and Baluchestan','zahedan','زاهدان','Zahedan',16),('IR','FRS','fars','فارس','Fars','shiraz','شیراز','Shiraz',17),('IR','QAZ','qazvin','قزوین','Qazvin','qazvin','قزوین','Qazvin',18),('IR','QOM','qom','قم','Qom','qom','قم','Qom',19),('IR','KRD','kurdistan','کردستان','Kurdistan','sanandaj','سنندج','Sanandaj',20),('IR','KER','kerman','کرمان','Kerman','kerman','کرمان','Kerman',21),('IR','KSH','kermanshah','کرمانشاه','Kermanshah','kermanshah','کرمانشاه','Kermanshah',22),('IR','KBA','kohgiluyeh-boyer-ahmad','کهگیلویه و بویراحمد','Kohgiluyeh and Boyer-Ahmad','yasuj','یاسوج','Yasuj',23),('IR','GLS','golestan','گلستان','Golestan','gorgan','گرگان','Gorgan',24),('IR','GIL','gilan','گیلان','Gilan','rasht','رشت','Rasht',25),('IR','LOR','lorestan','لرستان','Lorestan','khorramabad','خرم‌آباد','Khorramabad',26),('IR','MAZ','mazandaran','مازندران','Mazandaran','sari','ساری','Sari',27),('IR','MRK','markazi','مرکزی','Markazi','arak','اراک','Arak',28),('IR','HRZ','hormozgan','هرمزگان','Hormozgan','bandar-abbas','بندرعباس','Bandar Abbas',29),('IR','HAM','hamadan','همدان','Hamadan','hamadan','همدان','Hamadan',30),('IR','YAZ','yazd','یزد','Yazd','yazd','یزد','Yazd',31),
('IQ','ANB','anbar','الانبار','Al Anbar','ramadi','رمادی','Ramadi',1),('IQ','ARB','erbil','اربیل','Erbil','erbil','اربیل','Erbil',2),('IQ','BAS','basra','بصره','Basra','basra','بصره','Basra',3),('IQ','BAB','babylon','بابل','Babylon','hillah','حله','Hillah',4),('IQ','BGD','baghdad','بغداد','Baghdad','baghdad','بغداد','Baghdad',5),('IQ','DHK','dohuk','دهوک','Duhok','dohuk','دهوک','Duhok',6),('IQ','QAD','qadisiyyah','قادسیه','Al-Qadisiyyah','diwaniyah','دیوانیه','Diwaniyah',7),('IQ','DIY','diyala','دیاله','Diyala','baqubah','بعقوبه','Baqubah',8),('IQ','DQR','dhi-qar','ذی‌قار','Dhi Qar','nasiriyah','ناصریه','Nasiriyah',9),('IQ','SUL','sulaymaniyah','سلیمانیه','Sulaymaniyah','sulaymaniyah','سلیمانیه','Sulaymaniyah',10),('IQ','SAL','saladin','صلاح‌الدین','Saladin','tikrit','تکریت','Tikrit',11),('IQ','KRB','karbala','کربلا','Karbala','karbala','کربلا','Karbala',12),('IQ','KRK','kirkuk','کرکوک','Kirkuk','kirkuk','کرکوک','Kirkuk',13),('IQ','MYS','maysan','میسان','Maysan','amarah','عماره','Amarah',14),('IQ','MUT','muthanna','مثنی','Al Muthanna','samawah','سماوه','Samawah',15),('IQ','NAJ','najaf','نجف','Najaf','najaf','نجف','Najaf',16),('IQ','NIN','nineveh','نینوا','Nineveh','mosul','موصل','Mosul',17),('IQ','WAS','wasit','واسط','Wasit','kut','کوت','Kut',18),('IQ','HLB','halabja','حلبچه','Halabja','halabja','حلبچه','Halabja',19)
), upserted as (
  insert into public.provinces(country_id,code,slug,name_fa,name_en,is_published,position)
  select c.id,r.code,r.slug,r.name_fa,r.name_en,true,r.position from region r join public.countries c on c.code=r.country_code
  on conflict(country_id,code) do update set slug=excluded.slug,name_fa=excluded.name_fa,name_en=excluded.name_en,is_published=true,position=excluded.position
  returning id,country_id,code
)
insert into public.cities(province_id,slug,name_fa,name_en,is_published,position)
select p.id,r.city_slug,r.city_fa,r.city_en,true,0 from region r join public.countries c on c.code=r.country_code join public.provinces p on p.country_id=c.id and p.code=r.code
on conflict(province_id,slug) do update set name_fa=excluded.name_fa,name_en=excluded.name_en,is_published=true;

do $$ declare brand_id bigint; begin
  insert into public.brands(code,is_published,position) values('hafman',true,1) on conflict(code) do update set is_published=true,position=excluded.position returning id into brand_id;
  insert into public.brand_translations(brand_id,locale,name,slug,description) values(brand_id,'fa','هافمن','hafman','محصولات برند هافمن'),(brand_id,'en','Hafman','hafman','Hafman brand products') on conflict(locale,slug) do update set brand_id=excluded.brand_id,name=excluded.name,description=excluded.description;
  insert into public.brands(code,is_published,position) values('kentoil',true,2) on conflict(code) do update set is_published=true,position=excluded.position returning id into brand_id;
  insert into public.brand_translations(brand_id,locale,name,slug,description) values(brand_id,'fa','کینت اویل','kentoil','محصولات برند کینت اویل'),(brand_id,'en','Kentoil','kentoil','Kentoil brand products') on conflict(locale,slug) do update set brand_id=excluded.brand_id,name=excluded.name,description=excluded.description;
end $$;

create table public.navigation_items(
  id bigint generated always as identity primary key,
  code text not null unique check(code ~ '^[a-z0-9-]+$'),
  label_fa text not null,label_en text not null,
  href text not null check(href ~ '^/'),
  location text not null default 'header' check(location in ('header','footer','both')),
  parent_id bigint references public.navigation_items(id) on delete cascade,
  position integer not null default 0 check(position>=0),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index navigation_items_location_position_idx on public.navigation_items(location,position) where is_published;
create trigger navigation_items_set_updated_at before update on public.navigation_items for each row execute function private.set_updated_at();
alter table public.navigation_items enable row level security;
create policy navigation_items_public_read on public.navigation_items for select to anon,authenticated using(is_published);
create policy navigation_items_staff_manage on public.navigation_items for all to authenticated using((select private.has_staff_role(array['manager','admin','seo']))) with check((select private.has_staff_role(array['manager','admin','seo'])));
grant select on public.navigation_items to anon,authenticated;grant insert,update,delete on public.navigation_items to authenticated;grant usage,select on sequence public.navigation_items_id_seq to authenticated;
insert into public.navigation_items(code,label_fa,label_en,href,location,position) values
('home','صفحه اصلی','Home','/','header',0),('about','درباره ما','About us','/about','both',1),('products','محصولات','Products','/products','both',2),('representatives','نمایندگی‌ها','Representatives','/representatives','both',3),('media','رسانه','Media','/media','both',4),('international','همکاری بین‌المللی','International','/international-cooperation','both',5),('careers','فرصت‌های شغلی','Careers','/careers','both',6),('contact','تماس با ما','Contact us','/contact','both',7)
on conflict(code) do update set label_fa=excluded.label_fa,label_en=excluded.label_en,href=excluded.href,location=excluded.location,position=excluded.position,is_published=true;
