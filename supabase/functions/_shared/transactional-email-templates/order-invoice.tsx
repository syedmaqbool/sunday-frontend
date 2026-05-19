import * as React from 'npm:react@18.3.1'
import {
  Body,
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

const SITE_NAME = 'Sndy Market'

interface InvoiceItem {
  title?: string
  brand?: string
  quantity?: number
  price?: number
}

interface OrderInvoiceProps {
  buyerName?: string
  orderId?: string
  orderDate?: string
  items?: InvoiceItem[]
  subtotal?: number
  discountCode?: string | null
  discountAmount?: number
  taxName?: string
  taxRate?: number
  taxAmount?: number
  commissionAmount?: number
  total?: number
  shippingName?: string
  shippingAddress?: string
  shippingCity?: string
  shippingPostal?: string
  shippingPhone?: string
}

const fmt = (n?: number) =>
  typeof n === 'number' ? `R ${n.toLocaleString()}` : 'R 0'

const OrderInvoiceEmail = ({
  buyerName,
  orderId,
  orderDate,
  items = [],
  subtotal = 0,
  discountCode,
  discountAmount = 0,
  taxName,
  taxRate,
  taxAmount = 0,
  commissionAmount = 0,
  total = 0,
  shippingName,
  shippingAddress,
  shippingCity,
  shippingPostal,
  shippingPhone,
}: OrderInvoiceProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Your {SITE_NAME} invoice {orderId ? `#${orderId.slice(0, 8)}` : ''}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Invoice</Heading>
        <Text style={muted}>
          {orderId ? `Order #${orderId.slice(0, 8).toUpperCase()}` : ''}
          {orderDate ? ` · ${orderDate}` : ''}
        </Text>

        <Text style={text}>
          {buyerName ? `Hi ${buyerName},` : 'Hi,'} thank you for your purchase
          on {SITE_NAME}. Here's your invoice for this order.
        </Text>

        <Section style={card}>
          {items.map((item, idx) => (
            <div key={idx} style={itemRow}>
              <div style={{ flex: 1 }}>
                <Text style={itemTitle}>{item.title || 'Item'}</Text>
                {item.brand ? (
                  <Text style={itemMeta}>{item.brand}</Text>
                ) : null}
                <Text style={itemMeta}>Qty: {item.quantity ?? 1}</Text>
              </div>
              <Text style={itemPrice}>
                {fmt((item.price ?? 0) * (item.quantity ?? 1))}
              </Text>
            </div>
          ))}
        </Section>

        <Section style={totals}>
          <div style={totalsRow}>
            <Text style={totalsLabel}>Subtotal</Text>
            <Text style={totalsValue}>{fmt(subtotal)}</Text>
          </div>
          {discountAmount > 0 ? (
            <div style={totalsRow}>
              <Text style={totalsLabel}>
                Discount{discountCode ? ` (${discountCode})` : ''}
              </Text>
              <Text style={totalsValue}>−{fmt(discountAmount)}</Text>
            </div>
          ) : null}
          {taxAmount > 0 ? (
            <div style={totalsRow}>
              <Text style={totalsLabel}>
                {taxName || 'Tax'}
                {taxRate ? ` (${taxRate}%)` : ''}
              </Text>
              <Text style={totalsValue}>{fmt(taxAmount)}</Text>
            </div>
          ) : null}
          {commissionAmount > 0 ? (
            <div style={totalsRow}>
              <Text style={totalsLabel}>Platform fee</Text>
              <Text style={totalsValue}>{fmt(commissionAmount)}</Text>
            </div>
          ) : null}
          <Hr style={hr} />
          <div style={totalsRow}>
            <Text style={totalLabel}>Total</Text>
            <Text style={totalValue}>{fmt(total)}</Text>
          </div>
        </Section>

        {shippingName || shippingAddress ? (
          <Section style={card}>
            <Text style={sectionTitle}>Shipping to</Text>
            {shippingName ? <Text style={text}>{shippingName}</Text> : null}
            {shippingAddress ? <Text style={text}>{shippingAddress}</Text> : null}
            {shippingCity || shippingPostal ? (
              <Text style={text}>
                {[shippingCity, shippingPostal].filter(Boolean).join(', ')}
              </Text>
            ) : null}
            {shippingPhone ? <Text style={text}>{shippingPhone}</Text> : null}
          </Section>
        ) : null}

        <Text style={footer}>
          Questions about this order? Just reply to this email.
          <br />— The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderInvoiceEmail,
  subject: (data: Record<string, any>) =>
    `Your ${SITE_NAME} invoice${
      data?.orderId ? ` #${String(data.orderId).slice(0, 8).toUpperCase()}` : ''
    }`,
  displayName: 'Order invoice',
  previewData: {
    buyerName: 'Jane',
    orderId: 'a1b2c3d4-1234-5678-9abc-def012345678',
    orderDate: '25 Apr 2026',
    items: [
      { title: 'Vintage Denim Jacket', brand: 'Levi’s', quantity: 1, price: 850 },
      { title: 'Linen Shirt', brand: 'COS', quantity: 2, price: 420 },
    ],
    subtotal: 1690,
    discountCode: 'WELCOME10',
    discountAmount: 169,
    taxName: 'VAT',
    taxRate: 15,
    taxAmount: 228,
    total: 1749,
    shippingName: 'Jane Doe',
    shippingAddress: '123 Main St',
    shippingCity: 'Cape Town',
    shippingPostal: '8001',
    shippingPhone: '+27 12 345 6789',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container = { padding: '32px 24px', maxWidth: '560px' }
const h1 = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '0 0 4px',
}
const muted = { fontSize: '13px', color: '#888', margin: '0 0 24px' }
const text = {
  fontSize: '14px',
  color: '#333',
  lineHeight: '1.6',
  margin: '0 0 12px',
}
const card = {
  border: '1px solid #eee',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}
const sectionTitle = {
  fontSize: '13px',
  fontWeight: 'bold' as const,
  color: '#666',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
}
const itemRow = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid #f3f3f3',
}
const itemTitle = {
  fontSize: '14px',
  fontWeight: 600 as const,
  color: '#1a1a1a',
  margin: '0 0 2px',
}
const itemMeta = { fontSize: '12px', color: '#888', margin: '0' }
const itemPrice = {
  fontSize: '14px',
  fontWeight: 600 as const,
  color: '#1a1a1a',
  margin: '0',
}
const totals = { padding: '8px 4px' }
const totalsRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 0',
}
const totalsLabel = { fontSize: '14px', color: '#555', margin: '0' }
const totalsValue = { fontSize: '14px', color: '#1a1a1a', margin: '0' }
const hr = { borderColor: '#eee', margin: '12px 0' }
const totalLabel = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '0',
}
const totalValue = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '0',
}
const footer = {
  fontSize: '12px',
  color: '#999',
  margin: '32px 0 0',
  lineHeight: '1.6',
}
