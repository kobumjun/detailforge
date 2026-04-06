import crypto from "crypto";

export function sha256Hex(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

export function sha512Hex(plain: string): string {
  return crypto.createHash("sha512").update(plain).digest("hex");
}

/** 웹표준 결제 요청: mKey = SHA256(signKey) */
export function inicisMKey(signKey: string): string {
  return sha256Hex(signKey);
}

/**
 * signature = SHA256("oid=...&price=...&timestamp=...")
 * verification = SHA256("oid=...&price=...&signKey=...&timestamp=...")
 */
export function inicisStdPayRequestHashes(args: {
  oid: string;
  price: string;
  timestamp: string;
  signKey: string;
}): { signature: string; verification: string; mKey: string } {
  const { oid, price, timestamp, signKey } = args;
  const signature = sha256Hex(`oid=${oid}&price=${price}&timestamp=${timestamp}`);
  const verification = sha256Hex(
    `oid=${oid}&price=${price}&signKey=${signKey}&timestamp=${timestamp}`,
  );
  return { signature, verification, mKey: inicisMKey(signKey) };
}

/** 승인요청: signature / verification (authToken, timestamp, signKey) */
export function inicisApprovalHashes(args: {
  authToken: string;
  timestamp: string;
  signKey: string;
}): { signature: string; verification: string } {
  const { authToken, timestamp, signKey } = args;
  const signature = sha256Hex(`authToken=${authToken}&timestamp=${timestamp}`);
  const verification = sha256Hex(
    `authToken=${authToken}&signKey=${signKey}&timestamp=${timestamp}`,
  );
  return { signature, verification };
}

/** INIAPI v1 전체취소 hashData = SHA512(INIAPIKey + type + paymethod + timestamp + clientIp + mid + tid) */
export function inicisRefundHashV1(args: {
  apiKey: string;
  type: string;
  paymethod: string;
  timestamp: string;
  clientIp: string;
  mid: string;
  tid: string;
}): string {
  const { apiKey, type, paymethod, timestamp, clientIp, mid, tid } = args;
  const plain = apiKey + type + paymethod + timestamp + clientIp + mid + tid;
  return sha512Hex(plain);
}
