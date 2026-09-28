export function submissionMessage(code: string, locale: 'th' | 'en') {
  const messages: Record<string,[string,string]> = {
    invalid:['กรุณาตรวจสอบข้อมูลและยืนยันความยินยอม','Check the form fields and required consent.'],
    unavailable:['ยังไม่ได้เปิดรับข้อมูลในขณะนี้ กรุณาลองอีกครั้งภายหลัง','Submissions are not available yet. Please try again later.'],
    rate_limited:['ส่งคำขอหลายครั้งเกินไป กรุณารอ 1 นาที','Too many requests. Please wait one minute.'],
    save_failed:['บันทึกไม่สำเร็จ ข้อมูลยังอยู่ในฟอร์ม กรุณาลองอีกครั้ง','Could not save. Your form entries are preserved; please retry.'],
  };
  return (messages[code] || messages.save_failed)[locale==='en'?1:0];
}
