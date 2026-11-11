<#
.SYNOPSIS
    Tạo firmware/esp32_thingspeak_n17/secrets.h (tên + mật khẩu WiFi) cho ESP32 Nhóm 17.

.DESCRIPTION
    Không tham số: mở cửa sổ nhập WiFi (bấm đúp tools/change-wifi.bat).
    Có -Ssid: ghi thẳng, không mở cửa sổ (dùng trong terminal).

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tools\change-wifi.ps1 -Ssid "Nha_Rieng" -Password "12345678"
#>
param(
    [string]$Ssid,
    [string]$Password = ""
)

$ErrorActionPreference = "Stop"

$SketchDir = Join-Path $PSScriptRoot "..\firmware\esp32_thingspeak_n17"
$SecretsPath = Join-Path $SketchDir "secrets.h"
$SketchPath = Join-Path $SketchDir "esp32_thingspeak_n17.ino"

# Giới hạn của chuẩn WiFi: SSID tối đa 32 byte, mật khẩu WPA2 8–63 ký tự
$MAX_SSID_BYTES = 32
$MIN_PASSWORD_LENGTH = 8
$MAX_PASSWORD_LENGTH = 63

function ConvertTo-CString([string]$value) {
    # Escape để tên/mật khẩu có dấu " hoặc \ không làm hỏng chuỗi C++
    return $value.Replace('\', '\\').Replace('"', '\"')
}

function Get-InputError([string]$ssid, [string]$password) {
    if ([string]::IsNullOrWhiteSpace($ssid)) {
        return "Chưa nhập tên WiFi."
    }
    if ([Text.Encoding]::UTF8.GetByteCount($ssid) -gt $MAX_SSID_BYTES) {
        return "Tên WiFi dài quá $MAX_SSID_BYTES byte."
    }
    if ($ssid -match "[\r\n]" -or $password -match "[\r\n]") {
        return "Tên / mật khẩu không được chứa xuống dòng."
    }
    $isOpenNetwork = $password.Length -eq 0
    $isValidLength = $password.Length -ge $MIN_PASSWORD_LENGTH -and
        $password.Length -le $MAX_PASSWORD_LENGTH
    if (-not $isOpenNetwork -and -not $isValidLength) {
        return "Mật khẩu WiFi phải từ $MIN_PASSWORD_LENGTH đến $MAX_PASSWORD_LENGTH ký tự (mạng không mật khẩu thì để trống)."
    }
    return $null
}

function Save-Secrets([string]$ssid, [string]$password) {
    $content = @(
        "#pragma once"
        ""
        "// Tạo tự động bởi tools/change-wifi.ps1 lúc $(Get-Date -Format 'yyyy-MM-dd HH:mm')."
        "// Không commit file này (đã có trong .gitignore)."
        "const char* WIFI_SSID = `"$(ConvertTo-CString $ssid)`";"
        "const char* WIFI_PASSWORD = `"$(ConvertTo-CString $password)`";"
        ""
    ) -join "`n"
    # UTF-8 không BOM để tên WiFi tiếng Việt biên dịch đúng
    [IO.File]::WriteAllText($SecretsPath, $content, (New-Object Text.UTF8Encoding($false)))
}

function Get-CurrentWifi {
    $current = @{ Ssid = ""; Password = "" }
    if (-not (Test-Path $SecretsPath)) {
        return $current
    }
    $text = [IO.File]::ReadAllText($SecretsPath, [Text.Encoding]::UTF8)
    $pattern = '{0}\s*=\s*"((?:[^"\\]|\\.)*)"'
    foreach ($key in @("Ssid", "Password")) {
        $name = if ($key -eq "Ssid") { "WIFI_SSID" } else { "WIFI_PASSWORD" }
        $match = [regex]::Match($text, ($pattern -f $name))
        if ($match.Success -and $match.Groups[1].Value -notlike "<*") {
            $current[$key] = $match.Groups[1].Value.Replace('\"', '"').Replace('\\', '\')
        }
    }
    return $current
}

function Get-NearbyNetworks {
    # Danh sách WiFi máy tính đang thấy, để chọn thay vì gõ tay dễ sai
    try {
        $output = netsh wlan show networks 2>$null
        return $output |
            ForEach-Object { if ($_ -match '^\s*SSID \d+\s*:\s*(.+?)\s*$') { $Matches[1] } } |
            Where-Object { $_ } |
            Sort-Object -Unique
    } catch {
        Write-Warning "Không quét được WiFi: $($_.Exception.Message)"
        return @()
    }
}

# ---------- Chế độ dòng lệnh ----------
if ($PSBoundParameters.ContainsKey("Ssid")) {
    $inputError = Get-InputError $Ssid $Password
    if ($inputError) {
        Write-Error $inputError
        exit 1
    }
    Save-Secrets $Ssid $Password
    Write-Host "Đã ghi $([IO.Path]::GetFullPath($SecretsPath)) cho WiFi [$Ssid]."
    Write-Host "Giờ mở esp32_thingspeak_n17.ino bằng Arduino IDE và bấm Upload."
    exit 0
}

# ---------- Chế độ cửa sổ ----------
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()

$current = Get-CurrentWifi
$font = New-Object Drawing.Font("Segoe UI", 10)

$form = New-Object Windows.Forms.Form
$form.Text = "Đổi WiFi cho ESP32 - Nhóm 17"
$form.ClientSize = New-Object Drawing.Size(460, 330)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.Font = $font

$hint = New-Object Windows.Forms.Label
$hint.Text = "ESP32 chỉ bắt WiFi 2.4 GHz. Nhập xong bấm Lưu, rồi nạp lại code (Upload)."
$hint.SetBounds(16, 12, 430, 40)
$form.Controls.Add($hint)

$ssidLabel = New-Object Windows.Forms.Label
$ssidLabel.Text = "Tên WiFi (SSID):"
$ssidLabel.SetBounds(16, 60, 200, 22)
$form.Controls.Add($ssidLabel)

$ssidBox = New-Object Windows.Forms.ComboBox
$ssidBox.DropDownStyle = "DropDown"
$ssidBox.SetBounds(16, 84, 330, 28)
foreach ($network in Get-NearbyNetworks) { [void]$ssidBox.Items.Add($network) }
$ssidBox.Text = $current.Ssid
$form.Controls.Add($ssidBox)

$scanButton = New-Object Windows.Forms.Button
$scanButton.Text = "Quét lại"
$scanButton.SetBounds(354, 83, 90, 30)
$scanButton.Add_Click({
    $typed = $ssidBox.Text
    $ssidBox.Items.Clear()
    foreach ($network in Get-NearbyNetworks) { [void]$ssidBox.Items.Add($network) }
    $ssidBox.Text = $typed
})
$form.Controls.Add($scanButton)

$passwordLabel = New-Object Windows.Forms.Label
$passwordLabel.Text = "Mật khẩu (mạng không mật khẩu thì để trống):"
$passwordLabel.SetBounds(16, 124, 420, 22)
$form.Controls.Add($passwordLabel)

$passwordBox = New-Object Windows.Forms.TextBox
$passwordBox.UseSystemPasswordChar = $true
$passwordBox.Text = $current.Password
$passwordBox.SetBounds(16, 148, 428, 28)
$form.Controls.Add($passwordBox)

$showPassword = New-Object Windows.Forms.CheckBox
$showPassword.Text = "Hiện mật khẩu"
$showPassword.SetBounds(16, 182, 200, 24)
$showPassword.Add_CheckedChanged({ $passwordBox.UseSystemPasswordChar = -not $showPassword.Checked })
$form.Controls.Add($showPassword)

$statusLabel = New-Object Windows.Forms.Label
$statusLabel.SetBounds(16, 214, 428, 44)
$form.Controls.Add($statusLabel)

$saveButton = New-Object Windows.Forms.Button
$saveButton.Text = "Lưu"
$saveButton.SetBounds(16, 272, 120, 36)
$saveButton.Add_Click({
    $ssid = $ssidBox.Text.Trim()
    $inputError = Get-InputError $ssid $passwordBox.Text
    if ($inputError) {
        $statusLabel.ForeColor = [Drawing.Color]::Firebrick
        $statusLabel.Text = $inputError
        return
    }
    try {
        Save-Secrets $ssid $passwordBox.Text
        $statusLabel.ForeColor = [Drawing.Color]::ForestGreen
        $statusLabel.Text = "Đã lưu secrets.h cho WiFi [$ssid]. Giờ bấm 'Mở Arduino IDE' rồi Upload."
    } catch {
        $statusLabel.ForeColor = [Drawing.Color]::Firebrick
        $statusLabel.Text = "Lỗi ghi file: $($_.Exception.Message)"
    }
})
$form.Controls.Add($saveButton)
$form.AcceptButton = $saveButton

$openButton = New-Object Windows.Forms.Button
$openButton.Text = "Mở Arduino IDE"
$openButton.SetBounds(146, 272, 150, 36)
$openButton.Add_Click({
    try {
        Start-Process -FilePath ([IO.Path]::GetFullPath($SketchPath))
    } catch {
        $statusLabel.ForeColor = [Drawing.Color]::Firebrick
        $statusLabel.Text = "Không mở được file .ino (đã cài Arduino IDE chưa?): $($_.Exception.Message)"
    }
})
$form.Controls.Add($openButton)

$closeButton = New-Object Windows.Forms.Button
$closeButton.Text = "Đóng"
$closeButton.SetBounds(344, 272, 100, 36)
$closeButton.Add_Click({ $form.Close() })
$form.Controls.Add($closeButton)
$form.CancelButton = $closeButton

[void]$form.ShowDialog()
