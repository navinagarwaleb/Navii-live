import { NextResponse } from "next/server";

type ItunesSongResult = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  primaryGenreName?: string;
  previewUrl?: string;
};

export type ItunesSearchHit = {
  trackId: number;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  genre: string | null;
  previewUrl: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term")?.trim() ?? "";
  const limit = Math.min(
    Number(searchParams.get("limit") ?? 20) || 20,
    40,
  );

  if (term.length < 2) {
    return NextResponse.json({ results: [] as ItunesSearchHit[] });
  }

  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", term);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", String(limit));

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "iTunes search failed.", results: [] },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as {
      results?: ItunesSongResult[];
    };

    const results: ItunesSearchHit[] = (payload.results ?? [])
      .filter(
        (item) =>
          typeof item.trackId === "number" &&
          item.trackName &&
          item.artistName,
      )
      .map((item) => ({
        trackId: item.trackId!,
        title: item.trackName!.trim(),
        artist: item.artistName!.trim(),
        album: item.collectionName?.trim() || null,
        artworkUrl: item.artworkUrl100?.replace("100x100", "200x200") || null,
        genre: item.primaryGenreName?.trim() || null,
        previewUrl: item.previewUrl || null,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("iTunes search error:", error);
    return NextResponse.json(
      { error: "Could not reach iTunes.", results: [] },
      { status: 502 },
    );
  }
}
