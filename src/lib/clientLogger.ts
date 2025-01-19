class ClientLogger {
  private static instance: ClientLogger

  log(message: string, data?: any) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${message}`)
    if (data) {
      console.log(JSON.stringify(data, null, 2))
    }
  }

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] ERROR: ${message}`)
    if (error) {
      console.error(error)
    }
  }

  static getInstance(): ClientLogger {
    if (!ClientLogger.instance) {
      ClientLogger.instance = new ClientLogger()
    }
    return ClientLogger.instance
  }
}

export const clientLogger = ClientLogger.getInstance() 