/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Doctor, Treatment } from './types';

/** 门店招牌信息 — HOCK HOE TONG 福和堂 (Est. 1987) */
export const DEFAULTS = {
  PHONE_NUMBER: import.meta.env.VITE_CLINIC_PHONE || '013-6268626',
  PHONE_TEL:
    import.meta.env.VITE_CLINIC_PHONE?.replace(/[^\d+]/g, '') || '60136268626',
  /** 顾客点击电话/预约按钮 → WhatsApp（非 tel: 拨号） */
  WHATSAPP_URL:
    import.meta.env.VITE_WHATSAPP_URL || 'https://wa.me/qr/Z5GFCPPORNDIK1',
  CLINIC_NAME: '福和堂',
  CLINIC_ENGLISH: 'HOCK HOE TONG',
  CLINIC_MALAY: 'KEDAI UBAT CINA',
  ESTABLISHED: '1987',
  ESTABLISHED_LABEL: 'Since 1987',
  HOURS: '每天 9:30 AM – 7:30 PM',
  HOURS_EN: 'Daily: 9:30 AM – 7:30 PM',
  SHOP_HOURS: '9:30am-7:30pm',
  TCM_HOURS: '10am-7:30pm',
  REST_DAYS:
    '周三&周四（2周1次）Closed on Wednesday & Thursday BIWEEKLY',
  MAIN_BUSINESS: '药材零售/中医诊疗/健康咨询',
  ADDRESS:
    '34，Jalan Beladau 8，Taman Puteri Wangsa，81800，Ulu Tiram，Johor.',
  FOOTER_TAGLINE_1: '草木有情 • 岐黄有道',
  FOOTER_TAGLINE_2: '药材甄选 · 中医调养 · 健康相伴',
  MAPS_URL: 'https://maps.app.goo.gl/BbVV67mhZ5VtWDiS6',
  SLOGAN: '福泽苍生，和调阴阳',
  HERO_MOTTO: '承岐黄之道 • 济苍生之需',
  HERO_SUBHEAD: '始于1987 • 药材老字号',
  HERO_INTRO:
    '三十余载诚信经营，甄选优质人参、冬虫草、枸杞、红枣等中草药，传承中医药文化，守护大众健康。',
  HERO_CREDENTIAL: '上海中医药大学硕士 • 马来西亚合法注册中医师',
  HERO_CLOSING: '专业医师亲诊，传承岐黄智慧，精诚守护大众健康。',
  EMAIL: import.meta.env.VITE_CLINIC_EMAIL || 'hockhoetong1987@gmail.com',
  COPYRIGHT_YEAR: '1987',
};

export const HERO_CAPSULES = [
  { label: '把脉问诊', tip: '望闻问切，辨证识体质' },
  { label: '针灸调理', tip: '经络疏通，调和气血' },
  { label: '一人一方', tip: '个体化中药方案' },
  { label: '道地药材', tip: '精选饮片，严控品质' },
];

/** 中医门诊可预约窗口（每格 20 分钟；午休不定时，由后台「时段休息」临时关闭） */
export const TCM_CONSULT_WINDOWS = [
  { start: '10:00', end: '19:30' },
] as const;

export const SLOT_INTERVAL_MIN = 20;
/** 每次预约仅限 1 位就诊人 */
export const MAX_VISITORS = 1;
export const BOOKING_DAYS_AHEAD = 7;

/** 预约页 / 侧边栏双语文案 */
export const BOOKING_COPY = {
  hero: {
    bookSlotZh: '预约就诊时段',
    bookSlotEn: 'Book an Appointment',
    phoneBookZh: '电话 / WhatsApp 预约（推荐长辈）',
    phoneBookEn: 'Phone / WhatsApp Booking (Recommended for Seniors)',
    slotRulesZh: '每20分钟仅接待1人 · 门诊 10:00 AM–7:30 PM',
    slotRulesEn:
      'One patient every 20 minutes · Consultation: 10:00 AM–7:30 PM',
  },
  senior: {
    titleZh: '长辈专属电话预约',
    titleEn: 'Telephone Booking for Seniors',
    subtitleZh:
      '您只需提供姓名、性别、电话号码、出生年月日和就诊时间即可，我们帮您登记',
    subtitleEn:
      'Simply provide your name, gender, phone number, date of birth, and preferred visit time — we will register the appointment for you.',
    callNowZh: '立即拨打',
    callNowEn: 'Call Now',
    noteZh: '无需填写下方表单，店员将代为登记时段。',
    noteEn:
      'No need to fill out the form below — our staff will record the time slot on your behalf.',
  },
  slotSection: {
    titleZh: '选择您的就诊时段',
    titleEn: 'Select Your Appointment Slot',
    rules: [
      {
        zh: '每20分钟仅接待1人',
        en: 'One patient every 20 minutes',
      },
      {
        zh: '门诊时间 10:00 AM–7:30 PM（午休不定时，以当日可约时段为准）',
        en: 'Consultation: 10:00 AM–7:30 PM (lunch break varies; see available slots)',
      },
      {
        zh: '每两周的周三与周四休息',
        en: 'Closed every other Wednesday & Thursday',
      },
      {
        zh: '系统仅显示当前时间之后的可预约时段',
        en: 'The system only displays available slots after the current time',
      },
    ],
  },
  hotline: {
    titleZh: '福和堂 服务热线',
    titleEn: 'HOCK HOE TONG Customer Service Hotline',
    bodyZh:
      '如您对治疗方案、收费或药材零售有任何疑问，除了自助预约外，亦可直接通过电话客服与我们联系。',
    bodyEn:
      'If you have any questions regarding treatment plans, fees, or herbal retail, you may contact our customer service hotline directly in addition to using the self-service booking system.',
    hoursZh: '中药店每天 9:30 AM – 7:30 PM；门诊 10:00 AM – 7:30 PM',
    hoursEn: 'Shop daily 9:30 AM – 7:30 PM; Consultation 10:00 AM – 7:30 PM',
    restZh: '每两周的周三与周四休息',
    restEn: 'Closed every other Wednesday & Thursday',
    callZh: '拨号',
    callEn: 'Call',
  },
  trustHighlights: [
    {
      titleZh: '持证国医中医师',
      titleEn: 'Licensed TCM Physician',
      subZh: '资质均全国备案可查',
      subEn: 'Nationally registered — credentials verifiable',
    },
    {
      titleZh: '在线时段预约',
      titleEn: 'Online Time-Slot Booking',
      subZh: '无需现场排队苦候',
      subEn: 'No long waits on-site',
    },
    {
      titleZh: '100%道地本草',
      titleEn: '100% Authentic Herbs',
      subZh: '原产地采购无残熏',
      subEn: 'Sourced from origin — responsibly processed',
    },
    {
      titleZh: '长辈直拨登记',
      titleEn: 'Phone Registration for Seniors',
      subZh: '免表单极简通道',
      subEn: 'Simple process — no lengthy forms',
    },
  ],
  ui: {
    todayZh: '今天',
    todayEn: 'Today',
    tomorrowZh: '明天',
    tomorrowEn: 'Tomorrow',
    closedZh: '休息',
    closedEn: 'Closed',
    bookedZh: '已约',
    bookedEn: 'Booked',
    phoneBookLinkZh: '电话预约',
    phoneBookLinkEn: 'Call to book',
    todayEndedZh: '今日在线预约时段已结束，请选其他日期或直接电话预约。',
    todayEndedEn:
      "Today's online slots have ended. Please choose another date or call to book.",
    dayRestZh: '本日为休息日，请选择其他日期或致电门店预约。',
    dayRestEn: 'Clinic closed today. Please choose another date or call us to book.',
    noSlotsZh: '该日暂无可选时段，请换一天或',
    noSlotsEn: 'No slots available this day. Try another date or',
    partialClosedZh: '当日部分时段休息（灰色格不可约），其余时段可正常预约。',
    partialClosedEn:
      'Some time slots are closed today (grey cells). Other slots remain available.',
    partialClosedTagZh: '部分时段休息',
    partialClosedTagEn: 'Some slots closed',
    offlineZh: '离线模式（数据仅存本机）',
    offlineEn: 'Offline mode (data saved on this device only)',
    currentPickZh: '当前选择',
    currentPickEn: 'Selected',
    confirmBookZh: '确认预约',
    confirmBookEn: 'Confirm booking',
  },
  query: {
    titleZh: '预约查询 / 改期',
    titleEn: 'View / Reschedule Appointment',
    placeholderZh: '预约手机号',
    placeholderEn: 'Booking mobile number',
    searchZh: '查询',
    searchEn: 'Search',
    searching: '…',
    callBookZh: '电话预约请拨',
    callBookEn: 'Call to book',
    notFoundZh: '未找到预约记录',
    notFoundEn: 'No appointments found',
    cancelConfirmZh: '确定取消此次预约？',
    cancelConfirmEn: 'Cancel this appointment?',
    cancelledZh: '预约已取消。也可电话联系我们改期。',
    cancelledEn: 'Appointment cancelled. You may also call us to reschedule.',
    cancelFailZh: '取消失败，请致电前台协助。',
    cancelFailEn: 'Cancellation failed. Please call the front desk for help.',
    cancelTitleZh: '取消',
    cancelTitleEn: 'Cancel',
  },
  queue: {
    titleZh: '今日排队 / 现场取号',
    titleEn: "Today's Queue / Walk-In",
    bodyZh: '查 A 号、W 号或现场登记，请使用手机打开下方页面（可店内扫码）。',
    bodyEn:
      'Check A/W queue numbers or register on-site — open the page below on your phone (scan in-store QR).',
    openZh: '打开查号 / 取号',
    openEn: 'Open queue check / walk-in',
  },
  form: {
    physicianZh: '驻诊医师',
    physicianEn: 'Physician',
    physicianSuffixZh: '医师',
    treatmentZh: '项目 *',
    treatmentEn: 'Treatment *',
    selectTreatmentZh: '选择项目',
    selectTreatmentEn: 'Select treatment',
    nameZh: '姓名 *',
    nameEn: 'Name *',
    namePlaceholderZh: '就诊人姓名',
    namePlaceholderEn: 'Patient name',
    genderZh: '性别',
    genderEn: 'Gender',
    femaleZh: '女',
    femaleEn: 'Female',
    maleZh: '男',
    maleEn: 'Male',
    genderRequiredZh: '请选择性别',
    genderRequiredEn: 'Please select gender',
    birthZh: '出生年月日 *',
    birthEn: 'Date of birth *',
    phoneZh: '手机号 *',
    phoneEn: 'Mobile *',
    phonePlaceholderZh: '例: 0123456789',
    phonePlaceholderEn: 'e.g. 0123456789',
    onePatientZh: '每次预约仅限 1 位就诊人',
    onePatientEn: 'One patient per appointment',
    symptomsZh: '主诉症状（选填）',
    symptomsEn: 'Chief complaint (optional)',
    symptomsPlaceholderZh: '请简述症状',
    symptomsPlaceholderEn: 'Brief symptoms',
    privacyZh: '信息仅用于就诊登记与医师备诊，不会对外泄露。',
    privacyEn: 'Your details are used only for registration and clinical preparation.',
    successToastZh: '预约成功！已为您登记，确认短信/电话将稍后联系。',
    successToastEn:
      'Booked! Your slot is reserved. We will contact you shortly to confirm.',
  },
} as const;

/** 叫号大屏 / 现场取号页 — 中英双语 */
export const QUEUE_WALKIN_COPY = {
  queueDisplay: {
    titleZh: '候诊叫号',
    titleEn: 'Waiting queue',
    nowServingZh: '请以下号码准备进诊',
    nowServingEn: 'Now serving — please proceed when your number is called',
    appointmentZh: '预约等候 A',
    appointmentEn: 'Appointment queue (A)',
    walkInZh: '现场等候 W',
    walkInEn: 'Walk-in queue (W)',
    emptyZh: '暂无',
    emptyEn: 'None waiting',
    loadErrorZh: '加载失败',
    loadErrorEn: 'Failed to load',
    refreshZh: (seconds: number) => `每 ${seconds} 秒自动刷新`,
    refreshEn: (seconds: number) => `Auto-refresh every ${seconds} seconds`,
    enableSoundZh: '请点击此处启用叫号铃声与语音（每开新页面需点一次）',
    enableSoundEn: 'Tap here to enable chime & voice (required once per page)',
    soundOnZh: '铃声与语音已开',
    soundOnEn: 'Chime & voice on',
    ttsUnsupportedZh: '本设备不支持语音播报，仅显示号码与铃声',
    ttsUnsupportedEn: 'Voice unavailable on this device — display & chime only',
  },
  walkIn: {
    backZh: '返回官网',
    backEn: 'Back to website',
    subtitleZh: '现场查号 · 取号',
    subtitleEn: 'Check queue · Get walk-in number',
    tabCheckZh: '查我的号',
    tabCheckEn: 'Check my number',
    tabRegisterZh: '现场取号',
    tabRegisterEn: 'Walk-in ticket',
    phoneLabelZh: '电话号码',
    phoneLabelEn: 'Mobile number',
    phonePlaceholderZh: '与预约或取号时一致',
    phonePlaceholderEn: 'Same number used when booking or registering',
    searchZh: '查询',
    searchEn: 'Search',
    searchingZh: '…',
    searchingEn: '…',
    invalidPhoneZh: '请输入有效手机号',
    invalidPhoneEn: 'Please enter a valid mobile number',
    queryFailedZh: '查询失败',
    queryFailedEn: 'Search failed',
    notFoundZh: '今日暂无该手机号的号码。',
    notFoundEn: 'No queue number found for this phone today.',
    goRegisterZh: '前往现场取号 →',
    goRegisterEn: 'Get a walk-in number →',
    footerHintZh: '请留意店内大屏叫号，或刷新本页查看最新状态',
    footerHintEn: 'Watch the in-clinic display board, or refresh this page for updates',
    footerScreenZh: '候诊大屏请店内观看',
    footerScreenEn: 'Queue display is shown in the clinic',
    successZh: '取号成功',
    successEn: 'Number issued',
    successBodyZh: '请留意大屏叫号。可用此手机号在「查我的号」随时查看等候情况。',
    successBodyEn:
      'Watch the display board for your turn. Use this phone number under “Check my number” anytime.',
    checkMyNumberZh: '查我的号',
    checkMyNumberEn: 'Check my number',
    registerNoteZh:
      '请如实填写，便于区分同名患者。每次仅限 1 人取号；每手机号每日仅取一个现场号。',
    registerNoteEn:
      'Please fill in accurately. One person per registration; one walk-in number per phone per day.',
    submitZh: '确认取号',
    submitEn: 'Confirm',
    submittingZh: '提交中…',
    submittingEn: 'Submitting…',
    registerFailedZh: '取号失败',
    registerFailedEn: 'Registration failed',
    sourceWalkInZh: '现场号',
    sourceWalkInEn: 'Walk-in',
    sourceApptZh: '预约号',
    sourceApptEn: 'Appointment',
  },
  status: {
    not_arrived: {
      zh: '未到店 · 请至柜台签到',
      en: 'Not checked in · Please check in at the counter',
    },
    waiting: { zh: '等候中', en: 'Waiting' },
    called: { zh: '已叫号 · 请进', en: 'Called — please proceed' },
    in_service: { zh: '就诊中', en: 'In consultation' },
    done: { zh: '已完成', en: 'Completed' },
    skipped: { zh: '已过号', en: 'Missed turn' },
  },
  hints: {
    notCallableZh: '尚未到预约时段，请留意大屏',
    notCallableEn: 'Your appointment time has not arrived yet — watch the display',
    nextUpZh: '即将轮到您',
    nextUpEn: 'You are next',
    aheadZh: (n: number) => `前面约 ${n} 位`,
    aheadEn: (n: number) => `About ${n} ahead of you`,
  },
  patientFields: {
    nameZh: '姓名 *',
    nameEn: 'Full name *',
    namePlaceholderZh: '就诊人姓名',
    namePlaceholderEn: 'Patient name',
    genderZh: '性别 *',
    genderEn: 'Gender *',
    femaleZh: '女',
    femaleEn: 'Female',
    maleZh: '男',
    maleEn: 'Male',
    errGenderZh: '请选择性别',
    errGenderEn: 'Please select gender',
    birthZh: '出生年月日 *',
    birthEn: 'Date of birth *',
    phoneZh: '电话号码 *',
    phoneEn: 'Mobile number *',
    phonePlaceholderZh: '01xxxxxxxx',
    phonePlaceholderEn: 'e.g. 01xxxxxxxx',
    errNameZh: '请输入姓名',
    errNameEn: 'Please enter your name',
    errPhoneZh: '请输入有效手机号',
    errPhoneEn: 'Please enter a valid mobile number',
    errBirthZh: '请选择出生日期',
    errBirthEn: 'Please select date of birth',
  },
} as const;

/** 关于我们 — 标题、正文、地址与营业时间 */
export const ABOUT_COPY = {
  tagline: '草木有情 • 岐黄有道',
  logoSrc: '/logo-brand.png',
  sections: [
    {
      titleZh: '药材店兼医馆简介',
      titleEn: 'Herbal Shop & TCM Clinic',
      body: '**福和堂（HOCK HOE TONG）**创立于1987年，作为老字号药材店，我们传承近四十年的中医智慧与经验。如今，**【福和堂】**已正式从拉美士（Labis）迁至**新山（JB）**，并由单一药材零售扩展为**【药材店兼中医馆】**，为大众健康提供更全面的服务。',
    },
    {
      titleZh: '药品简介',
      titleEn: 'Herbs & Wellness Products',
      body: '作为正统药材店，我们专营多种**优质中草药：**人参、泡参、西洋参、党参、冬虫草、洞燕、枸杞、红枣、麦冬等。除此之外，还提供多款**传统凉茶**与药包冲剂，如杂凉茶、何人可茶、白花蛇舌草水、夏桑菊花茶、罗汉果菊花茶、湿热茶等。更有天然**野山蜜糖、自酿黄酒、**正品灵芝酒、巴戟酒、杜仲补药精、虫草泡参精、银杏泡参精、五加皮酒等**养生佳品，**品类齐全，品质保证。',
    },
    {
      titleZh: '医师简介',
      titleEn: 'Our Physician',
      body: '本医馆的驻诊医师**硕士**毕业于**上海中医药大学**，本科主修**中医专业**，辅修**针灸推拿专业**，更被评为**上海中医药大学优秀毕业生**，系统研修岐黄之道，兼具扎实的理论基础与丰富的临床经验。师从多位名中医，并在龙华医院、曙光医院、光华医院及岳阳中西医结合医院等**上海市三甲医院轮转学习**。该医师已**合法注册马来西亚中医师执业执照**，获准在当地开展临床服务。',
    },
    {
      titleZh: '诊疗理念',
      titleEn: 'Treatment Philosophy',
      body: '医师秉持“承岐黄之道 • 济苍生之需”的理念，擅长运用传统中草药、针灸、推拿及养生调理，为患者提供个性化的健康方案。多年来致力于弘扬中医文化，结合现代医学理念，帮助大众改善体质、调理身心，提升整体健康水平。',
    },
  ],
  address: {
    labelZh: '医馆地址',
    labelEn: 'Address',
  },
  hours: {
    titleZh: '营业时间',
    titleEn: 'Business Hours',
    shopZh: '中药店营业时间',
    shopEn: 'Chinese Medicine Shop Hours',
    shopValue: '9:30am-7:30pm',
    tcmZh: '中医门诊时间',
    tcmEn: 'TCM Consultation Hours',
    tcmValue: '10am-7:30pm',
    restZh: '休息日',
    restValue: '周三&周四（2周1次）',
    restEn: 'Closed on Wednesday & Thursday BIWEEKLY',
  },
} as const;

export const TREATMENTS: Treatment[] = [
  {
    id: 't1',
    name: '中药',
    nameEn: 'Chinese Herbal Medicine',
    operation:
      '根据舌脉辨证，一人一方精准配伍。提供有偿代煎服务，慢火熬制，确保药效充分释放，绝不浪费。',
    effects: '调理体质、扶正祛邪，改善脏腑功能，促进整体平衡。',
    suitableFor: '体质虚弱、慢性病患者、需长期调理者。',
    iconName: 'Leaf',
  },
  {
    id: 't2',
    name: '针刺治疗',
    nameEn: 'Acupuncture',
    operation: '以细针刺激经络穴位，调和气血。',
    effects: '缓解疼痛、改善睡眠、调节免疫功能。',
    suitableFor: '颈肩腰腿痛、失眠、消化不良、亚健康人群。',
    iconName: 'Activity',
  },
  {
    id: 't3',
    name: '艾灸',
    nameEn: 'Moxibustion',
    operation: '燃烧艾条或艾柱温热刺激穴位，温通经络。',
    effects: '驱寒祛湿、温阳补气、增强抵抗力。',
    suitableFor: '体寒怕冷、免疫力低下、妇科调理。',
    iconName: 'Flame',
  },
  {
    id: 't4',
    name: '拔罐',
    nameEn: 'Cupping',
    operation: '利用负压吸附于皮肤，促进气血运行。',
    effects: '祛风散寒、舒筋活络、缓解肌肉酸痛。',
    suitableFor: '肩颈僵硬、运动损伤、风湿痹痛。',
    iconName: 'CircleDot',
  },
  {
    id: 't5',
    name: '小儿推拿',
    nameEn: 'Pediatric TuiNa',
    operation: '通过特定手法按摩小儿经络穴位。',
    effects: '调理脾胃、增强免疫力、促进生长发育。',
    suitableFor: '婴幼儿及儿童，常见于消化不良、咳嗽、体弱易感冒。',
    iconName: 'Baby',
  },
  {
    id: 't6',
    name: '颐玥臻膳',
    nameEn: 'Moonwell Nourish',
    tagline: '东方食养 · 现代月膳',
    operation:
      '以东方草本智慧结合现代产后调理理念，从体质出发，温和滋养，帮助妈妈在月子期间循序恢复元气与气血。',
    effects:
      '传统食养结合温补理念，帮助产后妈妈调理气血、恢复体力、促进子宫修复与乳汁分泌，让身体从「失血、耗气、劳累」的状态慢慢恢复。精选天然药材与营养食材，温和滋补、暖身养身，让妈妈在月子期间更好地恢复元气、提升精神与身体状态，安心迎接产后新生活。',
    suitableFor: '产后恢复中、月子调理的妈妈。',
    iconName: 'UtensilsCrossed',
  },
];

export const DEFAULT_DOCTOR_ID = 'd1';

export const DOCTORS: Doctor[] = [
  {
    id: 'd1',
    name: '李妙音',
    title: '执业中医师',
    avatar: '/doctor-li-miaoyin.png',
    intro:
      '本医馆的驻诊医师**硕士**毕业于**上海中医药大学**，本科主修**中医专业**，辅修**针灸推拿专业**，更被评为**上海中医药大学优秀毕业生**，系统研修岐黄之道，兼具扎实的理论基础与丰富的临床经验。师从多位名中医，并在龙华医院、曙光医院、光华医院及岳阳中西医结合医院等**上海市三甲医院轮转学习**。该医师已**合法注册马来西亚中医师执业执照**，获准在当地开展临床服务。',
    specialties: ['中医全科', '内科', '外科', '妇科', '男科', '儿科', '杂病'],
    treatmentPlans: ['中药', '针刺', '艾灸', '拔罐', '小儿推拿', '颐玥臻膳'],
    schedule: ['每天：10:00 AM – 7:30 PM'],
    restDays: '每两周的周三与周四',
    rating: 5,
  },
];

export const TREATMENTS_SECTION = {
  tagline: '整体观 • 辨证论治',
  title: '治疗项目',
  intro:
    '中医强调以整体观念为指导，注重人体与自然、身心之间的统一与协调。通过四诊合参，全面分析患者的体质与病机，因人、因时、因地制宜，制定个性化的治疗方案。辨证论治不仅着眼于疾病本身，更关注整体平衡与长期康养。因此，所有治疗项目均在系统的舌脉辨证完成后，依据个人体质进行针对性的配伍与施治。',
} as const;

export const WELLNESS_SECTION = {
  tagline: '顺时调养 · 日常养护',
  title: '养生知识',
  intro:
    '以下内容仅供日常养生参考，不替代医师诊断与治疗；用药与针灸方案须经面诊后个体化制定。',
  disclaimer: '体质有别，若有不适或症状持续，请预约面诊辨证调理。',
} as const;
