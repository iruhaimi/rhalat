/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'عطلات رحلاتكم'

interface Staff2FAProps {
  code?: string
}

const Staff2FAEmail = ({ code }: Staff2FAProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>رمز التحقق للدخول إلى بوابة الموظفين</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>التحقق بخطوتين</Heading>
        <Text style={text}>
          رمز التحقق للدخول إلى بوابة الموظفين الخاصة بـ {SITE_NAME}:
        </Text>
        <Section style={codeBox}>
          <Text style={codeText} dir="ltr">{code ?? '------'}</Text>
        </Section>
        <Text style={meta}>⏱️ هذا الرمز صالح لمدة 10 دقائق فقط.</Text>
        <Text style={warning}>
          إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة وعدم مشاركتها مع أي شخص.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME} — بوابة الموظفين</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Staff2FAEmail,
  subject: 'رمز التحقق للدخول - عطلات رحلاتكم',
  displayName: 'رمز التحقق للموظفين (2FA)',
  previewData: { code: '123456' },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
  padding: '20px',
}
const container = {
  maxWidth: '500px',
  margin: '0 auto',
  padding: '30px 25px',
  textAlign: 'center' as const,
}
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#0f172a',
  margin: '0 0 16px',
}
const text = {
  fontSize: '14px',
  color: '#475569',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const codeBox = {
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
}
const codeText = {
  fontSize: '36px',
  fontWeight: 'bold' as const,
  letterSpacing: '8px',
  color: '#3b82f6',
  margin: 0,
}
const meta = {
  fontSize: '12px',
  color: '#64748b',
  margin: '16px 0 0',
}
const warning = {
  fontSize: '11px',
  color: '#94a3b8',
  margin: '12px 0 0',
}
const hr = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
}
const footer = {
  fontSize: '11px',
  color: '#94a3b8',
  margin: 0,
}