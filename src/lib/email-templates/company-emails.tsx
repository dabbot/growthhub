import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '520px' }
const h1 = { fontSize: '20px', color: '#111827', margin: '0 0 12px' }
const p = { fontSize: '14px', color: '#374151', lineHeight: '20px' }

const Request = (d: { company?: string; email?: string; website?: string; play?: string; appstore?: string }) => (
  <Html lang="en"><Head /><Preview>{`${d.company ?? 'A company'} wants a GrowthHub`}</Preview>
    <Body style={main}><Container style={container}>
      <Heading style={h1}>New dashboard request</Heading>
      <Text style={p}><strong>{d.company}</strong> requested by {d.email}</Text>
      <Text style={p}>Website: {d.website || '—'}<br />Play Store: {d.play || '—'}<br />App Store: {d.appstore || '—'}</Text>
      <Text style={p}>Open the Admin page in GrowthHub to approve or reject.</Text>
    </Container></Body></Html>
)

export const requestTemplate = {
  component: Request,
  subject: (d: Record<string, any>) => `Dashboard request: ${d['company'] ?? 'new company'}`,
  displayName: 'Company request (admin)',
  previewData: { company: 'Acme', email: 'jane@example.com', website: 'https://example.com' },
} satisfies TemplateEntry

const Status = (d: { company?: string; status?: string }) => (
  <Html lang="en"><Head /><Preview>{d.status === 'ready' ? 'Your GrowthHub is ready' : 'Update on your GrowthHub request'}</Preview>
    <Body style={main}><Container style={container}>
      <Heading style={h1}>{d.status === 'ready' ? `${d.company}'s dashboard is ready` : 'Request not approved'}</Heading>
      <Text style={p}>{d.status === 'ready'
        ? 'Your market, customers, competitors, audits and growth plan have been built. Sign in to GrowthHub to explore it.'
        : `We could not approve a dashboard for ${d.company} right now. Reply to this email if you think this is a mistake.`}</Text>
    </Container></Body></Html>
)

export const statusTemplate = {
  component: Status,
  subject: (d: Record<string, any>) => d['status'] === 'ready' ? `${d['company']}: your GrowthHub is ready` : 'Your GrowthHub request',
  displayName: 'Company status (requester)',
  previewData: { company: 'Acme', status: 'ready' },
} satisfies TemplateEntry
