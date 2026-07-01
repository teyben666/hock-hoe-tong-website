/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Gender } from '../types';

export function formatGender(gender?: Gender): string {
  if (gender === 'female') return '女';
  if (gender === 'male') return '男';
  return '不愿透露';
}

/** 列表展示：姓名 · 性别 · 出生日期 */
export function formatPatientIdentity(
  name: string,
  gender?: Gender,
  birthDate?: string
): string {
  const parts = [name.trim()];
  if (gender) parts.push(formatGender(gender));
  if (birthDate) parts.push(birthDate);
  return parts.join(' · ');
}
