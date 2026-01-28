# =================================================================================================
#
#  Vertex AI Text-to-Speech (Chirp3) Automation Script
#
#  Description:
#  This script automates the process of converting multiple SSML files to speech using
#  Google Cloud's Vertex AI Text-to-Speech API with a Chirp3 voice. It iterates through
#  a directory of .ssml files, sends each one to the API, and saves the resulting
#  audio as an MP3 file.
#
#  Author: Your Name
#  Date: 2024-10-27
#
# =================================================================================================
param (
    [string]$SsmlInputDirectory,
    [string]$AudioOutputDirectory,
    [string]$ProjectID
    )
# --- CONFIGURATION ---
# --- (Modify these variables to match your environment) ---
$AudioOutputDirectory = Join-Path -Path $PSScriptRoot -ChildPath "$AudioOutputDirectory"
# Your Google Cloud Project ID

# The Google Cloud region for the API call (e.g., "us-central1")
$Region = "eu"

# The specific Chirp3 voice model you want to use. [6]
# A list of available voices can be found in the official documentation.
$VoiceName = "en-GB-Chirp3-HD-Algenib"

# The language code corresponding to the voice. [6]
$LanguageCode = "en-GB"

# The directory containing your SSML files.


# The desired audio encoding for the output file. [6]
# Options include "MP3", "LINEAR16", "OGG_OPUS".
$AudioEncoding = "MP3"


# --- SCRIPT LOGIC ---
# --- (Do not modify below this line unless you know what you are doing) ---

# Check if the output directory exists, if not, create it.
if (-not (Test-Path -Path $AudioOutputDirectory -PathType Container)) {
    Write-Host "Output directory not found. Creating '$AudioOutputDirectory'..."
    New-Item -Path $AudioOutputDirectory -ItemType Directory | Out-Null
}

# 1. AUTHENTICATION
# ------------------
# Get the access token from the gcloud CLI.
# This requires you to have run 'gcloud auth application-default login' first.
Write-Host "Fetching authentication token..."
try {
    $AccessToken = gcloud auth print-access-token
}
catch {
    Write-Error "Failed to get access token. Please ensure you have authenticated via 'gcloud auth application-default login'."
    exit
}

# Construct the Authorization header.
$headers = @{
    "Authorization"       = "Bearer $accessToken"
    "Content-Type"        = "application/json; charset=utf-8"
    "X-Goog-User-Project" = $projectId  # <-- Tells Google which project to bill
}


# 2. PROCESS SSML FILES
# ---------------------
# Get all files with the .ssml extension from the input directory.
$ssmlFiles = Get-ChildItem -Path $SsmlInputDirectory -Filter *.ssml
if ($ssmlFiles.Count -eq 0) {
    Write-Warning "No .ssml files found in the '$SsmlInputDirectory' directory."
    exit
}

Write-Host "Found $($ssmlFiles.Count) SSML file(s) to process."

# Loop through each SSML file.
foreach ($file in $ssmlFiles) {
    $filePath = $file.FullName
    Write-Host "`n--- Processing file: $($file.Name) ---"

    # Read the SSML content from the file.
    $ssmlContent = Get-Content -Path $filePath -Raw
    $flattenedSSML = $ssmlContent -replace '[\r\n\t]', '' -replace '\s+', ' '
    # Construct the JSON request body for the API call.
    $requestBody = @{
    input       = @{ ssml = $flattenedSSML.Trim() }
    voice       = @{ languageCode = "en-GB"; name = "en-GB-Chirp3-HD-Algenib" }
    audioConfig = @{ audioEncoding = "MP3" }
} | ConvertTo-Json -Depth 4 -EscapeHandling EscapeNonAscii


    # Define the API endpoint URL.
    $apiUrl = "https://$($Region)-texttospeech.googleapis.com/v1beta1/text:synthesize"

    # 3. MAKE THE API CALL
    # --------------------
    try {
        Write-Host "Sending request to Vertex AI API..."
        $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $requestBody 

        if ($response.audioContent) {
            Write-Host "Successfully received audio content."

            # Decode the base64 audio content.
            $audioBytes = [System.Convert]::FromBase64String($response.audioContent)

            # Create the output file path.
            $outputFileName = "$($file.BaseName).mp3"
            $outputFilePath = Join-Path -Path $AudioOutputDirectory -ChildPath $outputFileName

            # Save the decoded audio to a file using a method compatible with all PowerShell versions.
            [System.IO.File]::WriteAllBytes($outputFilePath, $audioBytes)
            Write-Host "Audio file saved to: $outputFilePath" -ForegroundColor Green
        }
        else {
            Write-Warning "API response did not contain audio content for file '$($file.Name)'."
        }
    }
    catch {
        Write-Error "An error occurred while processing '$($file.Name)':" -ErrorAction Continue

        # Check if the exception contains a detailed API response.
        if ($_.Exception.Response -and $_.Exception.Response.Content) {
            # This is an API error (e.g., 4xx, 5xx) with a JSON body.
            $errorJson = $_.Exception.Response.Content.ReadAsStringAsync().Result
            # Ensure the response content is not null or empty before trying to parse it.
            if (-not [string]::IsNullOrWhiteSpace($errorJson)) {
                $formattedError = $errorJson | ConvertFrom-Json | ConvertTo-Json -Depth 5
                Write-Error $formattedError
            }
            else {
                # The response had no body, so fall back to the main exception message.
                # Let's output the entire response object for more details (headers, status code, etc.)
                Write-Error ($_.Exception.Response | Format-List | Out-String)
            }
        }
        else {
            # This is a different error (e.g., network timeout, DNS failure). Print the base exception.
            Write-Error $_.Exception.Message
        }
        # Continue to the next file
        continue
    }
}

Write-Host "`nAll files processed." -ForegroundColor Green