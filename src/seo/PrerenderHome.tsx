/**
 * 首页预渲染内容（构建时写入 dist/index.html #root）
 * 仅静态文案，无浏览器 API；React 客户端挂载后会整页替换，不影响预约。
 */

import React from 'react';
import {
  DEFAULTS,
  ABOUT_COPY,
  TREATMENTS,
  TREATMENTS_SECTION,
  WELLNESS_SECTION,
} from '../data';

function plainText(s: string): string {
  return s.replace(/\*\*/g, '');
}

export function PrerenderHome(): React.ReactElement {
  return (
    <div data-prerender="home">
      <header>
        <p>{DEFAULTS.CLINIC_ENGLISH}</p>
        <h1>
          {DEFAULTS.CLINIC_NAME} {DEFAULTS.CLINIC_ENGLISH} — 中医就诊预约
        </h1>
        <p>{DEFAULTS.SLOGAN}</p>
        <p>{DEFAULTS.HERO_MOTTO}</p>
        <p>{DEFAULTS.HERO_SUBHEAD}</p>
        <p>{DEFAULTS.HERO_INTRO}</p>
        <p>{DEFAULTS.HERO_CREDENTIAL}</p>
        <p>{DEFAULTS.HERO_CLOSING}</p>
      </header>

      <main>
        <section aria-label="关于我们">
          <h2>
            {DEFAULTS.CLINIC_NAME} · {DEFAULTS.CLINIC_ENGLISH}
          </h2>
          <p>{ABOUT_COPY.tagline}</p>
          {ABOUT_COPY.sections.map((section) => (
            <section key={section.titleZh}>
              <h3>
                {section.titleZh} / {section.titleEn}
              </h3>
              <p>{plainText(section.body)}</p>
            </section>
          ))}
          <p>
            {ABOUT_COPY.address.labelZh}：{DEFAULTS.ADDRESS}
          </p>
          <p>
            {ABOUT_COPY.hours.titleZh}：{ABOUT_COPY.hours.shopZh}{' '}
            {ABOUT_COPY.hours.shopValue}；{ABOUT_COPY.hours.tcmZh}{' '}
            {ABOUT_COPY.hours.tcmValue}；{ABOUT_COPY.hours.restZh}{' '}
            {ABOUT_COPY.hours.restValue}
          </p>
        </section>

        <section aria-label="治疗项目">
          <h2>{TREATMENTS_SECTION.title}</h2>
          <p>{TREATMENTS_SECTION.tagline}</p>
          <p>{TREATMENTS_SECTION.intro}</p>
          {TREATMENTS.map((t) => (
            <article key={t.id}>
              <h3>
                {t.name}
                {t.nameEn ? ` / ${t.nameEn}` : ''}
              </h3>
              {t.tagline ? <p>{t.tagline}</p> : null}
              <p>操作方式：{t.operation}</p>
              <p>功效作用：{t.effects}</p>
              <p>适合人群：{t.suitableFor}</p>
            </article>
          ))}
        </section>

        <section aria-label="中医知识库">
          <h2>{WELLNESS_SECTION.title}</h2>
          <p>{WELLNESS_SECTION.tagline}</p>
          <p>{WELLNESS_SECTION.intro}</p>
          <p>{WELLNESS_SECTION.disclaimer}</p>
        </section>

        <section aria-label="联系与预约">
          <h2>在线预约与联系</h2>
          <p>
            电话 / WhatsApp：{DEFAULTS.PHONE_NUMBER}
          </p>
          <p>邮箱：{DEFAULTS.EMAIL}</p>
          <p>地址：{DEFAULTS.ADDRESS}</p>
          <p>
            中药店营业时间 {DEFAULTS.SHOP_HOURS}；中医门诊时间 {DEFAULTS.TCM_HOURS}
          </p>
        </section>
      </main>
    </div>
  );
}
