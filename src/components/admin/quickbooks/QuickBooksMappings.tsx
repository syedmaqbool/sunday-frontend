import type {
  AdminQuickBooksAccountMappingCategory,
  AdminQuickBooksAccountMappingVersion,
  AdminQuickBooksAccountMappingVersionPayload,
  AdminQuickBooksEnvironment,
  AdminQuickBooksSellerOption,
  AdminQuickBooksSellerVendorMapping,
  AdminQuickBooksSellerVendorMappingPayload,
} from '@/types/adminQuickBooks.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, ChevronsUpDown, Loader2, Plus, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { showErrorToast } from '@/lib/errorToast';
import {
  getAdminQuickBooksAccountMappingVersionsQueryOptions,
  getAdminQuickBooksSellersQueryOptions,
  getAdminQuickBooksSellerVendorMappingsQueryOptions,
  useCreateAdminQuickBooksAccountMappingVersionMutation,
  useCreateAdminQuickBooksSellerVendorMappingMutation,
} from '@/queries/adminQuickBooks.query';

const QUICKBOOKS_ACCOUNT_MAPPING_CATEGORIES = [
  'COMMISSION_REVENUE',
  'SELLER_COUPONS_COGS',
  'SELLER_INCENTIVE_MARKETING_COGS',
  'BUYER_DISCOUNTS_COGS',
  'SELLER_PAYOUT_FEES_COGS',
  'SELLER_PAYABLE',
  'PAYMENT_CLEARING',
  'REFUNDS',
  'ADJUSTMENTS',
] as const satisfies readonly AdminQuickBooksAccountMappingCategory[];

const ACCOUNT_MAPPING_LABELS: Record<AdminQuickBooksAccountMappingCategory, string> = {
  ADJUSTMENTS: 'Adjustments',
  BUYER_DISCOUNTS_COGS: 'Buyer discounts COGS',
  COMMISSION_REVENUE: 'Commission revenue',
  PAYMENT_CLEARING: 'Payment clearing',
  REFUNDS: 'Refunds',
  SELLER_COUPONS_COGS: 'Seller coupons COGS',
  SELLER_INCENTIVE_MARKETING_COGS: 'Seller incentive marketing cost',
  SELLER_PAYABLE: 'Seller payable',
  SELLER_PAYOUT_FEES_COGS: 'Seller payout fees COGS',
};

const accountMappingFormSchema = z.object({
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter an effective date.'),
  mappings: z.array(z.object({
    accountId: z.string().trim().min(1, 'Enter the QuickBooks account ID.'),
    category: z.enum(QUICKBOOKS_ACCOUNT_MAPPING_CATEGORIES),
    displayName: z.string().trim().min(1, 'Enter the QuickBooks account name.'),
  })).length(QUICKBOOKS_ACCOUNT_MAPPING_CATEGORIES.length),
  reason: z.string().trim().min(1, 'Enter a reason for this mapping version.'),
});

const sellerVendorMappingFormSchema = z.object({
  quickbooksApAccountId: z.string().trim().min(1, 'Select a payable account mapping first.'),
  quickbooksVendorId: z.string().trim().min(1, 'Enter the QuickBooks vendor ID.'),
  sellerId: z.string().trim().uuid('Select a seller.'),
  displayName: z.string().trim().min(1, 'Enter the QuickBooks vendor name.'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter an effective date.'),
  quickbooksApAccountName: z.string().trim().min(1, 'Select a payable account mapping first.'),
  reason: z.string().trim().min(1, 'Enter a reason for this vendor mapping.'),
});

type AccountMappingFormValues = z.infer<typeof accountMappingFormSchema>;
type SellerVendorMappingFormValues = z.infer<typeof sellerVendorMappingFormSchema>;

function getToday() {
  return format(new Date(), 'yyyy-MM-dd');
}

function createAccountMappingDefaults(version?: AdminQuickBooksAccountMappingVersion): AccountMappingFormValues {
  return {
    effectiveDate: getToday(),
    mappings: QUICKBOOKS_ACCOUNT_MAPPING_CATEGORIES.map(category => ({
      accountId: version?.mappings.find(mapping => mapping.category === category)?.accountId ?? '',
      category,
      displayName: version?.mappings.find(mapping => mapping.category === category)?.displayName ?? '',
    })),
    reason: '',
  };
}

function formatDate(value: string) {
  return format(new Date(value), 'PP');
}

function FieldError({ children }: { children?: string }) {
  if (!children)
    return null;

  return <p className="text-xs text-destructive">{children}</p>;
}

function AccountMappingVersions({ versions }: { versions: AdminQuickBooksAccountMappingVersion[] }) {
  if (versions.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        No account mapping versions have been saved for this backend yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map(version => (
        <div key={version.id} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              Version
              {' '}
              {version.version}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Effective
              {' '}
              {formatDate(version.effectiveDate)}
            </span>
            <span className="text-sm text-muted-foreground">{version.reason}</span>
          </div>
          <div className="
            mt-3 grid gap-2
            sm:grid-cols-2
          "
          >
            {version.mappings.map(mapping => (
              <div key={`${version.id}-${mapping.category}`} className="min-w-0 text-sm">
                <span className="text-muted-foreground">
                  {ACCOUNT_MAPPING_LABELS[mapping.category]}
                  :
                  {' '}
                </span>
                <span className="font-medium">{mapping.displayName}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  ID
                  {mapping.accountId}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SellerVendorMappings({ mappings }: { mappings: AdminQuickBooksSellerVendorMapping[] }) {
  if (mappings.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        No seller vendor mappings have been saved yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {mappings.map(mapping => (
        <div key={mapping.id} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              Version
              {' '}
              {mapping.version}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Effective
              {' '}
              {formatDate(mapping.effectiveDate)}
            </span>
            <span className="text-sm text-muted-foreground">{mapping.reason}</span>
          </div>
          <div className="
            mt-3 grid gap-2 text-sm
            sm:grid-cols-2
          "
          >
            <p>
              <span className="font-medium">{mapping.sellerName}</span>
              <span className="ml-2 text-muted-foreground">{mapping.sellerEmail}</span>
            </p>
            <p>
              <span className="text-muted-foreground">QuickBooks vendor: </span>
              <span className="font-medium">{mapping.displayName}</span>
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                ID
                {mapping.quickbooksVendorId}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Accounts payable: </span>
              {mapping.quickbooksApAccountName ?? 'Not recorded'}
              {mapping.quickbooksApAccountId && (
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  ID
                  {mapping.quickbooksApAccountId}
                </span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface QuickBooksMappingsProps {
  canManageMappings: boolean;
  canReadMappings: boolean;
  isPostingEnvironmentConnected: boolean;
  postingEnvironment: AdminQuickBooksEnvironment | null;
}

export default function QuickBooksMappings({
  canManageMappings,
  canReadMappings,
  isPostingEnvironmentConnected,
  postingEnvironment,
}: QuickBooksMappingsProps) {
  const accountMappingQuery = useQuery({
    ...getAdminQuickBooksAccountMappingVersionsQueryOptions({ page: 1, size: 20 }),
    enabled: canReadMappings,
  });
  const sellerVendorMappingQuery = useQuery({
    ...getAdminQuickBooksSellerVendorMappingsQueryOptions({ page: 1, size: 30 }),
    enabled: canReadMappings,
  });
  const [accountMappingDialogOpen, setAccountMappingDialogOpen] = useState(false);
  const [sellerVendorDialogOpen, setSellerVendorDialogOpen] = useState(false);
  const [sellerPickerOpen, setSellerPickerOpen] = useState(false);
  const [sellerSearch, setSellerSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<AdminQuickBooksSellerOption | null>(null);
  const createAccountMapping = useCreateAdminQuickBooksAccountMappingVersionMutation();
  const createSellerVendorMapping = useCreateAdminQuickBooksSellerVendorMappingMutation();
  const latestAccountMapping = accountMappingQuery.data?.data[0];

  const accountMappingForm = useForm<AccountMappingFormValues>({
    defaultValues: createAccountMappingDefaults(),
    resolver: zodResolver(accountMappingFormSchema),
  });
  const { reset: resetAccountMappingForm } = accountMappingForm;
  const sellerVendorForm = useForm<SellerVendorMappingFormValues>({
    defaultValues: {
      quickbooksApAccountId: '',
      quickbooksVendorId: '',
      sellerId: '',
      displayName: '',
      effectiveDate: getToday(),
      quickbooksApAccountName: '',
      reason: '',
    },
    resolver: zodResolver(sellerVendorMappingFormSchema),
  });
  const { setValue: setSellerVendorValue } = sellerVendorForm;
  const selectedSellerId = sellerVendorForm.watch('sellerId');
  const sellerOptionsQuery = useQuery({
    ...getAdminQuickBooksSellersQueryOptions({
      page: 1,
      search: sellerSearch.trim() || undefined,
      size: 50,
    }),
    enabled: canManageMappings && sellerVendorDialogOpen,
  });
  const selectedSellerMappingsQuery = useQuery({
    ...getAdminQuickBooksSellerVendorMappingsQueryOptions({
      sellerId: selectedSellerId || undefined,
      page: 1,
      size: 100,
    }),
    enabled: sellerVendorDialogOpen && Boolean(selectedSellerId),
  });
  const prefilledSellerId = useRef<string | null>(null);

  useEffect(() => {
    if (!latestAccountMapping)
      return;

    resetAccountMappingForm(createAccountMappingDefaults(latestAccountMapping));
  }, [latestAccountMapping, resetAccountMappingForm]);

  const vendorEffectiveDate = sellerVendorForm.watch('effectiveDate');
  const payableMappingVersion = accountMappingQuery.data?.data
    .filter(version => version.effectiveDate <= vendorEffectiveDate)
    .toSorted((first, second) => second.effectiveDate.localeCompare(first.effectiveDate) || second.version - first.version)[0];
  const payableAccount = payableMappingVersion?.mappings.find(mapping => mapping.category === 'SELLER_PAYABLE');

  useEffect(() => {
    setSellerVendorValue('quickbooksApAccountId', payableAccount?.accountId ?? '');
    setSellerVendorValue('quickbooksApAccountName', payableAccount?.displayName ?? '');
  }, [payableAccount?.accountId, payableAccount?.displayName, setSellerVendorValue]);

  useEffect(() => {
    if (!selectedSellerId || !selectedSellerMappingsQuery.data || prefilledSellerId.current === selectedSellerId)
      return;

    const latestSellerMapping = selectedSellerMappingsQuery.data.data
      .toSorted((first, second) => second.version - first.version)[0];
    if (latestSellerMapping) {
      setSellerVendorValue('quickbooksVendorId', latestSellerMapping.quickbooksVendorId);
      setSellerVendorValue('displayName', latestSellerMapping.displayName);
    }
    prefilledSellerId.current = selectedSellerId;
  }, [selectedSellerId, selectedSellerMappingsQuery.data, setSellerVendorValue]);

  const openAccountMappingDialog = (open: boolean) => {
    if (open) {
      accountMappingForm.reset(createAccountMappingDefaults(latestAccountMapping));
    }
    setAccountMappingDialogOpen(open);
  };

  const openSellerVendorDialog = (open: boolean) => {
    if (open) {
      sellerVendorForm.reset({
        quickbooksApAccountId: payableAccount?.accountId ?? '',
        quickbooksVendorId: '',
        sellerId: '',
        displayName: '',
        effectiveDate: getToday(),
        quickbooksApAccountName: payableAccount?.displayName ?? '',
        reason: '',
      });
      setSelectedSeller(null);
      setSellerSearch('');
      setSellerPickerOpen(false);
      prefilledSellerId.current = null;
    }
    setSellerVendorDialogOpen(open);
  };

  const handleSellerSelected = (seller: AdminQuickBooksSellerOption) => {
    prefilledSellerId.current = null;
    setSelectedSeller(seller);
    setSellerPickerOpen(false);
    setSellerSearch('');
    sellerVendorForm.setValue('sellerId', seller.id, { shouldDirty: true, shouldValidate: true });
    sellerVendorForm.setValue('quickbooksVendorId', '');
    sellerVendorForm.setValue('displayName', '');
    sellerVendorForm.setValue('reason', '');
  };

  const handleAccountMappingSubmit = async (values: AccountMappingFormValues) => {
    try {
      const response = await createAccountMapping.mutateAsync(values as AdminQuickBooksAccountMappingVersionPayload);
      accountMappingForm.reset(createAccountMappingDefaults(response.data));
      setAccountMappingDialogOpen(false);
      sellerVendorForm.setValue('quickbooksApAccountId', response.data.mappings.find(mapping => mapping.category === 'SELLER_PAYABLE')?.accountId ?? '');
      sellerVendorForm.setValue('quickbooksApAccountName', response.data.mappings.find(mapping => mapping.category === 'SELLER_PAYABLE')?.displayName ?? '');
      sellerVendorForm.setValue('effectiveDate', values.effectiveDate);
      toast.success('QuickBooks account mappings saved', {
        description: `Version ${response.data.version} is effective ${formatDate(response.data.effectiveDate)}.`,
      });
    }
    catch (error) {
      showErrorToast(error, 'Could not save the QuickBooks account mappings.');
    }
  };

  const handleSellerVendorSubmit = async (values: SellerVendorMappingFormValues) => {
    try {
      const response = await createSellerVendorMapping.mutateAsync(values as AdminQuickBooksSellerVendorMappingPayload);
      sellerVendorForm.reset({
        quickbooksApAccountId: values.quickbooksApAccountId,
        quickbooksVendorId: '',
        sellerId: '',
        displayName: '',
        effectiveDate: values.effectiveDate,
        quickbooksApAccountName: values.quickbooksApAccountName,
        reason: '',
      });
      setSelectedSeller(null);
      setSellerVendorDialogOpen(false);
      toast.success('QuickBooks seller vendor mapping saved', {
        description: `${response.data.displayName} is mapped for ${response.data.sellerName}.`,
      });
    }
    catch (error) {
      showErrorToast(error, 'Could not save the seller vendor mapping.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="
          flex flex-col gap-4
          sm:flex-row sm:items-center sm:justify-between
        "
        >
          <div className="space-y-1.5">
            <CardTitle>Account mappings</CardTitle>
            <CardDescription>
              Review the saved account mapping versions or add a new version.
            </CardDescription>
          </div>
          {canManageMappings && (
            <Button onClick={() => openAccountMappingDialog(true)} type="button" variant="outline">
              <Plus aria-hidden="true" />
              Add account mapping version
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {canManageMappings && (
            <Dialog onOpenChange={openAccountMappingDialog} open={accountMappingDialogOpen}>
              <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add account mapping version</DialogTitle>
                  <DialogDescription>
                    Map each Sunday accounting category to the exact account in the connected QuickBooks company. Each save creates an immutable version.
                  </DialogDescription>
                </DialogHeader>
                {postingEnvironment && (
                  <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                    The posting worker is configured for
                    {' '}
                    <span className="font-medium text-foreground">{postingEnvironment}</span>
                    . Use account IDs from that company. Mapping versions are selected by effective date.
                  </p>
                )}
                <form onSubmit={accountMappingForm.handleSubmit(handleAccountMappingSubmit)} className="space-y-5">
                  <div className="
                    grid gap-4
                    sm:grid-cols-2
                  "
                  >
                    <div className="space-y-2">
                      <Label htmlFor="quickbooks-mapping-effective-date">Effective date</Label>
                      <Input
                        id="quickbooks-mapping-effective-date"
                        type="date"
                        {...accountMappingForm.register('effectiveDate')}
                      />
                      <p className="text-xs text-muted-foreground">
                        For an existing delivered order, choose its accounting posting date or an earlier approved date.
                      </p>
                      <FieldError>{accountMappingForm.formState.errors.effectiveDate?.message}</FieldError>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quickbooks-mapping-reason">Reason</Label>
                      <Textarea
                        id="quickbooks-mapping-reason"
                        placeholder="Initial Sandbox account mapping"
                        {...accountMappingForm.register('reason')}
                      />
                      <FieldError>{accountMappingForm.formState.errors.reason?.message}</FieldError>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {QUICKBOOKS_ACCOUNT_MAPPING_CATEGORIES.map((category, index) => (
                      <div
                        key={category}
                        className="
                          grid gap-3 rounded-lg border p-4
                          md:grid-cols-[minmax(150px,0.8fr)_minmax(180px,1fr)_minmax(180px,1fr)]
                        "
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{ACCOUNT_MAPPING_LABELS[category]}</p>
                          <p className="font-mono text-xs text-muted-foreground">{category}</p>
                        </div>
                        <input
                          type="hidden"
                          {...accountMappingForm.register(`mappings.${index}.category`)}
                          defaultValue={category}
                        />
                        <div className="space-y-2">
                          <Label htmlFor={`quickbooks-account-id-${category}`}>QuickBooks account ID</Label>
                          <Input
                            id={`quickbooks-account-id-${category}`}
                            autoComplete="off"
                            placeholder="Account ID from Chart of Accounts"
                            {...accountMappingForm.register(`mappings.${index}.accountId`)}
                          />
                          <FieldError>{accountMappingForm.formState.errors.mappings?.[index]?.accountId?.message}</FieldError>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`quickbooks-account-name-${category}`}>QuickBooks account name</Label>
                          <Input
                            id={`quickbooks-account-name-${category}`}
                            autoComplete="off"
                            placeholder="Exact account name"
                            {...accountMappingForm.register(`mappings.${index}.displayName`)}
                          />
                          <FieldError>{accountMappingForm.formState.errors.mappings?.[index]?.displayName?.message}</FieldError>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    disabled={!isPostingEnvironmentConnected || createAccountMapping.isPending}
                    type="submit"
                  >
                    {createAccountMapping.isPending
                      ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      : <Save aria-hidden="true" className="h-4 w-4" />}
                    Save account mapping version
                  </Button>
                  {!isPostingEnvironmentConnected && (
                    <p className="text-xs text-muted-foreground">
                      Connect the configured posting environment before saving account IDs.
                    </p>
                  )}
                </form>
              </DialogContent>
            </Dialog>
          )}

          {canReadMappings && (
            <section className="space-y-3">
              <h3 className="font-medium">Saved mapping versions</h3>
              {accountMappingQuery.isLoading
                ? <p className="text-sm text-muted-foreground">Loading mapping versions…</p>
                : accountMappingQuery.isError
                  ? <p className="text-sm text-destructive">Could not load account mapping versions.</p>
                  : <AccountMappingVersions versions={accountMappingQuery.data?.data ?? []} />}
            </section>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="
          flex flex-col gap-4
          sm:flex-row sm:items-center sm:justify-between
        "
        >
          <div className="space-y-1.5">
            <CardTitle>Seller vendor mappings</CardTitle>
            <CardDescription>
              Review saved seller vendor mappings or add a new version for a seller.
            </CardDescription>
          </div>
          {canManageMappings && (
            <Button onClick={() => openSellerVendorDialog(true)} type="button" variant="outline">
              <Plus aria-hidden="true" />
              Add seller vendor mapping
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {canManageMappings && (
            <Dialog onOpenChange={openSellerVendorDialog} open={sellerVendorDialogOpen}>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add seller vendor mapping</DialogTitle>
                  <DialogDescription>
                    Select a Sunday seller and map them to an existing QuickBooks vendor. Saving creates an immutable version.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={sellerVendorForm.handleSubmit(handleSellerVendorSubmit)} className="space-y-4">
                  <div className="
                    grid gap-4
                    sm:grid-cols-2
                  "
                  >
                    <div className="
                      space-y-2
                      sm:col-span-2
                    "
                    >
                      <Label htmlFor="quickbooks-vendor-seller">Sunday seller</Label>
                      <Popover onOpenChange={setSellerPickerOpen} open={sellerPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id="quickbooks-vendor-seller"
                            aria-expanded={sellerPickerOpen}
                            role="combobox"
                            type="button"
                            variant="outline"
                            className="h-auto min-h-10 w-full justify-between py-2 text-left"
                          >
                            {selectedSeller
                              ? (
                                  <span className="flex min-w-0 flex-col items-start">
                                    <span className="truncate font-medium">{selectedSeller.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{selectedSeller.email}</span>
                                  </span>
                                )
                              : <span className="text-muted-foreground">Select a seller</span>}
                            <ChevronsUpDown aria-hidden="true" className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command shouldFilter={false}>
                            <CommandInput
                              onValueChange={setSellerSearch}
                              value={sellerSearch}
                              placeholder="Search seller name or email…"
                            />
                            <CommandList>
                              <CommandEmpty>
                                {sellerOptionsQuery.isLoading
                                  ? 'Loading sellers…'
                                  : sellerOptionsQuery.isError
                                    ? 'Could not load active sellers.'
                                    : 'No active sellers found.'}
                              </CommandEmpty>
                              {!sellerOptionsQuery.isLoading && (
                                sellerOptionsQuery.data?.data.map(seller => (
                                  <CommandItem
                                    key={seller.id}
                                    onSelect={() => handleSellerSelected(seller)}
                                    value={seller.id}
                                  >
                                    <span className="flex min-w-0 flex-col">
                                      <span className="truncate">{seller.name}</span>
                                      <span className="truncate text-xs text-muted-foreground">{seller.email}</span>
                                    </span>
                                    <Check
                                      aria-hidden="true"
                                      className={`
                                        ml-auto h-4 w-4
                                        ${selectedSellerId === seller.id ? 'opacity-100' : 'opacity-0'}
                                      `}
                                    />
                                  </CommandItem>
                                ))
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <input type="hidden" {...sellerVendorForm.register('sellerId')} />
                      <FieldError>{sellerVendorForm.formState.errors.sellerId?.message}</FieldError>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quickbooks-vendor-effective-date">Effective date</Label>
                      <Input
                        id="quickbooks-vendor-effective-date"
                        type="date"
                        {...sellerVendorForm.register('effectiveDate')}
                      />
                      <FieldError>{sellerVendorForm.formState.errors.effectiveDate?.message}</FieldError>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quickbooks-vendor-id">Existing QuickBooks vendor ID</Label>
                      <Input
                        id="quickbooks-vendor-id"
                        autoComplete="off"
                        placeholder="Vendor ID from QuickBooks"
                        {...sellerVendorForm.register('quickbooksVendorId')}
                      />
                      <p className="text-xs text-muted-foreground">Use an existing vendor in the connected QuickBooks company.</p>
                      <FieldError>{sellerVendorForm.formState.errors.quickbooksVendorId?.message}</FieldError>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quickbooks-vendor-name">QuickBooks vendor name</Label>
                      <Input
                        id="quickbooks-vendor-name"
                        autoComplete="off"
                        placeholder="Exact vendor name"
                        {...sellerVendorForm.register('displayName')}
                      />
                      <FieldError>{sellerVendorForm.formState.errors.displayName?.message}</FieldError>
                    </div>
                    <div className="space-y-2">
                      <Label>Accounts payable account</Label>
                      <Input
                        value={payableAccount ? `${payableAccount.displayName} (ID ${payableAccount.accountId})` : 'No effective seller payable mapping'}
                        aria-label="Accounts payable account ID"
                        readOnly
                      />
                      <FieldError>{sellerVendorForm.formState.errors.quickbooksApAccountId?.message}</FieldError>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quickbooks-vendor-reason">Reason</Label>
                      <Textarea
                        id="quickbooks-vendor-reason"
                        placeholder="Map the seller to an existing Sandbox vendor"
                        {...sellerVendorForm.register('reason')}
                      />
                      <FieldError>{sellerVendorForm.formState.errors.reason?.message}</FieldError>
                    </div>
                  </div>
                  <input type="hidden" {...sellerVendorForm.register('quickbooksApAccountId')} />
                  <input type="hidden" {...sellerVendorForm.register('quickbooksApAccountName')} />
                  <Button
                    disabled={!isPostingEnvironmentConnected || !payableAccount || createSellerVendorMapping.isPending}
                    type="submit"
                  >
                    {createSellerVendorMapping.isPending
                      ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      : <Save aria-hidden="true" className="h-4 w-4" />}
                    Save seller vendor mapping
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {canReadMappings && (
            <section className="space-y-3">
              <h3 className="font-medium">Saved seller vendor mappings</h3>
              {sellerVendorMappingQuery.isLoading
                ? <p className="text-sm text-muted-foreground">Loading seller vendor mappings…</p>
                : sellerVendorMappingQuery.isError
                  ? <p className="text-sm text-destructive">Could not load seller vendor mappings.</p>
                  : <SellerVendorMappings mappings={sellerVendorMappingQuery.data?.data ?? []} />}
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
