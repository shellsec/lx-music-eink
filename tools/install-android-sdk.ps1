param(
  [string]$SdkRoot = $(
    if ($env:ANDROID_HOME) { $env:ANDROID_HOME }
    elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT }
    else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
  ),
  [string]$JavaHome = $(
    if ($env:JAVA_HOME) { $env:JAVA_HOME }
    else { $null }
  )
)

$sdk = $SdkRoot
if (-not $sdk) {
  Write-Error "Set ANDROID_HOME / ANDROID_SDK_ROOT, or pass -SdkRoot <path>."
  exit 1
}
if (-not $JavaHome) {
  Write-Error "Set JAVA_HOME, or pass -JavaHome <path>."
  exit 1
}

New-Item -ItemType Directory -Force -Path "$sdk\licenses" | Out-Null

Set-Content -Path "$sdk\licenses\android-sdk-license" -Value "`n24333f8a63b6825ea9c5514f6c68400e`n601085b94cd77f0b54ff86406957099ebe79c4d6`n859f317696f67ef3d7f30a50a5560e7834b43937"
Set-Content -Path "$sdk\licenses\android-sdk-preview-license" -Value "`n84831b9409646a918e30573bab4c9c71"
Set-Content -Path "$sdk\licenses\android-googletv-license" -Value "`n601085b94cd77f0b54ff86406957099ebe79c4d6"
Set-Content -Path "$sdk\licenses\android-sdk-arm-dbt-license" -Value "`n859f317696f67ef3d7f30a50a5560e7834b43937"
Set-Content -Path "$sdk\licenses\google-gdk-license" -Value "`n33b6a2b64607f11b759f320ef9dff4ae5c47d97a"
Set-Content -Path "$sdk\licenses\mips-android-sysimage-license" -Value "`n8933bad161af4178b1185d1a37fbf41ea5269c55`ne9acab5b5fbb560a72cfaecce8946896db86f659"
Set-Content -Path "$sdk\licenses\intel-android-extra-license" -Value "`nd975f751698a77b662f1254ddbeed3901e976f5a"

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:JAVA_HOME = $JavaHome
$sdkmanager = "$sdk\cmdline-tools\latest\bin\sdkmanager.bat"
if (-not (Test-Path $sdkmanager)) {
  Write-Error "sdkmanager not found: $sdkmanager (install Android cmdline-tools first)."
  exit 1
}
$cmd = "$env:SystemRoot\System32\cmd.exe"

Write-Host "Installing SDK components into $sdk ..."
& $cmd /c "`"$sdkmanager`" --sdk_root=$sdk platform-tools `"platforms;android-36`" `"build-tools;35.0.0`" `"ndk;26.1.10909125`" `"cmake;3.22.1`""
Write-Host "exit=$LASTEXITCODE"
Get-ChildItem $sdk | Select-Object Name
