import { exec } from 'child_process';

// Function executes command and returns result
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function checkSqlInstances() {
  console.log('Checking SQL Server instances...');
  
  try {
    // Check running SQL Server services
    console.log('\n1. Checking SQL Server services:');
    const servicesCmd = 'powershell "Get-Service | Where-Object {$_.DisplayName -like \'*SQL Server*\'} | Format-Table Name, DisplayName, Status -AutoSize"';
    const services = await executeCommand(servicesCmd);
    console.log(services || 'No SQL Server services found');
    
   // Check SQL Server instances in the registry
    console.log('\n2. Checking SQL Server instances in registry:');
    const registryCmd = 'powershell "Get-ItemProperty \'HKLM:\\SOFTWARE\\Microsoft\\Microsoft SQL Server\\Instance Names\\SQL\' -ErrorAction SilentlyContinue | Format-Table -AutoSize"';
    const registry = await executeCommand(registryCmd);
    console.log(registry || 'No SQL Server instances found in registry');
    
    // List SQL Server instances using sqlcmd
    console.log('\n3. Listing SQL Server instances using sqlcmd:');
    try {
      const sqlcmdResult = await executeCommand('sqlcmd -L');
      console.log(sqlcmdResult || 'No instances found with sqlcmd');
    } catch (err) {
      console.log('sqlcmd command failed. Make sure SQL Server command line tools are installed.');
    }
    
    // Check listening TCP port
    console.log('\n4. Checking TCP ports:');
    const netstatCmd = 'powershell "Get-NetTCPConnection | Where-Object {$_.State -eq \'Listen\' -and ($_.LocalPort -eq 1433 -or $_.LocalPort -eq 1434)} | Format-Table LocalAddress, LocalPort, State -AutoSize"';
    const ports = await executeCommand(netstatCmd);
    console.log(ports || 'No SQL Server ports (1433/1434) found listening');
    
    console.log('\nCheck complete. Use this information to update your connection string.');
    
  } catch (error) {
    console.error('Error checking SQL Server instances:', error);
  }
}

checkSqlInstances();

