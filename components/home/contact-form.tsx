"use client";
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/locale-provider';
import { submissionMessage } from '@/lib/submission-messages';

export function ContactForm() {
  const { locale } = useTranslation();
  const en = locale === 'en';
  const [values,setValues] = useState({ name:'',email:'',message:'' });
  const [busy,setBusy] = useState(false);
  const [result,setResult] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if(busy) return; setBusy(true); setResult(null);
    try {
      const response = await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});
      const data = await response.json();
      setResult(response.ok && data.ok ? 'saved' : data.code || 'save_failed');
      if(response.ok && data.ok) setValues({name:'',email:'',message:''});
    } catch { setResult('save_failed'); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="flex flex-col gap-4">
    <label className="flex flex-col gap-1.5"><span>{en?'Name':'ชื่อ'}</span><input className="input" required maxLength={120} autoComplete="name" value={values.name} onChange={e=>setValues({...values,name:e.target.value})}/></label>
    <label className="flex flex-col gap-1.5"><span>{en?'Email':'อีเมล'}</span><input className="input" type="email" required maxLength={254} autoComplete="email" value={values.email} onChange={e=>setValues({...values,email:e.target.value})}/></label>
    <label className="flex flex-col gap-1.5"><span>{en?'Message':'ข้อความ'}</span><textarea className="input min-h-28" required minLength={10} maxLength={5000} value={values.message} onChange={e=>setValues({...values,message:e.target.value})}/></label>
    <p className="text-xs text-muted">{en?'Your message will be saved for the store team. Do not include passwords or card details.':'ข้อความจะถูกบันทึกให้ทีมงานร้านค้า กรุณาไม่ส่งรหัสผ่านหรือข้อมูลบัตร'}</p>
    {result && <p role={result==='saved'?'status':'alert'} className={result==='saved'?'text-success':'text-danger'}>{result==='saved'?(en?'Your message has been saved.':'บันทึกข้อความเรียบร้อยแล้ว'):submissionMessage(result,locale)}</p>}
    <button className="primary-button self-start" disabled={busy} type="submit">{busy?(en?'Saving…':'กำลังบันทึก…'):(en?'Send message':'ส่งข้อความ')}</button>
  </form>;
}
