import { EventEmitter } from 'node:events'
import type { AutomationEventPayload } from './automation.types.js'

class AutomationEmitter extends EventEmitter {}

export const automationEmitter = new AutomationEmitter()
automationEmitter.setMaxListeners(30)

export function emitAutomation(payload: AutomationEventPayload) {
  automationEmitter.emit('automation:event', payload)
}
