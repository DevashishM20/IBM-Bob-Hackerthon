"""
code_chunker.py

Splits source files into prompt-sized chunks so they can be sent
to IBM Bob without exceeding token limits.
"""

from typing import List
from dataclasses import dataclass

# Approximate character limit per chunk (~2 000 tokens × 4 chars/token)
CHUNK_SIZE_CHARS = 8_000


@dataclass
class CodeChunk:
    file_path: str
    relative_path: str
    content: str
    chunk_index: int
    total_chunks: int


def chunk_file(file_path: str, project_root: str) -> List[CodeChunk]:
    """
    Read *file_path* and split it into CodeChunks of at most
    CHUNK_SIZE_CHARS characters. Returns an empty list if the file
    cannot be read (binary, permission error, etc.).
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as fh:
            content = fh.read()
    except OSError:
        return []

    relative = file_path.replace(project_root, "").lstrip("/\\")
    chunks_raw = [
        content[i : i + CHUNK_SIZE_CHARS]
        for i in range(0, max(len(content), 1), CHUNK_SIZE_CHARS)
    ]
    total = len(chunks_raw)

    return [
        CodeChunk(
            file_path=file_path,
            relative_path=relative,
            content=chunk,
            chunk_index=idx,
            total_chunks=total,
        )
        for idx, chunk in enumerate(chunks_raw)
    ]
