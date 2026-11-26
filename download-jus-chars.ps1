# language: PowerShell, file: download-jus-chars.ps1, target: Windows PowerShell
# Tự động tải lẻ các file .sff / .air / .def từ bên trong (View Contents) của Jump Force MUGEN & Dragon Ball VS Naruto JUS MUGEN mà KHÔNG cần tải cả cục 1GB!

$ErrorActionPreference = "Continue"
$headers = @{ "User-Agent" = "Mozilla/5.0" }
$charsRoot = Join-Path $PSScriptRoot "chars"

$packs = @(
  @{
    id = "luffy"
    baseUrl = "https://archive.org/download/jump-force-mugen/Jump%20Force%20MUGEN.zip/Jump%20Force%20MUGEN/chars/SM_Luffy_TS"
    files = @("SM_Luffy_TS.def", "SM_Luffy_TS.sff", "SM_Luffy_TS.air", "SM_Luffy_TS.cns")
  },
  @{
    id = "gon"
    baseUrl = "https://archive.org/download/jump-force-mugen/Jump%20Force%20MUGEN.zip/Jump%20Force%20MUGEN/chars/Gon_Edit_by_TrafalgarLawzz"
    files = @("Gon_Edit_by_TrafalgarLawzz.def", "Gon.sff", "Gon.air", "Gon.cns")
  },
  @{
    id = "killua"
    baseUrl = "https://archive.org/download/jump-force-mugen/Jump%20Force%20MUGEN.zip/Jump%20Force%20MUGEN/chars/Killua_Edit_by_TrafalgarLawzz"
    files = @("Killua_Edit_by_TrafalgarLawzz.def", "Killua.sff", "Killua.air", "Killua.cns")
  },
  @{
    id = "ichigo"
    baseUrl = "https://archive.org/download/jump-force-mugen/Jump%20Force%20MUGEN.zip/Jump%20Force%20MUGEN/chars/Ichigo_Final_by_TrafalgarLawzz"
    files = @("Ichigo_Final_by_TrafalgarLawzz.def", "Ichigo_Final.sff", "Ichigo_Final.air", "Ichigo_Final.cns")
  },
  @{
    id = "jotaro"
    baseUrl = "https://archive.org/download/jump-force-mugen/Jump%20Force%20MUGEN.zip/Jump%20Force%20MUGEN/chars/SM_Jotaro"
    files = @("SM_Jotaro.def", "SM_Jotaro.sff", "SM_Jotaro.air", "SM_Jotaro.cns")
  }
)

foreach ($p in $packs) {
  $destDir = Join-Path $charsRoot $p.id
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  Write-Host "=== Đang tải nhân vật JUS: $($p.id.ToUpper()) ===" -ForegroundColor Cyan
  foreach ($f in $p.files) {
    $url = "$($p.baseUrl)/$f"
    $out = Join-Path $destDir $f
    try {
      Write-Host "  -> Tải $f ..."
      Invoke-WebRequest -Uri $url -OutFile $out -Headers $headers
    } catch {
      Write-Warning "  [!] Bỏ qua $f ($($_.Exception.Message))"
    }
  }
}
Write-Host "Hoàn tất! Các nhân vật đã được lưu vào $charsRoot" -ForegroundColor Green
