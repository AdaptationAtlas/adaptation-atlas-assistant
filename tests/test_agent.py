from collections.abc import Callable
from typing import Any

import pytest

pytestmark = pytest.mark.integration


async def test_agent(run_agent: Callable[[str], Any]):
    result = await run_agent(
        "Make a plot about percent change in cattle dry matter intake over all "
        "available countries"
    )

    assert "chart" in result
    assert "chart_data" in result
