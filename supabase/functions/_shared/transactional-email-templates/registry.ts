/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as orderInvoice } from './order-invoice.tsx'
import { template as supportConfirmation } from './support-confirmation.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-invoice': orderInvoice,
  'support-confirmation': supportConfirmation,
}
