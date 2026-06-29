import httpx
from app.core.config import settings

async def get_movie_details(tmdb_id: int) -> dict:
    """Fetch poster, overview, runtime etc. from TMDB."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.TMDB_BASE_URL}/movie/{tmdb_id}",
            params={"api_key": settings.TMDB_API_KEY}
        )
        return resp.json()

async def search_movie(title: str) -> list[dict]:
    """Search TMDB by title — used to link MovieLens IDs to TMDB IDs."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.TMDB_BASE_URL}/search/movie",
            params={"api_key": settings.TMDB_API_KEY, "query": title}
        )
        return resp.json().get("results", [])
