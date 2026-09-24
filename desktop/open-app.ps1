# MiredGains desktop launcher: starts the sync server if it isn't already
# running, waits for it to come up, then opens the app in a Chrome/Edge
# app window (no tabs or address bar).

$ErrorActionPreference = 'SilentlyContinue'

function Test-Port8500 {
    $client = New-Object Net.Sockets.TcpClient
    try {
        $task = $client.ConnectAsync('127.0.0.1', 8500)
        if ($task.Wait(400) -and $client.Connected) { return $true }
    } finally { $client.Close() }
    return $false
}

if (-not (Test-Port8500)) {
    Start-Process 'node' -ArgumentList 'server.mjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    # Wait up to 8 seconds for the server to start listening
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 400
        if (Test-Port8500) { break }
    }
}

$browsers = @(
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
)

foreach ($b in $browsers) {
    if (Test-Path $b) {
        Start-Process $b -ArgumentList '--app=http://localhost:8500'
        exit
    }
}

# Fallback: default browser, normal tab
Start-Process 'http://localhost:8500'
