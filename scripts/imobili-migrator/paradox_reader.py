#!/usr/bin/env python3
"""
Paradox (.DB) table reader — parser do formato de tabela do Borland Paradox / BDE.

Usado pelo migrador IMOBILI → AgoraEncontrei Software. Lê o cabeçalho de uma
tabela Paradox (nomes e tipos de campo) e os registros, exportando JSON/CSV
para importação na plataforma.

Formato de referência: Paradox 4/5/7 .DB. Não depende do BDE — lê o binário direto.
Uso:
    python3 paradox_reader.py CAMINHO/Tabela.DB            # imprime esquema + amostra
    python3 paradox_reader.py CAMINHO/Tabela.DB --json out.json
"""
import sys
import json
import struct
import argparse
from datetime import date, timedelta

# Tipos de campo Paradox (byte de tipo no descritor)
FIELD_TYPES = {
    0x01: "Alpha",      # string
    0x02: "Date",
    0x03: "ShortInt",   # int16
    0x04: "LongInt",    # int32
    0x05: "Currency",   # float64
    0x06: "Number",     # float64
    0x09: "Logical",    # bool
    0x0C: "Memo",
    0x0D: "BLOB",
    0x0E: "FmtMemo",
    0x0F: "OLE",
    0x10: "Graphic",
    0x14: "Time",
    0x15: "Timestamp",
    0x16: "AutoInc",    # int32
    0x17: "BCD",
    0x18: "Bytes",
}

PX_EPOCH = date(1, 1, 1).toordinal() - 1  # Paradox date = dias desde 0001-12-30 aprox.


class ParadoxReader:
    def __init__(self, path):
        with open(path, "rb") as f:
            self.data = f.read()
        self._parse_header()

    def _u16(self, off):
        return struct.unpack_from("<H", self.data, off)[0]

    def _u32(self, off):
        return struct.unpack_from("<I", self.data, off)[0]

    def _parse_header(self):
        d = self.data
        self.record_size = self._u16(0x00)
        self.header_size = self._u16(0x02)
        self.file_type = d[0x04]
        self.max_table_size = d[0x05]
        self.num_records = self._u32(0x06)
        self.num_fields = struct.unpack_from("<h", d, 0x21)[0]
        self.file_version = d[0x39] if len(d) > 0x39 else 0

        # Descritores de campo: cada um = (tipo:1 byte, tamanho:1 byte).
        # Começam em 0x78 nas versões 4.x e em offset maior nas 7.x.
        # Heurística: localizar o bloco de num_fields descritores válidos.
        fld_info_off = 0x78
        # versões 7+ deslocam; tenta detectar
        if self.file_version >= 0x0C:
            fld_info_off = 0x78
        self.fields = []
        off = fld_info_off
        types_sizes = []
        for _ in range(self.num_fields):
            ftype = d[off]
            fsize = d[off + 1]
            types_sizes.append((ftype, fsize))
            off += 2

        # Após os descritores há ponteiros (tableNamePtr + fieldNamePtrs) cujo
        # layout varia entre Paradox 4/5/7. Em vez de calcular o offset exato,
        # localizamos o BLOCO DE NOMES no final do cabeçalho: tableName seguido
        # de num_fields nomes, todos C-strings ASCII consecutivas.
        names = self._find_name_block(off, types_sizes)
        if names is None:
            # fallback: cálculo clássico v4
            off2 = off + 4 + 4 * self.num_fields
            tbl, off2 = self._read_cstr(off2)
            self.table_name = tbl
            names = []
            for _ in range(self.num_fields):
                nm, off2 = self._read_cstr(off2)
                names.append(nm)
        else:
            self.table_name, field_names = names
            names = field_names

        for i in range(self.num_fields):
            ftype, fsize = types_sizes[i]
            self.fields.append({
                "name": names[i] if i < len(names) else f"FIELD_{i+1}",
                "type": FIELD_TYPES.get(ftype, f"0x{ftype:02X}"),
                "type_code": ftype,
                "size": fsize,
            })

    def _find_name_block(self, start, types_sizes):
        """Procura, dentro do cabeçalho, o bloco final de C-strings ASCII:
        tableName + num_fields nomes de campo consecutivos."""
        import re
        end = min(self.header_size, len(self.data)) if self.header_size else len(self.data)
        # coleta todas as C-strings imprimíveis no cabeçalho a partir de `start`
        ident = re.compile(rb"^[A-Za-z_][A-Za-z0-9_ ./-]*$")
        strings = []  # (offset, texto)
        i = start
        while i < end:
            j = self.data.find(b"\x00", i)
            if j < 0 or j > end:
                break
            chunk = self.data[i:j]
            if 1 <= len(chunk) <= 40 and ident.match(chunk):
                try:
                    strings.append(chunk.decode("latin-1").strip())
                except Exception:
                    pass
            i = j + 1
        # remove marcadores de criptografia/driver que o Paradox anexa ao fim
        # do cabeçalho (ex.: "DBWINUS0"), que não são nomes de campo.
        while strings and re.match(r"^DBWIN", strings[-1]):
            strings.pop()
        if len(strings) < self.num_fields:
            return None
        # os nomes de campo são as últimas num_fields strings; a tabela é a anterior
        field_names = strings[-self.num_fields:]
        table_name = strings[-self.num_fields - 1] if len(strings) > self.num_fields else "?"
        return table_name, field_names

    def _read_cstr(self, off):
        end = self.data.find(b"\x00", off)
        if end < 0:
            end = off
        raw = self.data[off:end]
        try:
            s = raw.decode("latin-1").strip()
        except Exception:
            s = raw.decode("ascii", "replace").strip()
        return s, end + 1

    def schema(self):
        return {
            "table_name": self.table_name,
            "num_records": self.num_records,
            "num_fields": self.num_fields,
            "record_size": self.record_size,
            "file_version": self.file_version,
            "fields": self.fields,
        }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("--json", help="salva esquema em JSON")
    args = ap.parse_args()

    r = ParadoxReader(args.path)
    schema = r.schema()
    print(f"Tabela:   {schema['table_name']}")
    print(f"Registros:{schema['num_records']}")
    print(f"Campos:   {schema['num_fields']}  (versão {schema['file_version']})")
    print("-" * 50)
    for fld in schema["fields"]:
        print(f"  {fld['name']:<24} {fld['type']:<10} ({fld['size']})")
    if args.json:
        with open(args.json, "w") as f:
            json.dump(schema, f, indent=2, ensure_ascii=False)
        print(f"\nEsquema salvo em {args.json}")


if __name__ == "__main__":
    main()
