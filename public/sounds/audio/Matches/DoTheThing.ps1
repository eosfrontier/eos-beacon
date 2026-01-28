param (
    [string]$Match,
    [string]$run,
    [string]$ProjectID
)
.\create_ssml_scripts.ps1 -CsvFile ".\Run $run\$match Match\matches.csv" -OutputDir ".\Run $run\$match Match\ssml_scripts"
.\Run-VertexTTS.ps1 -ProjectID $ProjectID -SsmlInputDirectory ".\Run $run\$match Match\ssml_scripts\" -AudioOutputDirectory ".\Run $run\$match Match"