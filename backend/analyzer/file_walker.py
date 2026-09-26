"""
file_walker.py

Recursively walks a project directory and returns a list of source-code
file paths, filtered to relevant extensions.
"""

import os
from typing import List

# Extensions considered "source code" for analysis
SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx",
    ".java", ".go", ".rb", ".php", ".cs",
    ".cpp", ".c", ".h", ".rs", ".swift",
    ".kt", ".scala", ".html", ".css", ".json",
    ".yaml", ".yml", ".md",
}

# Directories to always skip
IGNORE_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv",
    "env", "dist", "build", ".next", "coverage",
}


def walk_project(root_dir: str) -> List[str]:
    """
    Return a sorted list of absolute file paths for all source files
    found under *root_dir*, excluding ignored directories.
    """
    results: List[str] = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Prune ignored directories in-place so os.walk skips them
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]

        for filename in filenames:
            _, ext = os.path.splitext(filename)
            if ext.lower() in SUPPORTED_EXTENSIONS:
                results.append(os.path.join(dirpath, filename))

    return sorted(results)
