# 02 — Connect analytics marketing-leads download to CSV export endpoint

**What to build:** From `/admin/analytics`, an admin can download a complete CSV of the filtered marketing leads, including email addresses.

**Blocked by:** None — can start immediately.

**Status:** done

## Context

The current marketing-leads Download button builds a CSV in the browser from only the rows already loaded in the table. It manually maps the fields and omits email. The table currently loads a limited page of results, so the existing implementation cannot export the complete filtered dataset.

The backend will provide a dedicated CSV export endpoint. The frontend should call that endpoint directly instead of fetching pages one by one or constructing the CSV from the table query response.

## Backend contract and implementation notes

Call:

```text
GET /api/v1/admin/analytics/marketing-leads/export
```

The request uses the same authenticated admin access and `MARKETING_LEADS_READ` permission as the existing marketing-leads list endpoint.

### Query parameters

Both parameters are optional:

- `search`: the active marketing-lead search term.
- `leadStatus`: one of `NEW`, `ENGAGED`, or `CUSTOMER`.

Do not send `page` or `size`. The export endpoint returns every matching lead and has no pagination. Forward the active filter values exactly as they are sent to the table request. Omit unset parameters rather than sending empty or undefined values.

### Successful response

The response is a file response, not the usual JSON envelope:

- Status: `200`
- `Content-Type`: `text/csv; charset=utf-8`
- `Content-Disposition`: `attachment; filename="marketing-leads.csv"`

The CSV columns are emitted in this order:

```text
email,name,phone,location,offers,orders,status
```

The backend escapes commas, double quotes, carriage returns, and line breaks according to CSV rules. Treat the response as an opaque CSV `Blob`; do not split or rebuild it in the browser. An export with no matching leads still contains the header row.

### Client download flow

Keep the request in the analytics service or query module used by the existing marketing-leads API. The export action should:

1. Build the URL with only the active `search` and `leadStatus` filters.
2. Request the response as a `Blob` or the equivalent binary/file response type.
3. Read the filename from `Content-Disposition` when the HTTP client exposes response headers. Fall back to `marketing-leads.csv` if the header is missing or cannot be parsed.
4. Create a temporary object URL, click a temporary download link, then revoke the object URL and remove the link.
5. Only create the download after a successful response. On failure, show the existing analytics error UI and do not download the error body as a file.

The endpoint returns JSON error responses for validation, authentication, authorization, and server failures. The export button should remain disabled until the request settles, including when the user clicks it repeatedly.

## Acceptance criteria

- [x] Replace the current client-side export of loaded rows with a request to the backend CSV export endpoint.
- [x] Pass the active marketing-lead filters to the export request.
- [x] Download the backend response using its attachment filename, or `marketing-leads.csv` as a fallback.
- [x] Do not fetch pages one by one for export.
- [x] Disable the export button while the request is pending.
- [x] Show a loading state while the export is in progress.
- [x] Prevent duplicate export requests from repeated clicks.
- [x] Show an error message when the export request fails.
- [x] Do not create a partial or empty file after a failed request.
- [x] Preserve the existing analytics table, search behaviour, and lead display.
- [x] Keep the export request in the owning analytics service/query module according to repository conventions.
- [x] Add tests covering successful download, active filters, loading and disabled state, duplicate-click prevention, and failed export handling.
