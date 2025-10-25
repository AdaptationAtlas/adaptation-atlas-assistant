from dataclasses import dataclass

from .settings import Settings


@dataclass
class Context:
    """Immutable values shared between tools"""

    settings: Settings
