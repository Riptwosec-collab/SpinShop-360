"use client";
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/locale-provider';
import { submissionMessage } from '@/lib/submission-messages';
export function NewsletterForm() {
  const {t,locale} = useTranslation(); const en = locale==='en';
  const [email,setEmail]=useState(''); const [consent,setConsent]=useState(false);
  const [busy,setBusy]=useState(false); const [result,setResult]=useState<string|null>(null);
  async function submit(event:React.FormEvent){
    event.preventDefault(); if(busy)return; setBusy(true);setResult(null);
    try {const response=await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,consent})});const data=await response.json();
      setResult(response.ok&&data.ok?'saved':data.code||'save_failed');if(response.ok&&data.ok){setEmail('');setConsent(false);}
    }catch{setResult('save_failed');}finally{setBusy(false);}
  }
  return <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
    <div><h4 className="text-sm font-medium">{t.footer.newsletterTitle}</h4><p className="text-xs text-muted">{t.footer.newsletterDesc}</p></div>
    <form onSubmit={submit} className="w-full max-w-sm space-y-2">
      <div className="flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">{en?'Email address':'อีเมล'}</span><input className="input w-full" type="email" required maxLength={254} autoComplete="email" placeholder={en?'Your email':'อีเมลของคุณ'} value={email} onChange={e=>setEmail(e.target.value)}/></label><button disabled={busy} type="submit" className="primary-button shrink-0">{busy?(en?'Saving…':'กำลังบันทึก…'):t.footer.subscribe}</button></div>
      <label className="flex items-start gap-2 text-xs text-muted"><input type="checkbox" className="mt-0.5" required checked={consent} onChange={e=>setConsent(e.target.checked)}/>{en?'I agree to receive store news by email.':'ฉันยินยอมรับข่าวสารจากร้านทางอีเมล'}</label>
      {result&&<p role={result==='saved'?'status':'alert'} className={`text-xs ${result==='saved'?'text-success':'text-danger'}`}>{result==='saved'?(en?'Your subscription request has been saved.':'บันทึกคำขอรับข่าวสารเรียบร้อยแล้ว'):submissionMessage(result,locale)}</p>}
    </form>
  </div>;
}
