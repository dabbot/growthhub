import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  email?: string
  time?: string
  firstTime?: boolean
  firstSeen?: string
  location?: string
  ip?: string
  device?: string
}

const Row = ({ label, value }: { label: string; value?: string | undefined }) => (
  <Text style={row}>
    <span style={labelStyle}>{label}</span>
    <br />
    {value || '—'}
  </Text>
)

const Email = ({ email, time, firstTime, firstSeen, location, ip, device }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${email ?? 'Someone'} signed in to Growth Dashboard`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{firstTime ? 'New person signed in' : 'Someone signed in'}</Heading>
        <Text style={lead}>
          <strong>{email ?? 'Unknown'}</strong> just signed in to Growth Dashboard.
        </Text>
        <Section style={card}>
          <Row label="Email" value={email} />
          <Row label="Time (IST)" value={time} />
          <Row label="First time?" value={firstTime ? 'Yes — first ever sign-in' : `No — first seen ${firstSeen ?? 'earlier'}`} />
          <Row label="Location" value={location} />
          <Row label="IP address" value={ip} />
          <Row label="Device / browser" value={device} />
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Sign-in: ${d['email'] ?? 'someone'} — Growth Dashboard`,
  displayName: 'Sign-in alert',
  previewData: {
    email: 'jane@example.com',
    time: '24 Sep 2026, 6:10 PM',
    firstTime: false,
    firstSeen: '23 Sep 2026',
    location: 'Bengaluru, IN',
    ip: '203.0.113.5',
    device: 'Chrome on macOS',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '520px' }
const h1 = { fontSize: '20px', color: '#111827', margin: '0 0 12px' }
const lead = { fontSize: '14px', color: '#374151' }
const card = { border: '1px solid #e5e7eb', borderRadius: '10px', padding: '8px 16px' }
const row = { fontSize: '14px', color: '#111827', margin: '10px 0' }
const labelStyle = { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' as const }
