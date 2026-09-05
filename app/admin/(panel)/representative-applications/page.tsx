import {fileUrl} from "@/lib/storage/files";
import Link from "next/link";
import { FileTextIcon } from "@/components/admin-icons";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";
import { updateApplication } from "./actions";

type Props={searchParams:Promise<{error?:string;saved?:string;status?:string}>};
const labels={new:"جدید",reviewing:"در حال بررسی",needs_information:"نیازمند اطلاعات",approved:"تأییدشده",rejected:"ردشده",archived:"بایگانی"} as const;
type Status=keyof typeof labels;

export default async function ApplicationsPage({searchParams}:Props){
  const[,query]=await Promise.all([requireStaff(),searchParams]);
  const{data:items=[],error}=await(await createClient()).from("representative_applications").select("id,document_path,tracking_code,full_name,mobile,business_name,country_code,region,city,experience,distribution_area,facilities,notes,status,internal_note,created_at").order("created_at",{ascending:false});
  const selected=(query.status && query.status in labels?query.status:"all") as Status|"all";
  const visible=selected==="all"?items:items?.filter(item=>item.status===selected);
  const count=(status:Status)=>items?.filter(item=>item.status===status).length??0;
  return <main className="admin-module-page admin-requests-page"><header><div><span><FileTextIcon/></span><div><small>شبکه فروش</small><h1>درخواست‌های نمایندگی</h1><p>بررسی متمرکز اطلاعات متقاضی و ثبت نتیجه پیگیری</p></div></div></header>
    {error?<p className="admin-alert error">جدول درخواست‌ها هنوز روی پایگاه داده اعمال نشده است.</p>:null}{query.saved?<p className="admin-alert success">وضعیت درخواست ذخیره شد.</p>:null}
    <section className="admin-request-summary"><article><small>کل درخواست‌ها</small><strong>{items?.length??0}</strong></article><article><small>نیازمند بررسی</small><strong>{count("new")+count("reviewing")}</strong></article><article><small>تأییدشده</small><strong>{count("approved")}</strong></article><article><small>نیازمند اطلاعات</small><strong>{count("needs_information")}</strong></article></section>
    <nav className="admin-request-filters" aria-label="فیلتر وضعیت"><Link className={selected==="all"?"active":""} href="/admin/representative-applications">همه <span>{items?.length??0}</span></Link>{(Object.entries(labels) as [Status,string][]).map(([status,label])=><Link className={selected===status?"active":""} href={`/admin/representative-applications?status=${status}`} key={status}>{label}<span>{count(status)}</span></Link>)}</nav>
    <section className="admin-application-list"><header><div><h2>{selected==="all"?"همه درخواست‌ها":labels[selected]}</h2><p>برای مشاهده اطلاعات کامل و ثبت نتیجه، درخواست را باز کنید.</p></div><span>{visible?.length??0}</span></header>{visible?.length?visible.map((item,index)=><details className="admin-application-item" key={item.id}><summary><span className="admin-request-index">{String(index+1).padStart(2,"0")}</span><div><strong>{item.full_name}</strong><small>{item.business_name} · {item.city}</small></div><span dir="ltr">{item.tracking_code}</span><i data-status={item.status}>{labels[item.status]}</i><em aria-hidden="true">+</em></summary><div className="admin-application-details"><dl><div><dt>موبایل</dt><dd dir="ltr">{item.mobile}</dd></div><div><dt>موقعیت</dt><dd>{item.country_code} / {item.region} / {item.city}</dd></div><div><dt>سابقه</dt><dd>{item.experience}</dd></div><div><dt>محدوده توزیع</dt><dd>{item.distribution_area}</dd></div><div><dt>امکانات</dt><dd>{item.facilities.join("، ")||"—"}</dd></div><div><dt>توضیحات</dt><dd>{item.notes||"—"}</dd></div></dl>{item.document_path?<a href={fileUrl("representative-documents",item.document_path)}>دریافت مدارک</a>:null}<form action={updateApplication}><h3>نتیجه بررسی</h3><input type="hidden" name="id" value={item.id}/><label><span>وضعیت</span><select name="status" defaultValue={item.status}>{Object.entries(labels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><label><span>یادداشت داخلی</span><textarea name="internal_note" rows={5} defaultValue={item.internal_note??""}/></label><button>ذخیره نتیجه</button></form></div></details>):<div className="admin-catalog-empty"><strong>درخواستی در این وضعیت وجود ندارد</strong></div>}</section>
  </main>;
}
