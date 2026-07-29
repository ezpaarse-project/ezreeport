{{- if . }}
## Trivy Report

{{- range . }}

### {{ .Type | toString | escapeXML }}

#### Vulnerabilities

{{- if (eq (len .Vulnerabilities) 0) }}

> [!NOTE]
> No vulnerabilities found

{{- else }}

{{- $critical := 0 }}
{{- $high := 0 }}
{{- $medium := 0 }}
{{- $low := 0 }}

<details>
  <summary>Click to expand</summary>

| Package | Vulnerability | Severity | Installed | Fixed |
| ------- | ------------- | -------- | --------- | ----- |
{{- range .Vulnerabilities }}
{{- if  eq .Severity "CRITICAL" }}{{- $critical = add $critical 1 }}{{- end }}
{{- if  eq .Severity "HIGH" }}{{- $high = add $high 1 }}{{- end }}
{{- if  eq .Severity "MEDIUM" }}{{- $medium = add $medium 1 }}{{- end }}
{{- if  eq .Severity "LOW" }}{{- $low = add $low 1 }}{{- end }}
| {{ escapeXML .PkgName }} | {{ escapeXML .VulnerabilityID }} | {{ escapeXML .Vulnerability.Severity }} | {{ escapeXML .InstalledVersion }} | {{ escapeXML .FixedVersion }}
{{- end }}

</details>

| CRITICAL | HIGH | MEDIUM | LOW |
| -------- | ---- | ------ | --- |
| {{ $critical }} | {{ $high }} | {{ $medium }} | {{ $low }} |

{{- end }}

#### Misconfiguration

{{- if (eq (len .Misconfigurations ) 0) }}

> [!NOTE]
> No misconfigurations found

{{- else }}

<details>
  <summary>Click to expand</summary>

| Type | Misconf ID | Check | Severity | Message |
| ---- | ---------- | ----- | -------- | ------- |
{{- range .Misconfigurations }}
| {{ escapeXML .Type }} | {{ escapeXML .ID }} | {{ escapeXML .Title }} | {{ escapeXML .Severity }} | {{ escapeXML .Message }}<br/>[{{ escapeXML .PrimaryURL }}]({{ escapeXML .PrimaryURL }}) |
{{- end }}

</details>

{{- end }}

{{- end }}

{{- else }}

> [!CAUTION]
> Trivy returned empty report

{{- end }}

---
