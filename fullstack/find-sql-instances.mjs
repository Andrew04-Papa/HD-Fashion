import { exec } from 'child_process';

// Function executes command and returns result as Promise
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function findSqlInstances() {
  try {
    console.log('Searching for SQL Server instances on this machine...');
    
    // Use SQL Server Configuration Manager to list instances
    // Note: This command only works if SQL Server Configuration Manager is installed.
    try {
      const result = await executeCommand('powershell "Get-ItemProperty -Path \'HKLM:\\SOFTWARE\\Microsoft\\Microsoft SQL Server\\Instance Names\\SQL\'"');
      console.log('SQL Server instances found:');
      console.log(result);
    } catch (error) {
      console.log('Could not query registry for SQL instances:', error.message);
    }
    
    // Try using sqlcmd to list the instances
    try {
      const sqlcmdResult = await executeCommand('sqlcmd -L');
      console.log('\nSQL Server instances found using sqlcmd:');
      console.log(sqlcmdResult);
    } catch (error) {
      console.log('Could not run sqlcmd:', error.message);
    }
    
    // Check SQL Server services running
    try {
      const servicesResult = await executeCommand('powershell "Get-Service | Where-Object {$_.Name -like \'MSSQL*\'}"');
      console.log('\nSQL Server services running:');
      console.log(servicesResult);
    } catch (error) {
      console.log('Could not query SQL Server services:', error.message);
    }
    
  } catch (error) {
    console.error('Error finding SQL Server instances:', error);
  }
}

findSqlInstances();

