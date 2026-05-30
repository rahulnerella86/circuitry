$files = @(
  'ComponentList.jsx',
  'CodeViewer.jsx',
  'ExplanationPanel.jsx',
  'NetlistViewer.jsx',
  'PowerAnalysis.jsx',
  'PCBGuide.jsx',
  'BOMExport.jsx',
  'ProjectManager.jsx'
)

$dir = 'c:\Projects\circuit_generator\client\src\components'

foreach ($f in $files) {
  $path = Join-Path $dir $f
  if (Test-Path $path) {
    $c = Get-Content $path -Raw
    $c = $c -replace 'text-white', 'text-ink'
    $c = $c -replace 'text-surface-300', 'text-ink-400'
    $c = $c -replace 'text-surface-200', 'text-ink-500'
    $c = $c -replace 'bg-surface-950', 'bg-ink-50'
    $c = $c -replace 'bg-surface-900', 'bg-ink-100'
    $c = $c -replace 'border-white/5', 'border-ink-200'
    $c = $c -replace 'border-white/\[0\.03\]', 'border-ink-100'
    $c = $c -replace 'bg-white/5', 'bg-ink-50'
    $c = $c -replace 'text-primary-600', 'text-ink-900'
    $c = $c -replace 'text-primary-300', 'text-ink-700'
    $c = $c -replace 'text-primary-400', 'text-ink-700'
    $c = $c -replace 'text-primary-500', 'text-ink-800'
    $c = $c -replace 'text-surface-800', 'text-ink-600'
    $c = $c -replace 'hover:bg-surface-950/\[0\.02\]', 'hover:bg-ink-50'
    Set-Content $path $c -NoNewline
    Write-Host "Updated $f"
  }
}
