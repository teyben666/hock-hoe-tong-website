/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Gender } from '../types';
import { QUEUE_WALKIN_COPY } from '../data';
import { BilingualLine } from './BilingualLine';

export interface PatientIdentityValues {
  patientName: string;
  patientPhone: string;
  gender: Gender;
  birthDate: string;
}

interface PatientIdentityFieldsProps {
  values: PatientIdentityValues;
  onChange: (patch: Partial<PatientIdentityValues>) => void;
  errors?: Partial<Record<keyof PatientIdentityValues, string>>;
  compact?: boolean;
  /** 现场取号等公众页：标签与按钮显示中英 */
  bilingual?: boolean;
}

const PF = QUEUE_WALKIN_COPY.patientFields;

function FieldLabel({
  zh,
  en,
  bilingual,
}: {
  zh: string;
  en: string;
  bilingual?: boolean;
}) {
  if (!bilingual) {
    return <label className="text-sm font-medium text-[#10143A]">{zh}</label>;
  }
  return (
    <BilingualLine
      zh={zh}
      en={en}
      zhClassName="text-sm font-medium text-[#10143A]"
      enClassName="text-xs text-[#10143A]/50 mt-0.5"
    />
  );
}

export const PatientIdentityFields: React.FC<PatientIdentityFieldsProps> = ({
  values,
  onChange,
  errors,
  compact = false,
  bilingual = false,
}) => {
  const inputClass = compact
    ? 'w-full mt-1 border border-[#10143A]/15 rounded-xl px-3 py-2.5 text-sm bg-white'
    : 'w-full mt-1 rounded-lg border border-[#10143A]/15 p-2.5 text-sm bg-white';

  const genderOptions = [
    { v: 'female' as const, zh: PF.femaleZh, en: PF.femaleEn },
    { v: 'male' as const, zh: PF.maleZh, en: PF.maleEn },
  ];

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel zh={PF.nameZh} en={PF.nameEn} bilingual={bilingual} />
        <input
          required
          value={values.patientName}
          onChange={(e) => onChange({ patientName: e.target.value })}
          className={inputClass}
          placeholder={bilingual ? `${PF.namePlaceholderZh} / ${PF.namePlaceholderEn}` : PF.namePlaceholderZh}
          autoComplete="name"
        />
        {bilingual && (
          <p className="text-[10px] text-[#10143A]/45 mt-0.5">{PF.namePlaceholderEn}</p>
        )}
        {errors?.patientName && (
          <p className="text-red-500 text-xs mt-1">{errors.patientName}</p>
        )}
      </div>

      <div>
        <FieldLabel zh={PF.genderZh} en={PF.genderEn} bilingual={bilingual} />
        <div className="flex gap-2 mt-1">
          {genderOptions.map(({ v, zh, en }) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ gender: v })}
              className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors min-h-[44px] ${
                values.gender === v
                  ? 'bg-[#FDD772] border-[#FDD772] text-[#10143A] font-semibold'
                  : 'bg-white border-[#10143A]/15 text-[#10143A]/70'
              }`}
            >
              {bilingual ? (
                <span className="block leading-tight">
                  <span className="block">{zh}</span>
                  <span className="block text-[10px] font-normal opacity-80">{en}</span>
                </span>
              ) : (
                zh
              )}
            </button>
          ))}
        </div>
        {errors?.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
      </div>

      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
        <div>
          <FieldLabel zh={PF.birthZh} en={PF.birthEn} bilingual={bilingual} />
          <input
            required
            type="date"
            value={values.birthDate}
            onChange={(e) => onChange({ birthDate: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
            className={`${inputClass} font-mono`}
          />
          {errors?.birthDate && (
            <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>
          )}
        </div>
        <div>
          <FieldLabel zh={PF.phoneZh} en={PF.phoneEn} bilingual={bilingual} />
          <input
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.patientPhone}
            onChange={(e) => onChange({ patientPhone: e.target.value })}
            className={`${inputClass} font-mono`}
            placeholder={bilingual ? PF.phonePlaceholderZh : PF.phonePlaceholderZh}
          />
          {bilingual && (
            <p className="text-[10px] text-[#10143A]/45 mt-0.5">{PF.phonePlaceholderEn}</p>
          )}
          {errors?.patientPhone && (
            <p className="text-red-500 text-xs mt-1">{errors.patientPhone}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export function validatePatientIdentityClient(
  values: PatientIdentityValues,
  opts?: { bilingual?: boolean }
): Partial<Record<keyof PatientIdentityValues, string>> {
  const errors: Partial<Record<keyof PatientIdentityValues, string>> = {};
  const bi = opts?.bilingual;

  if (!values.patientName.trim()) {
    errors.patientName = bi
      ? `${PF.errNameZh} / ${PF.errNameEn}`
      : PF.errNameZh;
  }
  const phone = values.patientPhone.replace(/[\s-]/g, '');
  if (phone.length < 8) {
    errors.patientPhone = bi
      ? `${PF.errPhoneZh} / ${PF.errPhoneEn}`
      : PF.errPhoneZh;
  }
  if (!values.birthDate) {
    errors.birthDate = bi
      ? `${PF.errBirthZh} / ${PF.errBirthEn}`
      : PF.errBirthZh;
  }
  if (values.gender !== 'female' && values.gender !== 'male') {
    errors.gender = bi ? `${PF.errGenderZh} / ${PF.errGenderEn}` : PF.errGenderZh;
  }
  return errors;
}
