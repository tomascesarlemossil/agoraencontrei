import type { FastifyInstance } from 'fastify'
import type { AutomationEventPayload, ConditionRule, ActionDef } from './automation.types.js'
import { executeAction } from './automation.actions.js'

export async function runAutomation(
  app: FastifyInstance,
  payload: AutomationEventPayload,
): Promise<void> {
  const { companyId, event, data } = payload

  const rules = await app.prisma.automationRule.findMany({
    where: { companyId, trigger: event, isActive: true },
  })

  for (const rule of rules) {
    const log = await app.prisma.automationLog.create({
      data: { ruleId: rule.id, triggeredBy: event, payload: data as any, status: 'running' },
    })

    try {
      const conditions = rule.conditions as unknown as ConditionRule[]
      const passes = evaluateConditions(conditions, data)

      if (!passes) {
        await app.prisma.automationLog.update({
          where: { id: log.id },
          data:  { status: 'done', result: { skipped: true, reason: 'conditions_not_met' } },
        })
        continue
      }

      const actions = rule.actions as unknown as ActionDef[]
      const results: unknown[] = []

      for (const action of actions) {
        const result = await executeAction(app, action, data, companyId)
        results.push({ type: action.type, result })
      }

      await app.prisma.automationRule.update({
        where: { id: rule.id },
        data:  { lastTriggeredAt: new Date() },
      })

      await app.prisma.automationLog.update({
        where: { id: log.id },
        data:  { status: 'done', result: results as any },
      })
    } catch (err: any) {
      await app.prisma.automationLog.update({
        where: { id: log.id },
        data:  { status: 'failed', errorMsg: err.message },
      })
      throw err
    }
  }
}

function evaluateConditions(
  conditions: ConditionRule[],
  data: Record<string, unknown>,
): boolean {
  if (!conditions.length) return true
  return conditions.every((c) => {
    const actual = data[c.field]
    switch (c.op) {
      case 'eq':       return actual === c.value
      case 'neq':      return actual !== c.value
      case 'gt':       return Number(actual) > Number(c.value)
      case 'lt':       return Number(actual) < Number(c.value)
      case 'contains': return String(actual).toLowerCase().includes(String(c.value).toLowerCase())
      case 'in':       return Array.isArray(c.value) && (c.value as unknown[]).includes(actual)
      default:         return false
    }
  })
}
