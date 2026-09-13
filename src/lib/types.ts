export type Song = {
  id: string;
  title: string;
  artist: string;
  active?: boolean;
  tags?: string[];
};

export type RequestStatus = "pending" | "accepted" | "rejected" | "played";

export type SongRequest = {
  id: string;
  occasion: string;
  song_id: string | null;
  song_title: string;
  artist: string;
  requester_name: string;
  dedication: string | null;
  status: RequestStatus;
  created_at: string;
};
