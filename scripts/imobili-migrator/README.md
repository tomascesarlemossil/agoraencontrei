# Migrador IMOBILI → AgoraEncontrei Software

Ferramentas para importar a base de dados do sistema legado **IMOBILI**
(Delphi/BDE/**Paradox**) para a plataforma AgoraEncontrei.

## Status: ✅ Leitura de Paradox validada

`paradox_reader.py` lê tabelas Paradox `.DB` **sem depender do BDE** (parser do binário).
Testado com sucesso contra um arquivo real do cliente (`Backup.Db`):

```
$ python3 paradox_reader.py /caminho/Tabela.DB
Tabela:   Controle
Registros:10902
Campos:   25  (versão 12 = Paradox 7)
--------------------------------------------------
  Num_Cupom         AutoInc    (4)
  Codigo            LongInt    (4)
  Codigo_Barra      Alpha      (13)
  Data              Date       (4)
  Valor_Venda       Currency   (8)
  ...
```

Lê: nome da tabela, nº de registros, e **todos os campos com nome + tipo + tamanho**.

## O que falta para a migração completa

1. **Receber a pasta de DADOS do IMOBILI** (as tabelas reais de negócio):
   `Propriet.DB`, `Imoveis.DB`, `Inquilin.DB`, `Fiadores.DB`, `Contrato.DB`,
   `Parcelas.DB` + índices `.PX/.X*/.Y*`. Ficam na máquina do cliente, perto do `IMOBILI.exe`.
2. **Leitura de registros** (não só do esquema): implementar o decode dos blocos de dados
   Paradox (já temos record_size, header_size e tipos — base pronta).
3. **Mapa de campos** Paradox → Prisma (rascunho abaixo).

## Mapa de campos previsto (a confirmar com as tabelas reais)

| Paradox | → Prisma | Observação |
|---|---|---|
| `Propriet.DB` | `Client` (role LANDLORD) | nome, CPF/CNPJ, banco, PIX → repasse |
| `Inquilin.DB` | `Client` (role TENANT) | dados cadastrais + renda |
| `Fiadores.DB` | `Client` (role GUARANTOR) | vínculo via `Contract.guarantorId` |
| `Imoveis.DB` | `Property` | endereço, IPTU, tipo, proprietário |
| `Contrato.DB` | `Contract` | início, prazo, valor, reajuste, comissão, multa |
| `Parcelas.DB` | `Rental` | vencimento, valor, pago, juros, multa, repasse |
| `Movim.DB` | `Transaction` | movimentação financeira |

> A plataforma já tem campos `legacyId` / `importSource` em todos esses modelos —
> projetada para receber exatamente este tipo de importação (idempotente, sem duplicar).

## Como usar (quando a pasta de dados chegar)

```bash
# 1. Inspecionar o esquema de cada tabela
python3 paradox_reader.py DADOS/Imoveis.DB --json imoveis_schema.json

# 2. (próximo passo) exportar registros para JSON e importar via API da plataforma
```
