/**
 * 患者身份信息校验（姓名、性别、手机、出生日期）
 */

export type PatientGender = 'female' | 'male' | 'undisclosed';

export interface PatientIdentityInput {
  patientName?: string;
  patientPhone?: string;
  gender?: string;
  birthDate?: string;
}

export interface PatientIdentityParsed {
  patientName: string;
  patientPhone: string;
  gender: PatientGender;
  birthDate: string;
}

const PHONE_REGEX = /^(\+?6?01|1[3-9])\d{7,9}$/;

export function parsePatientIdentity(
  input: PatientIdentityInput
): { ok: true; data: PatientIdentityParsed } | { ok: false; error: string } {
  const patientName = String(input.patientName ?? '').trim();
  const patientPhone = String(input.patientPhone ?? '').replace(/[\s-]/g, '');
  const gender = input.gender as PatientGender;
  const birthDate = String(input.birthDate ?? '').trim();

  if (!patientName) return { ok: false, error: '请填写姓名' };
  if (!PHONE_REGEX.test(patientPhone) && patientPhone.length < 8) {
    return { ok: false, error: '手机号格式不正确' };
  }
  if (!['female', 'male'].includes(gender)) {
    return { ok: false, error: '请选择性别（男 / 女）' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return { ok: false, error: '请选择出生年月日' };
  }
  const birth = new Date(birthDate + 'T12:00:00');
  if (Number.isNaN(birth.getTime())) {
    return { ok: false, error: '出生日期无效' };
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (birth > today) return { ok: false, error: '出生日期不能晚于今天' };

  return {
    ok: true,
    data: { patientName, patientPhone, gender, birthDate },
  };
}
