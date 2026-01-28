param (
    [string]$CsvFile = "matches.csv",
    [string]$OutputDir = "ssml_scripts"
)

# Check if CSV exists before starting
if (-not (Test-Path $csvFile)) {
    Write-Host "Error: Could not find '$csvFile'. Please create it first." -ForegroundColor Red
    exit
}

# Create output directory if it doesn't exist
if (-not (Test-Path -Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "Created folder: $outputDir" -ForegroundColor Cyan
}

# 2. Helper function to clean names for filenames
function Clean-NameForFile ($name) {
    # Remove single quotes, double quotes, and periods
    $clean = $name -replace "['""\.]", ""
    # Replace spaces with underscores
    $clean = $clean -replace "\s+", "_"
    return $clean
}

# 3. Import CSV and Process
Write-Host "Reading from $csvFile..." -ForegroundColor Cyan
$rows = Import-Csv $csvFile

# Initialize Counter
$counter = 1

foreach ($row in $rows) {
    # Get names from CSV columns
    $p1 = $row.Person1
    $p2 = $row.Person2

    # Generate ID (pads with zero, e.g., 1 becomes "01")
    $id = $counter.ToString("00")

    # Generate the SSML Content
    $ssmlContent = @"
<speak>
  <p>
    $p1 is matched with... <break time="1000ms"/> $p2
  </p>
  <break time="800ms"/>
  I repeat.
  <break time="400ms"/>
  <p>
    $p1 is matched with... <break time="500ms"/> $p2
  </p>
</speak>
"@

    # Generate the Filename
    $cleanP1 = Clean-NameForFile $p1
    $cleanP2 = Clean-NameForFile $p2
    $fileName = "${id}_${cleanP1}_&_${cleanP2}.ssml"
    $fullPath = Join-Path $outputDir $fileName

    # Write to file
    $ssmlContent | Set-Content -Path $fullPath -Encoding UTF8

    Write-Host "[$id] Generated: $fileName" -ForegroundColor Gray

    # Increment the counter for the next loop
    $counter++
}

Write-Host "`nDone! Created $($counter - 1) files in '$outputDir'" -ForegroundColor Green
