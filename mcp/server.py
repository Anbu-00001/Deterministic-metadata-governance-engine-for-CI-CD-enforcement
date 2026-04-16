"""FastMCP server — universal translator for Hephaestus tools.

This module registers all tool functions from ``mcp/tools/`` and exposes
them via the Model Context Protocol.  Tool implementations live in their
own modules; this file handles **only** server wiring.

Run directly to start the server::

    python -m mcp.server
"""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

# ── Create the server instance ───────────────────────────────
mcp_server = FastMCP("hephaestus-mcp")

# ── Import tool modules so their @mcp_server.tool decorators execute ─
# Each module registers its own tools on import via the shared server.
from mcp.tools.entity_tools import (  # noqa: F401, E402
    get_entity,
    patch_entity,
    list_entities,
)
from mcp.tools.lineage_tools import (  # noqa: F401, E402
    get_entity_lineage,
    get_downstream_nodes,
)
from mcp.tools.diff_tools import (  # noqa: F401, E402
    get_data_diff,
    compare_schemas,
)


if __name__ == "__main__":
    mcp_server.run()
