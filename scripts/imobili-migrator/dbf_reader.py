#!/usr/bin/env python3
"""
Leitor DBF (dBASE III/IV / Visual FoxPro) — usado pelo migrador da carteira
legada (Uniloc) para a plataforma AgoraEncontrei.

Lê o cabeçalho (campos: nome, tipo, tamanho) e os registros, decodificando
tipos C/N/F/D/L/M (memo via .fpt). Exporta JSON pronto para importação.

Uso:
    python3 dbf_reader.py TABELA.dbf                 # esquema + nº de registros
    python3 dbf_reader.py TABELA.dbf --json out.json # exporta registros
    python3 dbf_reader.py TABELA.dbf --limit 5 --print
"""
import sys
import os
import json
import struct
import argparse
from datetime import date


def _decode(b):
    # Os DBFs do Uniloc são Windows-1252 (cp1252). latin-1 cobre os acentos
    # PT-BR (0xC0–0xFF) de forma idêntica e nunca falha.
    for enc in ("cp1252", "latin-1"):
        try:
            return b.decode(enc).strip()
        except Exception:
            continue
    return b.decode("latin-1", "replace").strip()


class DBF:
    def __init__(self, path, encoding=None):
        self.path = path
        self.fh = open(path, "rb")
        self._parse_header()
        # memo (.fpt para VFP, .dbt para dBASE)
        self.memo = None
        self.memo_block = 64
        for ext in (".fpt", ".FPT", ".dbt", ".DBT"):
            mp = os.path.splitext(path)[0] + ext
            if os.path.exists(mp):
                self.memo = open(mp, "rb")
                self.memo.seek(6)
                bs = struct.unpack(">H", self.memo.read(2))[0]
                self.memo_block = bs or 64
                break

    def _parse_header(self):
        h = self.fh.read(32)
        self.version = h[0]
        self.num_records = struct.unpack_from("<I", h, 4)[0]
        self.header_size = struct.unpack_from("<H", h, 8)[0]
        self.record_size = struct.unpack_from("<H", h, 10)[0]
        self.fields = []
        pos = 32
        while True:
            fd = self.fh.read(32)
            if not fd or fd[0] == 0x0D:
                break
            name = fd[:11].split(b"\x00")[0].decode("latin-1").strip()
            ftype = chr(fd[11])
            flen = fd[16]
            fdec = fd[17]
            self.fields.append({"name": name, "type": ftype, "len": flen, "dec": fdec})
            pos += 32
            if pos >= self.header_size - 1:
                break

    def _read_memo(self, ref):
        ref = ref.strip()
        if not self.memo or not ref or not ref.isdigit():
            return ""
        block = int(ref)
        self.memo.seek(block * self.memo_block)
        head = self.memo.read(8)
        if len(head) < 8:
            return ""
        length = struct.unpack(">I", head[4:8])[0]
        return _decode(self.memo.read(length))

    def records(self, limit=None):
        self.fh.seek(self.header_size)
        count = 0
        for _ in range(self.num_records):
            raw = self.fh.read(self.record_size)
            if len(raw) < self.record_size:
                break
            deleted = raw[:1] == b"*"
            if deleted:
                continue
            row = {}
            off = 1
            for f in self.fields:
                chunk = raw[off:off + f["len"]]
                off += f["len"]
                row[f["name"]] = self._convert(chunk, f)
            yield row
            count += 1
            if limit and count >= limit:
                break

    def _convert(self, chunk, f):
        t = f["type"]
        if t in ("C",):
            return _decode(chunk)
        if t in ("M",):
            return self._read_memo(_decode(chunk))
        if t in ("N", "F"):
            s = chunk.decode("latin-1").strip()
            if not s or s in ("-", "."):
                return None
            try:
                return int(s) if f["dec"] == 0 and "." not in s else float(s)
            except ValueError:
                return None
        if t == "D":
            s = chunk.decode("latin-1").strip()
            if len(s) == 8 and s.isdigit():
                try:
                    return date(int(s[:4]), int(s[4:6]), int(s[6:8])).isoformat()
                except ValueError:
                    return None
            return None
        if t == "L":
            return chunk.decode("latin-1").strip().upper() in ("T", "Y", "S", "1")
        if t in ("B", "Y"):  # double / currency (VFP)
            try:
                return struct.unpack("<d", chunk[:8])[0]
            except Exception:
                return None
        return _decode(chunk)

    def schema(self):
        return {
            "table": os.path.basename(self.path),
            "version": self.version,
            "num_records": self.num_records,
            "fields": self.fields,
        }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("--json")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--print", action="store_true", dest="do_print")
    args = ap.parse_args()

    dbf = DBF(args.path)
    sc = dbf.schema()
    print(f"Tabela:    {sc['table']}")
    print(f"Registros: {sc['num_records']}")
    print(f"Campos:    {len(sc['fields'])}")
    print("-" * 50)
    for f in sc["fields"]:
        print(f"  {f['name']:<14} {f['type']}  ({f['len']}.{f['dec']})")

    if args.json or args.do_print:
        rows = list(dbf.records(limit=args.limit))
        if args.json:
            with open(args.json, "w", encoding="utf-8") as fh:
                json.dump(rows, fh, ensure_ascii=False, indent=2, default=str)
            print(f"\n{len(rows)} registros exportados → {args.json}")
        if args.do_print:
            print("\n=== amostra ===")
            for r in rows[: (args.limit or 3)]:
                print(json.dumps({k: v for k, v in r.items() if v not in (None, "", 0)},
                                 ensure_ascii=False, default=str)[:400])


if __name__ == "__main__":
    main()
