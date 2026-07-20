/*
 * การตั้งค่าบริการยืนยันตัวตน RTAF Super App
 * ไฟล์นี้ต้องโหลดก่อนสคริปต์ login ใน Home.html
 */
window.WEAPONEERING_CONFIG = Object.freeze({
    // POST application/json: { user: "ไม่ใส่ @rtaf.mi.th", pass: "OTP" }
    otpEndpoint: "/api/mfa/login",
    otpCredentials: "same-origin",
    // POST ต้องตอบ { sessionId, qrData, statusUrl? }
    qrStartEndpoint: "REPLACE_WITH_RTAF_QR_START_ENDPOINT",
    // GET ต้องตอบ { status: "pending|approved|expired|denied", user? }
    // หาก qrStartEndpoint ส่ง statusUrl มาแล้ว ค่านี้จะไม่ถูกใช้
    qrStatusEndpoint: "REPLACE_WITH_RTAF_QR_STATUS_ENDPOINT/{sessionId}",
    qrPollInterval: 2000,
    successUrl: "index.html",
    credentials: "include"
});
