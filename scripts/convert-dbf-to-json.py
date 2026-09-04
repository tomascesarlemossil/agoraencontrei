#!/usr/bin/env python3
"""
Converte um backup Uniloc (DBF/FoxPro) em JSON para a migração da carteira.

É o primeiro elo da cadeia de migração:

    backup DBF  →  [este script]  →  data/uniloc/json/*.json  →  migrate-uniloc-dbf.ts  →  banco

Além de converter, emite um `_manifest.json` com a **data de corte** de cada
tabela (a última escrita registrada). Isso responde, em um comando, à pergunta
que importa quando chega um backup novo: *até quando este backup vai?*

Uso:
    python3 scripts/convert-dbf-to-json.py                      # usa data/uniloc/backup_extraido
    python3 scripts/convert-dbf-to-json.py --src /caminho/bkp   # outro backup
    python3 scripts/convert-dbf-to-json.py --only contrato,aluguel,lanrepas
    python3 scripts/convert-dbf-to-json.py --audit              # só audita, não escreve JSON

⚠️  Os JSON gerados contêm DADOS PESSOAIS (CPF, nomes, contas bancárias) e por
isso `data/uniloc/json/` está no .gitignore. O `_manifest.json` é agregado
(contagens e datas) e não carrega PII.
"""
import os
import re
import sys
import json
import argparse
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "imobili-migrator"))
from dbf_reader import DBF  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SRC = os.path.join(ROOT, "data", "uniloc", "backup_extraido")
DEFAULT_OUT = os.path.join(ROOT, "data", "uniloc", "json")

# Tabelas de trabalho do FoxPro — não fazem parte da carteira.
SKIP = {"foxuser.dbf", "codcp.dbf"}

# Campos de data/hora textual usados pelo Uniloc para carimbar criação/alteração.
STAMP_FIELDS = ("DATACAD", "DATAATUA", "C_DATACAD", "C_DATAATUA",
                "I_DATACAD", "I_DATAATUA", "L_DATACAD", "DATAEST")


def parse_stamp(v):
    """Os carimbos vêm como texto: '12/04/2022 14:33' ou ISO. Devolve 'YYYY-MM-DD'."""
    if not v:
        return None
    s = str(v).strip()
    m = re.match(r"(\d{2})/(\d{2})/(\d{4})", s)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", s)
    return s[:10] if m else None


def table_report(path, rows, fields):
    """Agregados por tabela — contagens e janelas de data. Sem PII."""
    rep = {"records": len(rows)}

    # Data de corte: o maior carimbo de criação/alteração encontrado.
    stamps = []
    for f in STAMP_FIELDS:
        if any(f == fl["name"] for fl in fields):
            stamps += [s for s in (parse_stamp(r.get(f)) for r in rows) if s]
    if stamps:
        rep["lastWrite"] = max(stamps)
        rep["firstWrite"] = min(stamps)

    # Janelas dos campos de data nativos (vencimentos, pagamentos, etc.).
    windows = {}
    for fl in fields:
        if fl["type"] != "D":
            continue
        vals = [r.get(fl["name"]) for r in rows]
        vals = [v for v in vals if v]
        if vals:
            windows[fl["name"]] = [min(vals), max(vals)]
    if windows:
        rep["dateRanges"] = windows
    return rep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=DEFAULT_SRC, help="pasta com os .dbf do backup")
    ap.add_argument("--out", default=DEFAULT_OUT, help="pasta de saída dos .json")
    ap.add_argument("--only", help="lista de tabelas separadas por vírgula (sem extensão)")
    ap.add_argument("--audit", action="store_true", help="apenas audita; não grava JSON")
    args = ap.parse_args()

    if not os.path.isdir(args.src):
        print(f"ERRO: pasta não encontrada: {args.src}")
        sys.exit(1)

    only = {t.strip().lower() for t in args.only.split(",")} if args.only else None
    tables = sorted(f for f in os.listdir(args.src)
                    if f.lower().endswith(".dbf") and f.lower() not in SKIP)
    if only:
        tables = [t for t in tables if os.path.splitext(t)[0].lower() in only]
    if not tables:
        print(f"ERRO: nenhuma tabela .dbf encontrada em {args.src}")
        sys.exit(1)

    if not args.audit:
        os.makedirs(args.out, exist_ok=True)

    manifest = {
        "source": os.path.abspath(args.src),
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "tables": {},
    }
    total = 0
    failures = []

    print("=" * 68)
    print(f"  CONVERSÃO DBF → JSON   ({'AUDITORIA' if args.audit else 'ESCRITA'})")
    print(f"  Origem: {args.src}")
    print("=" * 68)

    for t in tables:
        name = os.path.splitext(t)[0].lower()
        try:
            dbf = DBF(os.path.join(args.src, t))
            rows = list(dbf.records())
            rep = table_report(t, rows, dbf.fields)
            manifest["tables"][name] = rep
            total += len(rows)

            if not args.audit:
                with open(os.path.join(args.out, f"{name}.json"), "w", encoding="utf-8") as fh:
                    json.dump(rows, fh, ensure_ascii=False, default=str)

            corte = rep.get("lastWrite", "—")
            print(f"  {name:<14} {len(rows):>7} regs   última escrita: {corte}")
        except Exception as e:  # backup corrompido não pode derrubar a conversão inteira
            failures.append((name, str(e)))
            print(f"  {name:<14} ERRO: {e}")

    # A data de corte do backup é a mais recente entre todas as tabelas.
    cortes = [r["lastWrite"] for r in manifest["tables"].values() if r.get("lastWrite")]
    if cortes:
        manifest["backupCutoff"] = max(cortes)
    manifest["totalRecords"] = total
    if failures:
        manifest["failures"] = {n: e for n, e in failures}

    if not args.audit:
        with open(os.path.join(args.out, "_manifest.json"), "w", encoding="utf-8") as fh:
            json.dump(manifest, fh, ensure_ascii=False, indent=2)

    print("-" * 68)
    print(f"  Tabelas: {len(tables)}   Registros: {total:,}".replace(",", "."))
    if cortes:
        corte = manifest["backupCutoff"]
        idade = (datetime.now() - datetime.strptime(corte, "%Y-%m-%d")).days
        print(f"  >>> DATA DE CORTE DO BACKUP: {corte}  ({idade} dias atrás)")
        if idade > 60:
            print(f"  >>> ATENÇÃO: backup com {idade // 30} meses. NÃO use para emitir")
            print( "      cobrança ou repasse sem conferir a carteira vigente.")
    if failures:
        print(f"  >>> {len(failures)} tabela(s) com erro de leitura: {[n for n, _ in failures]}")
    if not args.audit:
        print(f"  JSON em: {args.out}  (contém PII — fora do Git)")
        print("  Próximo passo: cd apps/api && npx tsx scripts/migrate-uniloc-dbf.ts --dry-run")


if __name__ == "__main__":
    main()
