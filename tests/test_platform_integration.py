"""兼容入口：真实平台集成逻辑测试已迁移到 Node.js 版本。

保留本文件是为了避免旧命令 `python tests/test_platform_integration.py` 失败；
实际测试逻辑见 `tests/test_platform_integration.js`。
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tests" / "test_platform_integration.js"

if __name__ == "__main__":
    result = subprocess.run(["node", str(SCRIPT)], cwd=ROOT)
    sys.exit(result.returncode)
