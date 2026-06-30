#!/usr/bin/env python3
"""
Importador Uniloc (DBF) → payloads Prisma da plataforma AgoraEncontrei.

Lê imovel/locador/inquili/fiador/contrato, mapeia para os modelos
Client / Property / Contract, resolve os vínculos por código legado e
emite:
  - import_payload.json  (DADOS PESSOAIS — gitignored)
  - relatório de validação no stdout (agregado, sem PII)

Idempotência: cada registro carrega `legacyId` + `importSource: 'uniloc'`,
de modo que a importação na plataforma não duplica (upsert por legacyId).

Uso:
  python3 build_import.py /caminho/backup_extraido [--out import_payload.json]
"""
import os
import sys
import json
import argparse
from dbf_reader import DBF

TIPO_IMOVEL = {1: "Residencial", 2: "Comercial", 3: "Industrial", 4: "Terreno"}


def s(v):
    return None if v is None else (str(v).strip() or None)


def doc(cic, cgc):
    """CPF (CIC) tem prioridade; senão CNPJ (CGC)."""
    return s(cic) or s(cgc)


def load(dirpath, name):
    path = os.path.join(dirpath, name)
    if not os.path.exists(path):
        path = os.path.join(dirpath, name.upper())
    return list(DBF(path).records())


def map_pessoa(r, role, codefield):
    return {
        "legacyId": s(r.get(codefield)),
        "importSource": "uniloc",
        "name": s(r.get("NOME")),
        "document": doc(r.get("CIC"), r.get("CGC")),
        "rg": s(r.get("RG")),
        "birthDate": s(r.get("NASCIMENTO")),
        "profession": s(r.get("PROFISSAO")),
        "maritalStatus": s(r.get("CIVIL")),
        "nationality": s(r.get("NACIONAL")),
        "email": s(r.get("EMAIL")),
        "phone": s(r.get("TEL_RES")),
        "phoneMobile": s(r.get("CELULAR")),
        "phoneWork": s(r.get("TEL_COM")),
        "address": s(r.get("ENDERECO")),
        "addressComplement": s(r.get("COMPLEME")),
        "neighborhood": s(r.get("BAIRRO")),
        "city": s(r.get("CIDADE")),
        "state": s(r.get("UF")),
        "zipCode": s(r.get("CEP")),
        "spouseName": s(r.get("CONJUGE")),
        "spouseDocument": s(r.get("CIC_CONJ")),
        "bankName": s(r.get("NBANCO")),
        "bankBranch": s(r.get("AGENCIA")),
        "bankAccount": s(r.get("CONTA")),
        "roles": [role],
    }


def map_imovel(r):
    return {
        "legacyId": s(r.get("I_CODIMO")),
        "importSource": "uniloc",
        "ownerLegacyId": s(r.get("I_CODLOC")),
        "address": s(r.get("I_ENDERECO")),
        "addressComplement": s(r.get("I_COMPLEME")),
        "neighborhood": s(r.get("I_BAIRRO")),
        "city": s(r.get("I_CIDADE")),
        "state": s(r.get("I_UF")),
        "zipCode": s(r.get("I_CEP")),
        "iptuCode": s(r.get("I_NUM_IPTU")),
        "type": TIPO_IMOVEL.get(r.get("I_TIPO"), "Residencial"),
        "building": s(r.get("I_EDIFICIO")),
        "active": (s(r.get("I_ATIVO")) or "").upper() == "SIM",
    }


def map_contrato(r):
    return {
        "legacyId": s(r.get("C_CODCON")),
        "importSource": "uniloc",
        "landlordLegacyId": s(r.get("C_CODLOC")),
        "tenantLegacyId": s(r.get("C_CODINQ")),
        "guarantorLegacyId": s(r.get("C_CODFIA")),
        "propertyLegacyId": s(r.get("C_CODIMO")),
        "startDate": s(r.get("C_INICIO")),
        "duration": r.get("C_CONTRA"),
        "rentValue": r.get("C_VALOR"),
        "initialValue": r.get("C_VAL_INI"),
        "tenantDueDay": r.get("C_VENC_INQ"),
        "landlordDueDay": r.get("C_VENC_PRO"),
        "penalty": r.get("C_MULTA"),
        "commission": r.get("C_COMISSAO"),
        "adjustmentIndex": s(r.get("C_INDICE")) or s(r.get("C_REAJUSTE")),
        "rescissionDate": s(r.get("C_RESCISAO")),
        "guaranteeType": s(r.get("C_GARANTIA")),
        "isActive": (s(r.get("C_ATIVO")) or "").upper() in ("SIM", "S", "1", "ATIVO"),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir")
    ap.add_argument("--out", default="export/import_payload.json")
    args = ap.parse_args()

    locadores = [map_pessoa(r, "LANDLORD", "CODLOC") for r in load(args.dir, "locador.dbf")]
    inquilinos = [map_pessoa(r, "TENANT", "CODINQ") for r in load(args.dir, "inquili.dbf")]
    fiadores = [map_pessoa(r, "GUARANTOR", "CODFIA") for r in load(args.dir, "fiador.dbf")]
    imoveis = [map_imovel(r) for r in load(args.dir, "imovel.dbf")]
    contratos = [map_contrato(r) for r in load(args.dir, "contrato.dbf")]

    # Vínculo contrato↔fiador vem da junção contfia (1 contrato pode ter N fiadores)
    contfia = {}
    for r in load(args.dir, "contfia.dbf"):
        contfia.setdefault(s(r.get("CODCON")), []).append(s(r.get("CODFIA")))
    for c in contratos:
        c["guarantorLegacyIds"] = contfia.get(c["legacyId"], [])

    # índices de código → para validar vínculos
    loc_ids = {p["legacyId"] for p in locadores}
    inq_ids = {p["legacyId"] for p in inquilinos}
    fia_ids = {p["legacyId"] for p in fiadores}
    imo_ids = {p["legacyId"] for p in imoveis}

    # validação de integridade referencial
    imo_sem_dono = sum(1 for i in imoveis if i["ownerLegacyId"] not in loc_ids)
    c_ok = sum(1 for c in contratos
               if c["landlordLegacyId"] in loc_ids and c["tenantLegacyId"] in inq_ids
               and c["propertyLegacyId"] in imo_ids)
    c_sem_imovel = sum(1 for c in contratos if c["propertyLegacyId"] not in imo_ids)
    c_sem_inq = sum(1 for c in contratos if c["tenantLegacyId"] not in inq_ids)
    c_com_fiador = sum(1 for c in contratos if any(g in fia_ids for g in c.get("guarantorLegacyIds", [])))
    sem_doc = sum(1 for p in (locadores + inquilinos) if not p["document"])

    payload = {
        "source": "uniloc",
        "clients": locadores + inquilinos + fiadores,
        "properties": imoveis,
        "contracts": contratos,
    }
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2, default=str)

    print("=" * 56)
    print("  DRY-RUN — Importação Uniloc → AgoraEncontrei")
    print("=" * 56)
    print(f"Proprietários (LANDLORD): {len(locadores)}")
    print(f"Inquilinos    (TENANT):   {len(inquilinos)}")
    print(f"Fiadores      (GUARANTOR):{len(fiadores)}")
    print(f"  → Total de Clients:     {len(payload['clients'])}")
    print(f"Imóveis (Property):       {len(imoveis)}  (sem dono vinculável: {imo_sem_dono})")
    print(f"Contratos (Contract):     {len(contratos)}")
    print("-" * 56)
    print("VALIDAÇÃO DE VÍNCULOS:")
    print(f"  Contratos 100% resolvidos (locador+inquilino+imóvel): {c_ok}/{len(contratos)}")
    print(f"  Contratos sem imóvel vinculável:   {c_sem_imovel}")
    print(f"  Contratos sem inquilino vinculável:{c_sem_inq}")
    print(f"  Contratos com fiador:              {c_com_fiador}")
    print(f"  Pessoas sem CPF/CNPJ:              {sem_doc}")
    print("-" * 56)
    print(f"Payload salvo em: {args.out}  (contém PII — fora do Git)")
    print("Pronto para importar via API (idempotente por legacyId + importSource).")


if __name__ == "__main__":
    main()
