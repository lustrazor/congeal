import fs from 'fs'
import path from 'path'

class Logger {
  private static instance: Logger
  private logFile: string

  constructor() {
    try {
      // Create logs directory synchronously
      const logDir = path.join(process.cwd(), 'logs')
      console.log('Creating log directory at:', logDir)
      
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }

      // Set up log file path
      this.logFile = path.join(logDir, 'app.log')
      console.log('Log file path:', this.logFile)

      // Write initial log entry synchronously
      const initialLog = `\n=== Logger Started at ${new Date().toISOString()} ===\n`
      fs.writeFileSync(this.logFile, initialLog, { flag: 'a' })
      
      console.log('Logger initialized successfully')
    } catch (error) {
      console.error('Failed to initialize logger:', error)
      throw error
    }
  }

  log(message: string, data?: any) {
    try {
      const timestamp = new Date().toISOString()
      let logEntry = `[${timestamp}] ${message}\n`
      if (data) {
        logEntry += JSON.stringify(data, null, 2) + '\n'
      }

      // Write to file synchronously
      fs.writeFileSync(this.logFile, logEntry, { flag: 'a' })
      
      // Also log to console
      console.log(message)
      if (data) console.log(data)
    } catch (error) {
      console.error('Failed to write log:', error)
    }
  }

  error(message: string, error?: any) {
    try {
      const timestamp = new Date().toISOString()
      let logEntry = `[${timestamp}] ERROR: ${message}\n`
      if (error) {
        logEntry += JSON.stringify(error, null, 2) + '\n'
      }

      // Write to file synchronously
      fs.writeFileSync(this.logFile, logEntry, { flag: 'a' })
      
      // Also log to console
      console.error(message)
      if (error) console.error(error)
    } catch (error) {
      console.error('Failed to write error log:', error)
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }
}

// Create and export singleton instance
export const logger = Logger.getInstance() 