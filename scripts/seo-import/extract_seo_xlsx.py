#!/usr/bin/env python3
"""
Extrai os bancos de conteúdo SEO (.xlsx) para um dataset NDJSON gzipado,
pronto para ingestão no banco (Prisma) via import-seo-programmatic.ts.

Faz: leitura das 4 planilhas -> dedup (tema|bairro|titulo) -> slug estável e
único -> mapeamento tema->categoria -> saída gzip NDJSON.

Uso:
    python3 scripts/seo-import/extract_seo_xlsx.py \
        --src <dir-com-os-xlsx> \
        --out packages/database/data/seo-posts/franca-seo-posts.ndjson.gz

Requer: openpyxl  (pip install openpyxl)

Observação: os .xlsx de origem NÃO são versionados no repo (são grandes e
efêmeros). O artefato versionado é o .ndjson.gz gerado por este script.
"""
import argparse
import glob
import gzip
import hashlib
import json
import os
import re
import unicodedata

import openpyxl

# Colunas (após o cabeçalho na linha 4, index 3):
# 0 ID | 1 Tema | 2 Bairro | 3 Título H1 | 4 Keywords | 5 Meta Desc | 6 Conteúdo
DATA_START_ROW = 4

# Mapa tema -> slug de categoria do blog (as 2 últimas são criadas pelo importer).
TEMA_TO_CATEGORIA = {
    "Planejamento Urbano": "seo-local",
    "Mercado Imobiliário": "seo-local",
    "Infraestrutura de Bairros": "seo-local",
    "Leilões de Imóveis": "leilao-de-imoveis",
    "Financiamento Habitacional": "financiamento-imobiliario",
    "Primeiro Imóvel": "compra-de-imoveis",
    "Condomínios Fechados": "compra-de-imoveis",
    "Locação Residencial": "aluguel-de-imoveis",
    "Locação Comercial": "aluguel-de-imoveis",
    "Investimento de Alto Padrão": "investimento-imobiliario",
    "Avaliação Patrimonial": "investimento-imobiliario",
    "Desenvolvimento de Lotes": "investimento-imobiliario",
    "Corretagem de Elite": "venda-de-imoveis",
    "Tendências de Reformas": "reformas-e-arquitetura",
    "Arquitetura e Sustentabilidade": "reformas-e-arquitetura",
    "Retrofit Predial": "reformas-e-arquitetura",
    "Regularização de Imóveis": "regularizacao-e-documentacao",
    "Tributação Imobiliária (ITBI/IPTU)": "regularizacao-e-documentacao",
    "Segurança Jurídica Contratual": "regularizacao-e-documentacao",
    "Vistorias de Imóveis": "regularizacao-e-documentacao",
}
DEFAULT_CATEGORIA = "seo-local"


def slugify(text, maxlen=90):
    text = unicodedata.normalize("NFD", str(text)).encode("ascii", "ignore").decode()
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text[:maxlen].strip("-")


def short_hash(*parts):
    h = hashlib.sha1("|".join(str(p) for p in parts).encode("utf-8")).hexdigest()
    return h[:6]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="Diretório com os .xlsx de origem")
    ap.add_argument("--out", required=True, help="Caminho do .ndjson.gz de saída")
    ap.add_argument("--cidade", default="Franca")
    ap.add_argument("--uf", default="SP")
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(args.src, "*.xlsx")))
    if not files:
        raise SystemExit(f"Nenhum .xlsx em {args.src}")

    seen_key = set()
    used_slugs = set()
    stats = {"read": 0, "dup": 0, "written": 0, "slug_disambig": 0}

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with gzip.open(args.out, "wt", encoding="utf-8") as out:
        for f in files:
            wb = openpyxl.load_workbook(f, read_only=True)
            ws = wb.active
            for i, row in enumerate(ws.iter_rows(values_only=True)):
                if i < DATA_START_ROW or not row or row[0] is None:
                    continue
                ext_id, tema, bairro, titulo, kw, meta, cont = [
                    (str(c).strip() if c is not None else "") for c in row[:7]
                ]
                if not titulo or not cont:
                    continue
                stats["read"] += 1

                key = (tema.lower(), bairro.lower(), titulo.lower())
                if key in seen_key:
                    stats["dup"] += 1
                    continue
                seen_key.add(key)

                # slug estável e único
                base = slugify(titulo)
                slug = base
                if slug in used_slugs:
                    slug = slugify(f"{titulo}-{bairro}")
                if slug in used_slugs:
                    slug = f"{base}-{short_hash(ext_id, tema, bairro)}"
                    stats["slug_disambig"] += 1
                while slug in used_slugs:  # garantia final
                    slug = f"{base}-{short_hash(slug, ext_id)}"
                used_slugs.add(slug)

                categoria = TEMA_TO_CATEGORIA.get(tema, DEFAULT_CATEGORIA)
                rec = {
                    "extId": ext_id,
                    "slug": slug,
                    "tema": tema,
                    "categoria": categoria,
                    "cidade": args.cidade,
                    "uf": args.uf,
                    "bairro": bairro,
                    "titulo": titulo,
                    "keywords": kw,
                    "metaDesc": meta,
                    "conteudo": cont,
                }
                out.write(json.dumps(rec, ensure_ascii=False) + "\n")
                stats["written"] += 1
            wb.close()

    size = os.path.getsize(args.out)
    print(f"Arquivos lidos:   {len(files)}")
    print(f"Linhas lidas:     {stats['read']}")
    print(f"Duplicadas:       {stats['dup']}")
    print(f"Slugs c/ hash:    {stats['slug_disambig']}")
    print(f"Registros gravados: {stats['written']}")
    print(f"Saída: {args.out}  ({size/1e6:.1f} MB gzip)")


if __name__ == "__main__":
    main()
