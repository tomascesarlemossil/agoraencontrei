import type { PrismaClient } from '@prisma/client'

// ── Constantes fiscais da Imobiliária Lemos ───────────────────────────────
const COMPANY_CCM = '52525'
const COMPANY_CNPJ = '10.962.301/0001-50'
const COMPANY_RAZAO = 'IMOBILIARIA LEMOS'
const SERVICE_DESCRIPTION = 'Prestação de serviços de administração e intermediação imobiliária'
// Código IBGE Franca/SP = 3516200
const MUNICIPIO_CODE = '3516200'
// Código LC 116/03 para administração de imóveis
const LISTA_SERVICO = '10.05'
const COD_TRIBUTACAO = '1005001'

export class FiscalService {
  constructor(private prisma: PrismaClient) {}

  // ── Calcula taxa de serviço ────────────────────────────────────────────
  async calcularTaxa(rentalValue: number, landlordId: string, rentalMonth: number, rentalYear: number) {
    const previous = await this.prisma.fiscalNote.count({
      where: {
        landlordId,
        OR: [
          { rentalYear: { lt: rentalYear } },
          { rentalYear, rentalMonth: { lt: rentalMonth } },
        ],
      },
    })

    const percentage = previous === 0 ? 100 : 10
    const value = parseFloat(((rentalValue * percentage) / 100).toFixed(2))
    return { percentage, value }
  }

  // ── Lista notas fiscais com filtros ────────────────────────────────────
  async listar(companyId: string, opts: {
    month?: number
    year?: number
    status?: string
    page?: number
    limit?: number
  }) {
    const { month, year, status, page = 1, limit = 50 } = opts
    const where: any = { companyId }
    if (month) where.rentalMonth = month
    if (year) where.rentalYear = year
    if (status) where.status = status

    const [data, total] = await Promise.all([
      this.prisma.fiscalNote.findMany({
        where,
        orderBy: [{ rentalYear: 'desc' }, { rentalMonth: 'desc' }],
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.fiscalNote.count({ where }),
    ])

    const agg = await this.prisma.fiscalNote.aggregate({
      where,
      _sum: { serviceFeeValue: true, rentalValue: true },
      _count: true,
    })

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: {
        totalNotes: agg._count,
        totalServiceFee: Number(agg._sum.serviceFeeValue ?? 0),
        totalRentalValue: Number(agg._sum.rentalValue ?? 0),
      },
    }
  }

  // ── Busca nota por ID ──────────────────────────────────────────────────
  async buscarPorId(id: string, companyId: string) {
    const note = await this.prisma.fiscalNote.findFirst({
      where: { id, companyId },
      include: { logs: { orderBy: { createdAt: 'desc' }, take: 10 } },
    })
    if (!note) throw Object.assign(new Error('Nota fiscal não encontrada'), { statusCode: 404 })
    return note
  }

  // ── Cria nota individual ───────────────────────────────────────────────
  async criar(companyId: string, data: {
    landlordId?: string
    landlordName: string
    landlordCpf: string
    landlordEmail?: string
    landlordPhone?: string
    landlordAddress?: string
    propertyId?: string
    propertyAddress?: string
    rentalId?: string
    rentalMonth: number
    rentalYear: number
    rentalValue: number
    createdById?: string
  }) {
    const { percentage, value: serviceFeeValue } = await this.calcularTaxa(
      data.rentalValue,
      data.landlordId ?? data.landlordCpf,
      data.rentalMonth,
      data.rentalYear,
    )

    const note = await this.prisma.fiscalNote.create({
      data: {
        companyId,
        landlordId: data.landlordId,
        landlordName: data.landlordName,
        landlordCpf: data.landlordCpf,
        landlordEmail: data.landlordEmail,
        landlordPhone: data.landlordPhone,
        landlordAddress: data.landlordAddress,
        propertyId: data.propertyId,
        propertyAddress: data.propertyAddress,
        rentalId: data.rentalId,
        rentalMonth: data.rentalMonth,
        rentalYear: data.rentalYear,
        rentalValue: data.rentalValue,
        serviceFeePercentage: percentage,
        serviceFeeValue,
        serviceDescription: SERVICE_DESCRIPTION,
        status: 'DRAFT',
        createdById: data.createdById,
        logs: {
          create: {
            action: 'CREATED',
            newStatus: 'DRAFT',
            details: { rentalMonth: data.rentalMonth, rentalYear: data.rentalYear, serviceFeeValue },
            createdById: data.createdById,
          },
        },
      },
    })

    return note
  }

  // ── Geração em lote mensal ─────────────────────────────────────────────
  async gerarMensal(companyId: string, month: number, year: number, createdById?: string) {
    // Usa contratos ativos como base (contêm proprietário + valor do aluguel)
    const contracts = await this.prisma.contract.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        isActive: true,
        rentValue: { not: null },
      },
      select: {
        id: true,
        rentValue: true,
        landlordName: true,
        propertyAddress: true,
        landlordId: true,
        landlord: {
          select: { id: true, name: true, document: true, email: true, phone: true, address: true },
        },
      },
      take: 500,
    })

    const results = { created: 0, skipped: 0, errors: 0, notes: [] as any[] }

    for (const contract of contracts) {
      try {
        if (!contract.rentValue) { results.skipped++; continue }
        const landlordName = contract.landlord?.name ?? contract.landlordName
        if (!landlordName) { results.skipped++; continue }

        const existing = await this.prisma.fiscalNote.findFirst({
          where: { rentalId: contract.id, rentalMonth: month, rentalYear: year },
        })
        if (existing) { results.skipped++; continue }

        const note = await this.criar(companyId, {
          landlordId: contract.landlord?.id,
          landlordName: landlordName!,
          landlordCpf: contract.landlord?.document ?? '000.000.000-00',
          landlordEmail: contract.landlord?.email ?? undefined,
          landlordPhone: contract.landlord?.phone ?? undefined,
          landlordAddress: contract.landlord?.address ?? undefined,
          propertyId: undefined,
          propertyAddress: contract.propertyAddress ?? undefined,
          rentalId: contract.id,
          rentalMonth: month,
          rentalYear: year,
          rentalValue: Number(contract.rentValue),
          createdById,
        })

        results.created++
        results.notes.push(note)
      } catch (err: any) {
        if (err.code === 'P2002') { results.skipped++ }
        else { results.errors++ }
      }
    }

    return results
  }

  // ── Atualiza status ────────────────────────────────────────────────────
  async atualizarStatus(id: string, companyId: string, newStatus: string, updatedById?: string) {
    const note = await this.buscarPorId(id, companyId)
    const oldStatus = note.status

    const updated = await this.prisma.fiscalNote.update({
      where: { id },
      data: {
        status: newStatus as any,
        logs: {
          create: {
            action: 'STATUS_CHANGED',
            oldStatus,
            newStatus,
            createdById: updatedById,
          },
        },
      },
    })

    return updated
  }

  // ── Deleta (só DRAFT) ──────────────────────────────────────────────────
  async deletar(id: string, companyId: string, deletedById?: string) {
    const note = await this.buscarPorId(id, companyId)
    if (note.status !== 'DRAFT') {
      throw Object.assign(new Error('Apenas notas em Rascunho podem ser excluídas'), { statusCode: 400 })
    }
    await this.prisma.fiscalNote.delete({ where: { id } })
    return true
  }

  // ── Gera XML NFS-e padrão ABRASF para Franca/SP ───────────────────────
  gerarXml(note: any): string {
    const issueDate = note.issueDate ? new Date(note.issueDate) : new Date()
    const formattedDate = issueDate.toISOString().split('.')[0]
    const serviceValue = Number(note.serviceFeeValue).toFixed(2)
    const cleanCpf = (note.landlordCpf ?? '').replace(/\D/g, '')
    const cleanCnpj = COMPANY_CNPJ.replace(/\D/g, '')
    const loteId = note.id.replace(/-/g, '').substring(0, 15)
    const invoiceNum = note.invoiceNumber ?? Math.floor(Math.random() * 100000).toString()

    return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
  <LoteRps id="LOTE${loteId}">
    <NumeroLote>${Math.floor(Math.random() * 1000000)}</NumeroLote>
    <Cnpj>${cleanCnpj}</Cnpj>
    <InscricaoMunicipal>${COMPANY_CCM}</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfRps id="RPS${loteId}">
          <IdentificacaoRps>
            <Numero>${invoiceNum}</Numero>
            <Serie>${note.invoiceSeries ?? 'UN'}</Serie>
            <Tipo>1</Tipo>
          </IdentificacaoRps>
          <DataEmissao>${formattedDate}</DataEmissao>
          <NaturezaOperacao>1</NaturezaOperacao>
          <OptanteSimplesNacional>1</OptanteSimplesNacional>
          <IncentivadorCultural>2</IncentivadorCultural>
          <Status>1</Status>
          <Servico>
            <Valores>
              <ValorServicos>${serviceValue}</ValorServicos>
              <ValorDeducoes>0.00</ValorDeducoes>
              <ValorPis>0.00</ValorPis>
              <ValorCofins>0.00</ValorCofins>
              <ValorInss>0.00</ValorInss>
              <ValorIr>0.00</ValorIr>
              <ValorCsll>0.00</ValorCsll>
              <IssRetido>2</IssRetido>
              <ValorIss>0.00</ValorIss>
              <ValorIssRetido>0.00</ValorIssRetido>
              <OutrasRetencoes>0.00</OutrasRetencoes>
              <BaseCalculo>${serviceValue}</BaseCalculo>
              <Aliquota>0.00</Aliquota>
              <ValorLiquidoNfse>${serviceValue}</ValorLiquidoNfse>
              <DescontoIncondicionado>0.00</DescontoIncondicionado>
              <DescontoCondicionado>0.00</DescontoCondicionado>
            </Valores>
            <ItemListaServico>${LISTA_SERVICO}</ItemListaServico>
            <CodigoTributacaoMunicipio>${COD_TRIBUTACAO}</CodigoTributacaoMunicipio>
            <Discriminacao>${note.serviceDescription}. Ref. Mês: ${note.rentalMonth}/${note.rentalYear}. Imóvel: ${note.propertyAddress ?? 'Não informado'}</Discriminacao>
            <CodigoMunicipio>${MUNICIPIO_CODE}</CodigoMunicipio>
          </Servico>
          <Prestador>
            <Cnpj>${cleanCnpj}</Cnpj>
            <InscricaoMunicipal>${COMPANY_CCM}</InscricaoMunicipal>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj>
                <Cpf>${cleanCpf}</Cpf>
              </CpfCnpj>
            </IdentificacaoTomador>
            <RazaoSocial>${note.landlordName}</RazaoSocial>
            ${note.landlordAddress ? `<Endereco><Endereco>${note.landlordAddress}</Endereco></Endereco>` : ''}
            <Contato>
              ${note.landlordPhone ? `<Telefone>${note.landlordPhone.replace(/\D/g, '')}</Telefone>` : ''}
              ${note.landlordEmail ? `<Email>${note.landlordEmail}</Email>` : ''}
            </Contato>
          </Tomador>
        </InfRps>
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`
  }
}
