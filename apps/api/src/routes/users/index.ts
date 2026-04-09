import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createAuditLog } from '../../services/audit.service.js'

const UpdateUserBody = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  creciNumber: z.string().optional(),
  avatarUrl: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'BROKER', 'FINANCIAL', 'LAWYER', 'CLIENT']).optional(),
  accessLevel: z.enum(['full', 'custom', 'readonly']).optional(),
  moduleAccess: z.array(z.string()).optional(),
  hasDataAccess: z.boolean().optional(),
})

// All available system modules for granular permission control
const ALL_MODULES = [
  'imoveis', 'leads', 'contatos', 'negocios', 'financeiro', 'juridico',
  'chat', 'leiloes', 'blog', 'seo', 'automacoes', 'ia-visual', 'documentos',
  'configuracoes', 'parceiros', 'portal', 'financiamentos', 'campanhas',
  'notas-fiscais', 'renovacoes', 'foto-editor',
]

const CreateUserBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MANAGER', 'BROKER', 'FINANCIAL', 'LAWYER', 'CLIENT']).default('BROKER'),
  phone: z.string().optional(),
  creciNumber: z.string().optional(),
  oabNumber: z.string().optional(),
  moduleAccess: z.array(z.string()).optional(),
  accessLevel: z.enum(['full', 'custom', 'readonly']).default('full'),
  createIsolatedCompany: z.boolean().default(false),
  isolatedCompanyName: z.string().optional(),
  notifyWhatsapp: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
  notifySms: z.boolean().optional(),
})

export default async function usersRoutes(app: FastifyInstance) {
  // All routes require auth
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/users — list company users (admin/manager only)
  app.get('/', {
    schema: { tags: ['users'], summary: 'List company users' },
  }, async (req, reply) => {
    const { role } = req.user
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const users = await app.prisma.user.findMany({
      where: { companyId: req.user.cid, status: { not: 'SUSPENDED' } },
      select: {
        id: true, name: true, email: true, phone: true,
        avatarUrl: true, role: true, status: true, settings: true,
        creciNumber: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return reply.send(users)
  })

  // POST /api/v1/users — create user (admin only)
  app.post('/', {
    schema: { tags: ['users'], summary: 'Create a user in the company' },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const body = CreateUserBody.parse(req.body)

    const existing = await app.prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return reply.status(409).send({ error: 'EMAIL_EXISTS', message: 'E-mail já cadastrado' })
    }

    const argon2 = await import('argon2')
    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id })

    // Build settings object
    const settings: Record<string, any> = {}

    // Access level: full (all modules), custom (selected modules), readonly
    if (body.accessLevel === 'full') {
      settings.moduleAccess = ALL_MODULES
      settings.accessLevel = 'full'
    } else if (body.accessLevel === 'custom' && body.moduleAccess) {
      settings.moduleAccess = body.moduleAccess
      settings.accessLevel = 'custom'
    } else if (body.accessLevel === 'readonly') {
      settings.moduleAccess = ['imoveis'] // minimal access
      settings.accessLevel = 'readonly'
    } else if (body.moduleAccess) {
      settings.moduleAccess = body.moduleAccess
    } else if (body.role === 'LAWYER') {
      settings.moduleAccess = ['juridico']
    }

    if (body.oabNumber) settings.oabNumber = body.oabNumber
    if (body.notifyWhatsapp !== undefined) settings.notifyWhatsapp = body.notifyWhatsapp
    if (body.notifyEmail !== undefined) settings.notifyEmail = body.notifyEmail
    if (body.notifySms !== undefined) settings.notifySms = body.notifySms

    // Determine companyId: isolated company or same company
    let targetCompanyId = req.user.cid

    if (body.createIsolatedCompany) {
      // Create a fresh, isolated company with zero data
      const newCompany = await app.prisma.company.create({
        data: {
          name: body.isolatedCompanyName || `${body.name} — Empresa`,
          tradeName: body.isolatedCompanyName || body.name,
          isActive: true,
          plan: 'starter',
          settings: {},
        },
      })
      targetCompanyId = newCompany.id
      settings.isolatedCompany = true
      settings.parentCompanyId = req.user.cid // track who created it
    }

    const user = await app.prisma.user.create({
      data: {
        companyId: targetCompanyId,
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone,
        passwordHash,
        role: body.role as any,
        creciNumber: body.creciNumber,
        status: 'ACTIVE',
        settings: Object.keys(settings).length > 0 ? settings : undefined,
      },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, creciNumber: true, settings: true, createdAt: true,
      },
    })

    await createAuditLog({
      prisma: app.prisma, req,
      action: 'user.register',
      resource: 'user', resourceId: user.id,
      after: { name: user.name, email: user.email, role: user.role } as any,
    })
    return reply.status(201).send(user)
  })

  // GET /api/v1/users/company — get own company info
  app.get('/company', {
    preHandler: [app.authenticate],
    schema: { tags: ['users'], summary: 'Get company info' },
  }, async (req, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.user.sub },
      include: { company: true },
    })
    if (!user?.company) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(user.company)
  })

  // PATCH /api/v1/users/company — update own company info (admin only)
  app.patch('/company', {
    preHandler: [app.authenticate],
    schema: { tags: ['users'], summary: 'Update company info' },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
    const { z } = await import('zod')
    const body = z.object({
      name:            z.string().min(2).max(100).optional(),
      tradeName:       z.string().optional(),
      cnpj:            z.string().optional(),
      creci:           z.string().optional(),
      phone:           z.string().optional(),
      email:           z.string().email().optional(),
      website:         z.string().optional(),
      logoUrl:         z.string().optional().or(z.literal('')), // accepts URLs, data URLs, relative paths
      address:         z.string().optional(),
      city:            z.string().optional(),
      state:           z.string().max(2).optional(),
      zipCode:         z.string().optional(),
    }).parse(req.body)

    const updated = await app.prisma.company.update({
      where: { id: req.user.cid },
      data: body,
    })
    return reply.send(updated)
  })

  // PATCH /api/v1/users/site-settings — update public site + integration configuration
  app.patch('/site-settings', {
    preHandler: [app.authenticate],
    schema: { tags: ['users'] },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const body = req.body as {
      heroVideoUrl?: string
      heroVideoType?: string
      logoUrl?: string
      heroImageUrl?: string
      instagramTokenTomas?: string
      instagramTokenLemos?: string
      instagramBusinessAccountId?: string
      instagramPageAccessToken?: string
      youtubeApiKey?: string
      asaasApiKey?: string
    }

    const company = await app.prisma.company.findUnique({ where: { id: req.user.cid } })
    if (!company) return reply.status(404).send({ error: 'NOT_FOUND' })

    const currentSettings = (company.settings as any) ?? {}

    // Merge all provided fields (undefined = skip, empty string = clear the value)
    const ALLOWED_FIELDS = [
      'heroVideoUrl', 'heroVideoType',
      'logoUrl', 'heroImageUrl',
      'instagramTokenTomas', 'instagramTokenLemos',
      'instagramBusinessAccountId', 'instagramPageAccessToken',
      'youtubeApiKey', 'asaasApiKey',
    ] as const

    const updates: Record<string, string> = {}
    for (const field of ALLOWED_FIELDS) {
      if ((body as any)[field] !== undefined) {
        updates[field] = (body as any)[field]
      }
    }

    const newSettings = { ...currentSettings, ...updates }

    await app.prisma.company.update({ where: { id: req.user.cid }, data: { settings: newSettings } })
    return reply.send({ success: true, settings: newSettings })
  })

  // GET /api/v1/users/:id  (also handles /company as fallback for old builds)
  app.get('/:id', {
    schema: { tags: ['users'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    // Fallback: if id is "company", return the company info
    if (id === 'company') {
      const company = await app.prisma.company.findUnique({ where: { id: req.user.cid } })
      if (!company) return reply.status(404).send({ error: 'NOT_FOUND' })
      return reply.send(company)
    }

    // Users can only see themselves unless admin/manager
    if (id !== req.user.sub && !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const user = await app.prisma.user.findFirst({
      where: { id, companyId: req.user.cid },
      select: {
        id: true, name: true, email: true, phone: true,
        avatarUrl: true, role: true, status: true,
        creciNumber: true, bio: true, lastLoginAt: true, createdAt: true,
        _count: { select: { leads: true, deals: true, properties: true } },
      },
    })

    if (!user) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(user)
  })

  // PATCH /api/v1/users/:id  (also handles /company as fallback for old builds)
  app.patch('/:id', {
    schema: { tags: ['users'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    // Fallback: if id is "company", update company info
    if (id === 'company') {
      if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
        return reply.status(403).send({ error: 'FORBIDDEN' })
      }
      const { z } = await import('zod')
      const companyBody = z.object({
        name: z.string().min(2).max(100).optional(),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        creci: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().optional(),
        logoUrl: z.string().optional().or(z.literal('')), // accepts URLs, data URLs, relative paths
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().max(2).optional(),
        zipCode: z.string().optional(),
      }).parse(req.body)
      const updated = await app.prisma.company.update({ where: { id: req.user.cid }, data: companyBody })
      return reply.send(updated)
    }

    if (id !== req.user.sub && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const body = UpdateUserBody.parse(req.body)

    // Only ADMIN/SUPER_ADMIN can change roles, and cannot change own role
    if (body.role) {
      if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
        return reply.status(403).send({ error: 'FORBIDDEN', message: 'Apenas administradores podem alterar perfis de usuário' })
      }
      if (id === req.user.sub) {
        return reply.status(400).send({ error: 'VALIDATION_ERROR', message: 'Você não pode alterar seu próprio perfil de acesso' })
      }
    }

    const existingUser = await app.prisma.user.findUnique({ where: { id }, select: { id: true, name: true, role: true, phone: true, bio: true, creciNumber: true, settings: true } })

    // Extract permission fields that go into settings JSON
    const { accessLevel, moduleAccess, hasDataAccess, ...directFields } = body
    const updateData: any = { ...directFields }

    // Update settings if permission fields are provided
    if (accessLevel !== undefined || moduleAccess !== undefined || hasDataAccess !== undefined) {
      const currentSettings = (existingUser?.settings as Record<string, any>) ?? {}
      const newSettings = { ...currentSettings }
      if (accessLevel) {
        newSettings.accessLevel = accessLevel
        if (accessLevel === 'full') newSettings.moduleAccess = ALL_MODULES
        else if (accessLevel === 'readonly') newSettings.moduleAccess = ['imoveis']
      }
      if (moduleAccess) newSettings.moduleAccess = moduleAccess
      if (hasDataAccess !== undefined) newSettings.isolatedCompany = !hasDataAccess
      updateData.settings = newSettings
    }

    const user = await app.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, phone: true,
        avatarUrl: true, role: true, bio: true, creciNumber: true, settings: true,
      },
    })

    await createAuditLog({
      prisma: app.prisma, req,
      action: 'user.update',
      resource: 'user', resourceId: id,
      before: existingUser as any,
      after: user as any,
    })

    return reply.send(user)
  })

  // POST /api/v1/users/:id/reset-password — admin force-reset a user's password
  app.post('/:id/reset-password', {
    schema: { tags: ['users'], summary: 'Admin reset user password' },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const { id } = req.params as { id: string }
    const { newPassword } = req.body as { newPassword?: string }

    if (!newPassword || newPassword.length < 8) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', message: 'Nova senha deve ter pelo menos 8 caracteres' })
    }

    // Verify user belongs to same company
    const targetUser = await app.prisma.user.findFirst({
      where: { id, companyId: req.user.cid },
      select: { id: true, name: true, email: true, role: true },
    })
    if (!targetUser) return reply.status(404).send({ error: 'NOT_FOUND' })

    // Prevent non-SUPER_ADMIN from resetting SUPER_ADMIN passwords
    if (targetUser.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'Apenas Super Admin pode redefinir senha de outro Super Admin' })
    }

    const argon2 = await import('argon2')
    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id })

    await app.prisma.user.update({
      where: { id },
      data: { passwordHash },
    })

    await createAuditLog({
      prisma: app.prisma, req,
      action: 'user.password_reset',
      resource: 'user', resourceId: id,
      after: { resetBy: req.user.sub, targetEmail: targetUser.email } as any,
    })

    return reply.send({ success: true, message: 'Senha redefinida com sucesso' })
  })

  // DELETE /api/v1/users/:id — soft delete (set inactive)
  app.delete('/:id', {
    schema: { tags: ['users'] },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const { id } = req.params as { id: string }
    if (id === req.user.sub) {
      return reply.status(400).send({ error: 'CANNOT_DELETE_SELF' })
    }

    await app.prisma.user.update({
      where: { id, companyId: req.user.cid },
      data: { status: 'INACTIVE' },
    })

    await createAuditLog({
      prisma: app.prisma, req,
      action: 'user.delete',
      resource: 'user', resourceId: id,
    })

    return reply.send({ success: true })
  })

  // GET /api/v1/users/modules — list all available modules for permission UI
  app.get('/modules', {
    schema: { tags: ['users'], summary: 'List available system modules' },
  }, async (_req, reply) => {
    const modules = ALL_MODULES.map(m => ({
      id: m,
      label: {
        'imoveis': 'Imóveis', 'leads': 'Leads', 'contatos': 'Contatos',
        'negocios': 'Negócios', 'financeiro': 'Financeiro', 'juridico': 'Jurídico',
        'chat': 'Chat / WhatsApp', 'leiloes': 'Leilões', 'blog': 'Blog',
        'seo': 'SEO Programático', 'automacoes': 'Automações', 'ia-visual': 'IA Visual',
        'documentos': 'Documentos IA', 'configuracoes': 'Configurações',
        'parceiros': 'Parceiros', 'portal': 'Portal Cliente',
        'financiamentos': 'Financiamentos', 'campanhas': 'Campanhas Marketing',
        'notas-fiscais': 'Notas Fiscais', 'renovacoes': 'Renovações',
        'foto-editor': 'Editor de Fotos',
      }[m] || m,
    }))
    return reply.send(modules)
  })

  // POST /api/v1/users/import-data — import properties/clients from backup file
  app.post('/import-data', {
    schema: { tags: ['users'], summary: 'Import data from external system backup' },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const file = await req.file()
    if (!file) return reply.status(400).send({ error: 'NO_FILE', message: 'Envie um arquivo CSV ou JSON' })

    const chunks: Buffer[] = []
    for await (const chunk of file.file) chunks.push(chunk)
    const content = Buffer.concat(chunks).toString('utf-8')

    const companyId = req.user.cid
    let imported = { properties: 0, clients: 0, errors: [] as string[] }

    try {
      let records: any[]

      // Parse JSON or CSV
      if (file.mimetype === 'application/json' || file.filename.endsWith('.json')) {
        const parsed = JSON.parse(content)
        records = Array.isArray(parsed) ? parsed : (parsed.data || parsed.properties || parsed.items || [parsed])
      } else {
        // CSV parsing
        const lines = content.split('\n').filter(l => l.trim())
        if (lines.length < 2) return reply.status(400).send({ error: 'CSV vazio ou inválido' })
        const headers = lines[0].split(/[;,]/).map(h => h.trim().replace(/"/g, '').toLowerCase())
        records = lines.slice(1).map(line => {
          const values = line.split(/[;,]/).map(v => v.trim().replace(/^"|"$/g, ''))
          const obj: Record<string, string> = {}
          headers.forEach((h, i) => { if (values[i]) obj[h] = values[i] })
          return obj
        })
      }

      // Import properties
      for (const record of records) {
        try {
          // Map common field names from different systems
          const title = record.title || record.titulo || record.nome || record.descricao || ''
          const type = (record.type || record.tipo || 'HOUSE').toUpperCase()
          const purpose = (record.purpose || record.finalidade || 'SALE').toUpperCase()
          const price = parseFloat(record.price || record.preco || record.valor || '0') || undefined
          const priceRent = parseFloat(record.priceRent || record.aluguel || record.valorAluguel || '0') || undefined
          const city = record.city || record.cidade || ''
          const neighborhood = record.neighborhood || record.bairro || ''
          const street = record.street || record.endereco || record.rua || ''
          const area = parseFloat(record.totalArea || record.area || record.areaTotal || '0') || undefined
          const bedrooms = parseInt(record.bedrooms || record.quartos || record.dormitorios || '0') || 0
          const bathrooms = parseInt(record.bathrooms || record.banheiros || '0') || 0
          const parkingSpaces = parseInt(record.parkingSpaces || record.vagas || record.garagem || '0') || 0
          const description = record.description || record.descricao || record.obs || ''
          const reference = record.reference || record.referencia || record.codigo || record.ref || ''

          if (!title && !reference && !street) {
            imported.errors.push(`Registro ignorado: sem título, referência ou endereço`)
            continue
          }

          // Generate slug
          const slugBase = (title || reference || `${type}-${city}`).toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          const slug = `${slugBase}-${Date.now().toString(36)}`

          await app.prisma.property.create({
            data: {
              companyId,
              title: title || `${type} em ${city || 'N/A'}`,
              slug,
              type: (['HOUSE','APARTMENT','LAND','FARM','WAREHOUSE','OFFICE','STORE','STUDIO','PENTHOUSE','CONDO','KITNET'].includes(type) ? type : 'HOUSE') as any,
              purpose: (['SALE','RENT','BOTH','SEASON'].includes(purpose) ? purpose : 'SALE') as any,
              category: 'RESIDENTIAL',
              status: 'ACTIVE',
              price, priceRent,
              city, neighborhood, street,
              state: record.state || record.estado || record.uf || 'SP',
              totalArea: area,
              bedrooms, bathrooms, parkingSpaces,
              description,
              reference,
              authorizedPublish: true,
              showExactLocation: true,
            },
          })
          imported.properties++
        } catch (err: any) {
          imported.errors.push(`Erro em registro: ${err.message?.slice(0, 100)}`)
        }
      }

      // Also check for client records
      const clientRecords = records.filter(r => r.cpf || r.documento || r.clientName || r.nomeCliente)
      for (const record of clientRecords) {
        try {
          const name = record.clientName || record.nomeCliente || record.nome || record.name || ''
          const document = record.cpf || record.documento || record.cnpj || ''
          const email = record.clientEmail || record.emailCliente || record.email || ''
          const phone = record.clientPhone || record.telefoneCliente || record.telefone || record.phone || ''

          if (!name) continue

          await app.prisma.client.create({
            data: {
              companyId,
              name,
              document: document.replace(/\D/g, ''),
              email: email || undefined,
              phone: phone || undefined,
              roles: ['TENANT'],
            },
          })
          imported.clients++
        } catch {
          // Skip duplicate clients
        }
      }

      return reply.send({
        success: true,
        message: `Importação concluída: ${imported.properties} imóveis, ${imported.clients} clientes`,
        imported,
      })
    } catch (err: any) {
      return reply.status(400).send({
        error: 'IMPORT_ERROR',
        message: `Erro ao processar arquivo: ${err.message}`,
      })
    }
  })

}
