/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'عطلات رحلاتكم'
const SITE_URL = 'https://visafaster.com'

interface ApplicationConfirmationProps {
  applicationNumber?: string
  fullName?: string
  email?: string
  phone?: string
  countryName?: string
  visaTypeName?: string
  travelDate?: string
  travelers?: { adults?: number; children?: number; infants?: number }
  breakdown?: { adults?: number; children?: number; infants?: number }
  serviceTotal?: number
  governmentTotal?: number
  grandTotal?: number
  visaFeesIncluded?: boolean
  submissionMethod?: 'online' | 'whatsapp'
  paymentMethod?: string
  checkedRequirements?: string[]
  termsAcceptedAt?: string
}

const fmt = (n?: number) => (typeof n === 'number' ? n.toLocaleString('en-US') : '0')

const ApplicationConfirmationEmail = ({
  applicationNumber = 'VF-XXXX-XXXX',
  fullName = '',
  email = '',
  phone = '',
  countryName = '',
  visaTypeName = '',
  travelDate = '',
  travelers = {},
  breakdown = {},
  serviceTotal = 0,
  governmentTotal = 0,
  grandTotal = 0,
  visaFeesIncluded = false,
  submissionMethod = 'online',
  paymentMethod = '',
  checkedRequirements = [],
  termsAcceptedAt = '',
}: ApplicationConfirmationProps) => {
  const isWhatsApp = submissionMethod === 'whatsapp'

  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>تأكيد استلام طلب التأشيرة رقم {applicationNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>{SITE_NAME}</Heading>
            <Text style={headerSub}>
              {isWhatsApp ? 'تم استلام طلبك' : 'تم استلام طلبك ودفعتك بنجاح'}
            </Text>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Text style={text}>
              مرحباً {fullName || 'عميلنا الكريم'}،
            </Text>
            <Text style={text}>
              {isWhatsApp
                ? 'تم تسجيل طلب التأشيرة الخاص بك. هذه نسخة موثقة بتفاصيل طلبك. لم يتم خصم أي مبلغ بعد، وسيتواصل معك أحد موظفينا عبر واتساب لإكمال الإجراءات والدفع.'
                : 'تم استلام طلب التأشيرة الخاص بك بنجاح، وستبدأ مراجعته خلال 1-2 ساعة عمل. هذه نسخة موثقة بتفاصيل الطلب لمراجعتك.'}
            </Text>
          </Section>

          {/* Application Number */}
          <Section style={appNumberBox}>
            <Text style={appNumberLabel}>رقم طلبك</Text>
            <Text style={appNumberText} dir="ltr">{applicationNumber}</Text>
          </Section>

          {/* Customer Info */}
          <Section style={section}>
            <Heading as="h2" style={h2}>بيانات مقدم الطلب</Heading>
            <Row label="الاسم" value={fullName} />
            <Row label="البريد الإلكتروني" value={email} ltr />
            <Row label="رقم الجوال" value={phone} ltr />
          </Section>

          <Hr style={hr} />

          {/* Visa Details */}
          <Section style={section}>
            <Heading as="h2" style={h2}>تفاصيل التأشيرة</Heading>
            <Row label="الدولة" value={countryName} />
            <Row label="نوع التأشيرة" value={visaTypeName} />
            {travelDate && <Row label="تاريخ السفر المتوقع" value={travelDate} />}
            <Row
              label="المسافرون"
              value={[
                travelers.adults ? `${travelers.adults} بالغ` : null,
                travelers.children ? `${travelers.children} طفل` : null,
                travelers.infants ? `${travelers.infants} رضيع` : null,
              ].filter(Boolean).join('، ') || '-'}
            />
          </Section>

          <Hr style={hr} />

          {/* Pricing */}
          <Section style={section}>
            <Heading as="h2" style={h2}>تفاصيل المبلغ</Heading>
            {(travelers.adults ?? 0) > 0 && (
              <Row label={`بالغ × ${travelers.adults}`} value={`${fmt(breakdown.adults)} ر.س`} />
            )}
            {(travelers.children ?? 0) > 0 && (
              <Row label={`طفل × ${travelers.children}`} value={`${fmt(breakdown.children)} ر.س`} />
            )}
            {(travelers.infants ?? 0) > 0 && (
              <Row label={`رضيع × ${travelers.infants}`} value={`${fmt(breakdown.infants)} ر.س`} />
            )}
            <Row label="إجمالي رسوم الخدمة" value={`${fmt(serviceTotal)} ر.س`} />
            {!visaFeesIncluded && governmentTotal > 0 && (
              <Row
                label="رسوم التأشيرة الحكومية (تُدفع لاحقاً للسفارة)"
                value={`${fmt(governmentTotal)} ر.س`}
              />
            )}
            <div style={totalRow}>
              <Text style={totalLabel}>الإجمالي المستحق</Text>
              <Text style={totalValue}>{fmt(grandTotal)} ر.س</Text>
            </div>
            <Text style={meta}>
              {visaFeesIncluded
                ? '✅ شامل رسوم التأشيرة'
                : 'ℹ️ غير شامل رسوم التأشيرة الحكومية'}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Submission Method */}
          <Section style={section}>
            <Heading as="h2" style={h2}>طريقة الإكمال</Heading>
            {isWhatsApp ? (
              <Text style={text}>
                📱 <strong>الإكمال عبر واتساب</strong> — لم يتم خصم أي مبلغ.
                سيتواصل معك أحد موظفينا قريباً لإكمال الإجراءات والدفع.
              </Text>
            ) : (
              <Text style={text}>
                💳 <strong>تم الدفع عبر الموقع</strong>
                {paymentMethod ? ` — طريقة الدفع: ${paymentMethod}` : ''}
              </Text>
            )}
          </Section>

          {/* Requirements Acknowledged */}
          {checkedRequirements && checkedRequirements.length > 0 && (
            <>
              <Hr style={hr} />
              <Section style={section}>
                <Heading as="h2" style={h2}>المتطلبات الموافق عليها</Heading>
                <Text style={text}>
                  أقررت بأنك مطّلع على المتطلبات التالية وستوفّرها:
                </Text>
                <ul style={list}>
                  {checkedRequirements.map((req, i) => (
                    <li key={i} style={listItem}>{req}</li>
                  ))}
                </ul>
              </Section>
            </>
          )}

          {/* Terms */}
          <Hr style={hr} />
          <Section style={termsBox}>
            <Heading as="h2" style={h2}>الشروط والأحكام</Heading>
            <Text style={text}>
              ✅ بإرسالك هذا الطلب فإنك أقررت بأنك قرأت ووافقت على الشروط والأحكام
              وسياسة الاسترداد الخاصة بـ {SITE_NAME}.
            </Text>
            {termsAcceptedAt && (
              <Text style={meta}>
                تاريخ الموافقة: <span dir="ltr">{termsAcceptedAt}</span>
              </Text>
            )}
            <Text style={meta}>
              للاطلاع الكامل:{' '}
              <a href={`${SITE_URL}/terms`} style={link}>الشروط والأحكام</a>{' '}|{' '}
              <a href={`${SITE_URL}/refund`} style={link}>سياسة الاسترداد</a>
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button
              href={`${SITE_URL}/track?app=${applicationNumber}`}
              style={button}
            >
              تتبع حالة طلبك
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            هذه رسالة آلية من {SITE_NAME}. للاستفسار: واتساب +966 56 252 5665
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const Row = ({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) => (
  <div style={rowStyle}>
    <Text style={rowLabel}>{label}</Text>
    <Text style={rowValue} dir={ltr ? 'ltr' : 'rtl'}>{value || '-'}</Text>
  </div>
)

export const template = {
  component: ApplicationConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `تأكيد استلام طلب التأشيرة ${data?.applicationNumber || ''} - ${SITE_NAME}`.trim(),
  displayName: 'تأكيد استلام طلب التأشيرة',
  previewData: {
    applicationNumber: 'VF-2026-0042',
    fullName: 'محمد العتيبي',
    email: 'customer@example.com',
    phone: '+966 56 252 5665',
    countryName: 'فرنسا',
    visaTypeName: 'تأشيرة شنغن سياحية',
    travelDate: '15 يونيو 2026',
    travelers: { adults: 2, children: 1, infants: 0 },
    breakdown: { adults: 1200, children: 600, infants: 0 },
    serviceTotal: 1800,
    governmentTotal: 600,
    grandTotal: 1800,
    visaFeesIncluded: false,
    submissionMethod: 'online',
    paymentMethod: 'بطاقة ائتمانية',
    checkedRequirements: [
      'جواز سفر ساري لمدة 6 أشهر على الأقل',
      'صورة شخصية بخلفية بيضاء',
      'كشف حساب بنكي لآخر 3 أشهر',
    ],
    termsAcceptedAt: '2026-05-11 14:32',
  },
} satisfies TemplateEntry

/* Styles */
const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
  padding: '20px 0',
  margin: 0,
}
const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0 20px',
}
const header = {
  backgroundColor: '#1e40af',
  borderRadius: '12px 12px 0 0',
  padding: '28px 24px',
  textAlign: 'center' as const,
}
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  margin: '0 0 6px',
}
const headerSub = {
  fontSize: '14px',
  color: '#dbeafe',
  margin: 0,
}
const section = {
  padding: '20px 24px',
}
const h2 = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#1e40af',
  margin: '0 0 12px',
}
const text = {
  fontSize: '14px',
  color: '#334155',
  lineHeight: '1.7',
  margin: '0 0 12px',
}
const appNumberBox = {
  backgroundColor: '#eff6ff',
  border: '2px solid #3b82f6',
  borderRadius: '10px',
  padding: '16px',
  margin: '0 24px',
  textAlign: 'center' as const,
}
const appNumberLabel = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 6px',
}
const appNumberText = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1e40af',
  letterSpacing: '2px',
  margin: 0,
}
const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between' as const,
  borderBottom: '1px solid #f1f5f9',
  padding: '8px 0',
}
const rowLabel = {
  fontSize: '13px',
  color: '#64748b',
  margin: 0,
}
const rowValue = {
  fontSize: '13px',
  color: '#0f172a',
  fontWeight: '600' as const,
  margin: 0,
}
const totalRow = {
  display: 'flex',
  justifyContent: 'space-between' as const,
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '12px 16px',
  marginTop: '12px',
}
const totalLabel = {
  fontSize: '15px',
  fontWeight: 'bold' as const,
  color: '#0f172a',
  margin: 0,
}
const totalValue = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#1e40af',
  margin: 0,
}
const meta = {
  fontSize: '12px',
  color: '#64748b',
  margin: '8px 0 0',
}
const list = {
  paddingInlineStart: '20px',
  margin: '8px 0 0',
}
const listItem = {
  fontSize: '13px',
  color: '#334155',
  margin: '4px 0',
  lineHeight: '1.6',
}
const termsBox = {
  backgroundColor: '#fefce8',
  borderRadius: '10px',
  padding: '16px 24px',
  margin: '0 24px',
}
const ctaSection = {
  textAlign: 'center' as const,
  padding: '24px',
}
const button = {
  backgroundColor: '#1e40af',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  padding: '12px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
}
const link = {
  color: '#1e40af',
  textDecoration: 'underline',
}
const hr = {
  borderColor: '#e2e8f0',
  margin: '8px 24px',
}
const footer = {
  fontSize: '11px',
  color: '#94a3b8',
  textAlign: 'center' as const,
  padding: '0 24px 20px',
  margin: 0,
}