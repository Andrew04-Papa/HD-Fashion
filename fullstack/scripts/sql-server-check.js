const { exec } = require("child_process")
const fs = require("fs")

// Execute command and return result as promise
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`)
        reject(error)
        return
      }
      resolve(stdout.trim())
    })
  })
}

async function checkSqlServer() {
  console.log("SQL Server Connection Checker")
  console.log("============================\n")

  try {
    // 1. Check SQL Server services
    console.log("1. Checking SQL Server services...")
    const servicesCmd =
      "powershell \"Get-Service | Where-Object {$_.DisplayName -like '*SQL Server*'} | Format-Table Name, DisplayName, Status -AutoSize\""
    const services = await executeCommand(servicesCmd)
    console.log(services || "No SQL Server services found")

    // 2. Check SQL Server instances
    console.log("\n2. Checking SQL Server instances...")
    try {
      const instancesCmd =
        "powershell \"Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Microsoft SQL Server\\Instance Names\\SQL' -ErrorAction SilentlyContinue | Format-Table -AutoSize\""
      const instances = await executeCommand(instancesCmd)
      console.log(instances || "No SQL Server instances found in registry")
    } catch (error) {
      console.log("Could not query registry for SQL instances")
    }

    // 3. Check TCP/IP protocol status
    console.log("\n3. Checking TCP/IP protocol status...")
    console.log("Note: This requires SQL Server Configuration Manager")
    console.log("Please follow these manual steps:")
    console.log("  a. Open SQL Server Configuration Manager")
    console.log("  b. Go to SQL Server Network Configuration > Protocols for [YOUR_INSTANCE]")
    console.log("  c. Ensure TCP/IP is enabled")
    console.log("  d. Right-click on TCP/IP > Properties > IP Addresses tab")
    console.log("  e. For IPAll, clear TCP Dynamic Ports and set TCP Port to 1433")

    // 4. Check TCP ports
    console.log("\n4. Checking TCP ports...")
    const portsCmd =
      "powershell \"Get-NetTCPConnection | Where-Object {$_.State -eq 'Listen' -and ($_.LocalPort -eq 1433 -or $_.LocalPort -eq 1434)} | Format-Table LocalAddress, LocalPort, State -AutoSize\""
    const ports = await executeCommand(portsCmd)
    console.log(ports || "No SQL Server ports (1433/1434) found listening")

    // 5. Create PowerShell script to enable TCP/IP
    console.log("\n5. Creating PowerShell script to enable TCP/IP...")
    const tcpIpScript = `
# Load SQL Server SMO assembly
[System.Reflection.Assembly]::LoadWithPartialName('Microsoft.SqlServer.SqlWmiManagement') | Out-Null

# Get the default SQL Server instance
$wmi = New-Object 'Microsoft.SqlServer.Management.Smo.Wmi.ManagedComputer'

# Enable TCP/IP protocol
$tcpIpProtocol = $wmi.ServerInstances | ForEach-Object { $_.ServerProtocols } | Where-Object { $_.Name -eq 'Tcp' }
if ($tcpIpProtocol) {
    if ($tcpIpProtocol.IsEnabled -eq $false) {
        $tcpIpProtocol.IsEnabled = $true
        $tcpIpProtocol.Alter()
        Write-Output "TCP/IP protocol enabled"
    } else {
        Write-Output "TCP/IP protocol is already enabled"
    }
    
    # Configure TCP port 1433
    $ipAll = $tcpIpProtocol.IPAddresses | Where-Object { $_.Name -eq 'IPAll' }
    if ($ipAll) {
        $port = $ipAll.IPAddressProperties | Where-Object { $_.Name -eq 'TcpPort' }
        if ($port) {
            $port.Value = "1433"
            $tcpIpProtocol.Alter()
            Write-Output "TCP port set to 1433"
        }
    }
} else {
    Write-Output "TCP/IP protocol not found"
}

# Restart SQL Server service
$sqlService = Get-Service -Name 'MSSQLSERVER' -ErrorAction SilentlyContinue
if ($sqlService) {
    Restart-Service -Name 'MSSQLSERVER' -Force
    Write-Output "SQL Server service restarted"
} else {
    $sqlExpressService = Get-Service -Name 'MSSQL$SQLEXPRESS' -ErrorAction SilentlyContinue
    if ($sqlExpressService) {
        Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force
        Write-Output "SQL Server Express service restarted"
    } else {
        Write-Output "SQL Server service not found"
    }
}
`

    fs.writeFileSync("enable-tcp-ip.ps1", tcpIpScript)
    console.log("Created PowerShell script: enable-tcp-ip.ps1")
    console.log("Please run this script as administrator:")
    console.log("powershell -ExecutionPolicy Bypass -File enable-tcp-ip.ps1")

    console.log("\nCheck complete. Follow the instructions above to fix SQL Server connection issues.")
  } catch (error) {
    console.error("Error:", error)
  }
}

checkSqlServer()

