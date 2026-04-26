import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Sndy Market'

interface SupportConfirmationProps {
  name?: string
  subject?: string
  message?: string
  ticketId?: string
}

const SupportConfirmationEmail = ({
  name,
  subject,
  message,
  ticketId,
}: SupportConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your support request</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Thanks, ${name}!` : 'Thanks for reaching out!'}
        </Heading>
        <Text style={text}>
          We've received your message and our team will get back to you as soon as possible — usually within 24 hours.
        </Text>

        {subject && (
          <Section style={card}>
            <Text style={label}>Subject</Text>
            <Text style={value}>{subject}</Text>
            {message && (
              <>
                <Hr style={hr} />
                <Text style={label}>Your message</Text>
                <Text style={messageStyle}>{message}</Text>
              </>
            )}
            {ticketId && (
              <>
                <Hr style={hr} />
                <Text style={label}>Reference</Text>
                <Text style={mono}>#{ticketId.slice(0, 8).toUpperCase()}</Text>
              </>
            )}
          </Section>
        )}

        <Text style={text}>
          You can track your conversation and reply directly in your account under <strong>Support</strong>.
        </Text>

        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupportConfirmationEmail,
  subject: 'We received your support request',
  displayName: 'Support request confirmation',
  previewData: {
    name: 'Jane',
    subject: 'Question about my order',
    message: 'Hi, I had a quick question about the shipping date of order #12345.',
    ticketId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#000000', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 18px' }
const card = { backgroundColor: '#f9f8f5', border: '1px solid #ece9e2', borderRadius: '8px', padding: '16px 18px', margin: '20px 0' }
const label = { fontSize: '11px', color: '#999999', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 4px' }
const value = { fontSize: '14px', color: '#000000', fontWeight: 600, margin: '0 0 8px' }
const messageStyle = { fontSize: '13px', color: '#333333', lineHeight: '1.5', margin: '0', whiteSpace: 'pre-wrap' as const }
const mono = { fontSize: '13px', color: '#333333', fontFamily: 'monospace', margin: '0' }
const hr = { borderColor: '#ece9e2', margin: '12px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '28px 0 0' }
