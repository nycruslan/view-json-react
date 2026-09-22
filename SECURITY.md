# Security policy

## Supported releases

Security fixes are applied to the latest published release and the active v3 prerelease line. Older release lines may not receive fixes. Check the [npm package](https://www.npmjs.com/package/view-json-react) for the latest installable version.

## Reporting a vulnerability

Please do not disclose suspected vulnerabilities in a public issue, discussion, or pull request.

Use [GitHub private vulnerability reporting](https://github.com/nycruslan/view-json-react/security/advisories/new) and include:

- the affected package version and public entry point;
- a minimal reproduction or proof of concept;
- the expected and observed behavior;
- the impact and any known mitigations.

You should receive an acknowledgement within seven days. Confirmed reports will be assessed, fixed on a private branch when appropriate, and disclosed with a coordinated release. No sensitive data is required to investigate a report.

## Security scope

`view-json-react` is a client-side, read-only value inspector. It does not fetch, persist, or execute inspected values, and it does not inject runtime styles. JavaScript reflection can still trigger Proxy traps by language design; the package catches failures and bounds traversal, but callers should treat hostile Proxies as executable application code rather than inert JSON.
